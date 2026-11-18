"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CrmSubmenu from "./CrmSubmenu";

export interface CrmLeadRow {
  id: number;
  companyId?: number;
  code: string;
  firstName: string;
  lastName: string | null;
  organisationName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  city: string | null;
  country?: string;
  source: string;
  sourceDetail?: string | null;
  status: string;
  priority: string;
  score: number;
  interest: string | null;
  expectedValue: number;
  ownerId?: number | null;
  ownerName?: string | null;
  nextFollowUpOn: string | null;
  branchId?: number | null;
  projectIdsJson?: string;
  unitIdsJson?: string;
  lostReasonId?: number | null;
  lostNote?: string | null;
  notes?: string | null;
  createdAt?: string | Date;
}

export interface CrmFollowUpRow {
  id: number;
  subject: string;
  followUpTypeId: number | null;
  priority: string;
  description: string | null;
  scheduledDate: string;
  scheduledTime: string | null;
  durationMinutes: number;
  concerns: string | null;
  assignedTo: string | null;
  status: string;
  createdAt?: string | Date;
}

export interface CrmRefProject {
  id: number;
  code: string;
  name: string;
}

export interface CrmRefBranch {
  id: number;
  code: string;
  name: string;
}

export interface CrmRefUser {
  id: number;
  name: string;
  email?: string;
}

export interface CrmRefUnit {
  id: number;
  unitNumber: string;
  unitType: string;
}

