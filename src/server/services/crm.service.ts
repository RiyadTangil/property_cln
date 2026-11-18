import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/tier0";
import { ServiceError } from "@/server/http/api-handler";
import type { SessionUser } from "@/lib/auth";

const COMPANY_ID = 1;

export const CrmService = {
  async getCommonRefs() {
    const [projects, branches, departments, users, followupTypes, lostReasons, pipelines, units] = await Promise.all([
      prisma.project.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
      prisma.branch.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
      prisma.department.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, name: true } }),
      prisma.user.findMany({ select: { id: true, name: true, email: true } }),
      prisma.crmFollowUpType.findMany({ where: { companyId: COMPANY_ID }, orderBy: { sortOrder: "asc" } }),
      prisma.crmLostReason.findMany({ where: { companyId: COMPANY_ID }, orderBy: { sortOrder: "asc" } }),
      prisma.crmPipeline.findMany({ where: { companyId: COMPANY_ID }, orderBy: { sortOrder: "asc" } }),
      prisma.buildingUnit.findMany({ select: { id: true, unitNumber: true, unitType: true } }),
    ]);
    return { projects, branches, departments, users, followupTypes, lostReasons, pipelines, units };
  },

  async getLeadsPageData() {
    const [leads, refs] = await Promise.all([
      prisma.crmLead.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "asc" } }),
      this.getCommonRefs(),
    ]);
    return { leads, ...refs };
  },

  async getLeadDetailData(id: number) {
    const [lead, refs, followups] = await Promise.all([
      prisma.crmLead.findUnique({ where: { id } }),
      this.getCommonRefs(),
      prisma.crmFollowUp.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
    ]);
    if (!lead) throw new ServiceError(404, "Lead not found");
    return { lead, followups, ...refs };
  },

  async getCustomersPageData() {
    const [customers, refs] = await Promise.all([
      prisma.crmCustomer.findMany({
        where: { companyId: COMPANY_ID },
        include: { _count: { select: { contacts: true } }, contacts: true },
        orderBy: { id: "asc" },
      }),
      this.getCommonRefs(),
    ]);
    return { customers, ...refs };
  },

  async getCustomerDetailData(id: number) {
    const [customer, refs, followups] = await Promise.all([
      prisma.crmCustomer.findUnique({
        where: { id },
        include: { contacts: { orderBy: { id: "asc" } } },
      }),
      this.getCommonRefs(),
      prisma.crmFollowUp.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
    ]);
    if (!customer) throw new ServiceError(404, "Customer not found");
    return { customer, followups, ...refs };
  },

  async getFollowupsPageData() {
    const [followups, refs, leads, customers] = await Promise.all([
      prisma.crmFollowUp.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
      prisma.crmLead.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, firstName: true, lastName: true } }),
      prisma.crmCustomer.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, firstName: true, lastName: true, organisationName: true } }),
    ]);
    return { followups, leads, customers, ...refs };
  },

  async getFollowupDetailData(id: number) {
    const [followup, refs, leads, customers] = await Promise.all([
      prisma.crmFollowUp.findUnique({ where: { id } }),
      this.getCommonRefs(),
      prisma.crmLead.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, firstName: true, lastName: true } }),
      prisma.crmCustomer.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, firstName: true, lastName: true, organisationName: true } }),
    ]);
    if (!followup) throw new ServiceError(404, "Follow-up not found");
    return { followup, leads, customers, ...refs };
  },

  async getSiteVisitsPageData() {
    const [visits, refs, customers] = await Promise.all([
      prisma.crmSiteVisit.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
      prisma.crmCustomer.findMany({ where: { companyId: COMPANY_ID }, select: { id: true, code: true, firstName: true, lastName: true, organisationName: true } }),
    ]);
    return { visits, customers, ...refs };
  },

  async getDistributionsPageData() {
    const [distributions, refs] = await Promise.all([
      prisma.crmLeadDistribution.findMany({ where: { companyId: COMPANY_ID }, orderBy: { id: "desc" } }),
      this.getCommonRefs(),
    ]);
    return { distributions, ...refs };
  },

  async getAssignmentRulesPageData() {
    const [rules, refs] = await Promise.all([
      prisma.crmAssignmentRule.findMany({ where: { companyId: COMPANY_ID }, orderBy: { priority: "asc" } }),
      this.getCommonRefs(),
    ]);
    return { rules, ...refs };
  },

  async createRecord(user: SessionUser, kind: string, b: Record<string, unknown>) {
    const today = new Date().toISOString().slice(0, 10);
    if (kind === "leads") {
      if (Array.isArray(b.rows)) {
        const created = [];
        for (const r of b.rows as Array<Record<string, unknown>>) {
          if (!r.first_name && !r.organisation_name && !r.mobile) continue;
          const cnt = await prisma.crmLead.count();
          const row = await prisma.crmLead.create({
            data: {
              companyId: COMPANY_ID,
              code: `LD-2026-${String(cnt + 1).padStart(4, "0")}`,
              firstName: String(r.first_name || r.organisation_name || "Lead"),
              lastName: r.last_name ? String(r.last_name) : null,
              organisationName: r.organisation_name ? String(r.organisation_name) : null,
              mobile: r.mobile ? String(r.mobile) : null,
              email: r.email ? String(r.email) : null,
              city: r.city ? String(r.city) : "Dhaka",
              interest: r.interest ? String(r.interest) : null,
              expectedValue: Number(r.expected_value ?? 0) || 0,
              source: String(b.source ?? "website"),
              priority: String(b.priority ?? "medium"),
            },
          });
          created.push(row);
        }
        return created;
      }
      const cnt = await prisma.crmLead.count();
      const row = await prisma.crmLead.create({
        data: {
          companyId: COMPANY_ID,
          code: `LD-2026-${String(cnt + 1).padStart(4, "0")}`,
          firstName: String(b.first_name || b.organisation_name || "New Lead"),
          lastName: b.last_name ? String(b.last_name) : null,
          organisationName: b.organisation_name ? String(b.organisation_name) : null,
          email: b.email ? String(b.email) : null,
          phone: b.phone ? String(b.phone) : null,
          mobile: b.mobile ? String(b.mobile) : null,
          city: b.city ? String(b.city) : "Dhaka",
          country: String(b.country ?? "Bangladesh"),
          source: String(b.source ?? "website"),
          sourceDetail: b.source_detail ? String(b.source_detail) : null,
          status: String(b.status ?? "new"),
          priority: String(b.priority ?? "medium"),
          score: Number(b.score ?? 50) || 50,
          interest: b.interest ? String(b.interest) : null,
          expectedValue: Number(b.expected_value ?? 0) || 0,
          ownerId: b.owner_id ? Number(b.owner_id) : null,
          nextFollowUpOn: b.next_follow_up_on ? String(b.next_follow_up_on) : null,
          branchId: b.branch_id ? Number(b.branch_id) : null,
          notes: b.notes ? String(b.notes) : null,
        },
      });
      await recordAudit(user.name, "created", row.code, "CrmLead", [], user.id);
      return row;
    }

    if (kind === "customers") {
      const cnt = await prisma.crmCustomer.count();
      const row = await prisma.crmCustomer.create({
        data: {
          companyId: COMPANY_ID,
          code: b.code ? String(b.code) : `CUS-${String(cnt + 1).padStart(4, "0")}`,
          kind: String(b.kind ?? "individual"),
          organisationName: b.organisation_name ? String(b.organisation_name) : null,
          firstName: b.first_name ? String(b.first_name) : String(b.organisation_name || "Customer"),
          lastName: b.last_name ? String(b.last_name) : null,
          type: String(b.type ?? "buyer"),
          lifecycleStage: String(b.lifecycle_stage ?? "customer"),
          email: b.email ? String(b.email) : null,
          phone: b.phone ? String(b.phone) : null,
          mobile: b.mobile ? String(b.mobile) : null,
          website: b.website ? String(b.website) : null,
          addressLine1: b.address_line1 ? String(b.address_line1) : null,
          addressLine2: b.address_line2 ? String(b.address_line2) : null,
          city: b.city ? String(b.city) : "Dhaka",
          state: b.state ? String(b.state) : null,
          postalCode: b.postal_code ? String(b.postal_code) : null,
          country: String(b.country ?? "Bangladesh"),
          socialProfilesJson: JSON.stringify(b.social_profiles ?? {}),
          industry: b.industry ? String(b.industry) : null,
          source: b.source ? String(b.source) : null,
          branchId: b.branch_id ? Number(b.branch_id) : null,
          taxNumber: b.tax_number ? String(b.tax_number) : null,
          registrationNumber: b.registration_number ? String(b.registration_number) : null,
          creditLimit: Number(b.credit_limit ?? 0) || 0,
          ownerId: b.owner_id ? Number(b.owner_id) : null,
          notes: b.notes ? String(b.notes) : null,
          isActive: b.is_active !== false,
        },
      });
      await recordAudit(user.name, "created", row.code, "CrmCustomer", [], user.id);
      return row;
    }

    if (kind === "contacts") {
      const row = await prisma.crmContact.create({
        data: {
          customerId: Number(b.customer_id || 1),
          firstName: String(b.first_name || "Contact"),
          lastName: b.last_name ? String(b.last_name) : null,
          role: String(b.role ?? "primary"),
          jobTitle: b.job_title ? String(b.job_title) : null,
          department: b.department ? String(b.department) : null,
          email: b.email ? String(b.email) : null,
          phone: b.phone ? String(b.phone) : null,
          mobile: b.mobile ? String(b.mobile) : null,
          socialProfilesJson: JSON.stringify(b.social_profiles ?? {}),
          notes: b.notes ? String(b.notes) : null,
          isPrimary: Boolean(b.is_primary),
          isActive: b.is_active !== false,
        },
      });
      await recordAudit(user.name, "created", row.firstName, "CrmContact", [], user.id);
      return row;
    }

    if (kind === "followups") {
      const row = await prisma.crmFollowUp.create({
        data: {
          companyId: COMPANY_ID,
          subject: String(b.subject || b.note || "Follow-up"),
          followUpTypeId: b.follow_up_type_id ? Number(b.follow_up_type_id) : 1,
          priority: String(b.priority ?? "normal"),
          description: b.description ? String(b.description) : (b.note ? String(b.note) : null),
          scheduledDate: String(b.scheduled_date ?? b.next_follow_up_on ?? today),
          scheduledTime: b.scheduled_time ? String(b.scheduled_time) : null,
          durationMinutes: Number(b.duration_minutes ?? 15) || 15,
          reminderMinutesBefore: Number(b.reminder_minutes_before ?? 30) || 30,
          concerns: b.concerns ? String(b.concerns) : null,
          assignedTo: b.assigned_to ? String(b.assigned_to) : user.name,
          branchId: b.branch_id ? Number(b.branch_id) : null,
          status: String(b.status ?? "scheduled"),
        },
      });
      await recordAudit(user.name, "created", row.subject, "CrmFollowUp", [], user.id);
      return row;
    }

    if (kind === "site-visits") {
      const row = await prisma.crmSiteVisit.create({
        data: {
          companyId: COMPANY_ID,
          title: String(b.title || "Site Visit"),
          customerId: b.customer_id ? Number(b.customer_id) : null,
          projectId: b.project_id ? Number(b.project_id) : null,
          purpose: String(b.purpose ?? "initial_visit"),
          priority: String(b.priority ?? "normal"),
          description: b.description ? String(b.description) : null,
          scheduledDate: String(b.scheduled_date ?? today),
          scheduledTime: b.scheduled_time ? String(b.scheduled_time) : null,
          durationMinutes: Number(b.duration_minutes ?? 60) || 60,
          branchId: b.branch_id ? Number(b.branch_id) : null,
          assignedTo: b.assigned_to ? String(b.assigned_to) : user.name,
          meetingPoint: b.meeting_point ? String(b.meeting_point) : null,
          location: b.location ? String(b.location) : null,
          estimatedCost: Number(b.estimated_cost ?? 0) || 0,
          costsJson: JSON.stringify(b.costs ?? []),
          status: String(b.status ?? "scheduled"),
          progress: Number(b.progress ?? 0) || 0,
          outcome: b.outcome ? String(b.outcome) : null,
        },
      });
      await recordAudit(user.name, "created", row.title, "CrmSiteVisit", [], user.id);
      return row;
    }

    if (kind === "followup-types") {
      const row = await prisma.crmFollowUpType.create({
        data: {
          companyId: COMPANY_ID,
          name: String(b.name || "Follow-up Type"),
          description: b.description ? String(b.description) : null,
          icon: String(b.icon ?? "fa-solid fa-phone"),
          pill: String(b.pill ?? "available"),
          sortOrder: Number(b.sort_order ?? 10) || 10,
          isActive: b.is_active !== false,
        },
      });
      await recordAudit(user.name, "created", row.name, "CrmFollowUpType", [], user.id);
      return row;
    }

    if (kind === "lost-reasons") {
      const row = await prisma.crmLostReason.create({
        data: {
          companyId: COMPANY_ID,
          name: String(b.name || "Lost Reason"),
          description: b.description ? String(b.description) : null,
          requiresNote: Boolean(b.requires_note),
          sortOrder: Number(b.sort_order ?? 10) || 10,
          isActive: b.is_active !== false,
        },
      });
      await recordAudit(user.name, "created", row.name, "CrmLostReason", [], user.id);
      return row;
    }

    if (kind === "pipelines") {
      const row = await prisma.crmPipeline.create({
        data: {
          companyId: COMPANY_ID,
          name: String(b.name || "Sales Pipeline"),
          description: b.description ? String(b.description) : null,
          sortOrder: Number(b.sort_order ?? 1) || 1,
          isDefault: Boolean(b.is_default),
          isActive: b.is_active !== false,
          stagesJson: JSON.stringify(b.stages ?? []),
        },
      });
      await recordAudit(user.name, "created", row.name, "CrmPipeline", [], user.id);
      return row;
    }

    if (kind === "lead-distribution") {
      const row = await prisma.crmLeadDistribution.create({
        data: {
          companyId: COMPANY_ID,
          name: String(b.name || "Auto Distribution"),
          branchId: b.branch_id ? Number(b.branch_id) : null,
          projectId: b.project_id ? Number(b.project_id) : null,
          period: String(b.period ?? "daily"),
          validFrom: String(b.valid_from ?? today),
          validUntil: b.valid_until ? String(b.valid_until) : null,
          dailyLimit: Number(b.daily_limit ?? 20) || 20,
          minPendingLeads: Number(b.min_pending_leads ?? 5) || 5,
        },
      });
      await recordAudit(user.name, "created", row.name, "CrmLeadDistribution", [], user.id);
      return row;
    }

    if (kind === "assignment-rules") {
      const row = await prisma.crmAssignmentRule.create({
        data: {
          companyId: COMPANY_ID,
          name: String(b.name || "Assignment Rule"),
          priority: Number(b.priority ?? 1) || 1,
          strategy: String(b.strategy ?? "round_robin"),
          departmentId: b.department_id ? Number(b.department_id) : null,
          targetUserId: b.target_user_id ? Number(b.target_user_id) : null,
          conditionsJson: JSON.stringify(b.conditions ?? []),
          isActive: b.is_active !== false,
        },
      });
      await recordAudit(user.name, "created", row.name, "CrmAssignmentRule", [], user.id);
      return row;
    }

    throw new ServiceError(400, `Unsupported CRM kind: ${kind}`);
  },

  async updateRecord(user: SessionUser, kind: string, id: number, b: Record<string, unknown>) {
    if (kind === "leads") {
      const row = await prisma.crmLead.update({
        where: { id },
        data: {
          ...(b.first_name !== undefined ? { firstName: String(b.first_name) } : {}),
          ...(b.last_name !== undefined ? { lastName: b.last_name ? String(b.last_name) : null } : {}),
          ...(b.organisation_name !== undefined ? { organisationName: b.organisation_name ? String(b.organisation_name) : null } : {}),
          ...(b.email !== undefined ? { email: b.email ? String(b.email) : null } : {}),
          ...(b.phone !== undefined ? { phone: b.phone ? String(b.phone) : null } : {}),
          ...(b.mobile !== undefined ? { mobile: b.mobile ? String(b.mobile) : null } : {}),
          ...(b.city !== undefined ? { city: b.city ? String(b.city) : null } : {}),
          ...(b.source !== undefined ? { source: String(b.source) } : {}),
          ...(b.status !== undefined ? { status: String(b.status) } : {}),
          ...(b.priority !== undefined ? { priority: String(b.priority) } : {}),
          ...(b.score !== undefined ? { score: Number(b.score) || 0 } : {}),
          ...(b.interest !== undefined ? { interest: b.interest ? String(b.interest) : null } : {}),
          ...(b.expected_value !== undefined ? { expectedValue: Number(b.expected_value) || 0 } : {}),
          ...(b.next_follow_up_on !== undefined ? { nextFollowUpOn: b.next_follow_up_on ? String(b.next_follow_up_on) : null } : {}),
          ...(b.lost_reason_id !== undefined ? { lostReasonId: Number(b.lost_reason_id) || null, status: "lost" } : {}),
          ...(b.lost_note !== undefined ? { lostNote: b.lost_note ? String(b.lost_note) : null } : {}),
          ...(b.notes !== undefined ? { notes: b.notes ? String(b.notes) : null } : {}),
        },
      });
      await recordAudit(user.name, "updated", row.code, "CrmLead", [], user.id);
      return row;
    }
    if (kind === "customers") {
      const row = await prisma.crmCustomer.update({
        where: { id },
        data: {
          ...(b.first_name !== undefined ? { firstName: b.first_name ? String(b.first_name) : null } : {}),
          ...(b.last_name !== undefined ? { lastName: b.last_name ? String(b.last_name) : null } : {}),
          ...(b.organisation_name !== undefined ? { organisationName: b.organisation_name ? String(b.organisation_name) : null } : {}),
          ...(b.type !== undefined ? { type: String(b.type) } : {}),
          ...(b.lifecycle_stage !== undefined ? { lifecycleStage: String(b.lifecycle_stage) } : {}),
          ...(b.email !== undefined ? { email: b.email ? String(b.email) : null } : {}),
          ...(b.phone !== undefined ? { phone: b.phone ? String(b.phone) : null } : {}),
          ...(b.mobile !== undefined ? { mobile: b.mobile ? String(b.mobile) : null } : {}),
          ...(b.city !== undefined ? { city: b.city ? String(b.city) : null } : {}),
          ...(b.notes !== undefined ? { notes: b.notes ? String(b.notes) : null } : {}),
        },
      });
      await recordAudit(user.name, "updated", row.code, "CrmCustomer", [], user.id);
      return row;
    }
    if (kind === "followups") {
      const row = await prisma.crmFollowUp.update({
        where: { id },
        data: {
          ...(b.subject !== undefined ? { subject: String(b.subject) } : {}),
          ...(b.priority !== undefined ? { priority: String(b.priority) } : {}),
          ...(b.scheduled_date !== undefined ? { scheduledDate: String(b.scheduled_date) } : {}),
          ...(b.status !== undefined ? { status: String(b.status) } : {}),
          ...(b.description !== undefined ? { description: b.description ? String(b.description) : null } : {}),
        },
      });
      await recordAudit(user.name, "updated", row.subject, "CrmFollowUp", [], user.id);
      return row;
    }
    if (kind === "followup-types") {
      const row = await prisma.crmFollowUpType.update({
        where: { id },
        data: {
          ...(b.name !== undefined ? { name: String(b.name) } : {}),
          ...(b.description !== undefined ? { description: b.description ? String(b.description) : null } : {}),
          ...(b.icon !== undefined ? { icon: String(b.icon) } : {}),
          ...(b.pill !== undefined ? { pill: String(b.pill) } : {}),
          ...(b.sort_order !== undefined ? { sortOrder: Number(b.sort_order) || 1 } : {}),
          ...(b.is_active !== undefined ? { isActive: Boolean(b.is_active) } : {}),
        },
      });
      return row;
    }
    if (kind === "lost-reasons") {
      const row = await prisma.crmLostReason.update({
        where: { id },
        data: {
          ...(b.name !== undefined ? { name: String(b.name) } : {}),
          ...(b.description !== undefined ? { description: b.description ? String(b.description) : null } : {}),
          ...(b.requires_note !== undefined ? { requiresNote: Boolean(b.requires_note) } : {}),
          ...(b.sort_order !== undefined ? { sortOrder: Number(b.sort_order) || 1 } : {}),
          ...(b.is_active !== undefined ? { isActive: Boolean(b.is_active) } : {}),
        },
      });
      return row;
    }
    if (kind === "pipelines") {
      const row = await prisma.crmPipeline.update({
        where: { id },
        data: {
          ...(b.name !== undefined ? { name: String(b.name) } : {}),
          ...(b.description !== undefined ? { description: b.description ? String(b.description) : null } : {}),
          ...(b.sort_order !== undefined ? { sortOrder: Number(b.sort_order) || 1 } : {}),
          ...(b.is_default !== undefined ? { isDefault: Boolean(b.is_default) } : {}),
          ...(b.is_active !== undefined ? { isActive: Boolean(b.is_active) } : {}),
          ...(b.stages !== undefined ? { stagesJson: JSON.stringify(b.stages) } : {}),
        },
      });
      return row;
    }
    return { ok: true };
  },

  async deleteRecord(user: SessionUser, kind: string, id: number) {
    if (kind === "leads") await prisma.crmLead.delete({ where: { id } });
    else if (kind === "customers") await prisma.crmCustomer.delete({ where: { id } });
    else if (kind === "contacts") await prisma.crmContact.delete({ where: { id } });
    else if (kind === "followups") await prisma.crmFollowUp.delete({ where: { id } });
    else if (kind === "site-visits") await prisma.crmSiteVisit.delete({ where: { id } });
    else if (kind === "followup-types") await prisma.crmFollowUpType.delete({ where: { id } });
    else if (kind === "lost-reasons") await prisma.crmLostReason.delete({ where: { id } });
    else if (kind === "pipelines") await prisma.crmPipeline.delete({ where: { id } });
    else if (kind === "lead-distribution") await prisma.crmLeadDistribution.delete({ where: { id } });
    else if (kind === "assignment-rules") await prisma.crmAssignmentRule.delete({ where: { id } });
    await recordAudit(user.name, "deleted", `${kind}#${id}`, "Crm", [], user.id);
    return { ok: true };
  },
};
