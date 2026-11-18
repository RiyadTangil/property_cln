"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CrmSubmenu } from "./CrmSubmenu";

export interface CrmContactRow {
  id: number;
  customerId: number;
  firstName: string;
  lastName: string | null;
  role: string;
  jobTitle: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  socialProfilesJson: string;
  notes: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt?: string | Date;
}

export interface CrmCustomerRow {
  id: number;
  companyId?: number;
  code: string;
  kind: string;
  organisationName: string | null;
  firstName: string | null;
  lastName: string | null;
  type: string;
  lifecycleStage: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  socialProfilesJson: string;
  industry: string | null;
  source: string | null;
  branchId: number | null;
  taxNumber: string | null;
  registrationNumber: string | null;
  creditLimit: number;
  ownerId: number | null;
  ownerName: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt?: string | Date;
  contacts?: CrmContactRow[];
  _count?: { contacts: number };
}

export interface CustomerFollowUpRef {
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

export interface RefBranch {
  id: number;
  code?: string;
  name: string;
}

export interface RefUser {
  id: number;
  name: string;
  email?: string;
}

const CUSTOMER_TYPES = [
  { value: "prospect", label: "Prospect", icon: "fa-solid fa-binoculars", pill: "is-neutral" },
  { value: "lead", label: "Lead", icon: "fa-solid fa-filter", pill: "is-booked" },
  { value: "customer", label: "Customer", icon: "fa-solid fa-handshake", pill: "is-available" },
  { value: "partner", label: "Partner", icon: "fa-solid fa-people-arrows", pill: "is-sold" },
  { value: "vendor", label: "Vendor", icon: "fa-solid fa-truck-field", pill: "is-hold" },
];

const LIFECYCLE_STAGES = [
  { value: "subscriber", label: "Subscriber", pill: "is-neutral" },
  { value: "lead", label: "Lead", pill: "is-booked" },
  { value: "qualified", label: "Marketing Qualified", pill: "is-hold" },
  { value: "opportunity", label: "Opportunity", pill: "is-booked" },
  { value: "customer", label: "Customer", pill: "is-available" },
  { value: "evangelist", label: "Evangelist", pill: "is-sold" },
  { value: "dormant", label: "Dormant", pill: "is-neutral" },
];

const SOURCES = [
  { value: "website_form", label: "Website Form" },
  { value: "facebook", label: "Facebook Lead" },
  { value: "google_ads", label: "Google Ads" },
  { value: "referral", label: "Referral" },
  { value: "walk_in", label: "Walk-in" },
  { value: "campaign", label: "Campaign" },
  { value: "import", label: "CSV Import" },
  { value: "api", label: "API" },
  { value: "manual", label: "Manual Entry" },
];

const INDUSTRIES = [
  { value: "real_estate", label: "Real Estate & Development" },
  { value: "construction", label: "Construction & Contracting" },
  { value: "architecture", label: "Architecture & Design" },
  { value: "banking", label: "Banking & Financial Services" },
  { value: "insurance", label: "Insurance" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail & Wholesale" },
  { value: "healthcare", label: "Healthcare & Pharmaceuticals" },
  { value: "education", label: "Education" },
  { value: "it_software", label: "IT & Software" },
  { value: "hospitality", label: "Hospitality & Tourism" },
  { value: "logistics", label: "Logistics & Transportation" },
  { value: "telecom", label: "Telecommunications" },
  { value: "government", label: "Government & Public Sector" },
  { value: "ngo", label: "Non-Profit / NGO" },
  { value: "other", label: "Other" },
];

const CONTACT_ROLES = [
  { value: "owner", label: "Owner / Proprietor" },
  { value: "decision_maker", label: "Decision Maker" },
  { value: "finance", label: "Finance Contact" },
  { value: "technical", label: "Technical Contact" },
  { value: "procurement", label: "Procurement" },
  { value: "other", label: "Other" },
];

const SOCIAL_FIELDS = [
  { key: "linkedin", id: "social_linkedin", label: "LinkedIn", icon: "fa-brands fa-linkedin" },
  { key: "facebook", id: "social_facebook", label: "Facebook", icon: "fa-brands fa-facebook" },
  { key: "x", id: "social_x", label: "X / Twitter", icon: "fa-brands fa-x-twitter" },
  { key: "instagram", id: "social_instagram", label: "Instagram", icon: "fa-brands fa-instagram" },
  { key: "whatsapp", id: "social_whatsapp", label: "WhatsApp", icon: "fa-brands fa-whatsapp" },
  { key: "youtube", id: "social_youtube", label: "YouTube", icon: "fa-brands fa-youtube" },
] as const;

const COMM_METHODS = [
  { value: "email", label: "Email", duration: false, icon: "fa-solid fa-envelope", typeId: 4 },
  { value: "phone_call", label: "Phone Call", duration: true, icon: "fa-solid fa-phone", typeId: 1 },
  { value: "whatsapp", label: "WhatsApp", duration: false, icon: "fa-brands fa-whatsapp", typeId: 6 },
  { value: "sms", label: "SMS", duration: false, icon: "fa-solid fa-comment-sms", typeId: 5 },
  { value: "physical_meeting", label: "Physical Meeting", duration: true, icon: "fa-solid fa-handshake", typeId: 2 },
  { value: "online_meeting", label: "Online Meeting", duration: true, icon: "fa-solid fa-video", typeId: 2 },
  { value: "other", label: "Other", duration: false, icon: "fa-solid fa-comments", typeId: 10 },
];

const COUNTRIES: Array<[string, string]> = [
  ["AF", "Afghanistan"], ["AX", "Åland Islands"], ["AL", "Albania"], ["DZ", "Algeria"], ["AS", "American Samoa"],
  ["AD", "Andorra"], ["AO", "Angola"], ["AI", "Anguilla"], ["AQ", "Antarctica"], ["AG", "Antigua and Barbuda"],
  ["AR", "Argentina"], ["AM", "Armenia"], ["AW", "Aruba"], ["AU", "Australia"], ["AT", "Austria"],
  ["AZ", "Azerbaijan"], ["BS", "Bahamas"], ["BH", "Bahrain"], ["BD", "Bangladesh"], ["BB", "Barbados"],
  ["BY", "Belarus"], ["BE", "Belgium"], ["BZ", "Belize"], ["BJ", "Benin"], ["BM", "Bermuda"],
  ["BT", "Bhutan"], ["BO", "Bolivia"], ["BQ", "Bonaire, Sint Eustatius and Saba"], ["BA", "Bosnia and Herzegovina"],
  ["BW", "Botswana"], ["BV", "Bouvet Island"], ["BR", "Brazil"], ["IO", "British Indian Ocean Territory"],
  ["BN", "Brunei Darussalam"], ["BG", "Bulgaria"], ["BF", "Burkina Faso"], ["BI", "Burundi"], ["CV", "Cabo Verde"],
  ["KH", "Cambodia"], ["CM", "Cameroon"], ["CA", "Canada"], ["KY", "Cayman Islands"],
  ["CF", "Central African Republic"], ["TD", "Chad"], ["CL", "Chile"], ["CN", "China"], ["CX", "Christmas Island"],
  ["CC", "Cocos (Keeling) Islands"], ["CO", "Colombia"], ["KM", "Comoros"], ["CG", "Congo"],
  ["CD", "Congo, Democratic Republic of the"], ["CK", "Cook Islands"], ["CR", "Costa Rica"], ["CI", "Côte d'Ivoire"],
  ["HR", "Croatia"], ["CU", "Cuba"], ["CW", "Curaçao"], ["CY", "Cyprus"], ["CZ", "Czechia"],
  ["DK", "Denmark"], ["DJ", "Djibouti"], ["DM", "Dominica"], ["DO", "Dominican Republic"], ["EC", "Ecuador"],
  ["EG", "Egypt"], ["SV", "El Salvador"], ["GQ", "Equatorial Guinea"], ["ER", "Eritrea"], ["EE", "Estonia"],
  ["SZ", "Eswatini"], ["ET", "Ethiopia"], ["FK", "Falkland Islands (Malvinas)"], ["FO", "Faroe Islands"],
  ["FJ", "Fiji"], ["FI", "Finland"], ["FR", "France"], ["GF", "French Guiana"], ["PF", "French Polynesia"],
  ["TF", "French Southern Territories"], ["GA", "Gabon"], ["GM", "Gambia"], ["GE", "Georgia"], ["DE", "Germany"],
  ["GH", "Ghana"], ["GI", "Gibraltar"], ["GR", "Greece"], ["GL", "Greenland"], ["GD", "Grenada"],
  ["GP", "Guadeloupe"], ["GU", "Guam"], ["GT", "Guatemala"], ["GG", "Guernsey"], ["GN", "Guinea"],
  ["GW", "Guinea-Bissau"], ["GY", "Guyana"], ["HT", "Haiti"], ["HM", "Heard Island and McDonald Islands"],
  ["VA", "Holy See"], ["HN", "Honduras"], ["HK", "Hong Kong"], ["HU", "Hungary"], ["IS", "Iceland"],
  ["IN", "India"], ["ID", "Indonesia"], ["IR", "Iran"], ["IQ", "Iraq"], ["IE", "Ireland"],
  ["IM", "Isle of Man"], ["IL", "Israel"], ["IT", "Italy"], ["JM", "Jamaica"], ["JP", "Japan"],
  ["JE", "Jersey"], ["JO", "Jordan"], ["KZ", "Kazakhstan"], ["KE", "Kenya"], ["KI", "Kiribati"],
  ["KP", "Korea, Democratic People's Republic of"], ["KR", "Korea, Republic of"], ["KW", "Kuwait"],
  ["KG", "Kyrgyzstan"], ["LA", "Lao People's Democratic Republic"], ["LV", "Latvia"], ["LB", "Lebanon"],
  ["LS", "Lesotho"], ["LR", "Liberia"], ["LY", "Libya"], ["LI", "Liechtenstein"], ["LT", "Lithuania"],
  ["LU", "Luxembourg"], ["MO", "Macao"], ["MG", "Madagascar"], ["MW", "Malawi"], ["MY", "Malaysia"],
  ["MV", "Maldives"], ["ML", "Mali"], ["MT", "Malta"], ["MH", "Marshall Islands"], ["MQ", "Martinique"],
  ["MR", "Mauritania"], ["MU", "Mauritius"], ["YT", "Mayotte"], ["MX", "Mexico"], ["FM", "Micronesia"],
  ["MD", "Moldova"], ["MC", "Monaco"], ["MN", "Mongolia"], ["ME", "Montenegro"], ["MS", "Montserrat"],
  ["MA", "Morocco"], ["MZ", "Mozambique"], ["MM", "Myanmar"], ["NA", "Namibia"], ["NR", "Nauru"],
  ["NP", "Nepal"], ["NL", "Netherlands"], ["NC", "New Caledonia"], ["NZ", "New Zealand"], ["NI", "Nicaragua"],
  ["NE", "Niger"], ["NG", "Nigeria"], ["NU", "Niue"], ["NF", "Norfolk Island"], ["MK", "North Macedonia"],
  ["MP", "Northern Mariana Islands"], ["NO", "Norway"], ["OM", "Oman"], ["PK", "Pakistan"], ["PW", "Palau"],
  ["PS", "Palestine, State of"], ["PA", "Panama"], ["PG", "Papua New Guinea"], ["PY", "Paraguay"], ["PE", "Peru"],
  ["PH", "Philippines"], ["PN", "Pitcairn"], ["PL", "Poland"], ["PT", "Portugal"], ["PR", "Puerto Rico"],
  ["QA", "Qatar"], ["RE", "Réunion"], ["RO", "Romania"], ["RU", "Russian Federation"], ["RW", "Rwanda"],
  ["BL", "Saint Barthélemy"], ["SH", "Saint Helena, Ascension and Tristan da Cunha"],
  ["KN", "Saint Kitts and Nevis"], ["LC", "Saint Lucia"], ["MF", "Saint Martin (French part)"],
  ["PM", "Saint Pierre and Miquelon"], ["VC", "Saint Vincent and the Grenadines"], ["WS", "Samoa"],
  ["SM", "San Marino"], ["ST", "Sao Tome and Principe"], ["SA", "Saudi Arabia"], ["SN", "Senegal"],
  ["RS", "Serbia"], ["SC", "Seychelles"], ["SL", "Sierra Leone"], ["SG", "Singapore"],
  ["SX", "Sint Maarten (Dutch part)"], ["SK", "Slovakia"], ["SI", "Slovenia"], ["SB", "Solomon Islands"],
  ["SO", "Somalia"], ["ZA", "South Africa"], ["GS", "South Georgia and the South Sandwich Islands"],
  ["SS", "South Sudan"], ["ES", "Spain"], ["LK", "Sri Lanka"], ["SD", "Sudan"], ["SR", "Suriname"],
  ["SJ", "Svalbard and Jan Mayen"], ["SE", "Sweden"], ["CH", "Switzerland"], ["SY", "Syrian Arab Republic"],
  ["TW", "Taiwan"], ["TJ", "Tajikistan"], ["TZ", "Tanzania"], ["TH", "Thailand"], ["TL", "Timor-Leste"],
  ["TG", "Togo"], ["TK", "Tokelau"], ["TO", "Tonga"], ["TT", "Trinidad and Tobago"], ["TN", "Tunisia"],
  ["TR", "Turkey"], ["TM", "Turkmenistan"], ["TC", "Turks and Caicos Islands"], ["TV", "Tuvalu"],
  ["UG", "Uganda"], ["UA", "Ukraine"], ["AE", "United Arab Emirates"], ["GB", "United Kingdom"],
  ["US", "United States of America"], ["UM", "United States Minor Outlying Islands"], ["UY", "Uruguay"],
  ["UZ", "Uzbekistan"], ["VU", "Vanuatu"], ["VE", "Venezuela"], ["VN", "Viet Nam"],
  ["VG", "Virgin Islands (British)"], ["VI", "Virgin Islands (U.S.)"], ["WF", "Wallis and Futuna"],
  ["EH", "Western Sahara"], ["YE", "Yemen"], ["ZM", "Zambia"], ["ZW", "Zimbabwe"],
];

function customerDisplayName(c: {
  kind?: string;
  organisationName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  code?: string;
}): string {
  if (c.kind === "company" && c.organisationName) return c.organisationName;
  const full = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  return full || c.organisationName || c.code || "Customer";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatShortDate(d: string | Date | undefined | null): string {
  if (!d) return "12 Nov 2026";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizeCountryCode(country: string | undefined | null): string {
  if (!country) return "";
  const trimmed = country.trim();
  const byCode = COUNTRIES.find(([code]) => code.toLowerCase() === trimmed.toLowerCase());
  if (byCode) return byCode[0];
  const byName = COUNTRIES.find(([, name]) => name.toLowerCase() === trimmed.toLowerCase());
  return byName ? byName[0] : "";
}

function resolveCountryLabel(country: string | undefined | null): string {
  if (!country) return "";
  const byCode = COUNTRIES.find(([code]) => code.toLowerCase() === country.trim().toLowerCase());
  return byCode ? byCode[1] : country;
}

function parseSocialProfiles(json: string | undefined | null): Record<string, string> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
  } catch {
    // ignore invalid json
  }
  return {};
}

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

const COMM_PREFIX = "[COMM|";

function encodeCommDescription(entry: {
  method: string;
  direction: string;
  durationMinutes: number | null;
  heldBy: string;
  notes: string;
}): string {
  return `${COMM_PREFIX}${entry.method}|${entry.direction}|${entry.durationMinutes ?? ""}|${entry.heldBy.replace(/\|/g, " ")}] ${entry.notes}`;
}

function parseCommFromFollowUp(f: CustomerFollowUpRef, customerId: number): CommEntry | null {
  if (f.concerns !== `customer:${customerId}` || !f.description?.startsWith(COMM_PREFIX)) {
    return null;
  }
  const closeIdx = f.description.indexOf("]");
  if (closeIdx === -1) return null;
  const header = f.description.slice(COMM_PREFIX.length, closeIdx);
  const [method = "phone_call", direction = "outbound", dur = "", heldBy = ""] = header.split("|");
  const notes = f.description.slice(closeIdx + 1).trim();
  const occurredAt = f.scheduledTime ? `${f.scheduledDate}T${f.scheduledTime}` : `${f.scheduledDate}T09:00`;
  return {
    id: f.id,
    method,
    direction,
    occurredAt,
    durationMinutes: dur ? Number(dur) : null,
    subject: f.subject,
    heldBy: heldBy || f.assignedTo || "",
    notes,
  };
}

export function CrmCustomersList({
  initialItems,
  users = [],
}: {
  initialItems: CrmCustomerRow[];
  users?: RefUser[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<CrmCustomerRow[]>(initialItems);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CrmCustomerRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);

  const filtered = items.filter((item) => {
    const name = customerDisplayName(item);
    const q = search.trim().toLowerCase();
    if (q) {
      const hay = `${name} ${item.code} ${item.email ?? ""} ${item.phone ?? ""} ${item.mobile ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (typeFilter && item.type !== typeFilter) return false;
    if (kindFilter && item.kind !== kindFilter) return false;
    if (stageFilter && item.lifecycleStage !== stageFilter) return false;
    if (ownerFilter && String(item.ownerId ?? "") !== ownerFilter) return false;
    if (statusFilter === "active" && !item.isActive) return false;
    if (statusFilter === "inactive" && item.isActive) return false;
    return true;
  });

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/customers/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container ">
      <CrmSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-address-book"></i>
          </div>
          <div>
            <h1>Customers</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Customers
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/crm/leads" className="btn btn-erp-ghost">
            <i className="fa-solid fa-filter me-2"></i>Leads
          </Link>
          <Link href="/crm/customers/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Customer
          </Link>
        </div>
      </div>

      <div className="erp-statrow">
        {CUSTOMER_TYPES.map((t) => {
          const count = items.filter((c) => c.type === t.value).length;
          const active = typeFilter === t.value;
          return (
            <a
              key={t.value}
              href={`/crm/customers?type=${t.value}`}
              className={`erp-stat ${active ? "is-active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setTypeFilter((prev) => (prev === t.value ? "" : t.value));
              }}
            >
              <span className="erp-stat-icon">
                <i className={t.icon}></i>
              </span>
              <span className="erp-stat-body">
                <strong>{count}</strong>
                <small>{t.label}</small>
              </span>
            </a>
          );
        })}
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/crm/customers"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, code, email, phone…"
                aria-label="Search customers"
              />
            </div>

            <select
              name="kind"
              className="form-select erp-select"
              aria-label="Kind filter"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
            >
              <option value="">All kinds</option>
              <option value="individual">Individual</option>
              <option value="company">Company / Organisation</option>
            </select>

            <select
              name="lifecycle_stage"
              className="form-select erp-select"
              aria-label="Stage filter"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="">All stages</option>
              {LIFECYCLE_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              name="owner_id"
              className="form-select erp-select"
              aria-label="Owner filter"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="">All owners</option>
              {users.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              name="tag_id"
              className="form-select erp-select"
              aria-label="Tag filter"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <option value="">All tags</option>
            </select>

            <select
              name="status"
              className="form-select erp-select"
              aria-label="Status filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {filtered.length} {filtered.length === 1 ? "customer" : "customers"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-address-book"></i>
            </div>
            <h3>No customers yet</h3>
            <p>Add customers manually or convert won leads into full customer accounts.</p>
            <Link href="/crm/customers/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New Customer
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Stage</th>
                    <th>Owner</th>
                    <th className="text-end">Contacts</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const name = customerDisplayName(c);
                    const initials = getInitials(name);
                    const typeMeta = CUSTOMER_TYPES.find((t) => t.value === c.type) ?? {
                      label: c.type || "Customer",
                      pill: "is-available",
                    };
                    const stageMeta = LIFECYCLE_STAGES.find((s) => s.value === c.lifecycleStage) ?? {
                      label: c.lifecycleStage || "Customer",
                      pill: "is-available",
                    };
                    const ownerLabel = (c.ownerId ? userMap.get(c.ownerId) : null) || "—";
                    const contactCount = c._count?.contacts ?? c.contacts?.length ?? 0;

                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="erp-identity">
                            <span className="erp-initials">{initials}</span>
                            <span>
                              <span className="erp-identity-name">
                                <Link href={`/crm/customers/${c.id}`} className="erp-plain-link">
                                  {name}
                                </Link>
                              </span>
                              <span className="erp-identity-meta">
                                <i className={c.kind === "company" ? "fa-solid fa-building" : "fa-solid fa-user"}></i>{" "}
                                {c.email || c.mobile || c.phone || c.city || "—"}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="erp-cell-strong">{c.code}</td>
                        <td>
                          <span className={`erp-pill ${typeMeta.pill}`}>{typeMeta.label}</span>
                        </td>
                        <td>
                          <span className={`erp-pill ${stageMeta.pill}`}>{stageMeta.label}</span>
                        </td>
                        <td>{ownerLabel}</td>
                        <td className="text-end erp-cell-strong">{contactCount}</td>
                        <td>
                          <span className={`erp-pill ${c.isActive ? "is-available" : "is-neutral"}`}>
                            {c.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <span className="erp-created-by">
                            <span className="erp-cell-strong">{c.ownerName || "System Administrator"}</span>
                            <span className="erp-identity-meta d-block">{formatShortDate(c.createdAt)}</span>
                          </span>
                        </td>
                        <td className="text-end text-nowrap">
                          <Link href={`/crm/customers/${c.id}`} className="btn btn-erp-ghost btn-sm" title="View">
                            <i className="fa-solid fa-eye"></i>
                          </Link>{" "}
                          <Link href={`/crm/customers/${c.id}/edit`} className="btn btn-erp-ghost btn-sm" title="Edit">
                            <i className="fa-solid fa-pen"></i>
                          </Link>{" "}
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(c)}
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

      <div
        className={`modal fade ${deleteTarget ? "show" : ""}`}
        id="deleteRecordModal"
        tabIndex={-1}
        aria-hidden={!deleteTarget}
        style={deleteTarget ? { display: "block", backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
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
                    Delete customer?
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>{deleteTarget ? customerDisplayName(deleteTarget) : ""}</strong> will be
                    removed from active use. The record is retained and can be restored by an administrator.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <form method="POST" data-delete-form onSubmit={handleDelete}>
                <input type="hidden" name="_method" value="DELETE" />
                <button
                  type="submit"
                  className="btn btn-erp"
                  disabled={deleting}
                  style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                >
                  <i className="fa-solid fa-trash-can me-2"></i>Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CrmCustomerForm({
  mode,
  initialData,
  branches = [],
  users = [],
}: {
  mode: "create" | "edit";
  initialData?: CrmCustomerRow;
  branches?: RefBranch[];
  users?: RefUser[];
}) {
  const router = useRouter();
  const initialSocial = parseSocialProfiles(initialData?.socialProfilesJson);

  const [kind, setKind] = useState<string>(initialData?.kind || "individual");
  const [organisationName, setOrganisationName] = useState(initialData?.organisationName || "");
  const [firstName, setFirstName] = useState(initialData?.firstName || "");
  const [lastName, setLastName] = useState(initialData?.lastName || "");
  const [code, setCode] = useState(initialData?.code || "");
  const [type, setType] = useState(initialData?.type || "prospect");
  const [lifecycleStage, setLifecycleStage] = useState(initialData?.lifecycleStage || "lead");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [mobile, setMobile] = useState(initialData?.mobile || "");
  const [website, setWebsite] = useState(initialData?.website || "");
  const [addressLine1, setAddressLine1] = useState(initialData?.addressLine1 || "");
  const [addressLine2, setAddressLine2] = useState(initialData?.addressLine2 || "");
  const [city, setCity] = useState(initialData?.city || "");
  const [stateVal, setStateVal] = useState(initialData?.state || "");
  const [postalCode, setPostalCode] = useState(initialData?.postalCode || "");
  const [country, setCountry] = useState(
    initialData ? normalizeCountryCode(initialData.country) : ""
  );
  const [socialProfiles, setSocialProfiles] = useState<Record<string, string>>({
    linkedin: initialSocial.linkedin || "",
    facebook: initialSocial.facebook || "",
    x: initialSocial.x || "",
    instagram: initialSocial.instagram || "",
    whatsapp: initialSocial.whatsapp || "",
    youtube: initialSocial.youtube || "",
  });
  const [industry, setIndustry] = useState(initialData?.industry || "");
  const [source, setSource] = useState(initialData?.source || "");
  const [branchId, setBranchId] = useState(initialData?.branchId ? String(initialData.branchId) : "");
  const [taxNumber, setTaxNumber] = useState(initialData?.taxNumber || "");
  const [registrationNumber, setRegistrationNumber] = useState(initialData?.registrationNumber || "");
  const [creditLimit, setCreditLimit] = useState(
    initialData?.creditLimit ? String(initialData.creditLimit) : ""
  );
  const [ownerId, setOwnerId] = useState(initialData?.ownerId ? String(initialData.ownerId) : "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (kind === "company" && !organisationName.trim()) {
      setError("Company Name is required for organisation customers.");
      return;
    }
    if (kind === "individual" && !firstName.trim()) {
      setError("First Name is required for individual customers.");
      return;
    }
    if (mode === "edit" && !code.trim()) {
      setError("Customer Code is required.");
      return;
    }

    const cleanedSocial: Record<string, string> = {};
    for (const [k, v] of Object.entries(socialProfiles)) {
      if (v.trim()) cleanedSocial[k] = v.trim();
    }

    setSubmitting(true);
    try {
      const payload = {
        kind,
        organisation_name: organisationName.trim() || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        code: code.trim().toUpperCase() || undefined,
        type,
        lifecycle_stage: lifecycleStage,
        email: email.trim() || null,
        phone: phone.trim() || null,
        mobile: mobile.trim() || null,
        website: website.trim() || null,
        address_line1: addressLine1.trim() || null,
        address_line2: addressLine2.trim() || null,
        city: city.trim() || null,
        state: stateVal.trim() || null,
        postal_code: postalCode.trim() || null,
        country: country || "Bangladesh",
        social_profiles: cleanedSocial,
        industry: industry || null,
        source: source || null,
        branch_id: branchId ? Number(branchId) : null,
        tax_number: taxNumber.trim() || null,
        registration_number: registrationNumber.trim() || null,
        credit_limit: creditLimit ? Number(creditLimit) : 0,
        owner_id: ownerId ? Number(ownerId) : null,
        notes: notes.trim() || null,
        is_active: isActive,
      };
      const url = mode === "edit" && initialData ? `/api/crm/customers/${initialData.id}` : "/api/crm/customers";
      const method = mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to save customer.");
        return;
      }
      if (mode === "edit" && initialData) {
        router.push(`/crm/customers/${initialData.id}`);
      } else {
        router.push("/crm/customers");
      }
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = initialData ? customerDisplayName(initialData) : "New Customer";

  return (
    <div className="container erp-container-form">
      <CrmSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className={mode === "edit" ? "fa-solid fa-pen-to-square" : "fa-solid fa-user-plus"}></i>
          </div>
          <div>
            <h1>{mode === "edit" ? displayName : "New Customer"}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/customers">Customers</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {mode === "edit" ? "Edit" : "New"}
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          {mode === "edit" ? (
            <Link href="/crm/customers" className="btn btn-erp-ghost">
              <i className="fa-solid fa-list me-2"></i>All Customers
            </Link>
          ) : (
            <Link href="/crm/customers" className="btn btn-erp-ghost">
              <i className="fa-solid fa-arrow-left me-2"></i>Back to list
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-3" role="alert" style={{ borderRadius: "9px", fontSize: "12.5px" }}>
          <i className="fa-solid fa-circle-exclamation me-2"></i>
          {error}
        </div>
      )}

      <form
        method="POST"
        action={mode === "edit" && initialData ? `/crm/customers/${initialData.id}` : "/crm/customers"}
        className="erp-form"
        data-erp-org-form
        data-erp-customer-form
        noValidate
        onSubmit={handleSubmit}
      >
        {mode === "edit" && <input type="hidden" name="_method" value="PUT" />}

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-address-card"></i>
            </div>
            <div>
              <h2>Identity</h2>
              <p>Whether this is a person or an organisation decides which name fields apply.</p>
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
                  {mode === "edit"
                    ? "This customer belongs to HQ and stays with it."
                    : "Filed under HQ \u2014 switch companies from the top bar to change this."}
                </span>
              </div>
            </div>

            <div className="erp-field">
              <label className="form-label">
                Customer Kind <span className="erp-required">*</span>
              </label>
              <div className="erp-scope-choices" role="radiogroup" aria-label="Customer kind">
                <label className="erp-scope-choice">
                  <input
                    type="radio"
                    name="kind"
                    value="individual"
                    checked={kind === "individual"}
                    onChange={() => setKind("individual")}
                    data-customer-kind
                  />
                  <span className="erp-scope-choice-body">
                    <i className="fa-solid fa-user"></i>
                    <span>
                      <strong>Individual</strong>
                      <small>A single named person.</small>
                    </span>
                  </span>
                </label>
                <label className="erp-scope-choice">
                  <input
                    type="radio"
                    name="kind"
                    value="company"
                    checked={kind === "company"}
                    onChange={() => setKind("company")}
                    data-customer-kind
                  />
                  <span className="erp-scope-choice-body">
                    <i className="fa-solid fa-building"></i>
                    <span>
                      <strong>Company / Organisation</strong>
                      <small>Named by company; people are added as contacts.</small>
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="row" data-kind-panel="company" hidden={kind !== "company"}>
              <div className="col-md-12">
                <div className="erp-field">
                  <label htmlFor="organisation_name" className="form-label">
                    Company Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="organisation_name"
                    name="organisation_name"
                    className="form-control "
                    value={organisationName}
                    onChange={(e) => setOrganisationName(e.target.value)}
                    maxLength={190}
                    placeholder="Meghna Builders Ltd"
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="first_name" className="form-label">
                    First Name{" "}
                    <span className="erp-required" data-kind-required="individual" hidden={kind !== "individual"}>
                      *
                    </span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className="form-control "
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="last_name" className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className="form-control "
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="code" className="form-label">
                    Customer Code {mode === "edit" && <span className="erp-required">*</span>}
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    className="form-control text-uppercase "
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={20}
                    pattern="[A-Z0-9][A-Z0-9_-]*"
                    data-msg-pattern={mode === "edit" ? "Use letters, numbers, hyphens and underscores only." : undefined}
                    placeholder={mode === "create" ? "Auto" : undefined}
                    required={mode === "edit"}
                  />
                  {mode === "create" && (
                    <span className="erp-help">Left blank, the next number is allocated.</span>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="type" className="form-label">
                    Customer Type <span className="erp-required">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    className="form-select "
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                  >
                    {CUSTOMER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="lifecycle_stage" className="form-label">
                    Lifecycle Stage <span className="erp-required">*</span>
                  </label>
                  <select
                    id="lifecycle_stage"
                    name="lifecycle_stage"
                    className="form-select "
                    value={lifecycleStage}
                    onChange={(e) => setLifecycleStage(e.target.value)}
                    required
                  >
                    {LIFECYCLE_STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
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
              <i className="fa-solid fa-address-book"></i>
            </div>
            <div>
              <h2>Contact Details</h2>
              <p>How to reach this customer.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={150}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={40}
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
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    maxLength={40}
                  />
                </div>
              </div>

              <div className="col-md-12">
                <div className="erp-field">
                  <label htmlFor="website" className="form-label">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    className="form-control "
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    maxLength={190}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="address_line1" className="form-label">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    id="address_line1"
                    name="address_line1"
                    className="form-control "
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    maxLength={190}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="address_line2" className="form-label">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    id="address_line2"
                    name="address_line2"
                    className="form-control "
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    maxLength={190}
                  />
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field mb-md-0">
                  <label htmlFor="city" className="form-label">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    className="form-control "
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field mb-md-0">
                  <label htmlFor="state" className="form-label">
                    State / Division
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    className="form-control "
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="col-md-3">
                <div className="erp-field mb-md-0">
                  <label htmlFor="postal_code" className="form-label">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    className="form-control "
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="col-md-3">
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
                    {COUNTRIES.map(([cCode, cName]) => (
                      <option key={cCode} value={cCode}>
                        {cName}
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
              <i className="fa-solid fa-share-nodes"></i>
            </div>
            <div>
              <h2>Social Profiles</h2>
              <p>Optional. Blank handles are not stored.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              {SOCIAL_FIELDS.map((sf) => (
                <div key={sf.key} className="col-md-4">
                  <div className="erp-field mb-3">
                    <label htmlFor={sf.id} className="form-label">
                      <i className={`${sf.icon} me-1`}></i>
                      {sf.label}
                    </label>
                    <input
                      type="text"
                      id={sf.id}
                      name={`social_profiles[${sf.key}]`}
                      className="form-control "
                      value={socialProfiles[sf.key] || ""}
                      onChange={(e) =>
                        setSocialProfiles((prev) => ({ ...prev, [sf.key]: e.target.value }))
                      }
                      maxLength={190}
                      placeholder="Profile URL or handle"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-tags"></i>
            </div>
            <div>
              <h2>Classification</h2>
              <p>Industry, source and segmentation tags.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="industry" className="form-label">
                    Industry
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    className="form-select "
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">Not set</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind.value} value={ind.value}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="source" className="form-label">
                    Source
                  </label>
                  <select
                    id="source"
                    name="source"
                    className="form-select "
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="">Not set</option>
                    {SOURCES.map((src) => (
                      <option key={src.value} value={src.value}>
                        {src.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
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

            <div className="erp-field mb-0">
              <label className="form-label">Tags</label>
              <p className="text-muted mb-0" style={{ fontSize: "12.5px" }}>
                No tags defined for this company yet. Tags are used for segmentation &mdash; high value, VIP, apartment
                buyer, and so on.
              </p>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <div>
              <h2>Commercial</h2>
              <p>Registration, tax and account ownership.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="tax_number" className="form-label">
                    Tax / VAT Number
                  </label>
                  <input
                    type="text"
                    id="tax_number"
                    name="tax_number"
                    className="form-control "
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    maxLength={60}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="registration_number" className="form-label">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    id="registration_number"
                    name="registration_number"
                    className="form-control "
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    maxLength={60}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="credit_limit" className="form-label">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    id="credit_limit"
                    name="credit_limit"
                    min={0}
                    step="0.01"
                    className="form-control "
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field mb-md-0">
                  <label htmlFor="owner_id" className="form-label">
                    Account Owner
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

              <div className="col-md-6">
                <div className="erp-field mb-md-0">
                  <label htmlFor="notes" className="form-label">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="form-control "
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={5000}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-toggle-on"></i>
            </div>
            <div>
              <h2>Status</h2>
              <p>Inactive customers stay on file but drop out of pickers.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-switch-row">
              <div>
                <h6>Active</h6>
                <p>Available for quotations, orders and campaigns.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="is_active"
                  name="is_active"
                  value="1"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
              </div>
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
              href={mode === "edit" && initialData ? `/crm/customers/${initialData.id}` : "/crm/customers"}
              className="btn btn-erp-ghost"
            >
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" data-submit-button disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {mode === "edit" ? "Save Changes" : "Create Customer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function CrmCustomerDetail({
  customer: initialCustomer,
  followups = [],
  branches = [],
  users = [],
}: {
  customer: CrmCustomerRow;
  followups?: CustomerFollowUpRef[];
  branches?: RefBranch[];
  users?: RefUser[];
}) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CrmCustomerRow>(initialCustomer);
  const [contacts, setContacts] = useState<CrmContactRow[]>(initialCustomer.contacts ?? []);

  const [savedNotes, setSavedNotes] = useState(initialCustomer.notes || "");
  const [notesVal, setNotesVal] = useState(initialCustomer.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const notesDirty = notesVal !== savedNotes;

  const initialComms = useMemo(() => {
    const list: CommEntry[] = [];
    for (const f of followups) {
      const parsed = parseCommFromFollowUp(f, initialCustomer.id);
      if (parsed) list.push(parsed);
    }
    return list;
  }, [followups, initialCustomer.id]);

  const [commEntries, setCommEntries] = useState<CommEntry[]>(initialComms);
  const [commModalOpen, setCommModalOpen] = useState(false);
  const [editingCommId, setEditingCommId] = useState<number | null>(null);
  const [commMethod, setCommMethod] = useState("phone_call");
  const [commDirection, setCommDirection] = useState("outbound");
  const [commOccurred, setCommOccurred] = useState(() => new Date().toISOString().slice(0, 16));
  const [commDuration, setCommDuration] = useState("");
  const [commSubject, setCommSubject] = useState("");
  const [commHeldBy, setCommHeldBy] = useState("");
  const [commNotes, setCommNotes] = useState("");
  const [savingComm, setSavingComm] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "contact"; id: number; name: string }
    | { kind: "comm"; id: number; name: string }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const displayName = customerDisplayName(customer);
  const initials = getInitials(displayName);
  const typeMeta = CUSTOMER_TYPES.find((t) => t.value === customer.type) ?? {
    label: customer.type || "Customer",
    pill: "is-available",
  };
  const stageMeta = LIFECYCLE_STAGES.find((s) => s.value === customer.lifecycleStage) ?? {
    label: customer.lifecycleStage || "Customer",
    pill: "is-available",
  };
  const industryLabel = INDUSTRIES.find((i) => i.value === customer.industry)?.label || "";
  const sourceLabel = SOURCES.find((s) => s.value === customer.source)?.label || customer.source || "";
  const branchName = branches.find((b) => b.id === customer.branchId)?.name || "";
  const ownerName = users.find((u) => u.id === customer.ownerId)?.name || "";
  const addressParts = [
    customer.addressLine1,
    customer.addressLine2,
    customer.city,
    customer.state,
    customer.postalCode,
    resolveCountryLabel(customer.country),
  ].filter(Boolean);
  const fullAddress = addressParts.join(", ");

  const activeCommMethodMeta = COMM_METHODS.find((m) => m.value === commMethod);
  const showCommDuration = Boolean(activeCommMethodMeta?.duration);

  function openNewCommModal() {
    setEditingCommId(null);
    setCommMethod("phone_call");
    setCommDirection("outbound");
    setCommOccurred(new Date().toISOString().slice(0, 16));
    setCommDuration("");
    setCommSubject("");
    setCommHeldBy("");
    setCommNotes("");
    setCommModalOpen(true);
  }

  function openEditCommModal(entry: CommEntry) {
    setEditingCommId(entry.id);
    setCommMethod(entry.method);
    setCommDirection(entry.direction);
    setCommOccurred(entry.occurredAt.slice(0, 16));
    setCommDuration(entry.durationMinutes ? String(entry.durationMinutes) : "");
    setCommSubject(entry.subject);
    const matchedUser = users.find((u) => u.name === entry.heldBy);
    setCommHeldBy(matchedUser ? String(matchedUser.id) : "");
    setCommNotes(entry.notes);
    setCommModalOpen(true);
  }

  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    if (!notesDirty) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/crm/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesVal.trim() || null }),
      });
      if (res.ok) {
        setSavedNotes(notesVal);
        setCustomer((prev) => ({ ...prev, notes: notesVal }));
        router.refresh();
      }
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleSaveComm(e: React.FormEvent) {
    e.preventDefault();
    if (!commSubject.trim() || !commOccurred) return;
    setSavingComm(true);
    const heldByUser = users.find((u) => String(u.id) === commHeldBy);
    const heldByName = heldByUser?.name || "";
    const durationVal = showCommDuration && commDuration ? Number(commDuration) : null;
    const encodedDesc = encodeCommDescription({
      method: commMethod,
      direction: commDirection,
      durationMinutes: durationVal,
      heldBy: heldByName,
      notes: commNotes.trim(),
    });
    const methodMeta = COMM_METHODS.find((m) => m.value === commMethod);

    try {
      const payload = {
        subject: commSubject.trim(),
        follow_up_type_id: methodMeta?.typeId ?? 1,
        priority: "medium",
        description: encodedDesc,
        scheduled_date: commOccurred.slice(0, 10),
        scheduled_time: commOccurred.slice(11, 16),
        duration_minutes: durationVal ?? 15,
        concerns: `customer:${customer.id}`,
        assigned_to: heldByName || "System Administrator",
        status: "completed",
      };
      const url = editingCommId ? `/api/crm/followups/${editingCommId}` : "/api/crm/followups";
      const method = editingCommId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        const savedId = data.row?.id ?? editingCommId ?? Date.now();
        const newEntry: CommEntry = {
          id: savedId,
          method: commMethod,
          direction: commDirection,
          occurredAt: commOccurred,
          durationMinutes: durationVal,
          subject: commSubject.trim(),
          heldBy: heldByName,
          notes: commNotes.trim(),
        };
        if (editingCommId) {
          setCommEntries((prev) => prev.map((c) => (c.id === editingCommId ? newEntry : c)));
        } else {
          setCommEntries((prev) => [newEntry, ...prev]);
        }
        setCommModalOpen(false);
        router.refresh();
      }
    } finally {
      setSavingComm(false);
    }
  }

  async function handleConfirmDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const endpoint =
        deleteTarget.kind === "contact"
          ? `/api/crm/contacts/${deleteTarget.id}`
          : `/api/crm/followups/${deleteTarget.id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (res.ok) {
        if (deleteTarget.kind === "contact") {
          setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        } else {
          setCommEntries((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        }
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <CrmSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className={customer.kind === "company" ? "fa-solid fa-building" : "fa-solid fa-user"}></i>
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
                  <Link href="/crm/customers">Customers</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {customer.code}
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="erp-pagehead-actions">
          <Link href="/crm/customers" className="btn btn-erp-ghost">
            <i className="fa-solid fa-list me-2"></i>All Customers
          </Link>
          <Link href={`/crm/followups/create?customer_id=${customer.id}`} className="btn btn-erp-ghost">
            <i className="fa-solid fa-list-check me-2"></i>Follow-up
          </Link>
          <Link href={`/crm/customers/${customer.id}/edit`} className="btn btn-erp">
            <i className="fa-solid fa-pen me-2"></i>Edit
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-rec-head">
          <span className="erp-rec-avatar">{initials}</span>
          <div className="erp-rec-id">
            <h2>{displayName}</h2>
            <p>{industryLabel || "No industry set"}</p>
            <div className="erp-rec-pills">
              <span className={`erp-pill ${customer.isActive ? "is-available" : "is-neutral"}`}>
                {customer.isActive ? "Active" : "Inactive"}
              </span>
              <span className={`erp-pill ${typeMeta.pill}`}>{typeMeta.label}</span>
              <span className={`erp-pill ${stageMeta.pill}`}>{stageMeta.label}</span>
              <span className="erp-pill is-neutral">{customer.code}</span>
            </div>
          </div>
        </div>

        <div className="erp-rec-metrics">
          <div className="erp-rec-metric">
            <strong>{contacts.length}</strong>
            <small>Contacts</small>
          </div>
          <div className="erp-rec-metric">
            <strong>{customer.kind === "company" ? "Company" : "Individual"}</strong>
            <small>Kind</small>
          </div>
          <div className="erp-rec-metric">
            <strong>0</strong>
            <small>Tags</small>
          </div>
          <div className="erp-rec-metric">
            <strong>{formatShortDate(customer.createdAt)}</strong>
            <small>Customer since</small>
          </div>
        </div>

        <div className="erp-rec-section">
          <div className="erp-rec-section-head">
            <h3>Contact</h3>
          </div>
          <div className="erp-deflist">
            <div className="erp-def">
              <span className="erp-def-label">Email</span>
              <span className={`erp-def-value ${customer.email ? "" : "is-empty"}`}>
                {customer.email ? <a href={`mailto:${customer.email}`}>{customer.email}</a> : "—"}
              </span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Phone</span>
              <span className={`erp-def-value ${customer.phone ? "" : "is-empty"}`}>{customer.phone || "—"}</span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Mobile</span>
              <span className={`erp-def-value ${customer.mobile ? "" : "is-empty"}`}>{customer.mobile || "—"}</span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Website</span>
              <span className={`erp-def-value ${customer.website ? "" : "is-empty"}`}>
                {customer.website ? (
                  <a href={customer.website} target="_blank" rel="noreferrer">
                    {customer.website}
                  </a>
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className="erp-def is-wide">
              <span className="erp-def-label">Address</span>
              <span className={`erp-def-value ${fullAddress ? "" : "is-empty"}`}>{fullAddress || "—"}</span>
            </div>
          </div>
        </div>

        <div className="erp-rec-section">
          <div className="erp-rec-section-head">
            <h3>Classification</h3>
          </div>
          <div className="erp-deflist">
            <div className="erp-def">
              <span className="erp-def-label">Type</span>
              <span className="erp-def-value">{typeMeta.label}</span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Lifecycle stage</span>
              <span className="erp-def-value">{stageMeta.label}</span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Industry</span>
              <span className={`erp-def-value ${industryLabel ? "" : "is-empty"}`}>{industryLabel || "—"}</span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Source</span>
              <span className={`erp-def-value ${sourceLabel ? "" : "is-empty"}`}>{sourceLabel || "—"}</span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Branch</span>
              <span className={`erp-def-value ${branchName ? "" : "is-empty"}`}>{branchName || "—"}</span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Account owner</span>
              <span className={`erp-def-value ${ownerName ? "" : "is-empty"}`}>{ownerName || "—"}</span>
            </div>
          </div>
        </div>

        <div className="erp-rec-section">
          <div className="erp-rec-section-head">
            <h3>Commercial</h3>
          </div>
          <div className="erp-deflist">
            <div className="erp-def">
              <span className="erp-def-label">Tax / VAT</span>
              <span className={`erp-def-value ${customer.taxNumber ? "" : "is-empty"}`}>
                {customer.taxNumber || "—"}
              </span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Registration</span>
              <span className={`erp-def-value ${customer.registrationNumber ? "" : "is-empty"}`}>
                {customer.registrationNumber || "—"}
              </span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Credit limit</span>
              <span className={`erp-def-value ${customer.creditLimit > 0 ? "" : "is-empty"}`}>
                {customer.creditLimit > 0 ? customer.creditLimit.toLocaleString() : "—"}
              </span>
            </div>
            <div className="erp-def">
              <span className="erp-def-label">Added</span>
              <span className="erp-def-value">{formatShortDate(customer.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="erp-rec-section">
          <div className="erp-rec-section-head">
            <h3>Contact Persons</h3>
            <Link href={`/crm/customers/${customer.id}/contacts/create`} className="btn btn-erp-ghost btn-sm">
              <i className="fa-solid fa-plus me-1"></i>Add
            </Link>
          </div>

          {contacts.length === 0 ? (
            <p className="text-muted mb-0" style={{ fontSize: "12.5px" }}>
              No contact persons yet.{" "}
              <Link href={`/crm/customers/${customer.id}/contacts/create`}>Add the first one.</Link>
            </p>
          ) : (
            <div>
              {contacts.map((ct) => {
                const cName = `${ct.firstName} ${ct.lastName ?? ""}`.trim();
                const roleLabel = CONTACT_ROLES.find((r) => r.value === ct.role)?.label || ct.role;
                const metaParts = [ct.jobTitle || roleLabel, ct.department, ct.email, ct.mobile || ct.phone].filter(
                  Boolean
                );
                return (
                  <div key={ct.id} className="erp-person">
                    <span className="erp-person-avatar">{getInitials(cName)}</span>
                    <div className="erp-person-body">
                      <strong>
                        {cName}{" "}
                        {ct.isPrimary && <span className="erp-pill is-available ms-1">Primary</span>}
                        {!ct.isActive && <span className="erp-pill is-neutral ms-1">Inactive</span>}
                      </strong>
                      <small>{metaParts.join(" · ") || "—"}</small>
                    </div>
                    <div className="erp-person-actions">
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm text-danger"
                        title="Delete contact"
                        onClick={() => setDeleteTarget({ kind: "contact", id: ct.id, name: cName })}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="erp-rec-section">
          <div className="erp-rec-section-head">
            <h3>Notes</h3>
            <span className="erp-note-hint" data-note-hint hidden={!notesDirty}>
              Unsaved changes
            </span>
          </div>

          <form method="POST" data-note-form onSubmit={handleSaveNotes}>
            <input type="hidden" name="_method" value="PATCH" />
            <textarea
              name="notes"
              rows={4}
              maxLength={5000}
              className="form-control "
              placeholder="Anything the team should know — what was agreed, what to chase next…"
              data-note-input
              value={notesVal}
              onChange={(e) => setNotesVal(e.target.value)}
            />
            <div className="erp-note-actions">
              <button
                type="button"
                className="btn btn-erp-ghost btn-sm"
                data-note-reset
                disabled={!notesDirty}
                onClick={() => setNotesVal(savedNotes)}
              >
                Revert
              </button>
              <button
                type="submit"
                className="btn btn-erp btn-sm"
                data-note-save
                disabled={!notesDirty || savingNotes}
              >
                <i className="fa-solid fa-floppy-disk me-1"></i>
                {savingNotes ? "Saving…" : "Save Notes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-rec-head">
          <span className="erp-rec-avatar" style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
            <i className="fa-solid fa-comments"></i>
          </span>
          <div className="erp-rec-id">
            <h2>Communication Log</h2>
            <p>
              {commEntries.length} {commEntries.length === 1 ? "entry" : "entries"} recorded
            </p>
          </div>
          <button
            type="button"
            className="btn btn-erp btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#communicationModal"
            data-comm-new
            onClick={openNewCommModal}
          >
            <i className="fa-solid fa-plus me-1"></i>Log Communication
          </button>
        </div>

        <div className="erp-rec-section">
          {commEntries.length === 0 ? (
            <p className="text-muted mb-0" style={{ fontSize: "12.5px" }}>
              No communication recorded yet. Log the first call, email or meeting to start the history.
            </p>
          ) : (
            <div>
              {commEntries.map((entry) => {
                const mMeta = COMM_METHODS.find((m) => m.value === entry.method) ?? COMM_METHODS[6];
                return (
                  <div key={entry.id} className="erp-comm">
                    <span className="erp-comm-icon erp-pill is-neutral">
                      <i className={mMeta.icon}></i>
                    </span>
                    <div className="erp-comm-body">
                      <strong>{entry.subject}</strong>
                      <div className="erp-comm-meta">
                        <span>{mMeta.label}</span>
                        <span>{entry.direction === "inbound" ? "They contacted us" : "We contacted them"}</span>
                        <span>{entry.occurredAt.replace("T", " ")}</span>
                        {entry.durationMinutes ? <span>{entry.durationMinutes} min</span> : null}
                        {entry.heldBy ? <span>Held by {entry.heldBy}</span> : null}
                      </div>
                      {entry.notes && <p className="erp-comm-notes">{entry.notes}</p>}
                    </div>
                    <div className="erp-comm-actions">
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        title="Edit"
                        onClick={() => openEditCommModal(entry)}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>{" "}
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm text-danger"
                        title="Delete"
                        onClick={() => setDeleteTarget({ kind: "comm", id: entry.id, name: entry.subject })}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div
        className={`modal fade ${commModalOpen ? "show" : ""}`}
        id="communicationModal"
        tabIndex={-1}
        aria-hidden={!commModalOpen}
        style={commModalOpen ? { display: "block", backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            className="modal-content"
            style={{ border: "none", borderRadius: "14px" }}
            data-comm-form
            onSubmit={handleSaveComm}
          >
            <input type="hidden" name="_method" value={editingCommId ? "PATCH" : "POST"} data-comm-verb />
            <input type="hidden" name="entry_id" value={editingCommId ?? ""} data-comm-entry />

            <div className="modal-body p-4">
              <h5 className="mb-3" style={{ fontSize: "16px", fontWeight: 600 }} data-comm-title>
                {editingCommId ? "Edit communication" : "Log communication"}
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
                      data-comm-method
                      value={commMethod}
                      onChange={(e) => setCommMethod(e.target.value)}
                      required
                    >
                      {COMM_METHODS.map((m) => (
                        <option key={m.value} value={m.value} data-duration={m.duration ? "1" : "0"}>
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
                      data-comm-direction
                      value={commDirection}
                      onChange={(e) => setCommDirection(e.target.value)}
                      required
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
                      value={commOccurred}
                      onChange={(e) => setCommOccurred(e.target.value)}
                      data-comm-occurred
                      required
                    />
                    <span className="erp-help">Your local time (Asia/Dhaka).</span>
                  </div>
                </div>

                <div className="col-md-5" data-comm-duration-wrap hidden={!showCommDuration}>
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
                      data-comm-duration
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
                      value={commSubject}
                      onChange={(e) => setCommSubject(e.target.value)}
                      data-comm-subject
                      required
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
                      data-comm-held
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
                      data-comm-notes
                      value={commNotes}
                      onChange={(e) => setCommNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setCommModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" disabled={savingComm}>
                <i className="fa-solid fa-floppy-disk me-2"></i>
                <span data-comm-submit>
                  {savingComm ? "Saving…" : editingCommId ? "Save Changes" : "Log Communication"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className={`modal fade ${deleteTarget ? "show" : ""}`}
        id="deleteRecordModal"
        tabIndex={-1}
        aria-hidden={!deleteTarget}
        style={deleteTarget ? { display: "block", backgroundColor: "rgba(15, 23, 42, 0.45)" } : undefined}
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
                    {deleteTarget?.kind === "comm" ? "Delete communication?" : "Delete contact?"}
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    <strong data-delete-name>{deleteTarget?.name}</strong> will be removed from active use. The record is
                    retained and can be restored by an administrator.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <form method="POST" data-delete-form onSubmit={handleConfirmDelete}>
                <input type="hidden" name="_method" value="DELETE" />
                <button
                  type="submit"
                  className="btn btn-erp"
                  disabled={deleting}
                  style={{ background: "var(--erp-danger)", borderColor: "var(--erp-danger)" }}
                >
                  <i className="fa-solid fa-trash-can me-2"></i>Delete
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CrmContactCreateForm({ customer }: { customer: CrmCustomerRow }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("other");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [socialProfiles, setSocialProfiles] = useState<Record<string, string>>({
    linkedin: "",
    facebook: "",
    x: "",
    instagram: "",
    whatsapp: "",
    youtube: "",
  });
  const [notes, setNotes] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const customerName = customerDisplayName(customer);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!firstName.trim()) {
      setError("First Name is required.");
      return;
    }

    const cleanedSocial: Record<string, string> = {};
    for (const [k, v] of Object.entries(socialProfiles)) {
      if (v.trim()) cleanedSocial[k] = v.trim();
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          role,
          job_title: jobTitle.trim() || null,
          department: department.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          mobile: mobile.trim() || null,
          social_profiles: cleanedSocial,
          notes: notes.trim() || null,
          is_primary: isPrimary,
          is_active: isActive,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to add contact.");
        return;
      }
      router.push(`/crm/customers/${customer.id}`);
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
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div>
            <h1>Add Contact</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">CRM</li>
                <li className="breadcrumb-item">
                  <Link href="/crm/customers">Customers</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href={`/crm/customers/${customer.id}`}>{customerName}</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href={`/crm/customers/${customer.id}`} className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to customer
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-3" role="alert" style={{ borderRadius: "9px", fontSize: "12.5px" }}>
          <i className="fa-solid fa-circle-exclamation me-2"></i>
          {error}
        </div>
      )}

      <form
        method="POST"
        action={`/crm/customers/${customer.id}/contacts`}
        className="erp-form"
        data-erp-org-form
        noValidate
        onSubmit={handleSubmit}
      >
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-user"></i>
            </div>
            <div>
              <h2>Person</h2>
              <p>A named contact at {customerName}.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="first_name" className="form-label">
                    First Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    className="form-control "
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="last_name" className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    className="form-control "
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="role" className="form-label">
                    Role <span className="erp-required">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="form-select "
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    {CONTACT_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="job_title" className="form-label">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="job_title"
                    name="job_title"
                    className="form-control "
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    maxLength={150}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="department" className="form-label">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    className="form-control "
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    maxLength={150}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={150}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="phone" className="form-label">
                    Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    className="form-control "
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={40}
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="erp-field mb-md-0">
                  <label htmlFor="mobile" className="form-label">
                    Mobile
                  </label>
                  <input
                    type="text"
                    id="mobile"
                    name="mobile"
                    className="form-control "
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    maxLength={40}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-share-nodes"></i>
            </div>
            <div>
              <h2>Social Profiles</h2>
              <p>Optional.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              {SOCIAL_FIELDS.map((sf) => (
                <div key={sf.key} className="col-md-4">
                  <div className="erp-field mb-3">
                    <label htmlFor={sf.id} className="form-label">
                      <i className={`${sf.icon} me-1`}></i>
                      {sf.label}
                    </label>
                    <input
                      type="text"
                      id={sf.id}
                      name={`social_profiles[${sf.key}]`}
                      className="form-control "
                      value={socialProfiles[sf.key] || ""}
                      onChange={(e) =>
                        setSocialProfiles((prev) => ({ ...prev, [sf.key]: e.target.value }))
                      }
                      maxLength={190}
                      placeholder="Profile URL or handle"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="erp-field mb-0">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                className="form-control "
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
              />
            </div>
          </div>
        </section>

        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-toggle-on"></i>
            </div>
            <div>
              <h2>Status</h2>
              <p>One contact per customer is the primary point of address.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-switch-row">
              <div>
                <h6>Primary contact</h6>
                <p>The default person to address. Turning this on demotes whoever currently holds it.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="is_primary"
                  name="is_primary"
                  value="1"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                />
              </div>
            </div>

            <div className="erp-switch-row">
              <div>
                <h6>Active</h6>
                <p>Inactive contacts stay on file but drop out of pickers.</p>
              </div>
              <div className="form-check form-switch">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="is_active"
                  name="is_active"
                  value="1"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required.
          </span>
          <div className="erp-form-bar-actions">
            <Link href={`/crm/customers/${customer.id}`} className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" data-submit-button disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>Add Contact
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
