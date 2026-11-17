import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/tier0";
import permissionsCatalog from "@/lib/permissions-catalog.json";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";
import type { PermCatalogModule } from "@/components/settings/RolesWorkbenchClient";
import type {
  CreateDocumentDto,
  CreateInvoiceTemplateDto,
  CreateMfsServiceDto,
  CreateRoleDto,
  CreateUserDto,
  UpdateAppSettingDto,
  UpdateCodeSequenceDto,
  UpdateMfsServiceDto,
  UpdateProfileDto,
  UpdateRoleDto,
  UpdateUserDto,
} from "@/server/dto/settings.dto";

function formatDateEnGb(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const SettingsService = {
  // ---------------- Users ----------------
  async listUsers() {
    return prisma.user.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        roleId: true,
        jobTitle: true,
        phone: true,
        isSuperAdmin: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  async getUsersPageData(filters: {
    search?: string;
    role?: string;
    status?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const role = (filters.role ?? "").trim();
    const status = (filters.status ?? "").trim();

    const [users, roleRows] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...(role ? { role } : {}),
          ...(status === "active"
            ? { isActive: true }
            : status === "inactive"
            ? { isActive: false }
            : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search } },
                  { email: { contains: search } },
                  { jobTitle: { contains: search } },
                ],
              }
            : {}),
        },
        orderBy: { id: "asc" },
      }),
      prisma.role.findMany({ orderBy: { id: "asc" } }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role,
        jobTitle: u.jobTitle,
        phone: u.phone,
        isSuperAdmin: u.isSuperAdmin,
        isActive: u.isActive,
        createdAt: formatDateEnGb(u.createdAt),
      })),
      roles: roleRows.map((r) => r.name),
      filters: { search, role, status },
    };
  },

  async getCreateUserPageData() {
    const [company, roles] = await Promise.all([
      prisma.company.findFirst({ orderBy: { id: "asc" } }),
      prisma.role.findMany({ orderBy: { id: "asc" } }),
    ]);

    return {
      companyName: company?.name ?? "E-Hishabi ERP",
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        scope: r.scope,
        permissionsCount: r.permissionsCount,
      })),
    };
  },

  async createUser(actor: SessionUser, dto: CreateUserDto) {
    if (!dto.name || !dto.email || !dto.password) {
      throw new ServiceError(400, "Full Name, Email, and Password are required.");
    }
    if (dto.password.length < 8) {
      throw new ServiceError(400, "Password must be at least 8 characters.");
    }
    if (dto.passwordConfirmation && dto.password !== dto.passwordConfirmation) {
      throw new ServiceError(400, "Passwords do not match.");
    }

    const exists = await prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new ServiceError(409, `User with email ${dto.email} already exists.`);
    }

    const matchedRole = await prisma.role.findUnique({ where: { name: dto.roleName } });
    const usernameBase = dto.email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "");
    const username = `${usernameBase}-${String(Date.now()).slice(-3)}`;

    const created = await prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        username,
        password: dto.password,
        jobTitle: dto.jobTitle,
        phone: dto.phone,
        role: dto.roleName,
        roleId: matchedRole?.id ?? null,
        isSuperAdmin: dto.isSuperAdmin,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roleId: true,
        jobTitle: true,
        isSuperAdmin: true,
        isActive: true,
      },
    });

    await recordAudit(actor.name, "created", created.name, "User", ["email", "role"], actor.id);
    return created;
  },

  async updateUser(actor: SessionUser, id: number, dto: UpdateUserDto) {
    const data: Record<string, unknown> = {};
    if (typeof dto.isActive === "boolean") data.isActive = dto.isActive;
    if (typeof dto.role === "string" && dto.role) {
      data.role = dto.role;
      const matchedRole = await prisma.role.findUnique({ where: { name: dto.role } });
      data.roleId = matchedRole?.id ?? null;
    }

    const updated = await prisma.user.update({ where: { id }, data });
    await recordAudit(actor.name, "updated", updated.name, "User", Object.keys(data), actor.id);
    return updated;
  },

  async deleteUser(actor: SessionUser, id: number) {
    if (id === actor.id) {
      throw new ServiceError(400, "Cannot delete your own active account.");
    }
    const deleted = await prisma.user.delete({ where: { id } });
    await recordAudit(actor.name, "deleted", deleted.name, "User", ["id"], actor.id);
    return deleted;
  },

  // ---------------- Roles ----------------
  async listRoles() {
    return prisma.role.findMany({ orderBy: { id: "asc" } });
  },

  async getRolesPageData() {
    const roles = await prisma.role.findMany({
      orderBy: { id: "asc" },
      include: { _count: { select: { users: true } } },
    });
    return {
      roles: roles.map((r) => {
        let perms: string[] = [];
        try {
          perms = JSON.parse(r.permissionsJson || "[]");
        } catch {
          perms = [];
        }
        return {
          id: r.id,
          name: r.name,
          scope: r.scope,
          isSuper: r.isSuper,
          permissionsCount: r.permissionsCount,
          usersCount: r._count.users,
          permissions: perms,
        };
      }),
      catalog: permissionsCatalog as PermCatalogModule[],
    };
  },

  async createRole(actor: SessionUser, dto: CreateRoleDto) {
    if (!dto.name) {
      throw new ServiceError(400, "Role Name is required.");
    }

    const exists = await prisma.role.findUnique({ where: { name: dto.name } });
    if (exists) {
      throw new ServiceError(409, `Role "${dto.name}" already exists.`);
    }

    const role = await prisma.role.create({
      data: {
        name: dto.name,
        scope: dto.scope,
        isSuper: false,
        permissionsCount: 0,
        permissionsJson: "[]",
      },
    });

    await recordAudit(actor.name, "created", role.name, "Role", ["name", "scope"], actor.id);
    return role;
  },

  async updateRole(actor: SessionUser, id: number, dto: UpdateRoleDto) {
    const data: Record<string, unknown> = {};
    if (Array.isArray(dto.permissions)) {
      const unique = Array.from(new Set(dto.permissions));
      data.permissionsJson = JSON.stringify(unique);
      data.permissionsCount = unique.length;
    }
    if (typeof dto.name === "string" && dto.name) data.name = dto.name;
    if (typeof dto.scope === "string") data.scope = dto.scope;

    const role = await prisma.role.update({ where: { id }, data });
    await recordAudit(actor.name, "updated", role.name, "Role", Object.keys(data), actor.id);
    return role;
  },

  async deleteRole(actor: SessionUser, id: number) {
    const existing = await prisma.role.findUnique({ where: { id } });
    if (existing?.isSuper) {
      throw new ServiceError(400, "Super Admin role cannot be deleted.");
    }
    const deleted = await prisma.role.delete({ where: { id } });
    await recordAudit(actor.name, "deleted", deleted.name, "Role", ["id"], actor.id);
    return deleted;
  },

  // ---------------- Code Sequences ----------------
  async listCodeSequences() {
    return prisma.codeSequence.findMany({ orderBy: { label: "asc" } });
  },

  async getCodeSequencesPageData() {
    const [company, sequences] = await Promise.all([
      prisma.company.findFirst({ orderBy: { id: "asc" } }),
      prisma.codeSequence.findMany({ orderBy: { label: "asc" } }),
    ]);

    return {
      companyName: company?.name ?? "E-Hishabi ERP",
      companyCode: company?.code ?? "HQ",
      sequences: sequences.map((s) => ({
        id: s.id,
        key: s.key,
        label: s.label,
        prefix: s.prefix,
        suffix: s.suffix,
        separator: s.separator,
        padding: s.padding,
        nextNumber: s.nextNumber,
        yearInCode: s.yearInCode,
        resetYearly: s.resetYearly,
      })),
    };
  },

  async updateCodeSequence(actor: SessionUser, dto: UpdateCodeSequenceDto) {
    if (!dto.id) throw new ServiceError(400, "Sequence id required.");

    const updated = await prisma.codeSequence.update({
      where: { id: dto.id },
      data: {
        label: dto.label,
        prefix: dto.prefix,
        suffix: dto.suffix,
        separator: dto.separator,
        padding: dto.padding,
        nextNumber: dto.nextNumber,
        yearInCode: dto.yearInCode,
        resetYearly: dto.resetYearly,
      },
    });

    await recordAudit(actor.name, "updated", updated.label, "CodeSequence", ["prefix", "padding", "nextNumber"], actor.id);
    return updated;
  },

  // ---------------- Documents ----------------
  async listDocuments() {
    return prisma.documentRecord.findMany({ orderBy: { id: "desc" } });
  },

  async getDocumentsPageData(filters: {
    search?: string;
    documentable_type?: string;
    expiry?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const documentableType = (filters.documentable_type ?? "").trim();
    const expiry = (filters.expiry ?? "").trim();

    let docs = await prisma.documentRecord.findMany({
      where: {
        ...(documentableType ? { module: documentableType } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { category: { contains: search } },
                { uploadedBy: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { id: "desc" },
    });

    const now = new Date();
    if (expiry === "none") {
      docs = docs.filter((d) => !d.expiryDate);
    } else if (expiry === "expired") {
      docs = docs.filter((d) => d.expiryDate && new Date(d.expiryDate) < now);
    } else if (expiry === "expiring") {
      docs = docs.filter((d) => {
        if (!d.expiryDate) return false;
        const diff = (new Date(d.expiryDate).getTime() - now.getTime()) / 86400000;
        return diff >= 0 && diff <= 60;
      });
    }

    return {
      documents: docs.map((d) => ({
        id: d.id,
        title: d.title,
        category: d.category,
        module: d.module,
        uploadedBy: d.uploadedBy,
        uploadedDate: d.uploadedDate,
        expiryDate: d.expiryDate,
        fileSize: d.fileSize,
        fileUrl: d.fileUrl,
      })),
      filters: { search, documentable_type: documentableType, expiry },
    };
  },

  async createDocument(actor: SessionUser, dto: CreateDocumentDto) {
    if (!dto.title) throw new ServiceError(400, "Document Title is required.");

    const doc = await prisma.documentRecord.create({
      data: {
        title: dto.title,
        category: dto.category,
        module: dto.module,
        uploadedBy: actor.name,
        uploadedDate: formatDateEnGb(new Date()),
        expiryDate: dto.expiryDate,
        fileSize: dto.fileSize,
        fileUrl: dto.fileUrl,
      },
    });

    await recordAudit(actor.name, "created", doc.title, "DocumentRecord", ["title", "module"], actor.id);
    return doc;
  },

  async deleteDocument(actor: SessionUser, id: number) {
    if (!id) throw new ServiceError(400, "Document id required.");
    const deleted = await prisma.documentRecord.delete({ where: { id } });
    await recordAudit(actor.name, "deleted", deleted.title, "DocumentRecord", ["id"], actor.id);
    return deleted;
  },

  // ---------------- Invoice Templates ----------------
  async listInvoiceTemplates() {
    return prisma.invoiceTemplate.findMany({ orderBy: { id: "desc" } });
  },

  async getInvoiceTemplatesPageData() {
    const templates = await prisma.invoiceTemplate.findMany({ orderBy: { id: "desc" } });
    return {
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        paper: t.paper,
        orientation: t.orientation,
        isDefault: t.isDefault,
        isActive: t.isActive,
      })),
    };
  },

  async createInvoiceTemplate(actor: SessionUser, dto: CreateInvoiceTemplateDto) {
    if (!dto.name) throw new ServiceError(400, "Template Name is required.");

    if (dto.isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { type: dto.type },
        data: { isDefault: false },
      });
    }

    const template = await prisma.invoiceTemplate.create({
      data: {
        name: dto.name,
        type: dto.type,
        paper: dto.paper,
        orientation: dto.orientation,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
        blocksJson: dto.blocksJson,
      },
    });

    await recordAudit(actor.name, "created", template.name, "InvoiceTemplate", ["name", "type"], actor.id);
    return template;
  },

  async deleteInvoiceTemplate(actor: SessionUser, id: number) {
    if (!id) throw new ServiceError(400, "Template id required.");
    const deleted = await prisma.invoiceTemplate.delete({ where: { id } });
    await recordAudit(actor.name, "deleted", deleted.name, "InvoiceTemplate", ["id"], actor.id);
    return deleted;
  },

  // ---------------- MFS Services ----------------
  async listMfsServices() {
    return prisma.mfsService.findMany({ orderBy: { id: "asc" } });
  },

  async getMfsServicesPageData() {
    const services = await prisma.mfsService.findMany({ orderBy: { id: "asc" } });
    return {
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        shortName: s.shortName,
        accountName: s.accountName,
        accountNumber: s.accountNumber,
        accountType: s.accountType,
        isActive: s.isActive,
      })),
    };
  },

  async createMfsService(actor: SessionUser, dto: CreateMfsServiceDto) {
    if (!dto.name) throw new ServiceError(400, "Service Name is required.");

    const service = await prisma.mfsService.create({
      data: {
        name: dto.name,
        shortName: dto.shortName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        accountType: dto.accountType,
        isActive: dto.isActive,
      },
    });

    await recordAudit(actor.name, "created", service.name, "MfsService", ["name", "accountNumber"], actor.id);
    return service;
  },

  async updateMfsService(actor: SessionUser, dto: UpdateMfsServiceDto) {
    if (!dto.id) throw new ServiceError(400, "Service id required.");

    const service = await prisma.mfsService.update({
      where: { id: dto.id },
      data: {
        name: dto.name,
        shortName: dto.shortName,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        accountType: dto.accountType,
        isActive: dto.isActive,
      },
    });

    await recordAudit(actor.name, "updated", service.name, "MfsService", ["name", "accountNumber"], actor.id);
    return service;
  },

  async deleteMfsService(actor: SessionUser, id: number) {
    if (!id) throw new ServiceError(400, "Service id required.");
    const deleted = await prisma.mfsService.delete({ where: { id } });
    await recordAudit(actor.name, "deleted", deleted.name, "MfsService", ["id"], actor.id);
    return deleted;
  },

  // ---------------- Audit & App Settings & Profile ----------------
  async listAuditLogs() {
    return prisma.auditLog.findMany({ orderBy: { id: "desc" } });
  },

  async getAuditPageData(filters: {
    search?: string;
    event?: string;
    type?: string;
    user_id?: string;
    from?: string;
    to?: string;
  }) {
    const search = (filters.search ?? "").trim();
    const event = (filters.event ?? "").trim();
    const type = (filters.type ?? "").trim();
    const userId = (filters.user_id ?? "").trim();
    const from = (filters.from ?? "").trim();
    const to = (filters.to ?? "").trim();

    const [logs, distinctRows] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          ...(event ? { event } : {}),
          ...(type ? { recordType: type } : {}),
          ...(userId ? { userName: userId } : {}),
          ...(from || to
            ? {
                createdAt: {
                  ...(from ? { gte: new Date(from) } : {}),
                  ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
                },
              }
            : {}),
          ...(search
            ? {
                OR: [
                  { recordTitle: { contains: search } },
                  { recordType: { contains: search } },
                  { userName: { contains: search } },
                  { fieldsList: { contains: search } },
                ],
              }
            : {}),
        },
        orderBy: { id: "desc" },
        take: 150,
      }),
      prisma.auditLog.findMany({
        select: { recordType: true, userName: true },
      }),
    ]);

    const recordTypes = Array.from(new Set(distinctRows.map((r) => r.recordType))).sort();
    const users = Array.from(new Set(distinctRows.map((r) => r.userName))).sort();

    return {
      logs: logs.map((l) => ({
        id: l.id,
        userName: l.userName,
        ipAddress: l.ipAddress,
        event: l.event,
        recordTitle: l.recordTitle,
        recordType: l.recordType,
        fieldsCount: l.fieldsCount,
        fieldsList: l.fieldsList,
        whenLabel: l.whenLabel,
        createdAt: l.createdAt.toLocaleString("en-GB"),
      })),
      recordTypes,
      users,
      filters: { search, event, type, user_id: userId, from, to },
    };
  },

  async getApplicationSetting() {
    return prisma.appSetting.findFirst();
  },

  async getApplicationSettingsPageData() {
    const s = await prisma.appSetting.findFirst();
    return {
      initial: {
        appName: s?.appName ?? "e-Hishabi ERP",
        appTagline: s?.appTagline ?? "Real Estate & Development Suite",
        footerText: s?.footerText ?? "",
        contactEmail: s?.contactEmail ?? "info@ehishabi.com",
        contactPhone: s?.contactPhone ?? "",
        website: s?.website ?? "https://erp.ehishabi.com",
        contactAddress: s?.contactAddress ?? "",
        primaryColor: s?.primaryColor ?? "#00c292",
      },
    };
  },

  async updateApplicationSetting(actor: SessionUser, dto: UpdateAppSettingDto) {
    if (!dto.appName) throw new ServiceError(400, "Application Title is required.");

    const existing = await prisma.appSetting.findFirst();
    const data = {
      appName: dto.appName,
      appTagline: dto.appTagline,
      footerText: dto.footerText,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      website: dto.website,
      contactAddress: dto.contactAddress,
      primaryColor: dto.primaryColor,
    };

    const setting = existing
      ? await prisma.appSetting.update({ where: { id: existing.id }, data })
      : await prisma.appSetting.create({ data });

    await recordAudit(actor.name, "updated", setting.appName, "AppSetting", Object.keys(data), actor.id);
    return setting;
  },

  async getProfilePageData(sessionUser: SessionUser) {
    const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    return {
      user: {
        id: dbUser?.id ?? sessionUser.id,
        name: dbUser?.name ?? sessionUser.name,
        email: dbUser?.email ?? sessionUser.email,
        username: dbUser?.username ?? sessionUser.username,
        jobTitle: dbUser?.jobTitle ?? "",
        phone: dbUser?.phone ?? "",
        role: dbUser?.role ?? sessionUser.role,
        isSuperAdmin: dbUser?.isSuperAdmin ?? true,
        createdAt: dbUser ? formatDateEnGb(dbUser.createdAt) : "30 Oct 2026",
      },
    };
  },

  async getProfilePreferencesPageData(sessionUser: SessionUser) {
    const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    return {
      initial: {
        theme: dbUser?.theme ?? sessionUser.theme ?? "light",
        navLayout: dbUser?.navLayout ?? sessionUser.navLayout ?? "side",
        sidebarColor: dbUser?.sidebarColor ?? sessionUser.sidebarColor ?? "light",
        timezone: dbUser?.timezone ?? "Asia/Dhaka",
        dateFormat: dbUser?.dateFormat ?? "d M Y",
        timeFormat: dbUser?.timeFormat ?? "g:i A",
      },
    };
  },

  async updateProfile(actor: SessionUser, dto: UpdateProfileDto) {
    if (dto.mode === "password") {
      const dbUser = await prisma.user.findUnique({ where: { id: actor.id } });
      if (!dbUser || dbUser.password !== dto.currentPassword) {
        throw new ServiceError(400, "Current password does not match.");
      }
      if (dto.newPassword.length < 8) {
        throw new ServiceError(400, "New password must be at least 8 characters.");
      }
      if (dto.newPassword !== dto.passwordConfirmation) {
        throw new ServiceError(400, "Password confirmation does not match.");
      }
      await prisma.user.update({ where: { id: actor.id }, data: { password: dto.newPassword } });
      await recordAudit(actor.name, "updated", actor.name, "User", ["password"], actor.id);
      return { ok: true };
    }

    const data: Record<string, string | null> = {};
    if (dto.theme !== undefined) data.theme = dto.theme;
    if (dto.navLayout !== undefined) data.navLayout = dto.navLayout;
    if (dto.sidebarColor !== undefined) data.sidebarColor = dto.sidebarColor;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.jobTitle !== undefined) data.jobTitle = dto.jobTitle;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.timezone !== undefined) data.timezone = dto.timezone;
    if (dto.dateFormat !== undefined) data.dateFormat = dto.dateFormat;
    if (dto.timeFormat !== undefined) data.timeFormat = dto.timeFormat;

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: actor.id }, data });
    }

    return { ok: true, ...data };
  },
};
