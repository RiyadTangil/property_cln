import { optNum, optStr, reqStr } from "@/server/http/api-handler";
import { ContractorsService } from "@/server/services/contractors.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const ContractorsController = {
  createContractor(user: SessionUser, b: RawBody) {
    return ContractorsService.createContractor(user, {
      name: reqStr(b.name),
      displayName: optStr(b.display_name ?? b.displayName),
      contractorType: optStr(b.contractor_type ?? b.contractorType) ?? "labour_and_material",
      trade: optStr(b.trade),
      status: optStr(b.status) ?? "active",
      contactPerson: optStr(b.contact_person ?? b.contactPerson),
      phone: optStr(b.phone),
      email: optStr(b.email),
      addressLine: optStr(b.address_line ?? b.addressLine),
      city: optStr(b.city),
      tradeLicense: optStr(b.trade_license ?? b.tradeLicense),
      defaultRetentionPercent: optNum(b.default_retention_percent) ?? 5,
      defaultSecurityDepositPercent: optNum(b.default_security_deposit_percent) ?? 0,
      defaultTdsPercent: optNum(b.default_tds_percent) ?? 3,
      defaultVatPercent: optNum(b.default_vat_percent) ?? 0,
      taxNumber: optStr(b.tax_number),
      vatNumber: optStr(b.vat_number),
      bankName: optStr(b.bank_name),
      bankBranch: optStr(b.bank_branch),
      bankAccountNo: optStr(b.bank_account_no),
      notes: optStr(b.notes),
    });
  },
  createWorkOrder(user: SessionUser, b: RawBody) {
    return ContractorsService.createWorkOrder(user, {
      contractorId: Number(b.contractor_id ?? b.contractorId),
      projectId: optNum(b.project_id ?? b.projectId),
      orderDate: reqStr(b.order_date ?? b.orderDate, new Date().toISOString().slice(0, 10)),
      engagementType: optStr(b.engagement_type) ?? "subcontract",
      pricingMethod: optStr(b.pricing_method) ?? "item_rate",
      title: reqStr(b.title),
      scope: optStr(b.scope),
      startDate: optStr(b.start_date),
      completionDate: optStr(b.completion_date),
      defectLiabilityDays: optNum(b.defect_liability_days) ?? 180,
      retentionPercent: optNum(b.retention_percent) ?? 5,
      tdsPercent: optNum(b.tds_percent) ?? 3,
      vatPercent: optNum(b.vat_percent) ?? 0,
      advanceRecoveryPercent: optNum(b.advance_recovery_percent) ?? 0,
      contractValue: optNum(b.contract_value ?? b.contractValue) ?? 0,
    });
  },
  createPayment(user: SessionUser, b: RawBody) {
    return ContractorsService.createPayment(user, {
      contractorId: Number(b.contractor_id ?? b.contractorId),
      projectId: optNum(b.project_id ?? b.projectId),
      kind: optStr(b.kind) ?? "payment",
      paymentDate: reqStr(b.payment_date ?? b.paymentDate, new Date().toISOString().slice(0, 10)),
      amount: Number(b.amount ?? 0) || 0,
      method: optStr(b.method) ?? "bank",
      reference: optStr(b.reference),
      notes: optStr(b.notes),
    });
  },
};
