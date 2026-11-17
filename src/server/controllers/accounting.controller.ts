import { optNum, optStr, reqStr } from "@/server/http/api-handler";
import { AccountingService } from "@/server/services/accounting.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const AccountingController = {
  // ---------------- Chart of Accounts ----------------
  listAccounts() {
    return AccountingService.listAccounts();
  },

  createAccount(user: SessionUser, b: RawBody) {
    return AccountingService.createAccount(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      parentId: optNum(b.parent_id ?? b.parentId),
      code: reqStr(b.code).toUpperCase(),
      name: reqStr(b.name),
      accountType: reqStr(b.account_type ?? b.accountType, "asset"),
      normalBalance: reqStr(b.normal_balance ?? b.normalBalance, "debit"),
      openingBalance: Number(b.opening_balance ?? b.openingBalance ?? 0) || 0,
      currency: optStr(b.currency)?.toUpperCase() ?? null,
      isGroup: Boolean(b.is_group ?? b.isGroup),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
      description: optStr(b.description),
    });
  },

  updateAccount(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    const groupVal = b.isGroup ?? b.is_group;
    return AccountingService.updateAccount(user, id, {
      parentId: b.parent_id !== undefined || b.parentId !== undefined ? optNum(b.parent_id ?? b.parentId) : undefined,
      code: b.code !== undefined ? reqStr(b.code).toUpperCase() : undefined,
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      accountType: b.account_type !== undefined || b.accountType !== undefined ? reqStr(b.account_type ?? b.accountType) : undefined,
      normalBalance: b.normal_balance !== undefined || b.normalBalance !== undefined ? reqStr(b.normal_balance ?? b.normalBalance) : undefined,
      openingBalance: b.opening_balance !== undefined || b.openingBalance !== undefined ? Number(b.opening_balance ?? b.openingBalance ?? 0) : undefined,
      currency: b.currency !== undefined ? optStr(b.currency)?.toUpperCase() ?? null : undefined,
      isGroup: typeof groupVal === "boolean" ? groupVal : undefined,
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
      description: b.description !== undefined ? optStr(b.description) : undefined,
    });
  },

  deleteAccount(user: SessionUser, id: number) {
    return AccountingService.deleteAccount(user, id);
  },

  // ---------------- Income / Expense Heads ----------------
  listHeads() {
    return AccountingService.listHeads();
  },

  createHead(user: SessionUser, b: RawBody) {
    return AccountingService.createHead(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      type: reqStr(b.type, "expense"),
      name: reqStr(b.name),
      accountId: Number(b.account_id ?? b.accountId),
      defaultCostCode: optStr(b.default_cost_code_id ?? b.default_cost_code ?? b.defaultCostCode),
      description: optStr(b.description),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateHead(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    return AccountingService.updateHead(user, id, {
      type: b.type !== undefined ? reqStr(b.type) : undefined,
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      accountId: b.account_id !== undefined || b.accountId !== undefined ? Number(b.account_id ?? b.accountId) : undefined,
      defaultCostCode:
        b.default_cost_code_id !== undefined || b.defaultCostCode !== undefined
          ? optStr(b.default_cost_code_id ?? b.defaultCostCode)
          : undefined,
      description: b.description !== undefined ? optStr(b.description) : undefined,
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteHead(user: SessionUser, id: number) {
    return AccountingService.deleteHead(user, id);
  },

  // ---------------- Banks ----------------
  listBanks() {
    return AccountingService.listBanks();
  },

  createBank(user: SessionUser, b: RawBody) {
    return AccountingService.createBank(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      name: reqStr(b.name),
      shortName: optStr(b.short_name ?? b.shortName),
      accountName: optStr(b.account_name ?? b.accountName),
      accountNumber: optStr(b.account_number ?? b.accountNumber),
      branch: optStr(b.branch),
      routingNumber: optStr(b.routing_number ?? b.routingNumber),
      swift: optStr(b.swift),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateBank(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    return AccountingService.updateBank(user, id, {
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      shortName: b.short_name !== undefined || b.shortName !== undefined ? optStr(b.short_name ?? b.shortName) : undefined,
      accountName: b.account_name !== undefined || b.accountName !== undefined ? optStr(b.account_name ?? b.accountName) : undefined,
      accountNumber: b.account_number !== undefined || b.accountNumber !== undefined ? optStr(b.account_number ?? b.accountNumber) : undefined,
      branch: b.branch !== undefined ? optStr(b.branch) : undefined,
      routingNumber: b.routing_number !== undefined || b.routingNumber !== undefined ? optStr(b.routing_number ?? b.routingNumber) : undefined,
      swift: b.swift !== undefined ? optStr(b.swift) : undefined,
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteBank(user: SessionUser, id: number) {
    return AccountingService.deleteBank(user, id);
  },

  // ---------------- Lenders ----------------
  listLenders() {
    return AccountingService.listLenders();
  },

  createLender(user: SessionUser, b: RawBody) {
    return AccountingService.createLender(user, {
      companyId: optNum(b.company_id ?? b.companyId),
      name: reqStr(b.name),
      lenderType: reqStr(b.lender_type ?? b.lenderType, "bank"),
      contactPerson: optStr(b.contact_person ?? b.contactPerson),
      phone: optStr(b.phone),
      email: optStr(b.email),
      address: optStr(b.address),
      bankId: optNum(b.bank_id ?? b.bankId),
      notes: optStr(b.notes),
      isActive:
        b.is_active === undefined && b.isActive === undefined
          ? true
          : Boolean(b.is_active ?? b.isActive),
    });
  },

  updateLender(user: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    return AccountingService.updateLender(user, id, {
      name: b.name !== undefined ? reqStr(b.name) : undefined,
      lenderType: b.lender_type !== undefined || b.lenderType !== undefined ? reqStr(b.lender_type ?? b.lenderType) : undefined,
      contactPerson: b.contact_person !== undefined || b.contactPerson !== undefined ? optStr(b.contact_person ?? b.contactPerson) : undefined,
      phone: b.phone !== undefined ? optStr(b.phone) : undefined,
      email: b.email !== undefined ? optStr(b.email) : undefined,
      address: b.address !== undefined ? optStr(b.address) : undefined,
      bankId: b.bank_id !== undefined || b.bankId !== undefined ? optNum(b.bank_id ?? b.bankId) : undefined,
      notes: b.notes !== undefined ? optStr(b.notes) : undefined,
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
    });
  },

  deleteLender(user: SessionUser, id: number) {
    return AccountingService.deleteLender(user, id);
  },
};
