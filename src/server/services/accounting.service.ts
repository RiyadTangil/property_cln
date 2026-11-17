import { prisma } from "@/lib/prisma";
import { allocateSequenceCode, recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type {
  CreateAccountHeadDto,
  CreateBankAccountDto,
  CreateChartAccountDto,
  CreateLenderDto,
  UpdateAccountHeadDto,
  UpdateBankAccountDto,
  UpdateChartAccountDto,
  UpdateLenderDto,
} from "@/server/dto/accounting.dto";

function formatDateEnGb(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function resolveDefaultCompanyId(): Promise<number> {
  const company = await prisma.company.findFirst({ orderBy: { id: "asc" } });
  return company?.id ?? 1;
}

export const AccountingService = {
  // ---------------- Chart of Accounts ----------------
  async listAccounts() {
    return prisma.chartAccount.findMany({
      orderBy: [{ code: "asc" }, { id: "asc" }],
    });
  },

  async getAccountsPageData() {
    const rows = await prisma.chartAccount.findMany({
      orderBy: [{ code: "asc" }, { id: "asc" }],
    });

    // Build depth-first ordered list so parent rows always precede children
    const byParent = new Map<number | null, typeof rows>();
    for (const r of rows) {
      const list = byParent.get(r.parentId) ?? [];
      list.push(r);
      byParent.set(r.parentId, list);
    }

    const ordered: Array<{
      id: number;
      parentId: number | null;
      parentLabel: string;
      depth: number;
      code: string;
      name: string;
      accountType: string;
      normalBalance: string;
      openingBalance: number;
      currency: string | null;
      isGroup: boolean;
      isSystem: boolean;
      isActive: boolean;
      description: string | null;
      hasChildren: boolean;
    }> = [];

    const byId = new Map(rows.map((r) => [r.id, r]));

    function walk(parentId: number | null, depth: number) {
      const kids = byParent.get(parentId) ?? [];
      for (const node of kids) {
        const nodeKids = byParent.get(node.id) ?? [];
        const p = node.parentId ? byId.get(node.parentId) : null;
        ordered.push({
          id: node.id,
          parentId: node.parentId,
          parentLabel: p ? `${p.code} · ${p.name}` : "",
          depth,
          code: node.code,
          name: node.name,
          accountType: node.accountType,
          normalBalance: node.normalBalance,
          openingBalance: node.openingBalance,
          currency: node.currency,
          isGroup: node.isGroup,
          isSystem: node.isSystem,
          isActive: node.isActive,
          description: node.description,
          hasChildren: nodeKids.length > 0,
        });
        walk(node.id, depth + 1);
      }
    }
    walk(null, 0);

    const summary = {
      asset: rows.filter((r) => r.accountType === "asset").length,
      liability: rows.filter((r) => r.accountType === "liability").length,
      equity: rows.filter((r) => r.accountType === "equity").length,
      income: rows.filter((r) => r.accountType === "income").length,
      expense: rows.filter((r) => r.accountType === "expense").length,
      total: rows.length,
    };

    const groupParents = rows
      .filter((r) => r.isGroup)
      .map((r) => ({ id: r.id, code: r.code, name: r.name, accountType: r.accountType }));

    return { accounts: ordered, summary, groupParents };
  },

  async createAccount(user: SessionUser, dto: CreateChartAccountDto) {
    if (!dto.code || !dto.name) {
      throw new ServiceError(400, "Account Code and Name are required.");
    }
    const exists = await prisma.chartAccount.findUnique({ where: { code: dto.code } });
    if (exists) {
      throw new ServiceError(409, `Account code ${dto.code} already exists.`);
    }

    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());
    let accountType = dto.accountType || "asset";
    if (dto.parentId) {
      const parent = await prisma.chartAccount.findUnique({ where: { id: dto.parentId } });
      if (parent) accountType = parent.accountType;
    }

    const account = await prisma.chartAccount.create({
      data: {
        companyId,
        parentId: dto.parentId,
        code: dto.code,
        name: dto.name,
        accountType,
        normalBalance: dto.normalBalance || (accountType === "asset" || accountType === "expense" ? "debit" : "credit"),
        openingBalance: dto.openingBalance || 0,
        currency: dto.currency,
        isGroup: dto.isGroup,
        isSystem: false,
        isActive: dto.isActive,
        description: dto.description,
        createdBy: user.name,
      },
    });

    await recordAudit(user.name, "created", `${account.code} · ${account.name}`, "ChartAccount", ["code", "name"], user.id);
    return account;
  },

  async updateAccount(user: SessionUser, id: number, dto: UpdateChartAccountDto) {
    const existing = await prisma.chartAccount.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Account not found.");

    const data: Record<string, unknown> = {};
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.accountType !== undefined) data.accountType = dto.accountType;
    if (dto.normalBalance !== undefined) data.normalBalance = dto.normalBalance;
    if (dto.openingBalance !== undefined) data.openingBalance = dto.openingBalance;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (typeof dto.isGroup === "boolean") data.isGroup = dto.isGroup;
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;
    if (dto.description !== undefined) data.description = dto.description;

    const updated = await prisma.chartAccount.update({ where: { id }, data });
    await recordAudit(user.name, "updated", `${updated.code} · ${updated.name}`, "ChartAccount", Object.keys(data), user.id);
    return updated;
  },

  async deleteAccount(user: SessionUser, id: number) {
    const existing = await prisma.chartAccount.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Account not found.");
    if (existing.isSystem) {
      throw new ServiceError(400, "Built-in system accounts cannot be deleted.");
    }
    const deleted = await prisma.chartAccount.delete({ where: { id } });
    await recordAudit(user.name, "deleted", `${deleted.code} · ${deleted.name}`, "ChartAccount", ["id"], user.id);
    return deleted;
  },

  // ---------------- Income / Expense Heads ----------------
  async listHeads() {
    return prisma.accountHead?.findMany({
      include: { account: { select: { id: true, code: true, name: true } } },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  },

  async getHeadsPageData() {
    const [rows, accounts] = await Promise.all([
      prisma.accountHead?.findMany({
        include: { account: { select: { id: true, code: true, name: true } } },
        orderBy: [{ id: "asc" }],
      }),
      prisma.chartAccount?.findMany({
        where: { isGroup: false, isActive: true, accountType: { in: ["income", "expense"] } },
        orderBy: { code: "asc" },
        select: { id: true, code: true, name: true, accountType: true },
      }),
    ]);

    return {
      heads: rows.map((h) => ({
        id: h.id,
        type: h.type,
        name: h.name,
        accountId: h.accountId,
        accountCode: h.account.code,
        accountName: h.account.name,
        defaultCostCode: h.defaultCostCode,
        description: h.description,
        entriesCount: h.entriesCount,
        isActive: h.isActive,
        createdBy: h.createdBy,
        createdAt: formatDateEnGb(h.createdAt),
      })),
      accounts,
    };
  },

  async createHead(user: SessionUser, dto: CreateAccountHeadDto) {
    if (!dto.name || !dto.accountId) {
      throw new ServiceError(400, "Head Name and Linked Account are required.");
    }
    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());
    const head = await prisma.accountHead.create({
      data: {
        companyId,
        type: dto.type || "expense",
        name: dto.name,
        accountId: dto.accountId,
        defaultCostCode: dto.defaultCostCode,
        description: dto.description,
        isActive: dto.isActive,
        createdBy: user.name,
      },
      include: { account: { select: { id: true, code: true, name: true } } },
    });
    await recordAudit(user.name, "created", head.name, "AccountHead", ["type", "name", "accountId"], user.id);
    return head;
  },

  async updateHead(user: SessionUser, id: number, dto: UpdateAccountHeadDto) {
    const data: Record<string, unknown> = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.accountId !== undefined) data.accountId = dto.accountId;
    if (dto.defaultCostCode !== undefined) data.defaultCostCode = dto.defaultCostCode;
    if (dto.description !== undefined) data.description = dto.description;
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const updated = await prisma.accountHead.update({
      where: { id },
      data,
      include: { account: { select: { id: true, code: true, name: true } } },
    });
    await recordAudit(user.name, "updated", updated.name, "AccountHead", Object.keys(data), user.id);
    return updated;
  },

  async deleteHead(user: SessionUser, id: number) {
    const existing = await prisma.accountHead.findUnique({ where: { id } });
    if (!existing) throw new ServiceError(404, "Head not found.");
    if (existing.entriesCount > 0) {
      throw new ServiceError(400, "Heads in use by entries cannot be deleted.");
    }
    const deleted = await prisma.accountHead.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "AccountHead", ["id"], user.id);
    return deleted;
  },

  // ---------------- Banks ----------------
  async listBanks() {
    return prisma.bankAccount.findMany({ orderBy: { id: "asc" } });
  },

  async getBanksPageData() {
    const rows = await prisma.bankAccount.findMany({ orderBy: { id: "asc" } });
    return {
      banks: rows.map((b) => ({
        id: b.id,
        name: b.name,
        shortName: b.shortName,
        accountName: b.accountName,
        accountNumber: b.accountNumber,
        branch: b.branch,
        routingNumber: b.routingNumber,
        swift: b.swift,
        isActive: b.isActive,
        createdBy: b.createdBy,
        createdAt: formatDateEnGb(b.createdAt),
      })),
    };
  },

  async createBank(user: SessionUser, dto: CreateBankAccountDto) {
    if (!dto.name) {
      throw new ServiceError(400, "Bank Name is required.");
    }
    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());
    const bank = await prisma.bankAccount.create({
      data: {
        companyId,
        name: dto.name,
        shortName: dto.shortName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        branch: dto.branch,
        routingNumber: dto.routingNumber,
        swift: dto.swift,
        isActive: dto.isActive,
        createdBy: user.name,
      },
    });
    await recordAudit(user.name, "created", bank.name, "BankAccount", ["name"], user.id);
    return bank;
  },

  async updateBank(user: SessionUser, id: number, dto: UpdateBankAccountDto) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.shortName !== undefined) data.shortName = dto.shortName;
    if (dto.accountName !== undefined) data.accountName = dto.accountName;
    if (dto.accountNumber !== undefined) data.accountNumber = dto.accountNumber;
    if (dto.branch !== undefined) data.branch = dto.branch;
    if (dto.routingNumber !== undefined) data.routingNumber = dto.routingNumber;
    if (dto.swift !== undefined) data.swift = dto.swift;
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const updated = await prisma.bankAccount.update({ where: { id }, data });
    await recordAudit(user.name, "updated", updated.name, "BankAccount", Object.keys(data), user.id);
    return updated;
  },

  async deleteBank(user: SessionUser, id: number) {
    const deleted = await prisma.bankAccount.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "BankAccount", ["id"], user.id);
    return deleted;
  },

  // ---------------- Lenders ----------------
  async listLenders() {
    return prisma.lender.findMany({
      include: { bank: { select: { id: true, name: true } } },
      orderBy: { id: "asc" },
    });
  },

  async getLendersPageData(filters: { search?: string; type?: string }) {
    const search = (filters.search ?? "").trim();
    const type = (filters.type ?? "").trim();

    const [rows, banks] = await Promise.all([
      prisma.lender.findMany({
        where: {
          ...(type ? { lenderType: type } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search } },
                  { code: { contains: search } },
                  { contactPerson: { contains: search } },
                ],
              }
            : {}),
        },
        include: { bank: { select: { id: true, name: true } } },
        orderBy: { id: "asc" },
      }),
      prisma.bankAccount.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, shortName: true },
      }),
    ]);

    return {
      lenders: rows.map((l) => ({
        id: l.id,
        code: l.code,
        name: l.name,
        lenderType: l.lenderType,
        contactPerson: l.contactPerson,
        phone: l.phone,
        email: l.email,
        address: l.address,
        bankId: l.bankId,
        bankName: l.bank?.name ?? null,
        loansCount: l.loansCount,
        notes: l.notes,
        isActive: l.isActive,
      })),
      banks,
      filters: { search, type },
    };
  },

  async createLender(user: SessionUser, dto: CreateLenderDto) {
    if (!dto.name) {
      throw new ServiceError(400, "Lender Name is required.");
    }
    const companyId = dto.companyId ?? (await resolveDefaultCompanyId());
    const count = await prisma.lender.count();
    const seq = await prisma.codeSequence.findUnique({ where: { key: "lender" } });
    const code = seq
      ? await allocateSequenceCode("lender", "LND")
      : `LND-${String(count + 1).padStart(4, "0")}`;

    const lender = await prisma.lender.create({
      data: {
        companyId,
        code,
        name: dto.name,
        lenderType: dto.lenderType || "bank",
        contactPerson: dto.contactPerson,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        bankId: dto.bankId,
        notes: dto.notes,
        isActive: dto.isActive,
        createdBy: user.name,
      },
    });
    await recordAudit(user.name, "created", lender.name, "Lender", ["code", "name", "lenderType"], user.id);
    return lender;
  },

  async updateLender(user: SessionUser, id: number, dto: UpdateLenderDto) {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.lenderType !== undefined) data.lenderType = dto.lenderType;
    if (dto.contactPerson !== undefined) data.contactPerson = dto.contactPerson;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.bankId !== undefined) data.bankId = dto.bankId;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;

    const updated = await prisma.lender.update({ where: { id }, data });
    await recordAudit(user.name, "updated", updated.name, "Lender", Object.keys(data), user.id);
    return updated;
  },

  async deleteLender(user: SessionUser, id: number) {
    const deleted = await prisma.lender.delete({ where: { id } });
    await recordAudit(user.name, "deleted", deleted.name, "Lender", ["id"], user.id);
    return deleted;
  },
};
