import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";

const COMPANY_ID = 1;

export const SalesService = {
  async getCommonRefs() {
    const [projects, customers, clients, owners, employees, departments, accounts, units] = await Promise.all([
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
      prisma.crmCustomer.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, firstName: true, lastName: true, organisationName: true, mobile: true } }),
      prisma.clientRecord.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      prisma.propertyOwner.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      prisma.employee.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, firstName: true, lastName: true, departmentName: true } }),
      prisma.department.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
      prisma.chartAccount.findMany({ where: { companyId: COMPANY_ID, isGroup: false }, select: { id: true, code: true, name: true } }),
      prisma.buildingUnit.findMany({ select: { id: true, unitNumber: true, unitType: true, price: true, status: true } }),
    ]);
    return { projects, customers, clients, owners, employees, departments, accounts, units };
  },

  async getClientsPageData() {
    const [clients, refs] = await Promise.all([
      prisma.clientRecord.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { ...refs, clients };
  },

  async getOwnersPageData() {
    const [owners, refs] = await Promise.all([
      prisma.propertyOwner.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "asc" } }),
      this.getCommonRefs(),
    ]);
    return { ...refs, owners };
  },

  async getOwnerDetailData(id: number) {
    const owner = await prisma.propertyOwner.findUnique({ where: { id } });
    if (!owner) throw new ServiceError(404, "Owner not found");
    return { owner };
  },

  async getAgreementsPageData() {
    const [agreements, refs] = await Promise.all([
      prisma.devAgreement.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { agreements, ...refs };
  },

  async getSalesPageData() {
    const [sales, refs] = await Promise.all([
      prisma.apartmentSale.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { sales, ...refs };
  },

  async getPaymentsPageData() {
    const [payments, sales, refs] = await Promise.all([
      prisma.moneyReceipt.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      prisma.apartmentSale.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { payments, sales, ...refs };
  },

  async getTargetsPageData() {
    const [targets, refs] = await Promise.all([
      prisma.salesTarget.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { targets, ...refs };
  },

  async createRecord(user: SessionUser, kind: string, b: Record<string, unknown>) {
    const today = new Date().toISOString().slice(0, 10);
    if (kind === "clients") {
      const cnt = await prisma.clientRecord.count();
      const row = await prisma.clientRecord.create({
        data: {
          companyId: COMPANY_ID,
          code: `CLI-${String(cnt + 1).padStart(4, "0")}`,
          clientType: String(b.client_type ?? "individual"),
          name: String(b.name || "Client"),
          fatherName: b.father_name ? String(b.father_name) : null,
          motherName: b.mother_name ? String(b.mother_name) : null,
          occupation: b.occupation ? String(b.occupation) : null,
          nid: b.nid ? String(b.nid) : null,
          dateOfBirth: b.date_of_birth ? String(b.date_of_birth) : null,
          registrationNo: b.registration_no ? String(b.registration_no) : null,
          bin: b.bin ? String(b.bin) : null,
          authorizedPerson: b.authorized_person ? String(b.authorized_person) : null,
          authorizedDesignation: b.authorized_designation ? String(b.authorized_designation) : null,
          officeAddress: b.office_address ? String(b.office_address) : null,
          mobile: b.mobile ? String(b.mobile) : null,
          alternateMobile: b.alternate_mobile ? String(b.alternate_mobile) : null,
          email: b.email ? String(b.email) : null,
          tin: b.tin ? String(b.tin) : null,
          presentAddress: b.present_address ? String(b.present_address) : null,
          permanentAddress: b.permanent_address ? String(b.permanent_address) : null,
          notes: b.notes ? String(b.notes) : null,
          isActive: b.is_active !== false,
        },
      });
      await recordAudit(user.name, "created", row.name, "ClientRecord", [], user.id);
      return row;
    }

    if (kind === "owners") {
      const cnt = await prisma.propertyOwner.count();
      const row = await prisma.propertyOwner.create({
        data: {
          companyId: COMPANY_ID,
          code: `OWN-${String(cnt + 1).padStart(4, "0")}`,
          name: String(b.name || "Owner"),
          nid: b.nid ? String(b.nid) : null,
          tin: b.tin ? String(b.tin) : null,
          fatherName: b.father_name ? String(b.father_name) : null,
          motherName: b.mother_name ? String(b.mother_name) : null,
          dateOfBirth: b.date_of_birth ? String(b.date_of_birth) : null,
          occupation: b.occupation ? String(b.occupation) : null,
          mobile: b.mobile ? String(b.mobile) : null,
          alternateMobile: b.alternate_mobile ? String(b.alternate_mobile) : null,
          email: b.email ? String(b.email) : null,
          presentAddress: b.present_address ? String(b.present_address) : null,
          permanentAddress: b.permanent_address ? String(b.permanent_address) : null,
          notes: b.notes ? String(b.notes) : null,
          isActive: b.is_active !== false,
        },
      });
      await recordAudit(user.name, "created", row.name, "PropertyOwner", [], user.id);
      return row;
    }

    if (kind === "agreements") {
      const cnt = await prisma.devAgreement.count();
      const row = await prisma.devAgreement.create({
        data: {
          companyId: COMPANY_ID,
          code: `DAG-2026-${String(cnt + 1).padStart(4, "0")}`,
          clientId: b.client_id ? Number(b.client_id) : null,
          projectId: b.project_id ? Number(b.project_id) : null,
          agreementType: String(b.agreement_type ?? "joint_venture"),
          contractValue: Number(b.contract_value ?? 0) || 0,
          signedBy: b.signed_by ? String(b.signed_by) : null,
          agreementDate: String(b.agreement_date ?? today),
          effectiveDate: b.effective_date ? String(b.effective_date) : null,
          expiryDate: b.expiry_date ? String(b.expiry_date) : null,
          notes: b.notes ? String(b.notes) : null,
        },
      });
      await recordAudit(user.name, "created", row.code, "DevAgreement", [], user.id);
      return row;
    }

    if (kind === "sales") {
      const cnt = await prisma.apartmentSale.count();
      const row = await prisma.apartmentSale.create({
        data: {
          companyId: COMPANY_ID,
          code: `SAL-2026-${String(cnt + 1).padStart(4, "0")}`,
          projectId: b.project_id ? Number(b.project_id) : null,
          customerId: b.customer_id ? Number(b.customer_id) : null,
          salesPersonId: b.sales_person_id ? Number(b.sales_person_id) : null,
          saleDate: String(b.sale_date ?? today),
          agreementDate: b.agreement_date ? String(b.agreement_date) : null,
          expectedHandoverDate: b.expected_handover_date ? String(b.expected_handover_date) : null,
          paymentPlanType: String(b.payment_plan_type ?? "installment"),
          otherCharges: Number(b.other_charges ?? 0) || 0,
          totalAmount: Number(b.total_amount ?? 0) || 0,
          terms: b.terms ? String(b.terms) : null,
          note: b.note ? String(b.note) : null,
        },
      });
      await recordAudit(user.name, "created", row.code, "ApartmentSale", [], user.id);
      return row;
    }

    if (kind === "payments") {
      const cnt = await prisma.moneyReceipt.count();
      const row = await prisma.moneyReceipt.create({
        data: {
          companyId: COMPANY_ID,
          code: `MR-2026-${String(cnt + 1).padStart(4, "0")}`,
          customerId: b.customer_id ? Number(b.customer_id) : null,
          apartmentSaleId: b.apartment_sale_id ? Number(b.apartment_sale_id) : null,
          paymentDate: String(b.payment_date ?? today),
          paymentTypeId: b.payment_type_id ? Number(b.payment_type_id) : null,
          accountId: b.account_id ? Number(b.account_id) : null,
          amount: Number(b.amount ?? 0) || 0,
          method: String(b.method ?? "bank"),
          reference: b.reference ? String(b.reference) : null,
          narration: b.narration ? String(b.narration) : null,
        },
      });
      await recordAudit(user.name, "created", row.code, "MoneyReceipt", [], user.id);
      return row;
    }

    if (kind === "targets") {
      const empId = b.employee_id ? Number(b.employee_id) : null;
      const emp = empId ? await prisma.employee.findUnique({ where: { id: empId } }) : null;
      const row = await prisma.salesTarget.create({
        data: {
          companyId: COMPANY_ID,
          employeeId: empId,
          employeeName: emp ? `${emp.firstName} ${emp.lastName ?? ""}`.trim() : String(b.employee_name || "Sales Executive"),
          periodStart: String(b.period_start ?? today),
          periodEnd: String(b.period_end ?? today),
          targetType: String(b.target_type ?? "both"),
          targetAmount: Number(b.target_amount ?? 0) || 0,
          targetUnits: Number(b.target_units ?? 0) || 0,
          note: b.note ? String(b.note) : null,
        },
      });
      await recordAudit(user.name, "created", row.employeeName, "SalesTarget", [], user.id);
      return row;
    }

    throw new ServiceError(400, `Unsupported sales kind: ${kind}`);
  },

  async updateRecord(user: SessionUser, kind: string, id: number, b: Record<string, unknown>) {
    if (kind === "owners") {
      const row = await prisma.propertyOwner.update({
        where: { id },
        data: {
          ...(b.name !== undefined ? { name: String(b.name) } : {}),
          ...(b.nid !== undefined ? { nid: b.nid ? String(b.nid) : null } : {}),
          ...(b.tin !== undefined ? { tin: b.tin ? String(b.tin) : null } : {}),
          ...(b.father_name !== undefined ? { fatherName: b.father_name ? String(b.father_name) : null } : {}),
          ...(b.mother_name !== undefined ? { motherName: b.mother_name ? String(b.mother_name) : null } : {}),
          ...(b.mobile !== undefined ? { mobile: b.mobile ? String(b.mobile) : null } : {}),
          ...(b.email !== undefined ? { email: b.email ? String(b.email) : null } : {}),
          ...(b.present_address !== undefined ? { presentAddress: b.present_address ? String(b.present_address) : null } : {}),
          ...(b.permanent_address !== undefined ? { permanentAddress: b.permanent_address ? String(b.permanent_address) : null } : {}),
          ...(b.notes !== undefined ? { notes: b.notes ? String(b.notes) : null } : {}),
          ...(b.is_active !== undefined ? { isActive: Boolean(b.is_active) } : {}),
        },
      });
      await recordAudit(user.name, "updated", row.name, "PropertyOwner", [], user.id);
      return row;
    }
    return { ok: true };
  },

  async deleteRecord(user: SessionUser, kind: string, id: number) {
    if (kind === "clients") await prisma.clientRecord.delete({ where: { id } });
    else if (kind === "owners") await prisma.propertyOwner.delete({ where: { id } });
    else if (kind === "agreements") await prisma.devAgreement.delete({ where: { id } });
    else if (kind === "sales") await prisma.apartmentSale.delete({ where: { id } });
    else if (kind === "payments") await prisma.moneyReceipt.delete({ where: { id } });
    else if (kind === "targets") await prisma.salesTarget.delete({ where: { id } });
    await recordAudit(user.name, "deleted", `${kind}#${id}`, "Sales", [], user.id);
    return { ok: true };
  },
};
