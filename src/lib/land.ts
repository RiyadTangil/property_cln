export interface StageMeta {
  value: string;
  label: string;
  icon: string;
  tone: string;
  pillClass: string;
}

export const PIPELINE_STAGES: StageMeta[] = [
  {
    value: "prospect",
    label: "Prospect",
    icon: "fa-magnifying-glass-location",
    tone: "is-tone-slate",
    pillClass: "is-neutral",
  },
  {
    value: "under_verification",
    label: "Under Verification",
    icon: "fa-scale-balanced",
    tone: "is-tone-indigo",
    pillClass: "is-booked",
  },
  {
    value: "verified",
    label: "Legally Verified",
    icon: "fa-shield-halved",
    tone: "is-tone-blue",
    pillClass: "is-booked",
  },
  {
    value: "valued",
    label: "Valued",
    icon: "fa-money-bill-trend-up",
    tone: "is-tone-cyan",
    pillClass: "is-booked",
  },
  {
    value: "proposal_submitted",
    label: "Proposal Submitted",
    icon: "fa-paper-plane",
    tone: "is-tone-violet",
    pillClass: "is-hold",
  },
  {
    value: "proposal_approved",
    label: "Proposal Approved",
    icon: "fa-circle-check",
    tone: "is-tone-purple",
    pillClass: "is-booked",
  },
  {
    value: "agreement_signed",
    label: "Agreement Signed",
    icon: "fa-file-signature",
    tone: "is-tone-amber",
    pillClass: "is-hold",
  },
  {
    value: "payment_in_progress",
    label: "Payment In Progress",
    icon: "fa-hand-holding-dollar",
    tone: "is-tone-orange",
    pillClass: "is-hold",
  },
  {
    value: "registered",
    label: "Registered",
    icon: "fa-stamp",
    tone: "is-tone-teal",
    pillClass: "is-available",
  },
  {
    value: "owned",
    label: "Owned — Land Bank",
    icon: "fa-landmark",
    tone: "is-tone-green",
    pillClass: "is-available",
  },
];

export const EXTRA_STAGES: StageMeta[] = [
  {
    value: "on_hold",
    label: "On Hold",
    icon: "fa-pause-circle",
    tone: "is-tone-amber",
    pillClass: "is-hold",
  },
  {
    value: "rejected",
    label: "Rejected",
    icon: "fa-circle-xmark",
    tone: "is-tone-slate",
    pillClass: "is-overdue",
  },
  {
    value: "dropped",
    label: "Dropped",
    icon: "fa-ban",
    tone: "is-tone-slate",
    pillClass: "is-overdue",
  },
];

export const ALL_STAGES = [...PIPELINE_STAGES, ...EXTRA_STAGES];

export const LAND_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "agricultural", label: "Agricultural" },
  { value: "industrial", label: "Industrial" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "homestead", label: "Homestead (Bastu)" },
  { value: "pond", label: "Pond / Water Body" },
  { value: "fallow", label: "Fallow (Patit)" },
  { value: "khas", label: "Khas (Government)" },
  { value: "other", label: "Other" },
];

export const AREA_UNITS: { value: string; label: string; toSqft: number }[] = [
  { value: "sqft", label: "Square Feet", toSqft: 1 },
  { value: "sqm", label: "Square Metre", toSqft: 10.7639 },
  { value: "chatak", label: "Chatak", toSqft: 45 },
  { value: "katha", label: "Katha", toSqft: 720 },
  { value: "decimal", label: "Decimal (Shatak)", toSqft: 435.6 },
  { value: "bigha", label: "Bigha", toSqft: 14400 },
  { value: "acre", label: "Acre", toSqft: 43560 },
  { value: "hectare", label: "Hectare", toSqft: 107639 },
];

export const SQFT_MULTIPLIER: Record<string, number> = Object.fromEntries(
  AREA_UNITS.map((u) => [u.value, u.toSqft])
);

export function convertToSqft(value: number, unit: string): number {
  const factor = SQFT_MULTIPLIER[unit] ?? 1;
  return Number((value * factor).toFixed(2));
}

export function sqftToKatha(sqft: number): number {
  return Number((sqft / 720).toFixed(4));
}

export const LAND_SOURCES = [
  { value: "direct", label: "Direct from owner" },
  { value: "broker", label: "Broker / agent" },
  { value: "auction", label: "Auction" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
];

export const OWNER_KINDS = [
  {
    value: "individual",
    label: "Individual",
    icon: "fa-user",
    parentage: true,
    registration: false,
    succession: false,
  },
  {
    value: "company",
    label: "Company / Firm",
    icon: "fa-building",
    parentage: false,
    registration: true,
    succession: false,
  },
  {
    value: "trust",
    label: "Trust / Waqf",
    icon: "fa-mosque",
    parentage: false,
    registration: true,
    succession: false,
  },
  {
    value: "heir_group",
    label: "Heirs (Succession)",
    icon: "fa-users",
    parentage: true,
    registration: false,
    succession: true,
  },
  {
    value: "government",
    label: "Government Body",
    icon: "fa-landmark-flag",
    parentage: false,
    registration: false,
    succession: false,
  },
];

export const PROPOSAL_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Pending Approval" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "revision_required", label: "Revision Required" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "executed", label: "Executed" },
];

export const AGREEMENT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
  { value: "cancelled", label: "Cancelled" },
];

export const AGREEMENT_TYPES = [
  { value: "mou", label: "MOU (Memorandum of Understanding)" },
  { value: "sale_agreement", label: "Sale Agreement (Bainanama)" },
  { value: "power_of_attorney", label: "Power of Attorney" },
  { value: "joint_venture", label: "Developer Joint Venture" },
  { value: "lease", label: "Lease Agreement" },
];

export const PAYMENT_DIRECTIONS = [
  { value: "payout", label: "Payout to Landowner" },
  { value: "collection", label: "Collection from Investor" },
];

export const PAYMENT_TYPES = [
  { value: "advance", label: "Advance / Earnest Money", direction: "payout" },
  { value: "installment", label: "Installment", direction: "payout" },
  { value: "final_settlement", label: "Final Settlement", direction: "payout" },
  { value: "registration_cost", label: "Registration & Stamp Duty", direction: "payout" },
  { value: "other_cost", label: "Other Acquisition Cost", direction: "payout" },
  { value: "refund", label: "Refund from Owner", direction: "collection" },
  { value: "forfeiture", label: "Advance Forfeited", direction: "collection" },
  { value: "investor_contribution", label: "Investor Contribution", direction: "collection" },
  { value: "investor_refund", label: "Investor Refund", direction: "payout" },
];

export const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer / EFT / RTGS" },
  { value: "cheque", label: "Cheque" },
  { value: "pay_order", label: "Pay Order / DD" },
  { value: "cash", label: "Cash" },
  { value: "mfs", label: "MFS (bKash / Nagad)" },
];

export const PAYMENT_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "posted", label: "Posted" },
  { value: "cancelled", label: "Cancelled" },
];

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function getStageMeta(stage: string): StageMeta {
  return (
    ALL_STAGES.find((s) => s.value === stage) ?? {
      value: stage,
      label: stage,
      icon: "fa-circle-dot",
      tone: "is-tone-slate",
      pillClass: "is-neutral",
    }
  );
}

export function getLabel(list: { value: string; label: string }[], value: string): string {
  return list.find((item) => item.value === value)?.label ?? value;
}
