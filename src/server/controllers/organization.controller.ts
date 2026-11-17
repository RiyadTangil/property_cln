import { optNum, optStr, reqStr } from "@/server/http/api-handler";
import { OrganizationService } from "@/server/services/organization.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const OrganizationController = {
  // ---------------- Companies ----------------
  listCompanies() {
    return OrganizationService.listCompanies();
  },

  createCompany(user: SessionUser, b: RawBody) {
    return OrganizationService.createCompany(user, {
      code: reqStr(b.code).toUpperCase(),
      name: reqStr(b.name),
      legalName: optStr(b.legal_name),
      incorporationDate: optStr(b.incorporation_date),
      registrationNumber: optStr(b.registration_number),
      tin: optStr(b.tax_identification_number),
      email: optStr(b.email),
      phone: optStr(b.phone),
      website: optStr(b.website),
      addressLine1: optStr(b.address_line1),
      addressLine2: optStr(b.address_line2),
      city: optStr(b.city),
      state: optStr(b.state),
      postalCode: optStr(b.postal_code),
      country: optStr(b.country) || "Bangladesh",
      currency: optStr(b.currency) || "BDT",
      timezone: optStr(b.timezone) || "Asia/Dhaka",
      fyStartMonth: Number(b.financial_year_start_month ?? b.fyStartMonth ?? 7),
      fyStartDay: Number(b.financial_year_start_day ?? b.fyStartDay ?? 1),
      isDefault: Boolean(b.is_default ?? b.isDefault),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateCompany(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    const defVal = b.isDefault ?? b.is_default;
    return OrganizationService.updateCompany(user, id, {
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
      isDefault: typeof defVal === "boolean" ? defVal : undefined,
    });
  },

  deleteCompany(user: SessionUser, id: number) {
    return OrganizationService.deleteCompany(user, id);
  },

  // ---------------- Branches ----------------
  listBranches() {
    return OrganizationService.listBranches();
  },

  createBranch(user: SessionUser, b: RawBody) {
    return OrganizationService.createBranch(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      code: reqStr(b.code).toUpperCase(),
      name: reqStr(b.name),
      type: reqStr(b.type, "branch"),
      openedOn: optStr(b.opened_on),
      phone: optStr(b.phone),
      email: optStr(b.email),
      managerName: optStr(b.manager_name),
      addressLine1: optStr(b.address_line1),
      addressLine2: optStr(b.address_line2),
      city: optStr(b.city),
      state: optStr(b.state),
      postalCode: optStr(b.postal_code),
      country: optStr(b.country) || "Bangladesh",
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateBranch(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    return OrganizationService.updateBranch(user, id, {
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteBranch(user: SessionUser, id: number) {
    return OrganizationService.deleteBranch(user, id);
  },

  // ---------------- Departments ----------------
  listDepartments() {
    return OrganizationService.listDepartments();
  },

  createDepartment(user: SessionUser, b: RawBody) {
    const companyId = optNum(b.company_id ?? b.companyId);
    if (Array.isArray(b.items)) {
      return OrganizationService.createDepartment(user, {
        companyId,
        items: (b.items as RawBody[]).map((item) => ({
          code: reqStr(item.code).toUpperCase(),
          name: reqStr(item.name),
          branchId: optNum(item.branch_id),
          parentId: optNum(item.parent_id),
          headName: optStr(item.head_name),
          email: optStr(item.email),
        })),
      });
    }

    return OrganizationService.createDepartment(user, {
      companyId,
      code: reqStr(b.code).toUpperCase(),
      name: reqStr(b.name),
      branchId: optNum(b.branch_id),
      parentId: optNum(b.parent_id),
      headName: optStr(b.head_name),
      email: optStr(b.email),
      phone: optStr(b.phone),
      description: optStr(b.description),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateDepartment(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    return OrganizationService.updateDepartment(user, id, {
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteDepartment(user: SessionUser, id: number) {
    return OrganizationService.deleteDepartment(user, id);
  },

  // ---------------- Designations ----------------
  listDesignations() {
    return OrganizationService.listDesignations();
  },

  createDesignation(user: SessionUser, b: RawBody) {
    if (Array.isArray(b.items)) {
      return OrganizationService.createDesignation(user, {
        items: (b.items as RawBody[]).map((item) => ({
          code: reqStr(item.code).toUpperCase(),
          name: reqStr(item.name),
          departmentId: optNum(item.department_id),
          employmentType: reqStr(item.employment_type, "full_time"),
          grade: optStr(item.grade),
          isManagerial: Boolean(item.is_managerial),
          isActive: item.is_active === undefined ? true : Boolean(item.is_active),
        })),
      });
    }

    return OrganizationService.createDesignation(user, {
      code: reqStr(b.code).toUpperCase(),
      name: reqStr(b.name),
      departmentId: optNum(b.department_id),
      employmentType: reqStr(b.employment_type, "full_time"),
      grade: optStr(b.grade),
      description: optStr(b.description),
      isManagerial: Boolean(b.is_managerial),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateDesignation(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    return OrganizationService.updateDesignation(user, id, {
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteDesignation(user: SessionUser, id: number) {
    return OrganizationService.deleteDesignation(user, id);
  },

  // ---------------- Fiscal Years ----------------
  listFiscalYears() {
    return OrganizationService.listFiscalYears();
  },

  createFiscalYear(user: SessionUser, b: RawBody) {
    return OrganizationService.createFiscalYear(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      code: reqStr(b.code).toUpperCase(),
      name: reqStr(b.name),
      startDate: reqStr(b.start_date),
      endDate: reqStr(b.end_date),
      periodCadence: reqStr(b.period_cadence, "monthly"),
      hasAdjustmentPeriod: Boolean(b.has_adjustment_period),
      isCurrent: Boolean(b.is_current ?? b.isCurrent),
      status: reqStr(b.status, "open"),
      notes: optStr(b.notes),
    });
  },

  updateFiscalYear(user: SessionUser, id: number, b: RawBody) {
    const curVal = b.isCurrent ?? b.is_current;
    return OrganizationService.updateFiscalYear(user, id, {
      status: typeof b.status === "string" ? b.status : undefined,
      isCurrent: typeof curVal === "boolean" ? curVal : undefined,
    });
  },

  deleteFiscalYear(user: SessionUser, id: number) {
    return OrganizationService.deleteFiscalYear(user, id);
  },

  // ---------------- Holidays ----------------
  listHolidays() {
    return OrganizationService.listHolidays();
  },

  createHoliday(user: SessionUser, b: RawBody) {
    return OrganizationService.createHoliday(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      name: reqStr(b.name),
      type: reqStr(b.type, "public"),
      startDate: reqStr(b.start_date),
      endDate: reqStr(b.end_date ?? b.start_date),
      color: reqStr(b.color, "#00c292"),
      description: optStr(b.description),
      appliesTo: reqStr(b.applies_to, "company"),
      isRecurring: Boolean(b.is_recurring),
      isPaid: b.is_paid === undefined ? true : Boolean(b.is_paid),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateHoliday(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    return OrganizationService.updateHoliday(user, id, {
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteHoliday(user: SessionUser, id: number) {
    return OrganizationService.deleteHoliday(user, id);
  },

  // ---------------- Shifts ----------------
  listShifts() {
    return OrganizationService.listShifts();
  },

  createShift(user: SessionUser, b: RawBody) {
    const days = Array.isArray(b.working_days)
      ? b.working_days.join(",")
      : reqStr(b.working_days, "1,2,3,4,5");

    return OrganizationService.createShift(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      code: reqStr(b.code).toUpperCase(),
      name: reqStr(b.name),
      startTime: reqStr(b.start_time, "09:00"),
      endTime: reqStr(b.end_time, "18:00"),
      breakMinutes: Number(b.break_minutes ?? 60),
      graceInMinutes: Number(b.grace_in_minutes ?? 15),
      graceOutMinutes: Number(b.grace_out_minutes ?? 15),
      fullDayMinutes: Number(b.full_day_minutes ?? 480),
      halfDayMinutes: Number(b.half_day_minutes ?? 240),
      workingDays: days,
      appliesTo: reqStr(b.applies_to, "company"),
      description: optStr(b.description),
      isDefault: Boolean(b.is_default ?? b.isDefault),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateShift(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    const defVal = b.isDefault ?? b.is_default;
    return OrganizationService.updateShift(user, id, {
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
      isDefault: typeof defVal === "boolean" ? defVal : undefined,
    });
  },

  deleteShift(user: SessionUser, id: number) {
    return OrganizationService.deleteShift(user, id);
  },
};