export interface CrmFollowUpTypeRow {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  pill: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CrmLostReasonRow {
  id: number;
  name: string;
  description: string | null;
  requiresNote: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface LeadFilterParams {
  search?: string;
  source?: string;
  priority?: string;
  owner_id?: string;
  due?: string;
  status?: string;
}

interface LeadStageMeta {
  key: string;
  label: string;
  pct: number;
  icon: string;
  pill: string;
  kanbanHead: string;
  open: boolean;
  lost: boolean;
  converted: boolean;
}

const LEAD_STAGES: LeadStageMeta[] = [
  {
    key: "new",
    label: "New Lead",
    pct: 5,
    icon: "fa-solid fa-star",
    pill: "is-booked",
    kanbanHead: "is-booked",
    open: true,
    lost: false,
    converted: false,
  },
  {
    key: "contacted",
    label: "Contacted",
    pct: 15,
    icon: "fa-solid fa-phone",
    pill: "is-hold",
    kanbanHead: "is-hold",
    open: true,
    lost: false,
    converted: false,
  },
  {
    key: "qualified",
    label: "Qualified",
    pct: 30,
    icon: "fa-solid fa-circle-check",
    pill: "is-hold",
    kanbanHead: "is-hold",
    open: true,
    lost: false,
    converted: false,
  },
  {
    key: "interested",
    label: "Interested",
    pct: 50,
    icon: "fa-solid fa-heart",
    pill: "is-available",
    kanbanHead: "is-available",
    open: true,
    lost: false,
    converted: false,
  },
  {
    key: "site_visit",
    label: "Site Visit",
    pct: 70,
    icon: "fa-solid fa-person-walking",
    pill: "is-available",
    kanbanHead: "is-available",
    open: true,
    lost: false,
    converted: false,
  },
  {
    key: "negotiation",
    label: "Proposal / Negotiation",
    pct: 80,
    icon: "fa-solid fa-handshake",
    pill: "is-available",
    kanbanHead: "is-available",
    open: true,
    lost: false,
    converted: false,
  },
  {
    key: "converted",
    label: "Booked / Won",
    pct: 100,
    icon: "fa-solid fa-trophy",
    pill: "is-sold",
    kanbanHead: "is-sold",
    open: false,
    lost: false,
    converted: true,
  },
  {
    key: "unqualified",
    label: "Lost",
    pct: 0,
    icon: "fa-solid fa-circle-minus",
    pill: "is-overdue",
    kanbanHead: "is-overdue",
    open: false,
    lost: true,
    converted: false,
  },
  {
    key: "junk",
    label: "Junk Lead",
    pct: 0,
    icon: "fa-solid fa-ban",
    pill: "is-neutral",
    kanbanHead: "is-neutral",
    open: false,
    lost: false,
    converted: false,
  },
];

const PIPELINE_STEPPER_STAGES = LEAD_STAGES.slice(0, 7);

const LEAD_SOURCES = [
  { value: "website_form", label: "Website Form", icon: "fa-solid fa-globe" },
  { value: "facebook", label: "Facebook Lead", icon: "fa-brands fa-facebook" },
  { value: "google_ads", label: "Google Ads", icon: "fa-brands fa-google" },
  { value: "referral", label: "Referral", icon: "fa-solid fa-user-group" },
  { value: "walk_in", label: "Walk-in", icon: "fa-solid fa-person-walking" },
  { value: "campaign", label: "Campaign", icon: "fa-solid fa-bullhorn" },
  { value: "import", label: "CSV Import", icon: "fa-solid fa-file-csv" },
  { value: "api", label: "API", icon: "fa-solid fa-code" },
  { value: "manual", label: "Manual Entry", icon: "fa-solid fa-keyboard" },
];

const LEAD_PRIORITIES = [
  { value: "low", label: "Low", pill: "is-neutral", icon: "fa-solid fa-arrow-down" },
  { value: "medium", label: "Medium", pill: "is-booked", icon: "fa-solid fa-equals" },
  { value: "high", label: "High", pill: "is-hold", icon: "fa-solid fa-angles-up" },
  { value: "urgent", label: "Urgent", pill: "is-overdue", icon: "fa-solid fa-fire" },
];

const BUILTIN_FOLLOWUP_TYPES: Record<number, { displayName: string; icon: string }> = {
  1: { displayName: "Call", icon: "fa-solid fa-phone" },
  2: { displayName: "Meeting", icon: "fa-solid fa-handshake" },
  3: { displayName: "Site Visit", icon: "fa-solid fa-building-circle-check" },
  4: { displayName: "Email", icon: "fa-solid fa-envelope" },
  5: { displayName: "SMS", icon: "fa-solid fa-comment-sms" },
  6: { displayName: "WhatsApp", icon: "fa-brands fa-whatsapp" },
  7: { displayName: "Demo / Walkthrough", icon: "fa-solid fa-desktop" },
  8: { displayName: "Collect Documents", icon: "fa-solid fa-file-arrow-up" },
  9: { displayName: "Payment Reminder", icon: "fa-solid fa-money-bill-wave" },
  10: { displayName: "Other", icon: "fa-solid fa-list-check" },
};

const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: "AF", name: "Afghanistan" },
  { code: "AX", name: "Åland Islands" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AS", name: "American Samoa" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AG", name: "Antigua and Barbuda" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armenia" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" },
  { code: "BB", name: "Barbados" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BZ", name: "Belize" },
  { code: "BJ", name: "Benin" },
  { code: "BT", name: "Bhutan" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BW", name: "Botswana" },
  { code: "BR", name: "Brazil" },
  { code: "BN", name: "Brunei" },
  { code: "BG", name: "Bulgaria" },
  { code: "KH", name: "Cambodia" },
  { code: "CM", name: "Cameroon" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croatia" },
  { code: "CU", name: "Cuba" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czechia" },
  { code: "DK", name: "Denmark" },
  { code: "DO", name: "Dominican Republic" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "EE", name: "Estonia" },
  { code: "ET", name: "Ethiopia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KW", name: "Kuwait" },
  { code: "LA", name: "Laos" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MY", name: "Malaysia" },
  { code: "MV", name: "Maldives" },
  { code: "MT", name: "Malta" },
  { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" },
  { code: "MM", name: "Myanmar" },
  { code: "NP", name: "Nepal" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "PA", name: "Panama" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SG", name: "Singapore" },
  { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VN", name: "Vietnam" },
  { code: "YE", name: "Yemen" },
  { code: "ZM", name: "Zambia" },
  { code: "ZW", name: "Zimbabwe" },
];

const COMM_METHODS = [
  { value: "email", label: "Email", hasDuration: false },
  { value: "phone_call", label: "Phone Call", hasDuration: true },
  { value: "whatsapp", label: "WhatsApp", hasDuration: false },
  { value: "sms", label: "SMS", hasDuration: false },
  { value: "physical_meeting", label: "Physical Meeting", hasDuration: true },
  { value: "online_meeting", label: "Online Meeting", hasDuration: true },
  { value: "other", label: "Other", hasDuration: false },
];

function normalizeStatus(status: string | null | undefined): string {
  const s = (status || "new").toLowerCase();
  if (s === "lost") return "unqualified";
  if (s === "won") return "converted";
  if (s === "proposal") return "negotiation";
  return LEAD_STAGES.some((st) => st.key === s) ? s : "new";
}

function getStageMeta(status: string | null | undefined): LeadStageMeta {
  const key = normalizeStatus(status);
  return LEAD_STAGES.find((st) => st.key === key) ?? LEAD_STAGES[0];
}

function getNextOpenStage(status: string | null | undefined): LeadStageMeta | null {
  const key = normalizeStatus(status);
  const idx = PIPELINE_STEPPER_STAGES.findIndex((st) => st.key === key);
  if (idx >= 0 && idx < PIPELINE_STEPPER_STAGES.length - 1) {
    return PIPELINE_STEPPER_STAGES[idx + 1];
  }
  return null;
}

function normalizeSource(source: string | null | undefined): string {
  const s = (source || "manual").toLowerCase();
  if (s === "website") return "website_form";
  return LEAD_SOURCES.some((x) => x.value === s) ? s : "manual";
}

function getSourceMeta(source: string | null | undefined) {
  const val = normalizeSource(source);
  return LEAD_SOURCES.find((x) => x.value === val) ?? LEAD_SOURCES[LEAD_SOURCES.length - 1];
}

function getPriorityMeta(priority: string | null | undefined) {
  const p = (priority || "medium").toLowerCase();
  return LEAD_PRIORITIES.find((x) => x.value === p) ?? LEAD_PRIORITIES[1];
}

function getScoreBand(score: number) {
  if (score >= 70) return { label: "Hot", detailLabel: "Hot lead", pill: "is-available" };
  if (score >= 40) return { label: "Warm", detailLabel: "Warm lead", pill: "is-hold" };
  return { label: "Cold", detailLabel: "Cold lead", pill: "is-neutral" };
}

function getLeadDisplayName(lead: Pick<CrmLeadRow, "firstName" | "lastName" | "organisationName" | "code">): string {
  const full = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
  return full || lead.organisationName || lead.code;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "LD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const str = typeof d === "string" ? d : d.toISOString();
  const parsed = new Date(str.length === 10 ? `${str}T00:00:00` : str);
  if (Number.isNaN(parsed.getTime())) return str.slice(0, 10);
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizeCountryCode(country: string | null | undefined): string {
  if (!country) return "";
  const trimmed = country.trim();
  const byCode = COUNTRIES.find((c) => c.code.toLowerCase() === trimmed.toLowerCase());
  if (byCode) return byCode.code;
  const byName = COUNTRIES.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  return byName ? byName.code : "";
}

function getCountryDisplay(country: string | null | undefined): string {
  if (!country) return "";
  const trimmed = country.trim();
  const byCode = COUNTRIES.find((c) => c.code.toLowerCase() === trimmed.toLowerCase());
  return byCode ? byCode.name : trimmed;
}

function parseNumberArray(jsonStr: string | undefined): number[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed.map(Number).filter((n) => !Number.isNaN(n));
  } catch {
    // ignore invalid json
  }
  return [];
}

function resolveLostReasonDisplay(item: CrmLostReasonRow) {
  let cleanName = item.name;
  let cleanDesc = item.description || "";
  if (item.name.includes(" Built in ")) {
    const parts = item.name.split(" Built in ");
    cleanName = parts[0].trim();
    cleanDesc = cleanDesc || parts.slice(1).join(" Built in ").trim();
  }
  const requiresNote = item.requiresNote || (item.id === 8 && cleanName === "Other");
  return { cleanName, cleanDesc, requiresNote };
}

function resolveFollowupTypeDisplay(item: CrmFollowUpTypeRow) {
  const builtin = BUILTIN_FOLLOWUP_TYPES[item.id];
  const displayName =
    builtin && (item.name === builtin.displayName.split(" ")[0] || item.name === builtin.displayName)
      ? builtin.displayName
      : item.name;
  const icon =
    builtin && item.icon === "fa-solid fa-phone" && item.id !== 1 ? builtin.icon : item.icon || "fa-solid fa-list-check";
  return { displayName, icon };
}

function addDaysYmd(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface BulkLeadRowDraft {
  key: number;
  first_name: string;
  last_name: string;
  organisation_name: string;
  mobile: string;
  email: string;
  city: string;
  interest: string;
  expected_value: string;
}

function createEmptyBulkRows(count: number, startKey = 1): BulkLeadRowDraft[] {
  return Array.from({ length: count }, (_, idx) => ({
    key: startKey + idx,
    first_name: "",
    last_name: "",
    organisation_name: "",
    mobile: "",
    email: "",
    city: "",
    interest: "",
    expected_value: "",
  }));
}

function buildQueryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v.trim() !== "") qs.set(k, v.trim());
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}

// ============================================================================
// 1. CrmLeadsList (/crm/leads)
// ============================================================================

export function CrmLeadsList({
  initialLeads,
  projects = [],
  branches = [],
  users = [],
  followupTypes = [],
  lostReasons = [],
  initialFilters = {},
}: {
  initialLeads: CrmLeadRow[];
  projects?: CrmRefProject[];
  branches?: CrmRefBranch[];
  users?: CrmRefUser[];
  followupTypes?: CrmFollowUpTypeRow[];
  lostReasons?: CrmLostReasonRow[];
  initialFilters?: LeadFilterParams;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState<CrmLeadRow[]>(initialLeads);
  const [todayYmd, setTodayYmd] = useState("");
  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [sourceFilter, setSourceFilter] = useState(initialFilters.source ?? "");
  const [priorityFilter, setPriorityFilter] = useState(initialFilters.priority ?? "");
  const [ownerFilter, setOwnerFilter] = useState(initialFilters.owner_id ?? "");
  const [dueFilter, setDueFilter] = useState(initialFilters.due ?? "");
  const [statusFilter, setStatusFilter] = useState(initialFilters.status ?? "");

  const [distMenuOpen, setDistMenuOpen] = useState(false);
  const [openStageDropdownId, setOpenStageDropdownId] = useState<number | null>(null);
  const [busyLeadId, setBusyLeadId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal states
  const [deleteTarget, setDeleteTarget] = useState<CrmLeadRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [lostTarget, setLostTarget] = useState<CrmLeadRow | null>(null);
  const [lostReasonId, setLostReasonId] = useState("");
  const [lostNote, setLostNote] = useState("");
  const [lostError, setLostError] = useState("");
  const [savingLost, setSavingLost] = useState(false);

  const [reopenTarget, setReopenTarget] = useState<CrmLeadRow | null>(null);
  const [reopenDate, setReopenDate] = useState("");
  const [reopenError, setReopenError] = useState("");
  const [savingReopen, setSavingReopen] = useState(false);

  const [noteTarget, setNoteTarget] = useState<CrmLeadRow | null>(null);
  const [noteTypeId, setNoteTypeId] = useState<number>(followupTypes[0]?.id ?? 1);
  const [noteText, setNoteText] = useState("");
  const [noteNextDate, setNoteNextDate] = useState("");
  const [noteNextTime, setNoteNextTime] = useState("");
  const [noteError, setNoteError] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [sessionNotes, setSessionNotes] = useState<
    Record<number, Array<{ id: number; type: string; icon: string; status: string; at: string; text: string; by: string }>>
  >({});

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSource, setBulkSource] = useState("manual");
  const [bulkSourceDetail, setBulkSourceDetail] = useState("");
  const [bulkPriority, setBulkPriority] = useState("medium");
  const [bulkOwnerId, setBulkOwnerId] = useState("");
  const [bulkBranchId, setBulkBranchId] = useState("");
  const [bulkFollowUp, setBulkFollowUp] = useState("");
  const [bulkRows, setBulkRows] = useState<BulkLeadRowDraft[]>(() => createEmptyBulkRows(5, 1));
  const [bulkError, setBulkError] = useState("");
  const [savingBulk, setSavingBulk] = useState(false);
  const bulkKeyRef = useRef(10);

  const [assignMode, setAssignMode] = useState<"assign" | "unassign" | null>(null);
  const [assignStrategy, setAssignStrategy] = useState<"round_robin" | "least_loaded" | "specific_user">("round_robin");
  const [assignOwnerIds, setAssignOwnerIds] = useState<number[]>([]);
  const [assignUseShares, setAssignUseShares] = useState(false);
  const [assignShares, setAssignShares] = useState<Record<number, number>>({});
  const [assignReason, setAssignReason] = useState("");
  const [assignError, setAssignError] = useState("");
  const [savingAssign, setSavingAssign] = useState(false);

  const [distributeOpen, setDistributeOpen] = useState(false);
  const [distBranchId, setDistBranchId] = useState("");
  const [distProjectId, setDistProjectId] = useState("");
  const [distLimit, setDistLimit] = useState("");
  const [distShares, setDistShares] = useState<Record<number, number>>({});
  const [distError, setDistError] = useState("");
  const [savingDist, setSavingDist] = useState(false);

  useEffect(() => {
    setTodayYmd(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  useEffect(() => {
    setSearch(initialFilters.search ?? "");
    setSourceFilter(initialFilters.source ?? "");
    setPriorityFilter(initialFilters.priority ?? "");
    setOwnerFilter(initialFilters.owner_id ?? "");
    setDueFilter(initialFilters.due ?? "");
    setStatusFilter(initialFilters.status ?? "");
  }, [
    initialFilters.search,
    initialFilters.source,
    initialFilters.priority,
    initialFilters.owner_id,
    initialFilters.due,
    initialFilters.status,
  ]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".dropdown")) {
        setDistMenuOpen(false);
        setOpenStageDropdownId(null);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    LEAD_STAGES.forEach((s) => {
      counts[s.key] = 0;
    });
    leads.forEach((l) => {
      const key = normalizeStatus(l.status);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      const st = getStageMeta(l.status);
      if (statusFilter) {
        if (st.key !== normalizeStatus(statusFilter)) return false;
      } else {
        // Converted leads leave the active leads list unless filtered explicitly
        if (st.converted) return false;
      }
      if (q) {
        const hay = [
          getLeadDisplayName(l),
          l.code,
          l.email,
          l.mobile,
          l.phone,
          l.organisationName,
          l.interest,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (sourceFilter && normalizeSource(l.source) !== sourceFilter) return false;
      if (priorityFilter && (l.priority || "medium").toLowerCase() !== priorityFilter) return false;
      if (ownerFilter === "none" && l.ownerId) return false;
      if (ownerFilter && ownerFilter !== "none" && String(l.ownerId ?? "") !== ownerFilter) return false;
      if (dueFilter === "open" && !st.open) return false;
      if (dueFilter === "overdue") {
        if (!st.open || !l.nextFollowUpOn) return false;
        if (todayYmd && l.nextFollowUpOn > todayYmd) return false;
      }
      return true;
    });
  }, [leads, search, sourceFilter, priorityFilter, ownerFilter, dueFilter, statusFilter, todayYmd]);

  const selectableIds = useMemo(
    () => filtered.filter((l) => !getStageMeta(l.status).converted).map((l) => l.id),
    [filtered]
  );

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  const hasActiveFilters = Boolean(
    search || sourceFilter || priorityFilter || ownerFilter || dueFilter || statusFilter
  );

  function applyUrlFilters(next: LeadFilterParams) {
    router.push(`/crm/leads${buildQueryString(next as Record<string, string | undefined>)}`);
  }

  function resolveOwnerDisplay(lead: CrmLeadRow): string | null {
    if (lead.ownerId) {
      const found = users.find((u) => u.id === lead.ownerId);
      if (found) return found.name;
    }
    if (lead.ownerName && lead.ownerId) return lead.ownerName;
    return null;
  }

  function resolveProjectNames(lead: CrmLeadRow): string[] {
    const ids = parseNumberArray(lead.projectIdsJson);
    return ids
      .map((id) => projects.find((p) => p.id === id)?.name)
      .filter((n): n is string => Boolean(n));
  }

  async function handleStageChange(lead: CrmLeadRow, nextStageKey: string) {
    setOpenStageDropdownId(null);
    if (nextStageKey === "unqualified") {
      openLostModal(lead);
      return;
    }
    if (isLostStatus(lead.status) && getStageMeta(nextStageKey).open) {
      openReopenModal(lead);
      return;
    }
    setBusyLeadId(lead.id);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStageKey }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((item) => (item.id === lead.id ? { ...item, status: nextStageKey } : item))
        );
        router.refresh();
      }
    } finally {
      setBusyLeadId(null);
    }
  }

  function isLostStatus(status: string): boolean {
    return normalizeStatus(status) === "unqualified";
  }

  function openLostModal(lead: CrmLeadRow) {
    setLostTarget(lead);
    setLostReasonId(lead.lostReasonId ? String(lead.lostReasonId) : "");
    setLostNote(lead.lostNote ?? "");
    setLostError("");
  }

  async function handleLostSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lostTarget) return;
    const chosen = lostReasons.find((r) => String(r.id) === lostReasonId);
    if (!chosen) {
      setLostError("Please select a loss reason.");
      return;
    }
    const { requiresNote } = resolveLostReasonDisplay(chosen);
    if (requiresNote && !lostNote.trim()) {
      setLostError("A note is required for the selected loss reason.");
      return;
    }
    setSavingLost(true);
    setLostError("");
    try {
      const res = await fetch(`/api/crm/leads/${lostTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lost_reason_id: Number(lostReasonId),
          lost_note: lostNote.trim() || null,
          next_follow_up_on: null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setLostError(d.error || "Failed to mark lead as lost.");
        return;
      }
      setLeads((prev) =>
        prev.map((item) =>
          item.id === lostTarget.id
            ? {
                ...item,
                status: "unqualified",
                lostReasonId: Number(lostReasonId),
                lostNote: lostNote.trim() || null,
                nextFollowUpOn: null,
              }
            : item
        )
      );
      setLostTarget(null);
      router.refresh();
    } finally {
      setSavingLost(false);
    }
  }

  function openReopenModal(lead: CrmLeadRow) {
    setReopenTarget(lead);
    setReopenDate(lead.nextFollowUpOn ?? "");
    setReopenError("");
  }

  async function handleReopenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reopenTarget) return;
    setSavingReopen(true);
    setReopenError("");
    try {
      const res = await fetch(`/api/crm/leads/${reopenTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "contacted",
          next_follow_up_on: reopenDate || null,
          lost_note: null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setReopenError(d.error || "Failed to reopen lead.");
        return;
      }
      setLeads((prev) =>
        prev.map((item) =>
          item.id === reopenTarget.id
            ? {
                ...item,
                status: "contacted",
                nextFollowUpOn: reopenDate || null,
                lostReasonId: null,
                lostNote: null,
              }
            : item
        )
      );
      setReopenTarget(null);
      router.refresh();
    } finally {
      setSavingReopen(false);
    }
  }

  async function handleDeleteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/leads/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setLeads((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  function openNoteModal(lead: CrmLeadRow) {
    setNoteTarget(lead);
    setNoteTypeId(followupTypes[0]?.id ?? 1);
    setNoteText("");
    setNoteNextDate(lead.nextFollowUpOn ?? "");
    setNoteNextTime("");
    setNoteError("");
  }

  async function handleNoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!noteTarget) return;
    if (!noteText.trim()) {
      setNoteError("Please enter a follow-up note.");
      return;
    }
    setSavingNote(true);
    setNoteError("");
    try {
      const leadName = getLeadDisplayName(noteTarget);
      const selectedType = followupTypes.find((ft) => ft.id === noteTypeId);
      const typeInfo = selectedType
        ? resolveFollowupTypeDisplay(selectedType)
        : { displayName: "Call", icon: "fa-solid fa-phone" };
      const followRes = await fetch("/api/crm/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `${typeInfo.displayName} — ${leadName}`,
          follow_up_type_id: noteTypeId,
          description: noteText.trim(),
          scheduled_date: noteNextDate || todayYmd || new Date().toISOString().slice(0, 10),
          scheduled_time: noteNextTime || null,
          concerns: `Lead: ${leadName} (${noteTarget.code})`,
          status: noteNextDate ? "scheduled" : "completed",
        }),
      });
      if (!followRes.ok) {
        const d = await followRes.json().catch(() => ({}));
        setNoteError(d.error || "Failed to save note.");
        return;
      }

      const nextStatus = normalizeStatus(noteTarget.status) === "new" ? "contacted" : noteTarget.status;
      const leadPatch: Record<string, unknown> = {};
      if (noteNextDate) leadPatch.next_follow_up_on = noteNextDate;
      if (nextStatus !== noteTarget.status) leadPatch.status = nextStatus;

      if (Object.keys(leadPatch).length > 0) {
        await fetch(`/api/crm/leads/${noteTarget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadPatch),
        });
      }

      setSessionNotes((prev) => ({
        ...prev,
        [noteTarget.id]: [
          ...(prev[noteTarget.id] ?? []),
          {
            id: Date.now(),
            type: typeInfo.displayName,
            icon: typeInfo.icon,
            status: noteNextDate ? "Scheduled" : "Completed",
            at: noteNextDate ? formatDate(noteNextDate) : "Just now",
            text: noteText.trim(),
            by: "You",
          },
        ],
      }));

      setLeads((prev) =>
        prev.map((item) =>
          item.id === noteTarget.id
            ? {
                ...item,
                status: nextStatus,
                nextFollowUpOn: noteNextDate || item.nextFollowUpOn,
              }
            : item
        )
      );
      setNoteTarget(null);
      router.refresh();
    } finally {
      setSavingNote(false);
    }
  }

  function addBulkRows(count: number) {
    const start = bulkKeyRef.current;
    bulkKeyRef.current += count + 1;
    setBulkRows((prev) => [...prev.slice(0, 500 - count), ...createEmptyBulkRows(count, start)]);
  }

  function handleBulkPaste(rowIdx: number, colKey: keyof BulkLeadRowDraft, e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) return;
    e.preventDefault();
    const cols: Array<keyof BulkLeadRowDraft> = [
      "first_name",
      "last_name",
      "organisation_name",
      "mobile",
      "email",
      "city",
      "interest",
      "expected_value",
    ];
    const startColIdx = Math.max(0, cols.indexOf(colKey));
    const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
    setBulkRows((prev) => {
      const next = [...prev];
      while (next.length < rowIdx + lines.length && next.length < 500) {
        const key = bulkKeyRef.current++;
        next.push(...createEmptyBulkRows(1, key));
      }
      lines.forEach((line, lOffset) => {
        const rIdx = rowIdx + lOffset;
        if (rIdx >= next.length) return;
        const cells = line.split("\t");
        const updated = { ...next[rIdx] };
        cells.forEach((cellVal, cOffset) => {
          const targetCol = cols[startColIdx + cOffset];
          if (targetCol && targetCol !== "key") {
            updated[targetCol] = cellVal.trim();
          }
        });
        next[rIdx] = updated;
      });
      return next;
    });
  }

  const readyBulkRows = useMemo(
    () =>
      bulkRows.filter(
        (r) => r.first_name.trim() !== "" || r.organisation_name.trim() !== "" || r.mobile.trim() !== ""
      ),
    [bulkRows]
  );

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readyBulkRows.length === 0) {
      setBulkError("Enter at least one lead with a first name, organisation, or mobile.");
      return;
    }
    setSavingBulk(true);
    setBulkError("");
    try {
      const res = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: bulkSource,
          source_detail: bulkSourceDetail || null,
          priority: bulkPriority,
          owner_id: bulkOwnerId ? Number(bulkOwnerId) : null,
          branch_id: bulkBranchId ? Number(bulkBranchId) : null,
          next_follow_up_on: bulkFollowUp || null,
          rows: readyBulkRows.map((r) => ({
            first_name: r.first_name.trim(),
            last_name: r.last_name.trim() || null,
            organisation_name: r.organisation_name.trim() || null,
            mobile: r.mobile.trim() || null,
            email: r.email.trim() || null,
            city: r.city.trim() || null,
            interest: r.interest.trim() || null,
            expected_value: r.expected_value ? Number(r.expected_value) : 0,
          })),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setBulkError(d.error || "Failed to create leads.");
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.row)) {
        setLeads((prev) => [...prev, ...data.row]);
      }
      setBulkOpen(false);
      setBulkRows(createEmptyBulkRows(5, bulkKeyRef.current));
      bulkKeyRef.current += 6;
      router.refresh();
    } finally {
      setSavingBulk(false);
    }
  }

  function openAssignModal(mode: "assign" | "unassign") {
    setAssignMode(mode);
    setAssignOwnerIds([]);
    setAssignUseShares(false);
    setAssignShares({});
    setAssignReason("");
    setAssignError("");
  }

  function splitAssignEqually() {
    if (assignOwnerIds.length === 0) return;
    const base = Math.floor(100 / assignOwnerIds.length);
    const rem = 100 - base * assignOwnerIds.length;
    const next: Record<number, number> = {};
    assignOwnerIds.forEach((uid, idx) => {
      next[uid] = base + (idx < rem ? 1 : 0);
    });
    setAssignShares(next);
  }

  const assignShareSum = assignOwnerIds.reduce((sum, uid) => sum + (assignShares[uid] || 0), 0);

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignMode) return;
    if (assignMode === "assign" && assignOwnerIds.length === 0) {
      setAssignError("Pick at least one person to assign these leads to.");
      return;
    }
    if (assignMode === "assign" && assignUseShares && assignShareSum !== 100) {
      setAssignError("Percentage shares must add up to 100%.");
      return;
    }

    setSavingAssign(true);
    setAssignError("");
    try {
      const targetIds = selectedIds.filter((id) => {
        const ld = leads.find((x) => x.id === id);
        return ld && !getStageMeta(ld.status).converted;
      });
      const assignments: Record<number, number | null> = {};
      if (assignMode === "unassign") {
        targetIds.forEach((id) => {
          assignments[id] = null;
        });
      } else if (assignStrategy === "specific_user") {
        targetIds.forEach((id) => {
          assignments[id] = assignOwnerIds[0];
        });
      } else {
        targetIds.forEach((id, idx) => {
          assignments[id] = assignOwnerIds[idx % assignOwnerIds.length];
        });
      }

      await Promise.all(
        targetIds.map((id) =>
          fetch(`/api/crm/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ owner_id: assignments[id] }),
          })
        )
      );

      setLeads((prev) =>
        prev.map((item) => {
          if (!(item.id in assignments)) return item;
          const uid = assignments[item.id];
          const user = uid ? users.find((u) => u.id === uid) : null;
          return { ...item, ownerId: uid, ownerName: user?.name ?? null };
        })
      );
      setSelectedIds([]);
      setAssignMode(null);
      router.refresh();
    } finally {
      setSavingAssign(false);
    }
  }

  const unassignedPool = useMemo(() => {
    return leads.filter((l) => {
      if (l.ownerId) return false;
      const st = getStageMeta(l.status);
      if (!st.open) return false;
      if (distBranchId && String(l.branchId ?? "") !== distBranchId) return false;
      if (distProjectId && !parseNumberArray(l.projectIdsJson).includes(Number(distProjectId))) {
        return false;
      }
      return true;
    });
  }, [leads, distBranchId, distProjectId]);

  const distShareSum = users.reduce((sum, u) => sum + (distShares[u.id] || 0), 0);

  function splitDistEqually() {
    if (users.length === 0) return;
    const base = Math.floor(100 / users.length);
    const rem = 100 - base * users.length;
    const next: Record<number, number> = {};
    users.forEach((u, idx) => {
      next[u.id] = base + (idx < rem ? 1 : 0);
    });
    setDistShares(next);
  }

  async function handleDistributeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (distShareSum !== 100) {
      setDistError("The shares must add up to 100%.");
      return;
    }
    const maxCount = distLimit ? Math.min(Number(distLimit), unassignedPool.length) : unassignedPool.length;
    const targets = unassignedPool.slice(0, maxCount);
    if (targets.length === 0) {
      setDistError("No unassigned open leads match this scope.");
      return;
    }
    const activeUsers = users.filter((u) => (distShares[u.id] || 0) > 0);
    setSavingDist(true);
    setDistError("");
    try {
      const assignments: Record<number, number> = {};
      targets.forEach((lead, idx) => {
        const u = activeUsers[idx % activeUsers.length];
        assignments[lead.id] = u.id;
      });
      await Promise.all(
        targets.map((lead) =>
          fetch(`/api/crm/leads/${lead.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ owner_id: assignments[lead.id] }),
          })
        )
      );
      setLeads((prev) =>
        prev.map((item) => {
          if (!(item.id in assignments)) return item;
          const uid = assignments[item.id];
          const u = users.find((x) => x.id === uid);
          return { ...item, ownerId: uid, ownerName: u?.name ?? null };
        })
      );
      setDistributeOpen(false);
      router.refresh();
    } finally {
      setSavingDist(false);
    }
  }

  const chosenLostReason = lostReasons.find((r) => String(r.id) === lostReasonId);
  const chosenLostDisplay = chosenLostReason ? resolveLostReasonDisplay(chosenLostReason) : null;

  return (
    <div className="container ">
      <CrmSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-filter"></i>
          </div>
          <div>
            <h1>Leads</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Leads
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/leads/board" className="btn btn-erp-ghost">
            <i className="fa-solid fa-diagram-project me-2"></i>Board
          </Link>
          <Link href="/crm/leads?due=overdue" className="btn btn-erp-ghost">
            <i className="fa-solid fa-bell me-2"></i>Due Follow-ups
          </Link>
          <Link href="/crm/customers" className="btn btn-erp-ghost">
            <i className="fa-solid fa-address-book me-2"></i>Customers
          </Link>
          <div className="dropdown">
            <button
              className="btn btn-erp-ghost"
              type="button"
              aria-expanded={distMenuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setDistMenuOpen((v) => !v);
              }}
            >
              <i className="fa-solid fa-chart-pie me-2"></i>Distribution
            </button>
            <ul
              className={`dropdown-menu dropdown-menu-end notika-dropdown erp-user-menu${
                distMenuOpen ? " show" : ""
              }`}
            >
              <li>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setDistMenuOpen(false);
                    setDistError("");
                    setDistributeOpen(true);
                  }}
                >
                  <i className="fa-solid fa-share-nodes"></i> Distribute unassigned leads
                </button>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  href="/crm/leads?owner_id=none&due=open"
                  onClick={() => setDistMenuOpen(false)}
                >
                  <i className="fa-solid fa-inbox"></i> View unassigned pool
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <Link className="dropdown-item" href="/crm/lead-distribution">
                  <i className="fa-solid fa-clock-rotate-left"></i> Auto-distribution
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href="/crm/assignment-rules">
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Assignment rules
                </Link>
              </li>
            </ul>
          </div>
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() => {
              setBulkError("");
              setBulkOpen(true);
            }}
          >
            <i className="fa-solid fa-layer-group me-2"></i>Bulk Add
          </button>
          <Link
            href="/crm/leads/create"
            className="btn btn-erp"
            data-modal-form=""
            data-modal-title="New Lead"
            data-modal-size="xl"
          >
            <i className="fa-solid fa-plus me-2"></i>New Lead
          </Link>
        </div>
      </div>

      <div className="erp-statrow">
        {LEAD_STAGES.map((st) => {
          const isActive = normalizeStatus(statusFilter) === st.key && Boolean(statusFilter);
          return (
            <Link
              key={st.key}
              href={isActive ? "/crm/leads" : `/crm/leads?status=${st.key}`}
              className={`erp-stat ${isActive ? "is-active" : ""}`}
            >
              <span className="erp-stat-icon">
                <i className={st.icon}></i>
              </span>
              <span className="erp-stat-body">
                <strong>{stageCounts[st.key] ?? 0}</strong>
                <small>
                  {st.label} · {st.pct}%
                </small>
              </span>
            </Link>
          );
        })}
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/crm/leads"
            onSubmit={(e) => {
              e.preventDefault();
              applyUrlFilters({
                search,
                source: sourceFilter,
                priority: priorityFilter,
                owner_id: ownerFilter,
                due: dueFilter,
                status: statusFilter,
              });
            }}
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, reference, email…"
                aria-label="Search leads"
              />
            </div>

            <select
              name="source"
              className="form-select erp-select"
              aria-label="Source filter"
              value={sourceFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSourceFilter(val);
                applyUrlFilters({
                  search,
                  source: val,
                  priority: priorityFilter,
                  owner_id: ownerFilter,
                  due: dueFilter,
                  status: statusFilter,
                });
              }}
            >
              <option value="">All sources</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              name="priority"
              className="form-select erp-select"
              aria-label="Priority filter"
              value={priorityFilter}
              onChange={(e) => {
                const val = e.target.value;
                setPriorityFilter(val);
                applyUrlFilters({
                  search,
                  source: sourceFilter,
                  priority: val,
                  owner_id: ownerFilter,
                  due: dueFilter,
                  status: statusFilter,
                });
              }}
            >
              <option value="">All priorities</option>
              {LEAD_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <select
              name="owner_id"
              className="form-select erp-select"
              aria-label="Owner filter"
              value={ownerFilter}
              onChange={(e) => {
                const val = e.target.value;
                setOwnerFilter(val);
                applyUrlFilters({
                  search,
                  source: sourceFilter,
                  priority: priorityFilter,
                  owner_id: val,
                  due: dueFilter,
                  status: statusFilter,
                });
              }}
            >
              <option value="">All salespeople</option>
              <option value="none">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              name="due"
              className="form-select erp-select"
              aria-label="Due filter"
              value={dueFilter}
              onChange={(e) => {
                const val = e.target.value;
                setDueFilter(val);
                applyUrlFilters({
                  search,
                  source: sourceFilter,
                  priority: priorityFilter,
                  owner_id: ownerFilter,
                  due: val,
                  status: statusFilter,
                });
              }}
            >
              <option value="">All leads</option>
              <option value="open">Open only</option>
              <option value="overdue">Follow-up due</option>
            </select>

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>

            {hasActiveFilters && (
              <Link href="/crm/leads" className="btn btn-erp-ghost">
                Clear
              </Link>
            )}
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {filtered.length} {filtered.length === 1 ? "lead" : "leads"}
          </span>
        </div>

        <div className="lead-selection-bar" data-lead-selection hidden={selectedIds.length === 0}>
          <span>
            <strong data-lead-selected-count>{selectedIds.length}</strong> selected
          </span>
          <button
            type="button"
            className="btn btn-erp btn-sm"
            data-lead-bulk-assign
            onClick={() => openAssignModal("assign")}
          >
            <i className="fa-solid fa-user-tag me-1"></i>Assign
          </button>
          <button
            type="button"
            className="btn btn-erp-ghost btn-sm"
            data-lead-bulk-unassign
            onClick={() => openAssignModal("unassign")}
          >
            <i className="fa-solid fa-user-slash me-1"></i>Unassign
          </button>
          <button
            type="button"
            className="btn btn-erp-ghost btn-sm"
            data-lead-select-clear
            onClick={() => setSelectedIds([])}
          >
            <i className="fa-solid fa-xmark me-1"></i>Clear
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-filter"></i>
            </div>
            <h3>No leads found</h3>
            <p>
              {hasActiveFilters
                ? "No leads match your current filters."
                : "Capture your first enquiry to start tracking it through the pipeline."}
            </p>
            <div className="d-flex gap-2 justify-content-center">
              {hasActiveFilters && (
                <Link href="/crm/leads" className="btn btn-erp-ghost">
                  Reset Filters
                </Link>
              )}
              <Link href="/crm/leads/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>New Lead
              </Link>
            </div>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th style={{ width: "34px" }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        data-lead-select-all
                        aria-label="Select all leads on this page"
                        checked={allSelected}
                        onChange={(e) =>
                          setSelectedIds(e.target.checked ? selectableIds : [])
                        }
                      />
                    </th>
                    <th>Lead</th>
                    <th>Reference</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Owner</th>
                    <th>Follow-up</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => {
                    const displayName = getLeadDisplayName(lead);
                    const initials = getInitials(displayName);
                    const prio = getPriorityMeta(lead.priority);
                    const src = getSourceMeta(lead.source);
                    const st = getStageMeta(lead.status);
                    const nextSt = getNextOpenStage(lead.status);
                    const band = getScoreBand(lead.score);
                    const ownerDisplay = resolveOwnerDisplay(lead);
                    const projNames = resolveProjectNames(lead);
                    const isOverdue =
                      Boolean(todayYmd && lead.nextFollowUpOn && lead.nextFollowUpOn < todayYmd && st.open);
                    const stageOpen = openStageDropdownId === lead.id;

                    return (
                      <tr key={lead.id} data-lead-row={lead.id}>
                        <td>
                          {!st.converted && (
                            <input
                              type="checkbox"
                              className="form-check-input"
                              value={lead.id}
                              data-lead-select
                              aria-label={`Select ${displayName}`}
                              checked={selectedIds.includes(lead.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds((prev) =>
                                    prev.includes(lead.id) ? prev : [...prev, lead.id]
                                  );
                                } else {
                                  setSelectedIds((prev) => prev.filter((id) => id !== lead.id));
                                }
                              }}
                            />
                          )}
                        </td>
                        <td>
                          <div className="erp-identity">
                            <span className="erp-initials">{initials}</span>
                            <span>
                              <span className="erp-identity-name">
                                <Link href={`/crm/leads/${lead.id}`} className="erp-plain-link">
                                  {displayName}
                                </Link>
                                <span className={`erp-pill ${prio.pill} ms-1`}>{prio.label}</span>
                              </span>
                              {(lead.interest || lead.email || lead.mobile) && (
                                <span className="erp-identity-meta">
                                  {lead.interest || lead.email || lead.mobile}
                                </span>
                              )}
                              {projNames.length > 0 && (
                                <span className="erp-identity-meta" title="Interested projects">
                                  <i className="fa-solid fa-building me-1"></i>
                                  {projNames.join(", ")}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="erp-cell-strong">{lead.code}</td>
                        <td>
                          <span className="erp-scope-tag">
                            <i className={src.icon}></i> {src.label}
                          </span>
                        </td>
                        <td>
                          <div
                            className={`lead-stage${busyLeadId === lead.id ? " is-busy" : ""}`}
                            data-lead-stage
                            data-lead={lead.id}
                            data-name={displayName}
                            data-current={st.key}
                          >
                            <div className="dropdown d-inline-block">
                              <button
                                type="button"
                                className={`erp-pill ${st.pill} lead-stage-btn`}
                                aria-expanded={stageOpen}
                                title="Change stage"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenStageDropdownId(stageOpen ? null : lead.id);
                                }}
                              >
                                <i className={`${st.icon} me-1`}></i>
                                {st.label}
                                <span className="lead-stage-pct">{st.pct}%</span>
                                <i
                                  className="fa-solid fa-chevron-down ms-1"
                                  style={{ fontSize: "9px" }}
                                ></i>
                              </button>
                              <ul className={`dropdown-menu lead-stage-menu${stageOpen ? " show" : ""}`}>
                                {LEAD_STAGES.map((opt) => (
                                  <React.Fragment key={opt.key}>
                                    {opt.key === "unqualified" && (
                                      <li>
                                        <hr className="dropdown-divider" />
                                      </li>
                                    )}
                                    <li>
                                      <button
                                        type="button"
                                        className={`dropdown-item${opt.key === st.key ? " active" : ""}`}
                                        data-stage-set={opt.key}
                                        data-stage-label={opt.label}
                                        disabled={opt.key === st.key}
                                        onClick={() => handleStageChange(lead, opt.key)}
                                      >
                                        <i
                                          className={`${opt.icon} me-2`}
                                          style={{ width: "14px" }}
                                        ></i>
                                        {opt.label}
                                        <span className="lead-stage-menu-pct">{opt.pct}%</span>
                                      </button>
                                    </li>
                                  </React.Fragment>
                                ))}
                              </ul>
                            </div>
                            {nextSt && (
                              <button
                                type="button"
                                className="lead-stage-next"
                                data-stage-set={nextSt.key}
                                data-stage-label={nextSt.label}
                                title={`Move to ${nextSt.label} (${nextSt.pct}%)`}
                                onClick={() => handleStageChange(lead, nextSt.key)}
                              >
                                <i className="fa-solid fa-forward-step"></i>
                              </button>
                            )}
                            <div className="lead-stage-bar" title={`${st.pct}% likely to close`}>
                              <span style={{ width: `${st.pct}%` }}></span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`erp-pill ${band.pill}`}>
                            {lead.score} · {band.label}
                          </span>
                        </td>
                        <td>
                          {ownerDisplay ? (
                            <>
                              {ownerDisplay}
                              <div className="erp-identity-meta">Assigned</div>
                            </>
                          ) : (
                            <>
                              —
                              <div className="erp-identity-meta">
                                <i className="fa-solid fa-inbox me-1"></i>Unassigned
                              </div>
                            </>
                          )}
                        </td>
                        <td className="text-nowrap" style={{ fontSize: "12.5px" }}>
                          {lead.nextFollowUpOn ? (
                            <span className={isOverdue ? "text-danger fw-semibold" : ""}>
                              {formatDate(lead.nextFollowUpOn)}
                            </span>
                          ) : (
                            <span className="text-muted">Not scheduled</span>
                          )}
                          {lead.mobile && (
                            <div className="erp-identity-meta" title="Mobile">
                              <i className="fa-solid fa-phone-volume me-1"></i>
                              {lead.mobile}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="erp-created-by">
                            <span className="erp-cell-strong">System Administrator</span>
                            <span className="erp-identity-meta d-block">
                              {formatDate(lead.createdAt)}
                            </span>
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <Link
                            href={`/crm/leads/${lead.id}`}
                            className="btn btn-erp-ghost btn-sm"
                            title="View"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </Link>{" "}
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-primary"
                            title="Quick follow-up note"
                            data-lead-note
                            onClick={() => openNoteModal(lead)}
                          >
                            <i className="fa-solid fa-comment-medical"></i>
                          </button>{" "}
                          <Link
                            href={`/crm/leads/${lead.id}/edit`}
                            className="btn btn-erp-ghost btn-sm"
                            title="Edit"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </Link>{" "}
                          {st.lost ? (
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-success"
                              title="Reopen lead"
                              data-lead-reopen
                              onClick={() => openReopenModal(lead)}
                            >
                              <i className="fa-solid fa-rotate-left"></i>
                            </button>
                          ) : !st.converted ? (
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-warning"
                              title="Mark lost"
                              data-lead-lost
                              onClick={() => openLostModal(lead)}
                            >
                              <i className="fa-solid fa-circle-minus"></i>
                            </button>
                          ) : null}{" "}
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(lead)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: #deleteRecordModal */}
      <div
        className={`modal fade${deleteTarget ? " show d-block" : ""}`}
        id="deleteRecordModal"
        tabIndex={-1}
        aria-hidden={!deleteTarget}
        style={deleteTarget ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ border: "none", borderRadius: "14px" }}>
            <div className="modal-body p-4">
              <div className="d-flex gap-3">
                <div className="erp-kpi-icon is-danger">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                    Delete lead?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>
                      {deleteTarget ? getLeadDisplayName(deleteTarget) : ""}
                    </strong>{" "}
                    will be removed from active use. The record is retained and can be restored by an
                    administrator.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <form method="POST" data-delete-form onSubmit={handleDeleteSubmit}>
                <button
                  type="submit"
                  className="btn btn-erp"
                  disabled={deleting}
                  style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                >
                  <i className="fa-solid fa-trash-can me-2"></i>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 2: #leadLostModal */}
      <div
        className={`modal fade${lostTarget ? " show d-block" : ""}`}
        id="leadLostModal"
        tabIndex={-1}
        aria-hidden={!lostTarget}
        style={lostTarget ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            className="modal-content erp-form"
            style={{ border: "none", borderRadius: "14px" }}
            data-lost-form
            onSubmit={handleLostSubmit}
          >
            <div className="modal-body p-4">
              <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                Mark lost —{" "}
                <span data-lost-name>{lostTarget ? getLeadDisplayName(lostTarget) : "this lead"}</span>
              </h5>
              <p className="text-muted" style={{ fontSize: "13px" }}>
                Closes the lead without converting it and clears the follow-up so it leaves the
                queue. The reason is what the loss report is built from, so pick the closest one.
              </p>

              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-lost-errors
                hidden={!lostError}
              >
                <span data-lost-errors-text>{lostError}</span>
              </div>

              <div className="erp-field">
                <label htmlFor="lost_reason_id" className="form-label">
                  Reason <span className="erp-required">*</span>
                </label>
                <select
                  id="lost_reason_id"
                  name="lost_reason_id"
                  className="form-select"
                  value={lostReasonId}
                  onChange={(e) => setLostReasonId(e.target.value)}
                  required
                >
                  <option value="">Choose a reason</option>
                  {lostReasons
                    .filter((r) => r.isActive)
                    .map((r) => {
                      const { cleanName } = resolveLostReasonDisplay(r);
                      return (
                        <option key={r.id} value={String(r.id)}>
                          {cleanName}
                        </option>
                      );
                    })}
                </select>
                {chosenLostDisplay?.cleanDesc && (
                  <span className="erp-help" data-lost-hint>
                    {chosenLostDisplay.cleanDesc}
                  </span>
                )}
              </div>

              <div className="erp-field mb-0">
                <label htmlFor="lost_note" className="form-label">
                  Note{" "}
                  <span
                    className="erp-required"
                    data-lost-note-required
                    hidden={!chosenLostDisplay?.requiresNote}
                  >
                    *
                  </span>
                </label>
                <textarea
                  id="lost_note"
                  name="lost_note"
                  rows={3}
                  className="form-control"
                  maxLength={500}
                  placeholder="What actually happened, in one or two lines…"
                  value={lostNote}
                  onChange={(e) => setLostNote(e.target.value)}
                  required={Boolean(chosenLostDisplay?.requiresNote)}
                ></textarea>
                <span className="erp-help">Optional, unless the reason asks for it.</span>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                onClick={() => setLostTarget(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-erp"
                disabled={savingLost}
                style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
              >
                <i className="fa-solid fa-circle-minus me-2"></i>
                {savingLost ? "Saving…" : "Mark Lost"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 3: #leadReopenModal */}
      <div
        className={`modal fade${reopenTarget ? " show d-block" : ""}`}
        id="leadReopenModal"
        tabIndex={-1}
        aria-hidden={!reopenTarget}
        style={reopenTarget ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            className="modal-content erp-form"
            style={{ border: "none", borderRadius: "14px" }}
            data-reopen-form
            onSubmit={handleReopenSubmit}
          >
            <div className="modal-body p-4">
              <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                Reopen —{" "}
                <span data-reopen-name>
                  {reopenTarget ? getLeadDisplayName(reopenTarget) : "this lead"}
                </span>
              </h5>
              <p className="text-muted" style={{ fontSize: "13px" }}>
                Puts the lead back in play and clears{" "}
                <strong data-reopen-reason>
                  {reopenTarget?.lostReasonId
                    ? (() => {
                        const r = lostReasons.find((x) => x.id === reopenTarget.lostReasonId);
                        return r ? resolveLostReasonDisplay(r).cleanName : "the recorded loss";
                      })()
                    : "the recorded loss"}
                </strong>
                , so it stops counting against that reason. Set the next follow-up while you are
                here.
              </p>

              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-reopen-errors
                hidden={!reopenError}
              >
                <span data-reopen-errors-text>{reopenError}</span>
              </div>

              <div className="erp-field mb-0">
                <label htmlFor="reopen_next_follow_up_on" className="form-label">
                  Next follow-up
                </label>
                <input
                  type="date"
                  id="reopen_next_follow_up_on"
                  name="next_follow_up_on"
                  className="form-control"
                  value={reopenDate}
                  onChange={(e) => setReopenDate(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                onClick={() => setReopenTarget(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" disabled={savingReopen}>
                <i className="fa-solid fa-rotate-left me-2"></i>
                {savingReopen ? "Saving…" : "Reopen Lead"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 4: #leadNoteModal */}
      <div
        className={`modal fade${noteTarget ? " show d-block" : ""}`}
        id="leadNoteModal"
        tabIndex={-1}
        aria-hidden={!noteTarget}
        aria-labelledby="leadNoteTitle"
        style={noteTarget ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
          <form
            method="POST"
            className="modal-content erp-form"
            data-lead-note-form
            noValidate
            style={{ border: "none", borderRadius: "14px" }}
            onSubmit={handleNoteSubmit}
          >
            <div className="modal-body p-4">
              <h5 className="mb-1" id="leadNoteTitle" style={{ fontSize: "16px", fontWeight: 600 }}>
                <i className="fa-solid fa-comment-medical me-2 text-primary"></i>Follow-up note —{" "}
                <span data-note-name>
                  {noteTarget ? getLeadDisplayName(noteTarget) : "this lead"}
                </span>
              </h5>
              <p className="text-muted mb-3" style={{ fontSize: "12.5px" }}>
                Saved to the lead&apos;s follow-up history and marks it contacted.
              </p>

              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-note-error
                hidden={!noteError}
              >
                <i className="fa-solid fa-circle-exclamation me-1"></i>
                <span data-note-error-text>{noteError}</span>
              </div>

              <div className="lead-note-history-wrap">
                <div className="lead-note-history-head">
                  <span>
                    <i className="fa-solid fa-clock-rotate-left me-1"></i>Previous notes
                  </span>
                  <span data-history-count>
                    {noteTarget ? (sessionNotes[noteTarget.id]?.length ?? 0) : 0}
                  </span>
                </div>
                <div className="lead-note-history" data-history-list>
                  {!noteTarget || (sessionNotes[noteTarget.id]?.length ?? 0) === 0 ? (
                    <div className="lead-note-history-empty" data-history-state>
                      No quick follow-up notes recorded in this session yet.
                    </div>
                  ) : (
                    sessionNotes[noteTarget.id].map((n) => (
                      <div key={n.id} className="lead-note-item">
                        <div className="lead-note-item-meta">
                          <span className="lead-note-item-type">
                            <i className={n.icon}></i> <span>{n.type}</span>
                          </span>
                          <span className="lead-note-item-status">{n.status}</span>
                          <span className="ms-auto">{n.at}</span>
                        </div>
                        <div className="lead-note-item-text">{n.text}</div>
                        <div className="lead-note-item-by">{n.by}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="erp-field">
                <label className="form-label">
                  Type <span className="erp-required">*</span>
                </label>
                <div className="lead-note-types" role="radiogroup">
                  {followupTypes.map((ft) => {
                    const disp = resolveFollowupTypeDisplay(ft);
                    return (
                      <label key={ft.id} className="lead-note-type">
                        <input
                          type="radio"
                          name="follow_up_type_id"
                          value={String(ft.id)}
                          checked={noteTypeId === ft.id}
                          onChange={() => setNoteTypeId(ft.id)}
                        />
                        <span>
                          <i className={`${disp.icon} me-1`}></i>
                          {disp.displayName}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="erp-field">
                <label htmlFor="lead_note_text" className="form-label">
                  Note <span className="erp-required">*</span>
                </label>
                <textarea
                  id="lead_note_text"
                  name="note"
                  rows={4}
                  maxLength={2000}
                  className="form-control"
                  required
                  placeholder="What was discussed? Interest, objections, promises…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                ></textarea>
                <div className="d-flex justify-content-between">
                  <span className="erp-help">Ctrl + Enter to save</span>
                  <span className="erp-help" data-note-count>
                    {noteText.length} / 2000
                  </span>
                </div>
              </div>

              <div className="erp-field mb-0">
                <label htmlFor="lead_note_next" className="form-label">
                  Next follow-up
                </label>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <input
                    type="date"
                    id="lead_note_next"
                    name="next_follow_up_on"
                    className="form-control"
                    style={{ maxWidth: "170px" }}
                    min={todayYmd || undefined}
                    value={noteNextDate}
                    onChange={(e) => setNoteNextDate(e.target.value)}
                  />
                  <input
                    type="time"
                    name="next_follow_up_time"
                    className="form-control"
                    style={{ maxWidth: "120px" }}
                    aria-label="Time"
                    value={noteNextTime}
                    onChange={(e) => setNoteNextTime(e.target.value)}
                  />
                  <div className="btn-group btn-group-sm" role="group" aria-label="Quick dates">
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      onClick={() => setNoteNextDate(addDaysYmd(1))}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      onClick={() => setNoteNextDate(addDaysYmd(3))}
                    >
                      3 days
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp-ghost"
                      onClick={() => setNoteNextDate(addDaysYmd(7))}
                    >
                      1 week
                    </button>
                  </div>
                </div>
                <span className="erp-help">
                  Optional. Schedules the next follow-up and sets it on the lead.
                </span>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                onClick={() => setNoteTarget(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" disabled={savingNote}>
                <i className="fa-solid fa-floppy-disk me-2"></i>
                {savingNote ? "Saving…" : "Save note"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 5: #leadBulkModal */}
      <div
        className={`modal fade${bulkOpen ? " show d-block" : ""}`}
        id="leadBulkModal"
        tabIndex={-1}
        aria-hidden={!bulkOpen}
        aria-labelledby="leadBulkTitle"
        style={bulkOpen ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl lead-bulk-dialog">
          <form
            className="modal-content erp-form"
            data-lead-bulk-form
            noValidate
            style={{ border: "none", borderRadius: "14px" }}
            onSubmit={handleBulkSubmit}
          >
            <div className="modal-header border-0 px-4 pt-4 pb-2">
              <div>
                <h5 className="modal-title mb-1" id="leadBulkTitle" style={{ fontSize: "16px", fontWeight: 600 }}>
                  <i className="fa-solid fa-layer-group me-2 text-primary"></i>Bulk add leads
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: "12.5px" }}>
                  Type rows or paste them from Excel (columns in the order shown). Every lead starts
                  as <strong>New</strong>. A person or organisation name is required on each row.
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setBulkOpen(false)}
              ></button>
            </div>

            <div className="modal-body px-4">
              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-bulk-error
                hidden={!bulkError}
              >
                <i className="fa-solid fa-circle-exclamation me-1"></i>
                <span data-bulk-error-text>{bulkError}</span>
              </div>

              <div className="lead-bulk-shared">
                <div className="row g-2">
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="bulk_source">
                      Source <span className="erp-required">*</span>
                    </label>
                    <select
                      id="bulk_source"
                      name="source"
                      className="form-select form-select-sm"
                      value={bulkSource}
                      onChange={(e) => setBulkSource(e.target.value)}
                      required
                    >
                      {LEAD_SOURCES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="bulk_source_detail">
                      Source detail
                    </label>
                    <input
                      type="text"
                      id="bulk_source_detail"
                      name="source_detail"
                      className="form-control form-control-sm"
                      maxLength={190}
                      placeholder="Campaign, event, referrer"
                      value={bulkSourceDetail}
                      onChange={(e) => setBulkSourceDetail(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="bulk_priority">
                      Priority <span className="erp-required">*</span>
                    </label>
                    <select
                      id="bulk_priority"
                      name="priority"
                      className="form-select form-select-sm"
                      value={bulkPriority}
                      onChange={(e) => setBulkPriority(e.target.value)}
                      required
                    >
                      {LEAD_PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="bulk_owner">
                      Assigned to
                    </label>
                    <select
                      id="bulk_owner"
                      name="owner_id"
                      className="form-select form-select-sm"
                      value={bulkOwnerId}
                      onChange={(e) => setBulkOwnerId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={String(u.id)}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="bulk_branch">
                      Branch
                    </label>
                    <select
                      id="bulk_branch"
                      name="branch_id"
                      className="form-select form-select-sm"
                      value={bulkBranchId}
                      onChange={(e) => setBulkBranchId(e.target.value)}
                    >
                      <option value="">—</option>
                      {branches.map((b) => (
                        <option key={b.id} value={String(b.id)}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label" htmlFor="bulk_follow_up">
                      Follow-up
                    </label>
                    <input
                      type="date"
                      id="bulk_follow_up"
                      name="next_follow_up_on"
                      className="form-control form-control-sm"
                      value={bulkFollowUp}
                      onChange={(e) => setBulkFollowUp(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="erp-table-wrap mt-3 lead-bulk-grid">
                <table className="table erp-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: "36px" }}>#</th>
                      <th>First name</th>
                      <th>Last name</th>
                      <th>Organisation</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>City</th>
                      <th>Interested in</th>
                      <th>Expected value</th>
                      <th style={{ width: "36px" }}></th>
                    </tr>
                  </thead>
                  <tbody data-bulk-rows>
                    {bulkRows.map((row, idx) => (
                      <tr key={row.key} data-bulk-row>
                        <td className="text-muted" style={{ fontSize: "12px" }}>
                          {idx + 1}
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            aria-label="First name"
                            maxLength={100}
                            value={row.first_name}
                            onPaste={(e) => handleBulkPaste(idx, "first_name", e)}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, first_name: e.target.value } : r))
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            aria-label="Last name"
                            maxLength={100}
                            value={row.last_name}
                            onPaste={(e) => handleBulkPaste(idx, "last_name", e)}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, last_name: e.target.value } : r))
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            aria-label="Organisation"
                            maxLength={190}
                            value={row.organisation_name}
                            onPaste={(e) => handleBulkPaste(idx, "organisation_name", e)}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, organisation_name: e.target.value } : r
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="tel"
                            className="form-control form-control-sm"
                            aria-label="Mobile"
                            maxLength={40}
                            value={row.mobile}
                            onPaste={(e) => handleBulkPaste(idx, "mobile", e)}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, mobile: e.target.value } : r))
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            className="form-control form-control-sm"
                            aria-label="Email"
                            maxLength={150}
                            value={row.email}
                            onPaste={(e) => handleBulkPaste(idx, "email", e)}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, email: e.target.value } : r))
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            aria-label="City"
                            maxLength={100}
                            value={row.city}
                            onPaste={(e) => handleBulkPaste(idx, "city", e)}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, city: e.target.value } : r))
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            aria-label="Interested in"
                            maxLength={190}
                            value={row.interest}
                            onPaste={(e) => handleBulkPaste(idx, "interest", e)}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, interest: e.target.value } : r))
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            aria-label="Expected value"
                            min={0}
                            step="0.01"
                            value={row.expected_value}
                            onPaste={(e) => handleBulkPaste(idx, "expected_value", e)}
                            onChange={(e) =>
                              setBulkRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, expected_value: e.target.value } : r
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-erp-ghost text-danger"
                            title="Remove row"
                            onClick={() =>
                              setBulkRows((prev) =>
                                prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
                              )
                            }
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm"
                  onClick={() => addBulkRows(1)}
                >
                  <i className="fa-solid fa-plus me-1"></i>Add row
                </button>
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm"
                  onClick={() => addBulkRows(10)}
                >
                  <i className="fa-solid fa-plus me-1"></i>Add 10 rows
                </button>
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm"
                  onClick={() => {
                    const start = bulkKeyRef.current;
                    bulkKeyRef.current += 6;
                    setBulkRows(createEmptyBulkRows(5, start));
                  }}
                >
                  <i className="fa-solid fa-eraser me-1"></i>Clear
                </button>
                <span className="erp-help ms-auto mb-0">
                  <i className="fa-regular fa-clipboard me-1"></i>Tip: copy cells in Excel and paste
                  into any cell — rows are added automatically.
                </span>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <span className="me-auto text-muted" style={{ fontSize: "12.5px" }}>
                <strong data-bulk-count>{readyBulkRows.length}</strong> leads ready
              </span>
              <button
                type="button"
                className="btn btn-erp-ghost"
                onClick={() => setBulkOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" disabled={savingBulk}>
                <i className="fa-solid fa-layer-group me-2"></i>
                {savingBulk ? "Creating…" : "Create leads"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 6: #leadAssignBulkModal */}
      <div
        className={`modal fade${assignMode ? " show d-block" : ""}`}
        id="leadAssignBulkModal"
        tabIndex={-1}
        aria-hidden={!assignMode}
        aria-labelledby="leadAssignBulkTitle"
        style={assignMode ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <form
            className="modal-content erp-form"
            data-lead-assign-form
            noValidate
            style={{ border: "none", borderRadius: "14px" }}
            onSubmit={handleAssignSubmit}
          >
            <input type="hidden" name="mode" value={assignMode ?? "assign"} />

            <div className="modal-header border-0 px-4 pt-4 pb-2">
              <div>
                <h5 className="modal-title mb-1" id="leadAssignBulkTitle" style={{ fontSize: "16px", fontWeight: 600 }}>
                  <i className="fa-solid fa-user-tag me-2 text-primary"></i>
                  <span data-assign-title>
                    {assignMode === "unassign" ? "Unassign leads" : "Assign leads"}
                  </span>
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: "12.5px" }} data-assign-subtitle>
                  Converted leads in the selection are skipped. Each hand-over is recorded in the
                  lead&apos;s history.
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setAssignMode(null)}
              ></button>
            </div>

            <div className="modal-body px-4">
              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-assign-error
                hidden={!assignError}
              >
                {assignError}
              </div>

              {assignMode !== "unassign" && (
                <div data-assign-only>
                  <label className="form-label">
                    How to share them <span className="erp-required">*</span>
                  </label>
                  <div className="lead-dist-strategies mb-3">
                    <label className="lead-dist-strategy">
                      <input
                        type="radio"
                        name="strategy"
                        value="round_robin"
                        checked={assignStrategy === "round_robin"}
                        onChange={() => setAssignStrategy("round_robin")}
                      />
                      <span>
                        <strong>Round robin</strong>
                        <small>Equal turns, in order. Fair when the team starts level.</small>
                      </span>
                    </label>
                    <label className="lead-dist-strategy">
                      <input
                        type="radio"
                        name="strategy"
                        value="least_loaded"
                        checked={assignStrategy === "least_loaded"}
                        onChange={() => setAssignStrategy("least_loaded")}
                      />
                      <span>
                        <strong>Least loaded</strong>
                        <small>Whoever carries the fewest open leads right now.</small>
                      </span>
                    </label>
                    <label className="lead-dist-strategy">
                      <input
                        type="radio"
                        name="strategy"
                        value="specific_user"
                        checked={assignStrategy === "specific_user"}
                        onChange={() => setAssignStrategy("specific_user")}
                      />
                      <span>
                        <strong>Specific person</strong>
                        <small>Always the same person.</small>
                      </span>
                    </label>
                  </div>

                  <div className="erp-field">
                    <label className="form-label" htmlFor="assign_owner_ids">
                      People <span className="erp-required">*</span>
                    </label>
                    <select
                      id="assign_owner_ids"
                      name="owner_ids[]"
                      className="form-select"
                      multiple
                      value={assignOwnerIds.map(String)}
                      onChange={(e) => {
                        const vals = Array.from(e.target.selectedOptions).map((o) => Number(o.value));
                        setAssignOwnerIds(vals);
                      }}
                    >
                      {users.map((u) => (
                        <option key={u.id} value={String(u.id)}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <span className="erp-help">
                      Round robin follows the order you pick them in.
                    </span>
                  </div>

                  <div className="erp-switch-row">
                    <div>
                      <h6>Split by percentage</h6>
                      <p>
                        Overrides the strategy: give each person an exact share (must add up to
                        100%).
                      </p>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        role="switch"
                        name="use_shares"
                        value="1"
                        checked={assignUseShares}
                        onChange={(e) => setAssignUseShares(e.target.checked)}
                      />
                    </div>
                  </div>

                  {assignUseShares && (
                    <div className="erp-table-wrap mb-3">
                      <table className="table erp-table align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Person</th>
                            <th style={{ width: "140px" }}>Share %</th>
                            <th style={{ width: "110px" }} className="text-end">
                              Leads
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignOwnerIds.map((uid) => {
                            const u = users.find((x) => x.id === uid);
                            const pct = assignShares[uid] || 0;
                            return (
                              <tr key={uid}>
                                <td>{u?.name ?? `User #${uid}`}</td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    min={0}
                                    max={100}
                                    value={pct}
                                    onChange={(e) =>
                                      setAssignShares((prev) => ({
                                        ...prev,
                                        [uid]: Number(e.target.value) || 0,
                                      }))
                                    }
                                  />
                                </td>
                                <td className="text-end">
                                  {Math.round((selectedIds.length * pct) / 100)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th className="text-end">
                              <button
                                type="button"
                                className="btn btn-erp-ghost btn-sm me-2"
                                onClick={splitAssignEqually}
                              >
                                <i className="fa-solid fa-equals me-1"></i>Split equally
                              </button>
                              Total
                            </th>
                            <th>
                              <span
                                className={`erp-pill ${
                                  assignShareSum === 100 ? "is-available" : "is-neutral"
                                }`}
                              >
                                {assignShareSum}%
                              </span>
                            </th>
                            <th></th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="erp-field mb-0">
                <label className="form-label" htmlFor="assign_reason">
                  Reason
                </label>
                <input
                  type="text"
                  id="assign_reason"
                  name="reason"
                  className="form-control"
                  maxLength={255}
                  placeholder="e.g. Territory redrawn, covering for a leaver"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                onClick={() => setAssignMode(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" disabled={savingAssign}>
                <i className="fa-solid fa-user-tag me-2"></i>
                {savingAssign
                  ? "Saving…"
                  : assignMode === "unassign"
                  ? "Unassign"
                  : "Assign"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal 7: #leadDistributeModal */}
      <div
        className={`modal fade${distributeOpen ? " show d-block" : ""}`}
        id="leadDistributeModal"
        tabIndex={-1}
        aria-hidden={!distributeOpen}
        aria-labelledby="leadDistributeTitle"
        style={distributeOpen ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
          <form
            className="modal-content erp-form"
            data-lead-distribute-form
            noValidate
            style={{ border: "none", borderRadius: "14px" }}
            onSubmit={handleDistributeSubmit}
          >
            <div className="modal-header border-0 px-4 pt-4 pb-2">
              <div>
                <h5 className="modal-title mb-1" id="leadDistributeTitle" style={{ fontSize: "16px", fontWeight: 600 }}>
                  <i className="fa-solid fa-share-nodes me-2 text-primary"></i>Distribute unassigned
                  leads
                </h5>
                <p className="text-muted mb-0" style={{ fontSize: "12.5px" }}>
                  Oldest leads first. Give each person a share — the shares must add up to 100% —
                  and everybody gets a fair mix of old and new leads. Each person is notified once
                  with their count.
                </p>
              </div>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setDistributeOpen(false)}
              ></button>
            </div>

            <div className="modal-body px-4">
              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-distribute-error
                hidden={!distError}
              >
                {distError}
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label" htmlFor="distribute_branch">
                    Branch
                  </label>
                  <select
                    id="distribute_branch"
                    name="branch_id"
                    className="form-select"
                    value={distBranchId}
                    onChange={(e) => setDistBranchId(e.target.value)}
                  >
                    <option value="">All branches</option>
                    {branches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="distribute_project">
                    Interested in project
                  </label>
                  <select
                    id="distribute_project"
                    name="project_id"
                    className="form-select"
                    value={distProjectId}
                    onChange={(e) => setDistProjectId(e.target.value)}
                  >
                    <option value="">Any project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label" htmlFor="distribute_limit">
                    Limit
                  </label>
                  <input
                    type="number"
                    id="distribute_limit"
                    name="limit"
                    className="form-control"
                    min={1}
                    max={5000}
                    placeholder="All"
                    value={distLimit}
                    onChange={(e) => setDistLimit(e.target.value)}
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <div className="lead-dist-pool">
                    <strong data-distribute-available>{unassignedPool.length}</strong>
                    <small>waiting</small>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm"
                  onClick={splitDistEqually}
                >
                  <i className="fa-solid fa-equals me-1"></i>Split equally among everyone
                </button>
                <button
                  type="button"
                  className="btn btn-erp-ghost btn-sm"
                  onClick={() => setDistShares({})}
                >
                  <i className="fa-solid fa-eraser me-1"></i>Clear
                </button>
                <span className="ms-auto" style={{ fontSize: "12.5px" }}>
                  Total{" "}
                  <span
                    className={`erp-pill ${distShareSum === 100 ? "is-available" : "is-neutral"}`}
                  >
                    {distShareSum}%
                  </span>
                </span>
              </div>

              <div className="lead-dist-team" data-distribute-teams="">
                {users.length === 0 && (
                  <div className="erp-mf-loading">
                    <span className="spinner-border spinner-border-sm me-2" />
                    Loading teams…
                  </div>
                )}
                <div className="lead-dist-team-head">
                  Sales team <span className="ms-auto text-muted">{users.length} members</span>
                </div>
                <table className="table erp-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Salesperson</th>
                      <th style={{ width: "160px" }}>Share %</th>
                      <th style={{ width: "120px" }} className="text-end">
                        Will receive
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const pct = distShares[u.id] || 0;
                      const poolSize = distLimit
                        ? Math.min(Number(distLimit), unassignedPool.length)
                        : unassignedPool.length;
                      return (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              min={0}
                              max={100}
                              value={pct}
                              onChange={(e) =>
                                setDistShares((prev) => ({
                                  ...prev,
                                  [u.id]: Number(e.target.value) || 0,
                                }))
                              }
                            />
                          </td>
                          <td className="text-end">{Math.round((poolSize * pct) / 100)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <span className="me-auto text-muted" style={{ fontSize: "12.5px" }}>
                {unassignedPool.length} unassigned open leads available
              </span>
              <button
                type="button"
                className="btn btn-erp-ghost"
                onClick={() => setDistributeOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" disabled={savingDist}>
                <i className="fa-solid fa-share-nodes me-2"></i>
                {savingDist ? "Distributing…" : "Distribute"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. CrmLeadsBoard (/crm/leads/board)
// ============================================================================

export function CrmLeadsBoard({
  initialLeads,
  users = [],
  lostReasons = [],
  initialFilters = {},
}: {
  initialLeads: CrmLeadRow[];
  users?: CrmRefUser[];
  lostReasons?: CrmLostReasonRow[];
  initialFilters?: LeadFilterParams;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState<CrmLeadRow[]>(initialLeads);
  const [todayYmd, setTodayYmd] = useState("");
  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [sourceFilter, setSourceFilter] = useState(initialFilters.source ?? "");
  const [priorityFilter, setPriorityFilter] = useState(initialFilters.priority ?? "");
  const [ownerFilter, setOwnerFilter] = useState(initialFilters.owner_id ?? "");
  const [dueFilter, setDueFilter] = useState(initialFilters.due ?? "");

  const [draggingLeadId, setDraggingLeadId] = useState<number | null>(null);
  const [dropTargetCol, setDropTargetCol] = useState<string | null>(null);

  const [lostTarget, setLostTarget] = useState<CrmLeadRow | null>(null);
  const [lostReasonId, setLostReasonId] = useState("");
  const [lostNote, setLostNote] = useState("");
  const [lostError, setLostError] = useState("");
  const [savingLost, setSavingLost] = useState(false);

  const [reopenTarget, setReopenTarget] = useState<CrmLeadRow | null>(null);
  const [reopenTargetStage, setReopenTargetStage] = useState("contacted");
  const [reopenDate, setReopenDate] = useState("");
  const [reopenError, setReopenError] = useState("");
  const [savingReopen, setSavingReopen] = useState(false);

  useEffect(() => {
    setTodayYmd(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (q) {
        const hay = [getLeadDisplayName(l), l.code, l.email, l.mobile, l.interest]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (sourceFilter && normalizeSource(l.source) !== sourceFilter) return false;
      if (priorityFilter && (l.priority || "medium").toLowerCase() !== priorityFilter) return false;
      if (ownerFilter && String(l.ownerId ?? "") !== ownerFilter) return false;
      if (dueFilter === "overdue") {
        const st = getStageMeta(l.status);
        if (!st.open || !l.nextFollowUpOn) return false;
        if (todayYmd && l.nextFollowUpOn > todayYmd) return false;
      }
      return true;
    });
  }, [leads, search, sourceFilter, priorityFilter, ownerFilter, dueFilter, todayYmd]);

  function applyBoardFilters(next: LeadFilterParams) {
    router.push(`/crm/leads/board${buildQueryString(next as Record<string, string | undefined>)}`);
  }

  async function handleDropOnStage(targetStageKey: string) {
    setDropTargetCol(null);
    if (!draggingLeadId) return;
    const lead = leads.find((l) => l.id === draggingLeadId);
    setDraggingLeadId(null);
    if (!lead) return;
    const currentStage = getStageMeta(lead.status);
    if (currentStage.key === targetStageKey) return;

    if (targetStageKey === "unqualified") {
      setLostTarget(lead);
      setLostReasonId(lead.lostReasonId ? String(lead.lostReasonId) : "");
      setLostNote(lead.lostNote ?? "");
      setLostError("");
      return;
    }

    if (currentStage.lost && getStageMeta(targetStageKey).open) {
      setReopenTarget(lead);
      setReopenTargetStage(targetStageKey);
      setReopenDate(lead.nextFollowUpOn ?? "");
      setReopenError("");
      return;
    }

    const prevStatus = lead.status;
    setLeads((prev) =>
      prev.map((item) => (item.id === lead.id ? { ...item, status: targetStageKey } : item))
    );
    const res = await fetch(`/api/crm/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: targetStageKey }),
    });
    if (!res.ok) {
      setLeads((prev) =>
        prev.map((item) => (item.id === lead.id ? { ...item, status: prevStatus } : item))
      );
      return;
    }

    if (targetStageKey === "converted") {
      await fetch("/api/crm/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: lead.organisationName && !lead.firstName ? "company" : "individual",
          first_name: lead.firstName,
          last_name: lead.lastName,
          organisation_name: lead.organisationName,
          email: lead.email,
          phone: lead.phone,
          mobile: lead.mobile,
          city: lead.city,
          country: lead.country || "Bangladesh",
          source: lead.source,
          branch_id: lead.branchId ?? null,
          owner_id: lead.ownerId ?? null,
          notes: lead.notes,
        }),
      });
    }
    router.refresh();
  }

  async function handleLostSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lostTarget) return;
    const chosen = lostReasons.find((r) => String(r.id) === lostReasonId);
    if (!chosen) {
      setLostError("Please select a loss reason.");
      return;
    }
    if (resolveLostReasonDisplay(chosen).requiresNote && !lostNote.trim()) {
      setLostError("A note is required for the selected loss reason.");
      return;
    }
    setSavingLost(true);
    try {
      const res = await fetch(`/api/crm/leads/${lostTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lost_reason_id: Number(lostReasonId),
          lost_note: lostNote.trim() || null,
        }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((item) =>
            item.id === lostTarget.id
              ? { ...item, status: "unqualified", lostReasonId: Number(lostReasonId), lostNote: lostNote.trim() || null }
              : item
          )
        );
        setLostTarget(null);
        router.refresh();
      }
    } finally {
      setSavingLost(false);
    }
  }

  async function handleReopenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reopenTarget) return;
    setSavingReopen(true);
    try {
      const res = await fetch(`/api/crm/leads/${reopenTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reopenTargetStage,
          next_follow_up_on: reopenDate || null,
          lost_note: null,
        }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((item) =>
            item.id === reopenTarget.id
              ? { ...item, status: reopenTargetStage, nextFollowUpOn: reopenDate || null, lostReasonId: null, lostNote: null }
              : item
          )
        );
        setReopenTarget(null);
        router.refresh();
      }
    } finally {
      setSavingReopen(false);
    }
  }

  const chosenLostReason = lostReasons.find((r) => String(r.id) === lostReasonId);
  const chosenLostDisplay = chosenLostReason ? resolveLostReasonDisplay(chosenLostReason) : null;

  return (
    <div className="container ">
      <CrmSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-diagram-project"></i>
          </div>
          <div>
            <h1>Lead Pipeline</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/leads">Leads</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Board
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/leads" className="btn btn-erp-ghost">
            <i className="fa-solid fa-table-list me-2"></i>List View
          </Link>
          <Link href="/crm/leads/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Lead
          </Link>
        </div>
      </div>

      <div className="erp-card mb-3">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/crm/leads/board"
            onSubmit={(e) => {
              e.preventDefault();
              applyBoardFilters({
                search,
                source: sourceFilter,
                priority: priorityFilter,
                owner_id: ownerFilter,
                due: dueFilter,
              });
            }}
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this board…"
                aria-label="Search leads"
              />
            </div>

            <select
              name="source"
              className="form-select erp-select"
              aria-label="Source filter"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                applyBoardFilters({
                  search,
                  source: e.target.value,
                  priority: priorityFilter,
                  owner_id: ownerFilter,
                  due: dueFilter,
                });
              }}
            >
              <option value="">All sources</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              name="priority"
              className="form-select erp-select"
              aria-label="Priority filter"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                applyBoardFilters({
                  search,
                  source: sourceFilter,
                  priority: e.target.value,
                  owner_id: ownerFilter,
                  due: dueFilter,
                });
              }}
            >
              <option value="">All priorities</option>
              {LEAD_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <select
              name="owner_id"
              className="form-select erp-select"
              aria-label="Owner filter"
              value={ownerFilter}
              onChange={(e) => {
                setOwnerFilter(e.target.value);
                applyBoardFilters({
                  search,
                  source: sourceFilter,
                  priority: priorityFilter,
                  owner_id: e.target.value,
                  due: dueFilter,
                });
              }}
            >
              <option value="">All salespeople</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              name="due"
              className="form-select erp-select"
              aria-label="Due filter"
              value={dueFilter}
              onChange={(e) => {
                setDueFilter(e.target.value);
                applyBoardFilters({
                  search,
                  source: sourceFilter,
                  priority: priorityFilter,
                  owner_id: ownerFilter,
                  due: e.target.value,
                });
              }}
            >
              <option value="">All leads</option>
              <option value="overdue">Follow-up due</option>
            </select>

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            <i className="fa-solid fa-arrows-up-down-left-right me-1"></i>Drag a card to change its
            stage
          </span>
        </div>
      </div>

      <div data-lead-board-wrap>
        <div className="erp-kanban" data-lead-board data-can-update="1">
          {LEAD_STAGES.map((st) => {
            const colLeads = filtered.filter((l) => normalizeStatus(l.status) === st.key);
            // Match live board behavior: converted column shows total won count in header, cards visible if converted or open
            return (
              <div
                key={st.key}
                className={`erp-kanban-col${dropTargetCol === st.key ? " is-target" : ""}`}
                data-status-col
                data-status={st.key}
                data-open={st.open ? "1" : "0"}
                data-lost={st.lost ? "1" : "0"}
                data-converted={st.converted ? "1" : "0"}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dropTargetCol !== st.key) setDropTargetCol(st.key);
                }}
                onDragLeave={() => {
                  if (dropTargetCol === st.key) setDropTargetCol(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnStage(st.key);
                }}
              >
                <div className={`erp-kanban-col-head ${st.kanbanHead}`}>
                  <span className="erp-kanban-col-title">
                    <i className={`${st.icon} me-1`}></i>
                    {st.label} <small className="opacity-75">{st.pct}%</small>
                  </span>
                  <span className="erp-kanban-col-count" data-col-count>
                    {colLeads.length}
                  </span>
                </div>

                <div className="erp-kanban-col-body" data-status-drop>
                  {colLeads.length === 0 ? (
                    <div className="erp-kanban-empty" data-empty>
                      {st.converted ? "Drop here to win — a customer is created" : "No leads here"}
                    </div>
                  ) : (
                    colLeads.map((lead) => {
                      const displayName = getLeadDisplayName(lead);
                      const prio = getPriorityMeta(lead.priority);
                      const band = getScoreBand(lead.score);
                      const src = getSourceMeta(lead.source);
                      const ownerUser = lead.ownerId
                        ? users.find((u) => u.id === lead.ownerId)
                        : null;
                      const ownerName = ownerUser?.name ?? (lead.ownerId ? lead.ownerName : null);

                      return (
                        <div
                          key={lead.id}
                          className={`erp-kcard${draggingLeadId === lead.id ? " is-dragging" : ""}`}
                          data-lead-card
                          data-lead-id={lead.id}
                          data-status={st.key}
                          data-lead-name={displayName}
                          draggable={!st.converted}
                          onDragStart={() => setDraggingLeadId(lead.id)}
                          onDragEnd={() => {
                            setDraggingLeadId(null);
                            setDropTargetCol(null);
                          }}
                        >
                          <div className="erp-kcard-top">
                            <div className="erp-kcard-tags">
                              <span className={`erp-pill ${prio.pill}`} title="Priority">
                                <i className={`${prio.icon} me-1`}></i>
                                {prio.label}
                              </span>
                              <span className={`erp-pill ${band.pill}`} title={band.detailLabel}>
                                {lead.score}
                              </span>
                            </div>
                            <Link
                              href={`/crm/leads/${lead.id}`}
                              className="erp-kcard-view"
                              title="Open lead"
                              draggable={false}
                            >
                              <i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </Link>
                          </div>

                          <Link
                            href={`/crm/leads/${lead.id}`}
                            className="erp-kcard-title"
                            draggable={false}
                          >
                            {displayName}
                          </Link>

                          {lead.interest && <div className="erp-kcard-note">{lead.interest}</div>}

                          <div className="erp-kcard-meta mt-1">
                            <span className="erp-cell-strong">{lead.code}</span>
                            <span title="Source">
                              <i className={src.icon}></i> {src.label}
                            </span>
                          </div>

                          <div className="erp-kcard-foot">
                            <div className="erp-kcard-meta">
                              {lead.nextFollowUpOn ? (
                                <span title="Follow-up">
                                  <i className="fa-solid fa-bell me-1"></i>
                                  {formatDate(lead.nextFollowUpOn)}
                                </span>
                              ) : (
                                <span className="text-muted">
                                  <i className="fa-regular fa-clock me-1"></i>Not scheduled
                                </span>
                              )}
                              {lead.expectedValue > 0 && (
                                <span className="erp-cell-strong" title="Expected value">
                                  {Number(lead.expectedValue).toLocaleString()}
                                </span>
                              )}
                            </div>

                            <div className="erp-kcard-people">
                              {ownerName ? (
                                <span className="erp-kavatar" title={ownerName}>
                                  {getInitials(ownerName)}
                                </span>
                              ) : (
                                <span className="erp-kavatar is-empty" title="Unassigned">
                                  <i className="fa-solid fa-user"></i>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* #leadLostModal */}
      <div
        className={`modal fade${lostTarget ? " show d-block" : ""}`}
        id="leadLostModal"
        tabIndex={-1}
        aria-hidden={!lostTarget}
        style={lostTarget ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            className="modal-content erp-form"
            style={{ border: "none", borderRadius: "14px" }}
            data-lost-form
            onSubmit={handleLostSubmit}
          >
            <div className="modal-body p-4">
              <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                Mark lost —{" "}
                <span data-lost-name>{lostTarget ? getLeadDisplayName(lostTarget) : "this lead"}</span>
              </h5>
              <p className="text-muted" style={{ fontSize: "13px" }}>
                Closes the lead without converting it and clears the follow-up so it leaves the
                queue. The reason is what the loss report is built from, so pick the closest one.
              </p>
              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-lost-errors
                hidden={!lostError}
              >
                <span data-lost-errors-text>{lostError}</span>
              </div>
              <div className="erp-field">
                <label htmlFor="lost_reason_id" className="form-label">
                  Reason <span className="erp-required">*</span>
                </label>
                <select
                  id="lost_reason_id"
                  name="lost_reason_id"
                  className="form-select"
                  value={lostReasonId}
                  onChange={(e) => setLostReasonId(e.target.value)}
                  required
                >
                  <option value="">Choose a reason</option>
                  {lostReasons
                    .filter((r) => r.isActive)
                    .map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {resolveLostReasonDisplay(r).cleanName}
                      </option>
                    ))}
                </select>
                {chosenLostDisplay?.cleanDesc && (
                  <span className="erp-help" data-lost-hint>
                    {chosenLostDisplay.cleanDesc}
                  </span>
                )}
              </div>
              <div className="erp-field mb-0">
                <label htmlFor="lost_note" className="form-label">
                  Note{" "}
                  <span
                    className="erp-required"
                    data-lost-note-required
                    hidden={!chosenLostDisplay?.requiresNote}
                  >
                    *
                  </span>
                </label>
                <textarea
                  id="lost_note"
                  name="lost_note"
                  rows={3}
                  className="form-control"
                  maxLength={500}
                  placeholder="What actually happened, in one or two lines…"
                  value={lostNote}
                  onChange={(e) => setLostNote(e.target.value)}
                ></textarea>
                <span className="erp-help">Optional, unless the reason asks for it.</span>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                onClick={() => setLostTarget(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-erp"
                disabled={savingLost}
                style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
              >
                <i className="fa-solid fa-circle-minus me-2"></i>
                {savingLost ? "Saving…" : "Mark Lost"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* #leadReopenModal */}
      <div
        className={`modal fade${reopenTarget ? " show d-block" : ""}`}
        id="leadReopenModal"
        tabIndex={-1}
        aria-hidden={!reopenTarget}
        style={reopenTarget ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            className="modal-content erp-form"
            style={{ border: "none", borderRadius: "14px" }}
            data-reopen-form
            onSubmit={handleReopenSubmit}
          >
            <div className="modal-body p-4">
              <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                Reopen —{" "}
                <span data-reopen-name>
                  {reopenTarget ? getLeadDisplayName(reopenTarget) : "this lead"}
                </span>
              </h5>
              <p className="text-muted" style={{ fontSize: "13px" }}>
                Puts the lead back in play and clears{" "}
                <strong data-reopen-reason>the recorded loss</strong>, so it stops counting against
                that reason. Set the next follow-up while you are here.
              </p>
              <div
                className="alert alert-danger py-2 px-3 mb-3"
                role="alert"
                style={{ borderRadius: "9px", fontSize: "12.5px" }}
                data-reopen-errors
                hidden={!reopenError}
              >
                <span data-reopen-errors-text>{reopenError}</span>
              </div>
              <div className="erp-field mb-0">
                <label htmlFor="reopen_next_follow_up_on" className="form-label">
                  Next follow-up
                </label>
                <input
                  type="date"
                  id="reopen_next_follow_up_on"
                  name="next_follow_up_on"
                  className="form-control"
                  value={reopenDate}
                  onChange={(e) => setReopenDate(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                onClick={() => setReopenTarget(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" disabled={savingReopen}>
                <i className="fa-solid fa-rotate-left me-2"></i>
                {savingReopen ? "Saving…" : "Reopen Lead"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. CrmLeadForm (/crm/leads/create and /crm/leads/[id]/edit)
// ============================================================================

export function CrmLeadForm({
  mode,
  initialLead = null,
  projects = [],
  branches = [],
  users = [],
  units = [],
}: {
  mode: "create" | "edit";
  initialLead?: CrmLeadRow | null;
  projects?: CrmRefProject[];
  branches?: CrmRefBranch[];
  users?: CrmRefUser[];
  units?: CrmRefUnit[];
}) {
  const router = useRouter();
  const isEdit = mode === "edit" && Boolean(initialLead);

  const [firstName, setFirstName] = useState(initialLead?.firstName ?? "");
  const [lastName, setLastName] = useState(initialLead?.lastName ?? "");
  const [organisationName, setOrganisationName] = useState(initialLead?.organisationName ?? "");
  const [email, setEmail] = useState(initialLead?.email ?? "");
  const [phone, setPhone] = useState(initialLead?.phone ?? "");
  const [mobile, setMobile] = useState(initialLead?.mobile ?? "");
  const [city, setCity] = useState(initialLead?.city ?? "");
  const [country, setCountry] = useState(normalizeCountryCode(initialLead?.country));
  const [source, setSource] = useState(
    initialLead ? normalizeSource(initialLead.source) : "manual"
  );
  const [sourceDetail, setSourceDetail] = useState(initialLead?.sourceDetail ?? "");
  const [status, setStatus] = useState(
    initialLead ? normalizeStatus(initialLead.status) : "new"
  );
  const [priority, setPriority] = useState(initialLead?.priority ?? "medium");
  const [score, setScore] = useState(String(initialLead?.score ?? 0));
  const [interest, setInterest] = useState(initialLead?.interest ?? "");
  const [expectedValue, setExpectedValue] = useState(
    initialLead && initialLead.expectedValue ? String(initialLead.expectedValue) : ""
  );
  const [ownerId, setOwnerId] = useState(
    initialLead?.ownerId ? String(initialLead.ownerId) : ""
  );
  const [nextFollowUpOn, setNextFollowUpOn] = useState(initialLead?.nextFollowUpOn ?? "");
  const [branchId, setBranchId] = useState(
    initialLead?.branchId ? String(initialLead.branchId) : ""
  );
  const [projectIds, setProjectIds] = useState<string[]>(
    parseNumberArray(initialLead?.projectIdsJson).map(String)
  );
  const [unitIds, setUnitIds] = useState<string[]>(
    parseNumberArray(initialLead?.unitIdsJson).map(String)
  );
  const [notes, setNotes] = useState(initialLead?.notes ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const titleName = initialLead ? getLeadDisplayName(initialLead) : "New Lead";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim() && !organisationName.trim()) {
      setError("A person, an organisation, or both. At least one name is needed.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        organisation_name: organisationName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        mobile: mobile.trim() || null,
        city: city.trim() || null,
        country: country || "Bangladesh",
        source,
        source_detail: sourceDetail.trim() || null,
        status,
        priority,
        score: Number(score) || 0,
        interest: interest.trim() || null,
        expected_value: expectedValue ? Number(expectedValue) : 0,
        owner_id: ownerId ? Number(ownerId) : null,
        next_follow_up_on: nextFollowUpOn || null,
        branch_id: branchId ? Number(branchId) : null,
        project_ids: projectIds.map(Number),
        unit_ids: unitIds.map(Number),
        notes: notes.trim() || null,
      };

      const url = isEdit ? `/api/crm/leads/${initialLead!.id}` : "/api/crm/leads";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to save lead.");
        return;
      }
      const data = await res.json();
      const targetId = isEdit ? initialLead!.id : data?.row?.id;
      router.push(targetId ? `/crm/leads/${targetId}` : "/crm/leads");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <CrmSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className={isEdit ? "fa-solid fa-pen-to-square" : "fa-solid fa-filter-circle-dollar"}></i>
          </div>
          <div>
            <h1>{isEdit ? titleName : "New Lead"}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/leads">Leads</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {isEdit ? "Edit" : "New"}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/leads" className="btn btn-erp-ghost">
            <i className={isEdit ? "fa-solid fa-list me-2" : "fa-solid fa-arrow-left me-2"}></i>
            {isEdit ? "All Leads" : "Back to list"}
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-3" role="alert" style={{ borderRadius: "9px", fontSize: "13px" }}>
          <i className="fa-solid fa-circle-exclamation me-2"></i>
          {error}
        </div>
      )}

      <form className="erp-form" data-erp-org-form noValidate onSubmit={handleSubmit}>
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-user-plus"></i>
            </div>
            <div>
              <h2>Who</h2>
              <p>A person, an organisation, or both. At least one name is needed.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-context-banner">
              <span className="erp-context-banner-icon">
                <i className="fa-solid fa-building-columns"></i>
              </span>
              <div className="erp-context-banner-body">
                <strong>E-Hishabi ERP</strong>
                <span>
                  {isEdit
                    ? "This lead belongs to HQ and stays with it."
                    : "Filed under HQ — switch companies from the top bar to change this."}
                </span>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="first_name" className="form-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className="form-control "
                    maxLength={100}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="last_name" className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className="form-control "
                    maxLength={100}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="organisation_name" className="form-label">
                    Organisation
                  </label>
                  <input
                    type="text"
                    id="organisation_name"
                    name="organisation_name"
                    className="form-control "
                    maxLength={190}
                    value={organisationName}
                    onChange={(e) => setOrganisationName(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fa-solid fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control "
                      maxLength={150}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="phone" className="form-label">
                    Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    className="form-control "
                    maxLength={40}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="mobile" className="form-label">
                    Mobile
                  </label>
                  <input
                    type="text"
                    id="mobile"
                    name="mobile"
                    className="form-control "
                    maxLength={40}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field mb-md-0">
                  <label htmlFor="city" className="form-label">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className="form-control "
                    maxLength={100}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field mb-md-0">
                  <label htmlFor="country" className="form-label">
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    className="form-select "
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="">Not set</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-filter"></i>
            </div>
            <div>
              <h2>Qualification</h2>
              <p>Where the lead came from and what it is worth.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="source" className="form-label">
                    Source <span className="erp-required">*</span>
                  </label>
                  <select
                    id="source"
                    name="source"
                    className="form-select "
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-8">
                <div className="erp-field">
                  <label htmlFor="source_detail" className="form-label">
                    Source Detail
                  </label>
                  <input
                    type="text"
                    id="source_detail"
                    name="source_detail"
                    className="form-control "
                    maxLength={190}
                    placeholder="Campaign, form name or referrer"
                    value={sourceDetail}
                    onChange={(e) => setSourceDetail(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="status" className="form-label">
                    Status <span className="erp-required">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="form-select "
                    required
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {LEAD_STAGES.filter((s) => s.key !== "converted" || status === "converted").map(
                      (s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="priority" className="form-label">
                    Priority <span className="erp-required">*</span>
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    className="form-select "
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {LEAD_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="score" className="form-label">
                    Score
                  </label>
                  <input
                    type="number"
                    id="score"
                    name="score"
                    min={0}
                    max={100}
                    step={1}
                    className="form-control "
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                  />
                  <span className="erp-help">0–100. Drives the cold / warm / hot band.</span>
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="interest" className="form-label">
                    Interested In
                  </label>
                  <input
                    type="text"
                    id="interest"
                    name="interest"
                    className="form-control "
                    maxLength={190}
                    placeholder="3-bed apartment, Gulshan"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="expected_value" className="form-label">
                    Expected Value
                  </label>
                  <input
                    type="number"
                    id="expected_value"
                    name="expected_value"
                    min={0}
                    step="0.01"
                    className="form-control "
                    value={expectedValue}
                    onChange={(e) => setExpectedValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="owner_id" className="form-label">
                    Assigned To
                  </label>
                  <select
                    id="owner_id"
                    name="owner_id"
                    className="form-select "
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="next_follow_up_on" className="form-label">
                    Next Follow-up
                  </label>
                  <input
                    type="date"
                    id="next_follow_up_on"
                    name="next_follow_up_on"
                    className="form-control "
                    value={nextFollowUpOn}
                    onChange={(e) => setNextFollowUpOn(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="branch_id" className="form-label">
                    Branch
                  </label>
                  <select
                    id="branch_id"
                    name="branch_id"
                    className="form-select "
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    <option value="">Company-wide</option>
                    {branches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card" data-lead-interest>
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-building"></i>
            </div>
            <div>
              <h2>Interested In</h2>
              <p>
                Projects and specific units this lead is considering. Units narrow to the projects
                picked.
              </p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-5">
                <div className="erp-field mb-md-0">
                  <label htmlFor="project_ids" className="form-label">
                    Projects
                  </label>
                  <select
                    id="project_ids"
                    name="project_ids[]"
                    multiple
                    className="form-select "
                    data-interest-projects
                    value={projectIds}
                    onChange={(e) =>
                      setProjectIds(Array.from(e.target.selectedOptions).map((o) => o.value))
                    }
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={String(p.id)} data-meta={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-7">
                <div className="erp-field mb-0">
                  <label htmlFor="unit_ids" className="form-label">
                    Units
                  </label>
                  <select
                    id="unit_ids"
                    name="unit_ids[]"
                    multiple
                    className="form-select "
                    data-interest-units
                    value={unitIds}
                    onChange={(e) =>
                      setUnitIds(Array.from(e.target.selectedOptions).map((o) => o.value))
                    }
                  >
                    {units.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.unitNumber} ({u.unitType})
                      </option>
                    ))}
                  </select>
                  {units.length === 0 && (
                    <span className="erp-help">
                      No units are set up for this company&apos;s projects yet.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-tags"></i>
            </div>
            <div>
              <h2>Tags &amp; Notes</h2>
              <p>Tags carry over to the customer if this lead converts.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-field mb-0">
              <label className="form-label">Tags</label>
              <p className="text-muted mb-0" style={{ fontSize: "12.5px" }}>
                No tags defined for this company yet. Tags are used for segmentation &mdash; high
                value, VIP, apartment buyer, and so on.
              </p>
            </div>

            <div className="erp-field mt-3 mb-0">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="form-control "
                maxLength={5000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required.
          </span>
          <div className="erp-form-bar-actions">
            <Link
              href={isEdit ? `/crm/leads/${initialLead!.id}` : "/crm/leads"}
              className="btn btn-erp-ghost"
            >
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" data-submit-button disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Lead"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// 4. CrmLeadDetail (/crm/leads/[id])
// ============================================================================

interface CommEntry {
  id: number;
  method: string;
  direction: string;
  occurredAt: string;
  durationMinutes: number | null;
  subject: string;
  heldBy: string;
  notes: string;
}

export function CrmLeadDetail({
  initialLead,
  initialFollowups = [],
  projects = [],
  branches = [],
  users = [],
  lostReasons = [],
}: {
  initialLead: CrmLeadRow;
  initialFollowups?: CrmFollowUpRow[];
  projects?: CrmRefProject[];
  branches?: CrmRefBranch[];
  users?: CrmRefUser[];
  lostReasons?: CrmLostReasonRow[];
}) {
  const router = useRouter();
  const [lead, setLead] = useState<CrmLeadRow>(initialLead);
  const [moreOpen, setMoreOpen] = useState(false);
  const [stageBusy, setStageBusy] = useState(false);

  const [notesValue, setNotesValue] = useState(initialLead.notes ?? "");
  const [savedNotesValue, setSavedNotesValue] = useState(initialLead.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  const [stageHistory, setStageHistory] = useState<
    Array<{ stageKey: string; fromLabel?: string; at: string; by: string }>
  >(() => [
    {
      stageKey: normalizeStatus(initialLead.status),
      at: formatDate(initialLead.createdAt),
      by: "System Administrator",
    },
  ]);

  const [commEntries, setCommEntries] = useState<CommEntry[]>(() => {
    const leadName = getLeadDisplayName(initialLead).toLowerCase();
    return initialFollowups
      .filter((f) => {
        const c = (f.concerns || "").toLowerCase();
        return c.includes(leadName) || c.includes(initialLead.code.toLowerCase());
      })
      .map((f) => ({
        id: f.id,
        method: f.subject.split("—")[0]?.trim() || "Follow-up",
        direction: "outbound",
        occurredAt: `${f.scheduledDate}${f.scheduledTime ? ` ${f.scheduledTime}` : ""}`,
        durationMinutes: f.durationMinutes || null,
        subject: f.subject,
        heldBy: f.assignedTo || "System Administrator",
        notes: f.description || "",
      }));
  });

  // Modals
  const [commOpen, setCommOpen] = useState(false);
  const [commMethod, setCommMethod] = useState("phone_call");
  const [commDirection, setCommDirection] = useState("outbound");
  const [commOccurredAt, setCommOccurredAt] = useState("");
  const [commDuration, setCommDuration] = useState("");
  const [commSubject, setCommSubject] = useState("");
  const [commHeldBy, setCommHeldBy] = useState("");
  const [commNotes, setCommNotes] = useState("");
  const [savingComm, setSavingComm] = useState(false);

  const [logContactOpen, setLogContactOpen] = useState(false);
  const [logNextDate, setLogNextDate] = useState(initialLead.nextFollowUpOn ?? "");
  const [savingLogContact, setSavingLogContact] = useState(false);

  const [convertOpen, setConvertOpen] = useState(false);
  const [convertKind, setConvertKind] = useState<"individual" | "company">("individual");
  const [savingConvert, setSavingConvert] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [lostOpen, setLostOpen] = useState(false);
  const [lostReasonId, setLostReasonId] = useState(
    initialLead.lostReasonId ? String(initialLead.lostReasonId) : ""
  );
  const [lostNote, setLostNote] = useState(initialLead.lostNote ?? "");
  const [lostError, setLostError] = useState("");
  const [savingLost, setSavingLost] = useState(false);

  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenDate, setReopenDate] = useState(initialLead.nextFollowUpOn ?? "");
  const [reopenError, setReopenError] = useState("");
  const [savingReopen, setSavingReopen] = useState(false);

  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignOwnerId, setReassignOwnerId] = useState(
    initialLead.ownerId ? String(initialLead.ownerId) : ""
  );
  const [reassignReason, setReassignReason] = useState("");
  const [reassignError, setReassignError] = useState("");
  const [savingReassign, setSavingReassign] = useState(false);

  useEffect(() => {
    setCommOccurredAt(new Date().toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".dropdown")) setMoreOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const displayName = getLeadDisplayName(lead);
  const initials = getInitials(displayName);
  const st = getStageMeta(lead.status);
  const nextSt = getNextOpenStage(lead.status);
  const prio = getPriorityMeta(lead.priority);
  const src = getSourceMeta(lead.source);
  const band = getScoreBand(lead.score);
  const isLost = st.lost;
  const isConverted = st.converted;

  const ownerDisplay = useMemo(() => {
    if (lead.ownerId) {
      const found = users.find((u) => u.id === lead.ownerId);
      if (found) return found.name;
    }
    return lead.ownerId ? lead.ownerName : null;
  }, [lead.ownerId, lead.ownerName, users]);

  const branchDisplay = useMemo(() => {
    if (!lead.branchId) return null;
    return branches.find((b) => b.id === lead.branchId)?.name ?? null;
  }, [lead.branchId, branches]);

  const interestedProjects = useMemo(() => {
    const ids = parseNumberArray(lead.projectIdsJson);
    return ids
      .map((id) => projects.find((p) => p.id === id))
      .filter((p): p is CrmRefProject => Boolean(p));
  }, [lead.projectIdsJson, projects]);

  const lostReasonObj = lead.lostReasonId
    ? lostReasons.find((r) => r.id === lead.lostReasonId)
    : null;
  const lostReasonLabel = lostReasonObj ? resolveLostReasonDisplay(lostReasonObj).cleanName : null;

  const currentStepperIdx = PIPELINE_STEPPER_STAGES.findIndex((x) => x.key === st.key);

  async function handleStageChange(nextKey: string) {
    if (nextKey === st.key) return;
    if (nextKey === "unqualified") {
      setLostError("");
      setLostOpen(true);
      return;
    }
    if (isLost && getStageMeta(nextKey).open) {
      setReopenError("");
      setReopenOpen(true);
      return;
    }
    setStageBusy(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextKey }),
      });
      if (res.ok) {
        const prevLabel = st.label;
        setLead((prev) => ({ ...prev, status: nextKey }));
        setStageHistory((prev) => [
          {
            stageKey: nextKey,
            fromLabel: prevLabel,
            at: "Just now",
            by: "System Administrator",
          },
          ...prev,
        ]);
        router.refresh();
      }
    } finally {
      setStageBusy(false);
    }
  }

  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue || null }),
      });
      if (res.ok) {
        setSavedNotesValue(notesValue);
        setLead((prev) => ({ ...prev, notes: notesValue || null }));
        router.refresh();
      }
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleCommSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commSubject.trim()) return;
    setSavingComm(true);
    try {
      const methodLabel = COMM_METHODS.find((m) => m.value === commMethod)?.label || commMethod;
      const heldByUser = commHeldBy ? users.find((u) => String(u.id) === commHeldBy) : null;
      const schedDate = (commOccurredAt || new Date().toISOString()).slice(0, 10);
      const schedTime = commOccurredAt ? commOccurredAt.slice(11, 16) : null;
      const res = await fetch("/api/crm/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `${methodLabel} — ${commSubject.trim()}`,
          description: commNotes.trim() || null,
          scheduled_date: schedDate,
          scheduled_time: schedTime,
          duration_minutes: commDuration ? Number(commDuration) : 15,
          assigned_to: heldByUser?.name || undefined,
          concerns: `Lead: ${displayName} (${lead.code})`,
          status: "completed",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCommEntries((prev) => [
          {
            id: data?.row?.id ?? Date.now(),
            method: methodLabel,
            direction: commDirection,
            occurredAt: commOccurredAt.replace("T", " "),
            durationMinutes: commDuration ? Number(commDuration) : null,
            subject: commSubject.trim(),
            heldBy: heldByUser?.name || "System Administrator",
            notes: commNotes.trim(),
          },
          ...prev,
        ]);
        setCommSubject("");
        setCommNotes("");
        setCommDuration("");
        setCommOpen(false);
        router.refresh();
      }
    } finally {
      setSavingComm(false);
    }
  }

  async function handleLogContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingLogContact(true);
    try {
      const nextStatus = st.key === "new" ? "contacted" : lead.status;
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          next_follow_up_on: logNextDate || null,
        }),
      });
      if (res.ok) {
        setLead((prev) => ({
          ...prev,
          status: nextStatus,
          nextFollowUpOn: logNextDate || null,
        }));
        setLogContactOpen(false);
        router.refresh();
      }
    } finally {
      setSavingLogContact(false);
    }
  }

  async function handleConvertSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingConvert(true);
    try {
      const custRes = await fetch("/api/crm/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: convertKind,
          first_name: lead.firstName,
          last_name: lead.lastName,
          organisation_name: lead.organisationName,
          email: lead.email,
          phone: lead.phone,
          mobile: lead.mobile,
          city: lead.city,
          country: lead.country || "Bangladesh",
          source: lead.source,
          branch_id: lead.branchId ?? null,
          owner_id: lead.ownerId ?? null,
          notes: lead.notes,
        }),
      });
      const custData = custRes.ok ? await custRes.json() : null;

      await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "converted" }),
      });

      setLead((prev) => ({ ...prev, status: "converted" }));
      setConvertOpen(false);
      const newCustomerId = custData?.row?.id;
      router.push(newCustomerId ? `/crm/customers/${newCustomerId}` : "/crm/customers");
      router.refresh();
    } finally {
      setSavingConvert(false);
    }
  }

  async function handleDeleteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/crm/leads");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleLostSubmit(e: React.FormEvent) {
    e.preventDefault();
    const chosen = lostReasons.find((r) => String(r.id) === lostReasonId);
    if (!chosen) {
      setLostError("Please select a loss reason.");
      return;
    }
    if (resolveLostReasonDisplay(chosen).requiresNote && !lostNote.trim()) {
      setLostError("A note is required for the selected loss reason.");
      return;
    }
    setSavingLost(true);
    setLostError("");
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lost_reason_id: Number(lostReasonId),
          lost_note: lostNote.trim() || null,
          next_follow_up_on: null,
        }),
      });
      if (res.ok) {
        setLead((prev) => ({
          ...prev,
          status: "unqualified",
          lostReasonId: Number(lostReasonId),
          lostNote: lostNote.trim() || null,
          nextFollowUpOn: null,
        }));
        setLostOpen(false);
        router.refresh();
      }
    } finally {
      setSavingLost(false);
    }
  }

  async function handleReopenSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingReopen(true);
    setReopenError("");
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "contacted",
          next_follow_up_on: reopenDate || null,
          lost_note: null,
        }),
      });
      if (res.ok) {
        setLead((prev) => ({
          ...prev,
          status: "contacted",
          nextFollowUpOn: reopenDate || null,
          lostReasonId: null,
          lostNote: null,
        }));
        setReopenOpen(false);
        router.refresh();
      }
    } finally {
      setSavingReopen(false);
    }
  }

  async function handleReassignSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavingReassign(true);
    setReassignError("");
    try {
      const nextUid = reassignOwnerId ? Number(reassignOwnerId) : null;
      const nextUser = nextUid ? users.find((u) => u.id === nextUid) : null;
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_id: nextUid, reason: reassignReason || null }),
      });
      if (res.ok) {
        setLead((prev) => ({ ...prev, ownerId: nextUid, ownerName: nextUser?.name ?? null }));
        setReassignOpen(false);
        router.refresh();
      }
    } finally {
      setSavingReassign(false);
    }
  }

  const chosenLostReason = lostReasons.find((r) => String(r.id) === lostReasonId);
  const chosenLostDisplay = chosenLostReason ? resolveLostReasonDisplay(chosenLostReason) : null;
  const chosenCommMethod = COMM_METHODS.find((m) => m.value === commMethod);

  return (
    <div className="container erp-container-form">
      <CrmSubmenu />

      <div data-lead-detail className={isLost ? "is-lead-lost" : "is-lead-open"}>
        <div className="erp-pagehead">
          <div className="erp-pagehead-main">
            <div className="erp-pagehead-icon">
              <i className="fa-solid fa-filter"></i>
            </div>
            <div>
              <h1>{displayName}</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link href="/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-item">CRM</li>
                  <li className="breadcrumb-item">
                    <Link href="/crm/leads">Leads</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {lead.code}
                  </li>
                </ol>
              </nav>
            </div>
          </div>

          <div className="erp-pagehead-actions">
            <Link href="/crm/leads" className="btn btn-erp-ghost">
              <i className="fa-solid fa-list me-2"></i>All Leads
            </Link>

            {!isConverted && (
              <>
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  data-when-open
                  onClick={() => setLogContactOpen(true)}
                >
                  <i className="fa-solid fa-phone me-2"></i>Log Contact
                </button>

                <Link href={`/crm/followups/create?lead_id=${lead.id}`} className="btn btn-erp-ghost">
                  <i className="fa-solid fa-list-check me-2"></i>Follow-up
                </Link>

                <Link href={`/crm/leads/${lead.id}/edit`} className="btn btn-erp-ghost">
                  <i className="fa-solid fa-pen me-2"></i>Edit
                </Link>

                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  onClick={() => setReassignOpen(true)}
                >
                  <i className="fa-solid fa-user-tag me-2"></i>Reassign
                </button>

                <div className="dropdown">
                  <button
                    className="btn btn-erp-ghost"
                    type="button"
                    aria-expanded={moreOpen}
                    aria-label="More actions"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoreOpen((v) => !v);
                    }}
                  >
                    <i className="fa-solid fa-ellipsis"></i>
                  </button>
                  <ul
                    className={`dropdown-menu dropdown-menu-end notika-dropdown erp-user-menu${
                      moreOpen ? " show" : ""
                    }`}
                  >
                    <li>
                      <button
                        type="button"
                        className="dropdown-item"
                        data-lead-lost
                        onClick={() => {
                          setMoreOpen(false);
                          setLostError("");
                          setLostOpen(true);
                        }}
                      >
                        <i className="fa-solid fa-circle-minus"></i>{" "}
                        <span data-lost-verb>{isLost ? "Edit Loss Reason" : "Mark Lost"}</span>
                      </button>
                    </li>
                    <li data-when-lost>
                      <button
                        type="button"
                        className="dropdown-item"
                        data-lead-reopen
                        onClick={() => {
                          setMoreOpen(false);
                          setReopenError("");
                          setReopenOpen(true);
                        }}
                      >
                        <i className="fa-solid fa-rotate-left"></i> Reopen Lead
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        className="dropdown-item text-danger"
                        onClick={() => {
                          setMoreOpen(false);
                          setDeleteOpen(true);
                        }}
                      >
                        <i className="fa-solid fa-trash-can text-danger"></i> Delete Lead
                      </button>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="btn btn-erp"
                  data-when-open
                  onClick={() => setConvertOpen(true)}
                >
                  <i className="fa-solid fa-trophy me-2"></i>Won — Create Customer
                </button>
              </>
            )}
          </div>
        </div>

        <div
          className="alert alert-warning d-flex gap-2 align-items-start"
          data-when-lost
          style={{ borderRadius: "9px", fontSize: "13px" }}
        >
          <i className="fa-solid fa-circle-minus mt-1"></i>
          <div>
            Closed as lost —{" "}
            <strong data-lead-lost-summary>{lostReasonLabel || "—"}</strong>
            {lead.lostNote ? ` (${lead.lostNote})` : ""}. Use Reopen to put it back in play.
          </div>
        </div>

        {isConverted && (
          <div
            className="alert alert-success d-flex gap-2 align-items-start"
            style={{ borderRadius: "9px", fontSize: "13px" }}
          >
            <i className="fa-solid fa-trophy mt-1"></i>
            <div>
              Booked / Won — this lead has been converted to a customer and is kept read-only as the
              source record.
            </div>
          </div>
        )}

        {/* Pipeline Stepper */}
        <div
          className={`erp-card lead-stepper-card${stageBusy ? " is-busy" : ""}`}
          data-lead-stage
          data-detail
          data-lead={lead.id}
          data-name={displayName}
          data-current={st.key}
        >
          <div className="lead-stepper-head">
            <div>
              <strong>Pipeline stage</strong>
              <span className={`erp-pill ${st.pill} ms-2`}>
                <i className={`${st.icon} me-1`}></i>
                {st.label} · {st.pct}%
              </span>
            </div>
            {!isConverted && (
              <div className="d-flex gap-2">
                {nextSt && !isLost && (
                  <button
                    type="button"
                    className="btn btn-erp btn-sm"
                    data-stage-set={nextSt.key}
                    onClick={() => handleStageChange(nextSt.key)}
                  >
                    <i className="fa-solid fa-forward-step me-1"></i>
                    {nextSt.label} ({nextSt.pct}%)
                  </button>
                )}
                {!isLost && (
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm text-danger"
                    data-stage-set="unqualified"
                    onClick={() => handleStageChange("unqualified")}
                  >
                    <i className="fa-solid fa-circle-minus me-1"></i>Lost
                  </button>
                )}
                {st.key !== "junk" && !isLost && (
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    data-stage-set="junk"
                    onClick={() => handleStageChange("junk")}
                  >
                    <i className="fa-solid fa-ban me-1"></i>Junk
                  </button>
                )}
              </div>
            )}
          </div>

          <ol className="lead-stepper">
            {PIPELINE_STEPPER_STAGES.map((step, idx) => {
              let cls = "is-todo";
              if (currentStepperIdx >= 0) {
                if (idx < currentStepperIdx) cls = "is-done";
                else if (idx === currentStepperIdx) cls = "is-current";
              } else {
                cls = "is-off";
              }
              return (
                <li key={step.key} className={cls}>
                  <button
                    type="button"
                    data-stage-set={step.key}
                    disabled={step.key === st.key || isConverted}
                    title={`Move to ${step.label}`}
                    onClick={() => handleStageChange(step.key)}
                  >
                    <span className="lead-stepper-dot">
                      <i className={cls === "is-done" ? "fa-solid fa-check" : step.icon}></i>
                    </span>
                    <span className="lead-stepper-label">{step.label}</span>
                    <span className="lead-stepper-pct">{step.pct}%</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Main Record Card */}
        <div className="erp-card">
          <div className="erp-rec-head">
            <span className="erp-rec-avatar">{initials}</span>
            <div className="erp-rec-id">
              <h2>{displayName}</h2>
              <p>{lead.organisationName || "Individual enquiry"}</p>
              <div className="erp-rec-pills">
                <span className={`erp-pill ${st.pill}`} data-lead-status-pill>
                  {st.label}
                </span>
                <span className={`erp-pill ${prio.pill}`}>{prio.label}</span>
                <span className={`erp-pill ${band.pill}`}>
                  {lead.score} · {band.label}
                </span>
                <span className="erp-pill is-neutral">{lead.code}</span>
              </div>
            </div>
          </div>

          <div className="erp-rec-metrics">
            <div className="erp-rec-metric">
              <strong>
                {lead.score}
                <span className="text-muted" style={{ fontSize: "11px" }}>
                  /100
                </span>
              </strong>
              <small>{band.detailLabel}</small>
            </div>
            <div className="erp-rec-metric">
              <strong>
                {lead.expectedValue > 0 ? Number(lead.expectedValue).toLocaleString() : "—"}
              </strong>
              <small>Expected value</small>
            </div>
            <div className="erp-rec-metric">
              <strong>{src.label}</strong>
              <small>Source</small>
            </div>
            <div className="erp-rec-metric">
              <strong>{lead.nextFollowUpOn ? formatDate(lead.nextFollowUpOn) : "None"}</strong>
              <small>Next follow-up</small>
            </div>
          </div>

          {(interestedProjects.length > 0 || lead.interest) && (
            <div className="erp-rec-section">
              <div className="erp-rec-section-head">
                <h3>Interested In</h3>
              </div>
              {interestedProjects.length > 0 && (
                <div className="d-flex flex-wrap gap-1 mb-1">
                  {interestedProjects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/projects/${p.id}`}
                      className="erp-pill is-booked text-decoration-none"
                    >
                      <i className="fa-solid fa-diagram-project me-1"></i>
                      {p.name}
                    </Link>
                  ))}
                </div>
              )}
              {lead.interest && (
                <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>
                  {lead.interest}
                </p>
              )}
            </div>
          )}

          <div className="erp-rec-section">
            <div className="erp-rec-section-head">
              <h3>Contact</h3>
            </div>
            <div className="erp-deflist">
              <div className="erp-def">
                <span className="erp-def-label">Email</span>
                <span className={`erp-def-value${lead.email ? "" : " is-empty"}`}>
                  {lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : "—"}
                </span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Phone</span>
                <span className={`erp-def-value${lead.phone ? "" : " is-empty"}`}>
                  {lead.phone || "—"}
                </span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Mobile</span>
                <span className={`erp-def-value${lead.mobile ? "" : " is-empty"}`}>
                  {lead.mobile || "—"}
                </span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Location</span>
                <span
                  className={`erp-def-value${
                    lead.city || lead.country ? "" : " is-empty"
                  }`}
                >
                  {[lead.city, getCountryDisplay(lead.country)].filter(Boolean).join(", ") || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="erp-rec-section">
            <div className="erp-rec-section-head">
              <h3>Qualification</h3>
            </div>
            <div className="erp-deflist">
              <div className="erp-def">
                <span className="erp-def-label">Source</span>
                <span className="erp-def-value">{src.label}</span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Status</span>
                <span className="erp-def-value">{st.label}</span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Priority</span>
                <span className="erp-def-value">{prio.label}</span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Assigned to</span>
                <span className={`erp-def-value${ownerDisplay ? "" : " is-empty"}`}>
                  {ownerDisplay || "—"}
                </span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Branch</span>
                <span className={`erp-def-value${branchDisplay ? "" : " is-empty"}`}>
                  {branchDisplay || "—"}
                </span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Captured</span>
                <span className="erp-def-value">{formatDate(lead.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="erp-rec-section">
            <div className="erp-rec-section-head">
              <h3>Follow-up</h3>
            </div>
            <div className="erp-deflist">
              <div className="erp-def">
                <span className="erp-def-label">Last contacted</span>
                <span className={`erp-def-value${commEntries.length > 0 ? "" : " is-empty"}`}>
                  {commEntries[0]?.occurredAt || formatDate(lead.createdAt)}
                </span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Next follow-up</span>
                <span
                  className={`erp-def-value${lead.nextFollowUpOn ? "" : " is-empty"}`}
                  data-lead-next-followup
                >
                  {lead.nextFollowUpOn ? formatDate(lead.nextFollowUpOn) : "—"}
                </span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Lost reason</span>
                <span
                  className={`erp-def-value${isLost && lostReasonLabel ? "" : " is-empty"}`}
                  data-lead-lost-reason
                >
                  {isLost && lostReasonLabel ? lostReasonLabel : "—"}
                </span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Lost note</span>
                <span
                  className={`erp-def-value${isLost && lead.lostNote ? "" : " is-empty"}`}
                  data-lead-lost-note
                >
                  {isLost && lead.lostNote ? lead.lostNote : "—"}
                </span>
              </div>
              <div className="erp-def">
                <span className="erp-def-label">Lost on</span>
                <span className="erp-def-value is-empty" data-lead-lost-at>
                  {isLost ? formatDate(new Date()) : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="erp-rec-section">
            <div className="erp-rec-section-head">
              <h3>Stage history</h3>
            </div>
            <ol className="lead-stage-history">
              {stageHistory.map((h, i) => {
                const hMeta = getStageMeta(h.stageKey);
                return (
                  <li key={`${h.stageKey}-${i}`}>
                    <span className={`erp-pill ${hMeta.pill}`}>
                      <i className={`${hMeta.icon} me-1`}></i>
                      {hMeta.label} · {hMeta.pct}%
                    </span>
                    <span className="lead-stage-history-meta">
                      {h.fromLabel ? `from ${h.fromLabel} · ` : ""}
                      {h.at} · {h.by}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="erp-rec-section">
            <div className="erp-rec-section-head">
              <h3>Ownership history</h3>
            </div>
            {ownerDisplay ? (
              <p className="erp-def-note text-muted">
                Currently assigned to <strong>{ownerDisplay}</strong>.
              </p>
            ) : (
              <p className="erp-def-note text-muted">
                Never assigned — the lead is in the unassigned pool.
              </p>
            )}
          </div>

          <div className="erp-rec-section">
            <div className="erp-rec-section-head">
              <h3>Notes</h3>
              <span className="erp-note-hint" hidden={notesValue === savedNotesValue}>
                Unsaved changes
              </span>
            </div>

            <form method="POST" data-note-form onSubmit={handleSaveNotes}>
              <textarea
                name="notes"
                rows={4}
                maxLength={5000}
                className="form-control "
                placeholder="Anything the team should know — what was agreed, what to chase next…"
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                readOnly={isConverted}
              ></textarea>

              {!isConverted && (
                <div className="erp-note-actions">
                  <button
                    type="button"
                    className="btn btn-erp-ghost btn-sm"
                    disabled={notesValue === savedNotesValue}
                    onClick={() => setNotesValue(savedNotesValue)}
                  >
                    Revert
                  </button>
                  <button
                    type="submit"
                    className="btn btn-erp btn-sm"
                    disabled={notesValue === savedNotesValue || savingNotes}
                  >
                    <i className="fa-solid fa-floppy-disk me-1"></i>
                    {savingNotes ? "Saving…" : "Save Notes"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Communication Log Card */}
        <div className="erp-card">
          <div className="erp-rec-head">
            <span
              className="erp-rec-avatar"
              style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}
            >
              <i className="fa-solid fa-comments"></i>
            </span>
            <div className="erp-rec-id">
              <h2>Communication Log</h2>
              <p>
                {commEntries.length} {commEntries.length === 1 ? "entry" : "entries"} recorded
              </p>
            </div>
            {!isConverted && (
              <button
                type="button"
                className="btn btn-erp btn-sm"
                onClick={() => setCommOpen(true)}
              >
                <i className="fa-solid fa-plus me-1"></i>Log Communication
              </button>
            )}
          </div>

          <div className="erp-rec-section">
            {commEntries.length === 0 ? (
              <p className="text-muted mb-0" style={{ fontSize: "12.5px" }}>
                No communication recorded yet. Log the first call, email or meeting to start the
                history.
              </p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {commEntries.map((c) => (
                  <div key={c.id} className="lead-note-item">
                    <div className="lead-note-item-meta">
                      <span className="lead-note-item-type">{c.method}</span>
                      <span className="lead-note-item-status">
                        {c.direction === "inbound" ? "Inbound" : "Outbound"}
                      </span>
                      {c.durationMinutes && <span>{c.durationMinutes} min</span>}
                      <span className="ms-auto">{c.occurredAt}</span>
                    </div>
                    <div className="lead-note-item-text">
                      <strong>{c.subject}</strong>
                      {c.notes ? ` — ${c.notes}` : ""}
                    </div>
                    <div className="lead-note-item-by">Held by {c.heldBy}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal 1: #communicationModal */}
        <div
          className={`modal fade${commOpen ? " show d-block" : ""}`}
          id="communicationModal"
          tabIndex={-1}
          aria-hidden={!commOpen}
          style={commOpen ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <form
              method="POST"
              className="modal-content"
              style={{ border: "none", borderRadius: "14px" }}
              data-comm-form
              onSubmit={handleCommSubmit}
            >
              <input type="hidden" name="entry_id" value="" data-comm-entry="" />
              <div className="modal-body p-4">
                <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }} data-comm-title>
                  Log communication
                </h5>

                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="comm_method" className="form-label">
                        Method <span className="erp-required">*</span>
                      </label>
                      <select
                        id="comm_method"
                        name="method"
                        className="form-select"
                        required
                        value={commMethod}
                        onChange={(e) => setCommMethod(e.target.value)}
                      >
                        {COMM_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="erp-field">
                      <label htmlFor="comm_direction" className="form-label">
                        Direction <span className="erp-required">*</span>
                      </label>
                      <select
                        id="comm_direction"
                        name="direction"
                        className="form-select"
                        required
                        value={commDirection}
                        onChange={(e) => setCommDirection(e.target.value)}
                      >
                        <option value="outbound">We contacted them</option>
                        <option value="inbound">They contacted us</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-7">
                    <div className="erp-field">
                      <label htmlFor="comm_occurred" className="form-label">
                        Communicated on <span className="erp-required">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="comm_occurred"
                        name="occurred_at"
                        className="form-control "
                        required
                        value={commOccurredAt}
                        onChange={(e) => setCommOccurredAt(e.target.value)}
                      />
                      <span className="erp-help">Your local time (Asia/Dhaka).</span>
                    </div>
                  </div>

                  <div className="col-md-5" hidden={!chosenCommMethod?.hasDuration}>
                    <div className="erp-field">
                      <label htmlFor="comm_duration" className="form-label">
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        id="comm_duration"
                        name="duration_minutes"
                        min={1}
                        max={1440}
                        step={5}
                        className="form-control"
                        value={commDuration}
                        onChange={(e) => setCommDuration(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="erp-field">
                      <label htmlFor="comm_subject" className="form-label">
                        Subject <span className="erp-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="comm_subject"
                        name="subject"
                        className="form-control "
                        maxLength={190}
                        placeholder="Discussed the revised quotation"
                        required
                        value={commSubject}
                        onChange={(e) => setCommSubject(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="erp-field">
                      <label htmlFor="comm_held" className="form-label">
                        Held by
                      </label>
                      <select
                        id="comm_held"
                        name="held_by"
                        className="form-select"
                        value={commHeldBy}
                        onChange={(e) => setCommHeldBy(e.target.value)}
                      >
                        <option value="">Not recorded</option>
                        {users.map((u) => (
                          <option key={u.id} value={String(u.id)}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                      <span className="erp-help">Who actually spoke to them, if not you.</span>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="erp-field mb-0">
                      <label htmlFor="comm_notes" className="form-label">
                        Notes
                      </label>
                      <textarea
                        id="comm_notes"
                        name="notes"
                        rows={3}
                        className="form-control"
                        maxLength={5000}
                        placeholder="What was said, what was agreed…"
                        value={commNotes}
                        onChange={(e) => setCommNotes(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  onClick={() => setCommOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-erp" disabled={savingComm}>
                  <i className="fa-solid fa-floppy-disk me-2"></i>
                  {savingComm ? "Saving…" : "Log Communication"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Detail Modal 2: #logContactModal */}
        <div
          className={`modal fade${logContactOpen ? " show d-block" : ""}`}
          id="logContactModal"
          tabIndex={-1}
          aria-hidden={!logContactOpen}
          style={logContactOpen ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <form
              method="POST"
              className="modal-content"
              style={{ border: "none", borderRadius: "14px" }}
              onSubmit={handleLogContactSubmit}
            >
              <div className="modal-body p-4">
                <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                  Log contact
                </h5>
                <p className="text-muted" style={{ fontSize: "13px" }}>
                  Stamps the time now and moves a new lead to contacted. Set the next follow-up
                  date while you are here.
                </p>
                <div className="erp-field mb-0">
                  <label htmlFor="log_next_follow_up_on" className="form-label">
                    Next follow-up
                  </label>
                  <input
                    type="date"
                    id="log_next_follow_up_on"
                    name="next_follow_up_on"
                    className="form-control"
                    value={logNextDate}
                    onChange={(e) => setLogNextDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  onClick={() => setLogContactOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-erp" disabled={savingLogContact}>
                  <i className="fa-solid fa-phone me-2"></i>
                  {savingLogContact ? "Saving…" : "Log Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Detail Modal 3: #convertModal */}
        <div
          className={`modal fade${convertOpen ? " show d-block" : ""}`}
          id="convertModal"
          tabIndex={-1}
          aria-hidden={!convertOpen}
          style={convertOpen ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <form
              method="POST"
              className="modal-content"
              style={{ border: "none", borderRadius: "14px" }}
              onSubmit={handleConvertSubmit}
            >
              <div className="modal-body p-4">
                <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                  Booked / Won — create customer
                </h5>
                <p className="text-muted" style={{ fontSize: "13px" }}>
                  Marks the lead Booked / Won (100%), creates a customer from these details flagged
                  as coming from this lead, and carries the tags across. The lead leaves the leads
                  list and is kept read-only as the record of where the customer came from.
                </p>
                <div className="erp-field mb-0">
                  <label htmlFor="convert_kind" className="form-label">
                    Create as
                  </label>
                  <select
                    id="convert_kind"
                    name="kind"
                    className="form-select"
                    value={convertKind}
                    onChange={(e) =>
                      setConvertKind(e.target.value === "company" ? "company" : "individual")
                    }
                  >
                    <option value="individual">Individual — {displayName}</option>
                    <option value="company">Organisation instead</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  onClick={() => setConvertOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-erp" disabled={savingConvert}>
                  <i className="fa-solid fa-trophy me-2"></i>
                  {savingConvert ? "Creating customer…" : "Mark Won"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Detail Modal 4: #deleteRecordModal */}
        <div
          className={`modal fade${deleteOpen ? " show d-block" : ""}`}
          id="deleteRecordModal"
          tabIndex={-1}
          aria-hidden={!deleteOpen}
          style={deleteOpen ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ border: "none", borderRadius: "14px" }}>
              <div className="modal-body p-4">
                <div className="d-flex gap-3">
                  <div className="erp-kpi-icon is-danger">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                  </div>
                  <div>
                    <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                      Delete lead?
                    </h5>
                    <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                      <strong data-delete-name>{displayName}</strong> will be removed from active
                      use. The record is retained and can be restored by an administrator.
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancel
                </button>
                <form method="POST" data-delete-form onSubmit={handleDeleteSubmit}>
                  <button
                    type="submit"
                    className="btn btn-erp"
                    disabled={deleting}
                    style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                  >
                    <i className="fa-solid fa-trash-can me-2"></i>
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Modal 5: #leadLostModal */}
        <div
          className={`modal fade${lostOpen ? " show d-block" : ""}`}
          id="leadLostModal"
          tabIndex={-1}
          aria-hidden={!lostOpen}
          style={lostOpen ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <form
              method="POST"
              className="modal-content erp-form"
              style={{ border: "none", borderRadius: "14px" }}
              data-lost-form
              onSubmit={handleLostSubmit}
            >
              <div className="modal-body p-4">
                <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                  Mark lost — <span data-lost-name>{displayName}</span>
                </h5>
                <p className="text-muted" style={{ fontSize: "13px" }}>
                  Closes the lead without converting it and clears the follow-up so it leaves the
                  queue. The reason is what the loss report is built from, so pick the closest one.
                </p>
                <div
                  className="alert alert-danger py-2 px-3 mb-3"
                  role="alert"
                  style={{ borderRadius: "9px", fontSize: "12.5px" }}
                  data-lost-errors
                  hidden={!lostError}
                >
                  <span data-lost-errors-text>{lostError}</span>
                </div>
                <div className="erp-field">
                  <label htmlFor="lost_reason_id" className="form-label">
                    Reason <span className="erp-required">*</span>
                  </label>
                  <select
                    id="lost_reason_id"
                    name="lost_reason_id"
                    className="form-select"
                    value={lostReasonId}
                    onChange={(e) => setLostReasonId(e.target.value)}
                    required
                  >
                    <option value="">Choose a reason</option>
                    {lostReasons
                      .filter((r) => r.isActive)
                      .map((r) => (
                        <option key={r.id} value={String(r.id)}>
                          {resolveLostReasonDisplay(r).cleanName}
                        </option>
                      ))}
                  </select>
                  {chosenLostDisplay?.cleanDesc && (
                    <span className="erp-help" data-lost-hint>
                      {chosenLostDisplay.cleanDesc}
                    </span>
                  )}
                </div>
                <div className="erp-field mb-0">
                  <label htmlFor="lost_note" className="form-label">
                    Note{" "}
                    <span
                      className="erp-required"
                      data-lost-note-required
                      hidden={!chosenLostDisplay?.requiresNote}
                    >
                      *
                    </span>
                  </label>
                  <textarea
                    id="lost_note"
                    name="lost_note"
                    rows={3}
                    className="form-control"
                    maxLength={500}
                    placeholder="What actually happened, in one or two lines…"
                    value={lostNote}
                    onChange={(e) => setLostNote(e.target.value)}
                  ></textarea>
                  <span className="erp-help">Optional, unless the reason asks for it.</span>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  onClick={() => setLostOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-erp"
                  disabled={savingLost}
                  style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                >
                  <i className="fa-solid fa-circle-minus me-2"></i>
                  {savingLost ? "Saving…" : "Mark Lost"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Detail Modal 6: #leadReopenModal */}
        <div
          className={`modal fade${reopenOpen ? " show d-block" : ""}`}
          id="leadReopenModal"
          tabIndex={-1}
          aria-hidden={!reopenOpen}
          style={reopenOpen ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <form
              method="POST"
              className="modal-content erp-form"
              style={{ border: "none", borderRadius: "14px" }}
              data-reopen-form
              onSubmit={handleReopenSubmit}
            >
              <div className="modal-body p-4">
                <h5 className="mb-2" style={{ fontSize: "16px", fontWeight: 600 }}>
                  Reopen — <span data-reopen-name>{displayName}</span>
                </h5>
                <p className="text-muted" style={{ fontSize: "13px" }}>
                  Puts the lead back in play and clears{" "}
                  <strong data-reopen-reason>{lostReasonLabel || "the recorded loss"}</strong>, so it
                  stops counting against that reason. Set the next follow-up while you are here.
                </p>
                <div
                  className="alert alert-danger py-2 px-3 mb-3"
                  role="alert"
                  style={{ borderRadius: "9px", fontSize: "12.5px" }}
                  data-reopen-errors
                  hidden={!reopenError}
                >
                  <span data-reopen-errors-text>{reopenError}</span>
                </div>
                <div className="erp-field mb-0">
                  <label htmlFor="reopen_next_follow_up_on" className="form-label">
                    Next follow-up
                  </label>
                  <input
                    type="date"
                    id="reopen_next_follow_up_on"
                    name="next_follow_up_on"
                    className="form-control"
                    value={reopenDate}
                    onChange={(e) => setReopenDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  onClick={() => setReopenOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-erp" disabled={savingReopen}>
                  <i className="fa-solid fa-rotate-left me-2"></i>
                  {savingReopen ? "Saving…" : "Reopen Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Detail Modal 7: #leadReassignModal */}
        <div
          className={`modal fade${reassignOpen ? " show d-block" : ""}`}
          id="leadReassignModal"
          tabIndex={-1}
          aria-hidden={!reassignOpen}
          aria-labelledby="leadReassignTitle"
          style={reassignOpen ? { backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
        >
          <div className="modal-dialog modal-dialog-centered">
            <form
              className="modal-content erp-form"
              data-lead-reassign-form
              noValidate
              style={{ border: "none", borderRadius: "14px" }}
              onSubmit={handleReassignSubmit}
            >
              <div className="modal-body p-4">
                <h5 className="mb-2" id="leadReassignTitle" style={{ fontSize: "16px", fontWeight: 600 }}>
                  <i className="fa-solid fa-user-tag me-2 text-primary"></i>Reassign lead
                </h5>
                <p className="text-muted" style={{ fontSize: "13px" }}>
                  {ownerDisplay
                    ? `Currently assigned to ${ownerDisplay}. `
                    : "Currently in the unassigned pool. "}
                  The new owner is notified and the change is kept in the ownership history.
                </p>

                <div
                  className="alert alert-danger py-2 px-3 mb-3"
                  role="alert"
                  style={{ borderRadius: "9px", fontSize: "12.5px" }}
                  data-reassign-error
                  hidden={!reassignError}
                >
                  {reassignError}
                </div>

                <div className="erp-field">
                  <label htmlFor="reassign_owner_id" className="form-label">
                    New owner
                  </label>
                  <select
                    id="reassign_owner_id"
                    name="owner_id"
                    className="form-select"
                    value={reassignOwnerId}
                    onChange={(e) => setReassignOwnerId(e.target.value)}
                  >
                    <option value="">Unassigned pool</option>
                    {users.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="erp-field mb-0">
                  <label htmlFor="reassign_reason" className="form-label">
                    Reason
                  </label>
                  <input
                    type="text"
                    id="reassign_reason"
                    name="reason"
                    className="form-control"
                    maxLength={255}
                    placeholder="e.g. Customer asked for a Bangla-speaking agent"
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-erp-ghost"
                  onClick={() => setReassignOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-erp" disabled={savingReassign}>
                  <i className="fa-solid fa-user-tag me-2"></i>
                  {savingReassign ? "Saving…" : "Reassign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
