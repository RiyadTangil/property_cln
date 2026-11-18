import { optNum, optStr, reqStr } from "@/server/http/api-handler";
import { ProcurementService } from "@/server/services/procurement.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const ProcurementController = {
  createSupplier(user: SessionUser, b: RawBody) {
    return ProcurementService.createSupplier(user, {
      supplierType: optStr(b.supplier_type ?? b.supplierType) ?? "material",
      companyName: reqStr(b.company_name ?? b.companyName),
      displayName: optStr(b.display_name ?? b.displayName),
      status: optStr(b.status) ?? "active",
      openingBalance: optNum(b.opening_balance) ?? 0,
      creditLimit: optNum(b.credit_limit) ?? 0,
      creditDays: optNum(b.credit_days) ?? 30,
      businessCategory: optStr(b.business_category),
      industry: optStr(b.industry),
      tradeLicense: optStr(b.trade_license),
      website: optStr(b.website),
      defaultCurrency: optStr(b.default_currency) ?? "BDT",
      defaultPaymentMethod: optStr(b.default_payment_method) ?? "bank",
      leadTimeDays: optNum(b.lead_time_days) ?? 7,
      notes: optStr(b.notes),
    });
  },
  createVendor(user: SessionUser, b: RawBody) {
    return ProcurementService.createVendor(user, {
      name: reqStr(b.name),
      displayName: optStr(b.display_name ?? b.displayName),
      vendorType: optStr(b.vendor_type ?? b.vendorType) ?? "service",
      category: optStr(b.category),
      status: optStr(b.status) ?? "active",
      contactPerson: optStr(b.contact_person),
      phone: optStr(b.phone),
      email: optStr(b.email),
      city: optStr(b.city),
      country: optStr(b.country) ?? "BD",
      defaultCurrency: optStr(b.default_currency) ?? "BDT",
      openingBalance: optNum(b.opening_balance) ?? 0,
      creditLimit: optNum(b.credit_limit) ?? 0,
      creditDays: optNum(b.credit_days) ?? 30,
      tradeLicense: optStr(b.trade_license),
      taxNumber: optStr(b.tax_number),
      notes: optStr(b.notes),
    });
  },
};
