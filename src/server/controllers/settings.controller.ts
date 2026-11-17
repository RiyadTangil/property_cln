import { optStr, reqStr } from "@/server/http/api-handler";
import { SettingsService } from "@/server/services/settings.service";
import type { SessionUser } from "@/lib/auth";

type RawBody = Record<string, unknown>;

export const SettingsController = {
  // ---------------- Users ----------------
  listUsers() {
    return SettingsService.listUsers();
  },

  createUser(actor: SessionUser, b: RawBody) {
    return SettingsService.createUser(actor, {
      name: reqStr(b.name),
      email: reqStr(b.email).toLowerCase(),
      password: String(b.password ?? ""),
      passwordConfirmation: String(b.password_confirmation ?? ""),
      jobTitle: optStr(b.job_title),
      phone: optStr(b.phone),
      roleName: reqStr(b.role, b.is_super_admin ? "Super Admin" : "Staff"),
      isSuperAdmin: Boolean(b.is_super_admin),
      isActive: b.is_active === undefined ? true : Boolean(b.is_active),
    });
  },

  updateUser(actor: SessionUser, id: number, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    return SettingsService.updateUser(actor, id, {
      isActive: typeof activeVal === "boolean" ? activeVal : undefined,
      role: typeof b.role === "string" && b.role.trim() ? b.role.trim() : undefined,
    });
  },

  deleteUser(actor: SessionUser, id: number) {
    return SettingsService.deleteUser(actor, id);
  },

  // ---------------- Roles ----------------
  listRoles() {
    return SettingsService.listRoles();
  },

  createRole(actor: SessionUser, b: RawBody) {
    return SettingsService.createRole(actor, {
      name: reqStr(b.name),
      scope: reqStr(b.scope, "global"),
    });
  },

  updateRole(actor: SessionUser, id: number, b: RawBody) {
    return SettingsService.updateRole(actor, id, {
      permissions: Array.isArray(b.permissions) ? b.permissions.map(String) : undefined,
      name: typeof b.name === "string" && b.name.trim() ? b.name.trim() : undefined,
      scope: typeof b.scope === "string" ? b.scope : undefined,
    });
  },

  deleteRole(actor: SessionUser, id: number) {
    return SettingsService.deleteRole(actor, id);
  },

  // ---------------- Code Sequences ----------------
  listCodeSequences() {
    return SettingsService.listCodeSequences();
  },

  updateCodeSequence(actor: SessionUser, b: RawBody) {
    return SettingsService.updateCodeSequence(actor, {
      id: Number(b.id),
      label: optStr(b.label) ?? undefined,
      prefix: reqStr(b.prefix),
      suffix: reqStr(b.suffix),
      separator: String(b.separator ?? "-"),
      padding: Math.max(1, Math.min(10, Number(b.padding ?? 4))),
      nextNumber: Math.max(1, Number(b.next_number ?? b.nextNumber ?? 1)),
      yearInCode: Boolean(b.year_in_code ?? b.yearInCode),
      resetYearly: Boolean(b.reset_yearly ?? b.resetYearly),
    });
  },

  // ---------------- Documents ----------------
  listDocuments() {
    return SettingsService.listDocuments();
  },

  createDocument(actor: SessionUser, b: RawBody) {
    return SettingsService.createDocument(actor, {
      title: reqStr(b.title),
      category: reqStr(b.category, "general"),
      module: reqStr(b.module, "project"),
      expiryDate: optStr(b.expiry_date),
      fileSize: optStr(b.file_size) || "240 KB",
      fileUrl: optStr(b.file_url) || "#",
    });
  },

  deleteDocument(actor: SessionUser, id: number) {
    return SettingsService.deleteDocument(actor, id);
  },

  // ---------------- Invoice Templates ----------------
  listInvoiceTemplates() {
    return SettingsService.listInvoiceTemplates();
  },

  createInvoiceTemplate(actor: SessionUser, b: RawBody) {
    return SettingsService.createInvoiceTemplate(actor, {
      name: reqStr(b.name),
      type: reqStr(b.type, "sale"),
      paper: reqStr(b.paper, "a4"),
      orientation: reqStr(b.orientation, "portrait"),
      isDefault: Boolean(b.is_default ?? b.isDefault),
      isActive: b.is_active === undefined ? true : Boolean(b.is_active),
      blocksJson: typeof b.blocks === "string" ? b.blocks : JSON.stringify(b.blocks ?? []),
    });
  },

  deleteInvoiceTemplate(actor: SessionUser, id: number) {
    return SettingsService.deleteInvoiceTemplate(actor, id);
  },

  // ---------------- MFS Services ----------------
  listMfsServices() {
    return SettingsService.listMfsServices();
  },

  createMfsService(actor: SessionUser, b: RawBody) {
    return SettingsService.createMfsService(actor, {
      name: reqStr(b.name),
      shortName: optStr(b.short_name),
      accountName: optStr(b.account_name),
      accountNumber: optStr(b.account_number),
      accountType: optStr(b.account_type),
      isActive: b.is_active === undefined ? true : Boolean(b.is_active),
    });
  },

  updateMfsService(actor: SessionUser, b: RawBody) {
    const activeVal = b.isActive ?? b.is_active;
    return SettingsService.updateMfsService(actor, {
      id: Number(b.id),
      name: optStr(b.name) ?? undefined,
      shortName: optStr(b.short_name),
      accountName: optStr(b.account_name),
      accountNumber: optStr(b.account_number),
      accountType: optStr(b.account_type),
      isActive: activeVal === undefined ? undefined : Boolean(activeVal),
    });
  },

  deleteMfsService(actor: SessionUser, id: number) {
    return SettingsService.deleteMfsService(actor, id);
  },

  // ---------------- Audit & App Settings & Profile ----------------
  listAuditLogs() {
    return SettingsService.listAuditLogs();
  },

  getApplicationSetting() {
    return SettingsService.getApplicationSetting();
  },

  updateApplicationSetting(actor: SessionUser, b: RawBody) {
    return SettingsService.updateApplicationSetting(actor, {
      appName: reqStr(b.app_name, "e-Hishabi ERP"),
      appTagline: reqStr(b.app_tagline),
      footerText: reqStr(b.footer_text),
      contactEmail: reqStr(b.contact_email),
      contactPhone: reqStr(b.contact_phone),
      website: reqStr(b.website),
      contactAddress: reqStr(b.contact_address),
      primaryColor: reqStr(b.primary_color, "#00c292"),
    });
  },

  updateProfile(actor: SessionUser, body: RawBody) {
    if (body.current_password !== undefined || body.new_password !== undefined) {
      return SettingsService.updateProfile(actor, {
        mode: "password",
        currentPassword: String(body.current_password ?? ""),
        newPassword: String(body.new_password ?? ""),
        passwordConfirmation: String(body.password_confirmation ?? ""),
      });
    }

    const navLayout = body.navLayout ?? body.nav_layout;
    const sidebarColor = body.sidebarColor ?? body.sidebar_color;

    return SettingsService.updateProfile(actor, {
      mode: "profile",
      theme:
        typeof body.theme === "string" && ["light", "dark", "system"].includes(body.theme)
          ? body.theme
          : undefined,
      navLayout:
        typeof navLayout === "string" && ["side", "top"].includes(navLayout)
          ? navLayout
          : undefined,
      sidebarColor:
        typeof sidebarColor === "string" && sidebarColor.length <= 30
          ? sidebarColor
          : undefined,
      name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined,
      email: typeof body.email === "string" && body.email.trim() ? body.email.trim() : undefined,
      username:
        typeof body.username === "string" && body.username.trim()
          ? body.username.trim()
          : undefined,
      jobTitle: body.job_title !== undefined ? optStr(body.job_title) : undefined,
      phone: body.phone !== undefined ? optStr(body.phone) : undefined,
      timezone: typeof body.timezone === "string" ? body.timezone : undefined,
      dateFormat: typeof body.date_format === "string" ? body.date_format : undefined,
      timeFormat: typeof body.time_format === "string" ? body.time_format : undefined,
    });
  },
};
