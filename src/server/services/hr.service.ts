import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";

const COMPANY_ID = 1;

export const HrService = {
  async getCommonRefs() {
    const [branches, departments, designations, shifts, users, accounts, employees] = await Promise.all([
      prisma.branch.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
      prisma.department.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
      prisma.designation.findMany({ select: { id: true, name: true } }),
      prisma.shift.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, name: true } }),
      prisma.user.findMany({ select: { id: true, name: true, email: true } }),
      prisma.chartAccount.findMany({ where: { companyId: COMPANY_ID, isGroup: false }, select: { id: true, code: true, name: true } }),
      prisma.employee.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "asc" } }),
    ]);
    return { branches, departments, designations, shifts, users, accounts, employees };
  },

  async getEmployeesPageData() {
    const refs = await this.getCommonRefs();
    return { ...refs };
  },

  async getEmployeeDetailData(id: number) {
    const [employee, refs] = await Promise.all([
      prisma.employee.findUnique({ where: { id } }),
      this.getCommonRefs(),
    ]);
    if (!employee) throw new ServiceError(404, "Employee not found");
    return { employee, ...refs };
  },

  async getPayrollPageData() {
    const [payrolls, refs] = await Promise.all([
      prisma.payrollRecord.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { payrolls, ...refs };
  },

  async getPayrollDetailData(id: number) {
    const [payroll, refs] = await Promise.all([
      prisma.payrollRecord.findUnique({ where: { id } }),
      this.getCommonRefs(),
    ]);
    if (!payroll) throw new ServiceError(404, "Payroll record not found");
    return { payroll, ...refs };
  },

  async getSalaryStructuresPageData() {
    const [structures, refs] = await Promise.all([
      prisma.salaryStructure.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { structures, ...refs };
  },

  async getDeductionHeadsPageData() {
    const [heads, refs] = await Promise.all([
      prisma.deductionHead.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "asc" } }),
      this.getCommonRefs(),
    ]);
    return { heads, ...refs };
  },

  async createRecord(user: SessionUser, kind: string, b: Record<string, unknown>) {
    const today = new Date().toISOString().slice(0, 10);
    if (kind === "employees") {
      const cnt = await prisma.employee.count();
      const deptId = b.department_id ? Number(b.department_id) : null;
      const desigId = b.designation_id ? Number(b.designation_id) : null;
      const dept = deptId ? await prisma.department.findUnique({ where: { id: deptId } }) : null;
      const desig = desigId ? await prisma.designation.findUnique({ where: { id: desigId } }) : null;
      const row = await prisma.employee.create({
        data: {
          companyId: COMPANY_ID,
          code: b.code ? String(b.code) : `EMP-${String(cnt + 1).padStart(4, "0")}`,
          firstName: String(b.first_name || "Employee"),
          lastName: b.last_name ? String(b.last_name) : null,
          gender: b.gender ? String(b.gender) : "male",
          dateOfBirth: b.date_of_birth ? String(b.date_of_birth) : null,
          maritalStatus: b.marital_status ? String(b.marital_status) : "single",
          bloodGroup: b.blood_group ? String(b.blood_group) : null,
          religion: b.religion ? String(b.religion) : null,
          nationality: b.nationality ? String(b.nationality) : "Bangladeshi",
          fatherName: b.father_name ? String(b.father_name) : null,
          motherName: b.mother_name ? String(b.mother_name) : null,
          spouseName: b.spouse_name ? String(b.spouse_name) : null,
          nationalId: b.national_id ? String(b.national_id) : null,
          passportNo: b.passport_no ? String(b.passport_no) : null,
          tin: b.tin ? String(b.tin) : null,
          workEmail: b.work_email ? String(b.work_email) : null,
          personalEmail: b.personal_email ? String(b.personal_email) : null,
          phone: b.phone ? String(b.phone) : null,
          personalPhone: b.personal_phone ? String(b.personal_phone) : null,
          presentAddress: b.present_address ? String(b.present_address) : null,
          presentCity: b.present_city ? String(b.present_city) : null,
          presentCountry: b.present_country ? String(b.present_country) : "Bangladesh",
          permanentAddress: b.permanent_address ? String(b.permanent_address) : null,
          permanentCity: b.permanent_city ? String(b.permanent_city) : null,
          permanentCountry: b.permanent_country ? String(b.permanent_country) : "Bangladesh",
          departmentId: deptId,
          departmentName: dept?.name ?? "Engineering",
          designationId: desigId,
          designationName: desig?.name ?? "Project Engineer",
          branchId: b.branch_id ? Number(b.branch_id) : null,
          shiftId: b.shift_id ? Number(b.shift_id) : null,
          reportingTo: b.reporting_to ? Number(b.reporting_to) : null,
          employmentType: String(b.employment_type ?? "full_time"),
          employmentStatus: String(b.employment_status ?? "active"),
          dateJoined: b.date_joined ? String(b.date_joined) : today,
          probationEndDate: b.probation_end_date ? String(b.probation_end_date) : null,
          confirmationDate: b.confirmation_date ? String(b.confirmation_date) : null,
          grossSalary: Number(b.gross_salary ?? 0) || 0,
          basicSalary: Number(b.basic_salary ?? 0) || 0,
          salaryCurrency: String(b.salary_currency ?? "BDT"),
          bankName: b.bank_name ? String(b.bank_name) : null,
          bankBranch: b.bank_branch ? String(b.bank_branch) : null,
          bankAccountName: b.bank_account_name ? String(b.bank_account_name) : null,
          bankAccountNumber: b.bank_account_number ? String(b.bank_account_number) : null,
          bankRoutingNumber: b.bank_routing_number ? String(b.bank_routing_number) : null,
          notes: b.notes ? String(b.notes) : null,
        },
      });
      await recordAudit(user.name, "created", `${row.code} ${row.firstName}`, "Employee", [], user.id);
      return row;
    }

    if (kind === "payroll") {
      const cnt = await prisma.payrollRecord.count();
      const empId = b.employee_id ? Number(b.employee_id) : 1;
      const emp = await prisma.employee.findUnique({ where: { id: empId } });
      const basic = Number(b.basic ?? 0) || 0;
      const allowArr = Array.isArray(b.allowances) ? (b.allowances as Array<{ name?: string; amount?: number }>) : [];
      const deductArr = Array.isArray(b.deductions) ? (b.deductions as Array<{ name?: string; amount?: number }>) : [];
      const allowSum = allowArr.reduce((s, a) => s + (Number(a.amount) || 0), 0);
      const deductSum = deductArr.reduce((s, d) => s + (Number(d.amount) || 0), 0);
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const mIdx = (Number(b.month ?? 11) || 11) - 1;
      const yr = Number(b.year ?? 2026) || 2026;
      const row = await prisma.payrollRecord.create({
        data: {
          companyId: COMPANY_ID,
          code: `SAL-${String(cnt + 1).padStart(5, "0")}`,
          employeeId: empId,
          employeeName: emp ? `${emp.firstName} ${emp.lastName ?? ""}`.trim() : "Employee",
          branchId: b.branch_id ? Number(b.branch_id) : null,
          month: mIdx + 1,
          year: yr,
          period: `${months[mIdx] ?? "November"} ${yr}`,
          type: String(b.type ?? "salary"),
          disbursedOn: String(b.disbursed_on ?? today),
          paymentMethod: String(b.payment_method ?? "Bank Transfer"),
          paymentAccountId: b.payment_account_id ? Number(b.payment_account_id) : null,
          basic,
          allowances: allowSum,
          deductions: deductSum,
          net: basic + allowSum - deductSum,
          allowancesJson: JSON.stringify(allowArr),
          deductionsJson: JSON.stringify(deductArr),
          remarks: b.remarks ? String(b.remarks) : null,
        },
      });
      await recordAudit(user.name, "created", row.code, "PayrollRecord", [], user.id);
      return row;
    }

    if (kind === "salary-structures") {
      const empId = b.employee_id ? Number(b.employee_id) : 1;
      const emp = await prisma.employee.findUnique({ where: { id: empId } });
      const row = await prisma.salaryStructure.create({
        data: {
          companyId: COMPANY_ID,
          employeeId: empId,
          employeeName: emp ? `${emp.firstName} ${emp.lastName ?? ""}`.trim() : "Employee",
          branchId: b.branch_id ? Number(b.branch_id) : null,
          basicSalary: Number(b.basic_salary ?? 0) || 0,
          effectiveFrom: b.effective_from ? String(b.effective_from) : today,
          note: b.note ? String(b.note) : null,
          allowancesJson: JSON.stringify(b.allowances ?? []),
        },
      });
      await recordAudit(user.name, "created", row.employeeName, "SalaryStructure", [], user.id);
      return row;
    }

    if (kind === "deduction-heads") {
      const row = await prisma.deductionHead.create({
        data: {
          companyId: COMPANY_ID,
          code: String(b.code || "DED-01"),
          name: String(b.name || "Deduction Head"),
          description: b.description ? String(b.description) : null,
          isFixed: Boolean(b.is_fixed),
          isActive: b.is_active !== false,
        },
      });
      await recordAudit(user.name, "created", row.name, "DeductionHead", [], user.id);
      return row;
    }

    throw new ServiceError(400, `Unsupported HR kind: ${kind}`);
  },

  async updateRecord(user: SessionUser, kind: string, id: number, b: Record<string, unknown>) {
    if (kind === "employees") {
      const row = await prisma.employee.update({
        where: { id },
        data: {
          ...(b.first_name !== undefined ? { firstName: String(b.first_name) } : {}),
          ...(b.last_name !== undefined ? { lastName: b.last_name ? String(b.last_name) : null } : {}),
          ...(b.employment_status !== undefined ? { employmentStatus: String(b.employment_status) } : {}),
          ...(b.employment_type !== undefined ? { employmentType: String(b.employment_type) } : {}),
          ...(b.phone !== undefined ? { phone: b.phone ? String(b.phone) : null } : {}),
          ...(b.work_email !== undefined ? { workEmail: b.work_email ? String(b.work_email) : null } : {}),
          ...(b.gross_salary !== undefined ? { grossSalary: Number(b.gross_salary) || 0 } : {}),
          ...(b.basic_salary !== undefined ? { basicSalary: Number(b.basic_salary) || 0 } : {}),
          ...(b.notes !== undefined ? { notes: b.notes ? String(b.notes) : null } : {}),
        },
      });
      await recordAudit(user.name, "updated", `${row.code} ${row.firstName}`, "Employee", [], user.id);
      return row;
    }
    if (kind === "deduction-heads") {
      return prisma.deductionHead.update({
        where: { id },
        data: {
          ...(b.code !== undefined ? { code: String(b.code) } : {}),
          ...(b.name !== undefined ? { name: String(b.name) } : {}),
          ...(b.description !== undefined ? { description: b.description ? String(b.description) : null } : {}),
          ...(b.is_fixed !== undefined ? { isFixed: Boolean(b.is_fixed) } : {}),
          ...(b.is_active !== undefined ? { isActive: Boolean(b.is_active) } : {}),
        },
      });
    }
    return { ok: true };
  },

  async deleteRecord(user: SessionUser, kind: string, id: number) {
    if (kind === "employees") await prisma.employee.delete({ where: { id } });
    else if (kind === "payroll") await prisma.payrollRecord.delete({ where: { id } });
    else if (kind === "salary-structures") await prisma.salaryStructure.delete({ where: { id } });
    else if (kind === "deduction-heads") await prisma.deductionHead.delete({ where: { id } });
    await recordAudit(user.name, "deleted", `${kind}#${id}`, "Hr", [], user.id);
    return { ok: true };
  },
};
