import { prisma } from "@/lib/prisma";
import { MONTHS, recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type {
  CreateBranchDto,
  CreateCompanyDto,
  CreateDepartmentInput,
  CreateDesignationInput,
  CreateFiscalYearDto,
  CreateHolidayDto,
  CreateShiftDto,
  UpdateBranchDto,
  UpdateCompanyDto,
  UpdateDepartmentDto,
  UpdateDesignationDto,
  UpdateFiscalYearDto,
  UpdateHolidayDto,
  UpdateShiftDto,
} from "@/server/dto/organization.dto";

async function resolveDefaultCompanyId(): Promise<number> {
  const def =
    (await prisma.company.findFirst({ where: { isDefault: true } })) ??
    (await prisma.company.findFirst({ orderBy: { id: "asc" } }));
  return def?.id ?? 1;
}

function formatDateEnGb(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const OrganizationService = {
  // ---------------- Companies ----------------
  async listCompanies() {
    return prisma.company.findMany({ orderBy: { id: "asc" } });
  },

  async getCompaniesPageData(filters: { search?: string; status?: string }) {
    const search = (filters.search ?? "").trim();
    const status = (filters.status ?? "").trim();

    const where: Record<string, unknown> = {};
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { email: { contains: search } },
        { tin: { contains: search } },
      ];
    }

    const rows = await prisma.company.findMany({ where, orderBy: { id: "asc" } });
    const companies = rows.map((c) => ({
      ...c,
      createdAt: formatDateEnGb(c.createdAt),
    }));

    return { companies, filters: { search, status } };
  },

  async createCompany(user: SessionUser, dto: CreateCompanyDto) {
    if (!dto.code || !dto.name) {
      throw new ServiceError(400, "Company Code and Name are required.");
    }

    if (dto.isDefault) {
      await prisma.company.updateMany({ data: { isDefault: false } });
    }

    const endMonthIdx = (dto.fyStartMonth + 10) % 12;
    const fiscalYear = `${dto.fyStartDay} ${MONTHS[(dto.fyStartMonth - 1) % 12]?.slice(0, 3) || "Jul"} – 30 ${MONTHS[endMonthIdx]?.slice(0, 3) || "Jun"}`;

    const company = await prisma.company.create({
      data: {
        code: dto.code,
        name: dto.name,
        legalName: dto.legalName,
        incorporationDate: dto.incorporationDate,
        registrationNumber: dto.registrationNumber,
        tin: dto.tin,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
        currency: dto.currency,
        timezone: dto.timezone,
        fyStartMonth: dto.fyStartMonth,
        fyStartDay: dto.fyStartDay,
        branch: dto.code,
        fiscalYear,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
      },
    });

    await recordAudit(user.name, "created", company.name, "Company", ["code", "name", "currency"], user.id);
    return company;
  },

  async updateCompany(user: SessionUser, id: number, dto: UpdateCompanyDto) {
    const data: Record<string, unknown> = {};
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;
    if (typeof dto.isDefault === "boolean") {
      if (dto.isDefault) await prisma.company.updateMany({ data: { isDefault: false } });
      data.isDefault = dto.isDefault;
    }

    const company = await prisma.company.update({ where: { id }, data });
    await recordAudit(user.name, "updated", company.name, "Company", Object.keys(data), user.id);
    return company;
  },

  async deleteCompany(user: SessionUser, id: number) {
    const deleted = await prisma.company.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "Company", ["id"], user.id);
    return deleted;
  },

  // ---------------- Branches ----------------
  async listBranches() {
    return prisma.branch.findMany({
      include: { _count: { select: { departments: true } } },
      orderBy: { id: "asc" },
    });
  },

  async getBranchesPageData(filters: { search?: string; status?: string }) {
    const search = (filters.search ?? "").trim();
    const status = (filters.status ?? "").trim();

    const where: Record<string, unknown> = {};
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { city: { contains: search } },
        { managerName: { contains: search } },
      ];
    }

    const [rows, company] = await Promise.all([
      prisma.branch.findMany({
        where,
        include: { _count: { select: { departments: true } } },
        orderBy: { id: "asc" },
      }),
      prisma.company.findFirst({ where: { isDefault: true } }),
    ]);

    const branches = rows.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      type: b.type,
      managerName: b.managerName,
      city: b.city,
      country: b.country,
      deptsCount: b._count.departments,
      isActive: b.isActive,
      createdAt: formatDateEnGb(b.createdAt),
    }));

    return {
      branches,
      companyName: company?.name || "E-Hishabi ERP",
      filters: { search, status },
    };
  },

  async createBranch(user: SessionUser, dto: CreateBranchDto) {
    if (!dto.code || !dto.name) {
      throw new ServiceError(400, "Branch Code and Name are required.");
    }

    const exists = await prisma.branch.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ServiceError(409, `Branch code ${dto.code} already exists.`);
    }

    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());

    const branch = await prisma.branch.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        type: dto.type,
        openedOn: dto.openedOn,
        phone: dto.phone,
        email: dto.email,
        managerName: dto.managerName,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country,
        isActive: dto.isActive,
      },
    });

    await recordAudit(user.name, "created", branch.name, "Branch", ["code", "name", "type"], user.id);
    return branch;
  },

  async updateBranch(user: SessionUser, id: number, dto: UpdateBranchDto) {
    const data: Record<string, unknown> = {};
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const branch = await prisma.branch.update({ where: { id }, data });
    await recordAudit(user.name, "updated", branch.name, "Branch", Object.keys(data), user.id);
    return branch;
  },

  async deleteBranch(user: SessionUser, id: number) {
    const deleted = await prisma.branch.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "Branch", ["id"], user.id);
    return deleted;
  },

  // ---------------- Departments ----------------
  async listDepartments() {
    return prisma.department.findMany({
      include: { branch: true, parent: true, _count: { select: { children: true } } },
      orderBy: { name: "asc" },
    });
  },

  async getDepartmentsPageData(filters: {
    search?: string;
    branch_id?: string;
    status?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const branch_id = (filters.branch_id ?? "").trim();
    const status = (filters.status ?? "").trim();

    const where: Record<string, unknown> = {};
    if (branch_id) where.branchId = Number(branch_id);
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { headName: { contains: search } },
      ];
    }

    const [rows, branches, company] = await Promise.all([
      prisma.department.findMany({
        where,
        include: {
          branch: { select: { name: true } },
          parent: { select: { name: true } },
          _count: { select: { children: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.branch.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.company.findFirst({ where: { isDefault: true } }),
    ]);

    const departments = rows.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      branchName: d.branch?.name ?? null,
      parentName: d.parent?.name ?? null,
      headName: d.headName,
      subCount: d._count.children,
      isActive: d.isActive,
      createdAt: formatDateEnGb(d.createdAt),
    }));

    return {
      departments,
      branches,
      companyName: company?.name || "E-Hishabi ERP",
      filters: { search, branch_id, status },
    };
  },

  async getCreateDepartmentPageData() {
    const [branches, parents] = await Promise.all([
      prisma.branch.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
    return { branches, parents };
  },

  async createDepartment(user: SessionUser, input: CreateDepartmentInput) {
    const companyId = input.companyId ?? (await resolveDefaultCompanyId());

    if ("items" in input) {
      const created = [];
      for (const item of input.items) {
        if (!item.code || !item.name) continue;
        const exists = await prisma.department.findUnique({ where: { code: item.code } });
        if (exists) continue;
        const dep = await prisma.department.create({
          data: {
            companyId,
            code: item.code,
            name: item.name,
            branchId: item.branchId,
            parentId: item.parentId,
            headName: item.headName,
            email: item.email ?? null,
            isActive: true,
          },
        });
        created.push(dep);
      }
      if (created.length > 0) {
        await recordAudit(user.name, "created", `${created.length} departments`, "Department", ["bulk"], user.id);
      }
      return { created };
    }

    if (!input.code || !input.name) {
      throw new ServiceError(400, "Department Code and Name are required.");
    }

    const exists = await prisma.department.findUnique({ where: { code: input.code } });
    if (exists) {
      throw new ServiceError(409, `Department code ${input.code} already exists.`);
    }

    const department = await prisma.department.create({
      data: {
        companyId,
        code: input.code,
        name: input.name,
        branchId: input.branchId,
        parentId: input.parentId,
        headName: input.headName,
        email: input.email,
        phone: input.phone,
        description: input.description,
        isActive: input.isActive,
      },
    });

    await recordAudit(user.name, "created", department.name, "Department", ["code", "name"], user.id);
    return { department };
  },

  async updateDepartment(user: SessionUser, id: number, dto: UpdateDepartmentDto) {
    const data: Record<string, unknown> = {};
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const department = await prisma.department.update({ where: { id }, data });
    await recordAudit(user.name, "updated", department.name, "Department", Object.keys(data), user.id);
    return department;
  },

  async deleteDepartment(user: SessionUser, id: number) {
    const deleted = await prisma.department.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "Department", ["id"], user.id);
    return deleted;
  },

  // ---------------- Designations ----------------
  async listDesignations() {
    return prisma.designation.findMany({
      include: { department: true },
      orderBy: [{ grade: "asc" }, { id: "asc" }],
    });
  },

  async getDesignationsPageData(filters: {
    search?: string;
    department_id?: string;
    status?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const department_id = (filters.department_id ?? "").trim();
    const status = (filters.status ?? "").trim();

    const where: Record<string, unknown> = {};
    if (department_id) where.departmentId = Number(department_id);
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [rows, departments, company] = await Promise.all([
      prisma.designation.findMany({
        where,
        include: { department: { select: { name: true } } },
        orderBy: [{ grade: "asc" }, { id: "asc" }],
      }),
      prisma.department.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.company.findFirst({ where: { isDefault: true } }),
    ]);

    const designations = rows.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      departmentName: d.department?.name ?? null,
      employmentType: d.employmentType,
      grade: d.grade,
      description: d.description,
      isManagerial: d.isManagerial,
      isActive: d.isActive,
      createdBy: d.createdBy,
      createdAt: formatDateEnGb(d.createdAt),
    }));

    return {
      designations,
      departments,
      companyName: company?.name || "E-Hishabi ERP",
      filters: { search, department_id, status },
    };
  },

  async getCreateDesignationPageData() {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return { departments };
  },

  async createDesignation(user: SessionUser, input: CreateDesignationInput) {
    if ("items" in input) {
      const created = [];
      for (const item of input.items) {
        if (!item.code || !item.name) continue;
        const ds = await prisma.designation.create({
          data: {
            code: item.code,
            name: item.name,
            departmentId: item.departmentId,
            employmentType: item.employmentType,
            grade: item.grade,
            isManagerial: item.isManagerial,
            isActive: item.isActive ?? true,
            createdBy: user.name,
          },
        });
        created.push(ds);
      }
      if (created.length > 0) {
        await recordAudit(user.name, "created", `${created.length} designations`, "Designation", ["bulk"], user.id);
      }
      return { created };
    }

    if (!input.code || !input.name) {
      throw new ServiceError(400, "Code and Designation Title are required.");
    }

    const designation = await prisma.designation.create({
      data: {
        code: input.code,
        name: input.name,
        departmentId: input.departmentId,
        employmentType: input.employmentType,
        grade: input.grade,
        description: input.description,
        isManagerial: input.isManagerial,
        isActive: input.isActive,
        createdBy: user.name,
      },
    });

    await recordAudit(user.name, "created", designation.name, "Designation", ["code", "name"], user.id);
    return { designation };
  },

  async updateDesignation(user: SessionUser, id: number, dto: UpdateDesignationDto) {
    const data: Record<string, unknown> = {};
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const designation = await prisma.designation.update({ where: { id }, data });
    await recordAudit(user.name, "updated", designation.name, "Designation", Object.keys(data), user.id);
    return designation;
  },

  async deleteDesignation(user: SessionUser, id: number) {
    const deleted = await prisma.designation.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "Designation", ["id"], user.id);
    return deleted;
  },

  // ---------------- Company Tree ----------------
  async getCompanyTreePageData() {
    const [company, branches, departments] = await Promise.all([
      prisma.company.findFirst({ orderBy: { id: "asc" } }),
      prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.department.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: { _count: { select: { designations: true } } },
      }),
    ]);

    return {
      company: {
        id: company?.id ?? 1,
        code: company?.code ?? "HQ",
        name: company?.name ?? "E-Hishabi ERP",
        currency: company?.currency ?? "BDT",
      },
      branches: branches.map((b) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        type: b.type,
        city: b.city,
      })),
      departments: departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        branchId: d.branchId,
        parentId: d.parentId,
        headName: d.headName,
        designationsCount: d._count.designations,
      })),
    };
  },

  // ---------------- Fiscal Years ----------------
  async listFiscalYears() {
    return prisma.fiscalYear.findMany({ orderBy: { startDate: "desc" } });
  },

  async getFiscalYearsPageData(filters: { search?: string; status?: string }) {
    const search = (filters.search ?? "").trim();
    const status = (filters.status ?? "").trim();

    const fiscalYears = await prisma.fiscalYear.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search } },
                { name: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { startDate: "desc" },
    });

    return {
      fiscalYears: fiscalYears.map((fy) => ({
        id: fy.id,
        code: fy.code,
        name: fy.name,
        startDate: fy.startDate,
        endDate: fy.endDate,
        periodCadence: fy.periodCadence,
        hasAdjustmentPeriod: fy.hasAdjustmentPeriod,
        isCurrent: fy.isCurrent,
        status: fy.status,
        notes: fy.notes,
      })),
      filters: { search, status },
    };
  },

  async getCreateFiscalYearPageData() {
    const company = await prisma.company.findFirst({ orderBy: { id: "asc" } });
    return {
      companyName: company?.name ?? "E-Hishabi ERP",
      companyCode: company?.code ?? "HQ",
    };
  },

  async createFiscalYear(user: SessionUser, dto: CreateFiscalYearDto) {
    if (!dto.code || !dto.name || !dto.startDate || !dto.endDate) {
      throw new ServiceError(400, "Code, Name, Start Date, and End Date are required.");
    }
    if (dto.endDate <= dto.startDate) {
      throw new ServiceError(400, "End Date must be after Start Date.");
    }

    const exists = await prisma.fiscalYear.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ServiceError(409, `Fiscal year code ${dto.code} already exists.`);
    }

    if (dto.isCurrent) {
      await prisma.fiscalYear.updateMany({ data: { isCurrent: false } });
    }

    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());

    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        startDate: dto.startDate,
        endDate: dto.endDate,
        periodCadence: dto.periodCadence,
        hasAdjustmentPeriod: dto.hasAdjustmentPeriod,
        isCurrent: dto.isCurrent,
        status: dto.isCurrent ? "open" : dto.status,
        notes: dto.notes,
      },
    });

    await recordAudit(user.name, "created", fiscalYear.name, "FiscalYear", ["code", "startDate", "endDate"], user.id);
    return fiscalYear;
  },

  async updateFiscalYear(user: SessionUser, id: number, dto: UpdateFiscalYearDto) {
    const data: Record<string, unknown> = {};
    if (typeof dto.status === "string") data.status = dto.status;
    if (typeof dto.isCurrent === "boolean") {
      if (dto.isCurrent) await prisma.fiscalYear.updateMany({ data: { isCurrent: false } });
      data.isCurrent = dto.isCurrent;
    }

    const fiscalYear = await prisma.fiscalYear.update({ where: { id }, data });
    await recordAudit(user.name, "updated", fiscalYear.name, "FiscalYear", Object.keys(data), user.id);
    return fiscalYear;
  },

  async deleteFiscalYear(user: SessionUser, id: number) {
    const deleted = await prisma.fiscalYear.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "FiscalYear", ["id"], user.id);
    return deleted;
  },

  // ---------------- Holidays ----------------
  async listHolidays() {
    return prisma.holiday.findMany({ orderBy: { startDate: "asc" } });
  },

  async getHolidaysPageData(filters: {
    search?: string;
    year?: string;
    type?: string;
    branch_id?: string;
    department_id?: string;
    status?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const year = (filters.year ?? "").trim();
    const type = (filters.type ?? "").trim();
    const branchId = (filters.branch_id ?? "").trim();
    const departmentId = (filters.department_id ?? "").trim();
    const status = (filters.status ?? "").trim();

    const [holidays, branches, departments] = await Promise.all([
      prisma.holiday.findMany({
        where: {
          ...(type ? { type } : {}),
          ...(year ? { startDate: { startsWith: year } } : {}),
          ...(status === "active"
            ? { isActive: true }
            : status === "inactive"
            ? { isActive: false }
            : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search } },
                  { description: { contains: search } },
                ],
              }
            : {}),
        },
        orderBy: { startDate: "asc" },
      }),
      prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

    return {
      holidays: holidays.map((h) => ({
        id: h.id,
        name: h.name,
        type: h.type,
        startDate: h.startDate,
        endDate: h.endDate,
        color: h.color,
        description: h.description,
        appliesTo: h.appliesTo,
        isRecurring: h.isRecurring,
        isPaid: h.isPaid,
        isActive: h.isActive,
      })),
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
      departments: departments.map((d) => ({ id: d.id, name: d.name })),
      filters: {
        search,
        year,
        type,
        branch_id: branchId,
        department_id: departmentId,
        status,
      },
    };
  },

  async getCreateHolidayPageData() {
    const [company, branches, departments] = await Promise.all([
      prisma.company.findFirst({ orderBy: { id: "asc" } }),
      prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

    return {
      companyName: company?.name ?? "E-Hishabi ERP",
      companyCode: company?.code ?? "HQ",
      branches: branches.map((b) => ({ id: b.id, name: b.name, code: b.code })),
      departments: departments.map((d) => ({ id: d.id, name: d.name, code: d.code })),
    };
  },

  async createHoliday(user: SessionUser, dto: CreateHolidayDto) {
    if (!dto.name || !dto.startDate) {
      throw new ServiceError(400, "Holiday Name and Start Date are required.");
    }

    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());

    const holiday = await prisma.holiday.create({
      data: {
        companyId,
        name: dto.name,
        type: dto.type,
        startDate: dto.startDate,
        endDate: dto.endDate || dto.startDate,
        color: dto.color,
        description: dto.description,
        appliesTo: dto.appliesTo,
        isRecurring: dto.isRecurring,
        isPaid: dto.isPaid,
        isActive: dto.isActive,
      },
    });

    await recordAudit(user.name, "created", holiday.name, "Holiday", ["name", "startDate", "type"], user.id);
    return holiday;
  },

  async updateHoliday(user: SessionUser, id: number, dto: UpdateHolidayDto) {
    const data: Record<string, unknown> = {};
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const holiday = await prisma.holiday.update({ where: { id }, data });
    await recordAudit(user.name, "updated", holiday.name, "Holiday", Object.keys(data), user.id);
    return holiday;
  },

  async deleteHoliday(user: SessionUser, id: number) {
    const deleted = await prisma.holiday.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "Holiday", ["id"], user.id);
    return deleted;
  },

  // ---------------- Shifts ----------------
  async listShifts() {
    return prisma.shift.findMany({ orderBy: { id: "asc" } });
  },

  async getShiftsPageData(filters: {
    search?: string;
    branch_id?: string;
    department_id?: string;
    status?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const branchId = (filters.branch_id ?? "").trim();
    const departmentId = (filters.department_id ?? "").trim();
    const status = (filters.status ?? "").trim();

    const [shifts, branches, departments] = await Promise.all([
      prisma.shift.findMany({
        where: {
          ...(status === "active"
            ? { isActive: true }
            : status === "inactive"
            ? { isActive: false }
            : {}),
          ...(search
            ? {
                OR: [
                  { code: { contains: search } },
                  { name: { contains: search } },
                ],
              }
            : {}),
        },
        orderBy: { id: "asc" },
      }),
      prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

    return {
      shifts: shifts.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        breakMinutes: s.breakMinutes,
        graceInMinutes: s.graceInMinutes,
        graceOutMinutes: s.graceOutMinutes,
        workingDays: s.workingDays,
        appliesTo: s.appliesTo,
        isDefault: s.isDefault,
        isActive: s.isActive,
      })),
      branches: branches.map((b) => ({ id: b.id, name: b.name })),
      departments: departments.map((d) => ({ id: d.id, name: d.name })),
      filters: { search, branch_id: branchId, department_id: departmentId, status },
    };
  },

  async getCreateShiftPageData() {
    const [company, branches, departments] = await Promise.all([
      prisma.company.findFirst({ orderBy: { id: "asc" } }),
      prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

    return {
      companyName: company?.name ?? "E-Hishabi ERP",
      companyCode: company?.code ?? "HQ",
      branches: branches.map((b) => ({ id: b.id, name: b.name, code: b.code })),
      departments: departments.map((d) => ({ id: d.id, name: d.name, code: d.code })),
    };
  },

  async createShift(user: SessionUser, dto: CreateShiftDto) {
    if (!dto.code || !dto.name) {
      throw new ServiceError(400, "Shift Code and Name are required.");
    }

    const exists = await prisma.shift.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ServiceError(409, `Shift code ${dto.code} already exists.`);
    }

    if (dto.isDefault) {
      await prisma.shift.updateMany({ data: { isDefault: false } });
    }

    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());

    const shift = await prisma.shift.create({
      data: {
        companyId,
        code: dto.code,
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        breakMinutes: dto.breakMinutes,
        graceInMinutes: dto.graceInMinutes,
        graceOutMinutes: dto.graceOutMinutes,
        fullDayMinutes: dto.fullDayMinutes,
        halfDayMinutes: dto.halfDayMinutes,
        workingDays: dto.workingDays,
        appliesTo: dto.appliesTo,
        description: dto.description,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
      },
    });

    await recordAudit(user.name, "created", shift.name, "Shift", ["code", "startTime", "endTime"], user.id);
    return shift;
  },

  async updateShift(user: SessionUser, id: number, dto: UpdateShiftDto) {
    const data: Record<string, unknown> = {};
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;
    if (typeof dto.isDefault === "boolean") {
      if (dto.isDefault) await prisma.shift.updateMany({ data: { isDefault: false } });
      data.isDefault = dto.isDefault;
    }

    const shift = await prisma.shift.update({ where: { id }, data });
    await recordAudit(user.name, "updated", shift.name, "Shift", Object.keys(data), user.id);
    return shift;
  },

  async deleteShift(user: SessionUser, id: number) {
    const deleted = await prisma.shift.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "Shift", ["id"], user.id);
    return deleted;
  },
};
