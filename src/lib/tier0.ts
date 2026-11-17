import { prisma } from "./prisma";

export const BRANCH_TYPES = [
  { value: "head_office", label: "Head Office" },
  { value: "regional_office", label: "Regional Office" },
  { value: "sales_center", label: "Sales Centre" },
  { value: "site_office", label: "Site Office" },
  { value: "warehouse", label: "Store / Warehouse" },
  { value: "branch", label: "Branch" },
];

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "consultant", label: "Consultant" },
  { value: "intern", label: "Intern" },
  { value: "daily_labour", label: "Daily Labour" },
];

export const DESIGNATION_GRADES = [
  { value: "1", label: "Grade 1 — Executive Board" },
  { value: "2", label: "Grade 2 — Director" },
  { value: "3", label: "Grade 3 — General Manager" },
  { value: "4", label: "Grade 4 — Manager" },
  { value: "5", label: "Grade 5 — Assistant Manager" },
  { value: "6", label: "Grade 6 — Senior Officer" },
  { value: "7", label: "Grade 7 — Officer" },
  { value: "8", label: "Grade 8 — Junior Officer" },
  { value: "9", label: "Grade 9 — Support Staff" },
];

export const FISCAL_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "locked", label: "Locked" },
];

export const HOLIDAY_TYPES = [
  { value: "public", label: "Public Holiday" },
  { value: "national", label: "National Day" },
  { value: "religious", label: "Religious" },
  { value: "company", label: "Company Holiday" },
  { value: "optional", label: "Optional / Restricted" },
  { value: "compensatory", label: "Compensatory Off" },
];

export const WEEKDAYS = [
  { value: "mon", label: "Mon", tag: "Weekday" },
  { value: "tue", label: "Tue", tag: "Weekday" },
  { value: "wed", label: "Wed", tag: "Weekday" },
  { value: "thu", label: "Thu", tag: "Weekday" },
  { value: "fri", label: "Fri", tag: "Weekend" },
  { value: "sat", label: "Sat", tag: "Weekend" },
  { value: "sun", label: "Sun", tag: "Weekend" },
];

export const DOCUMENT_MODULES = [
  { value: "project", label: "Project" },
  { value: "project_task", label: "Task" },
  { value: "project_estimate", label: "Project Estimate" },
  { value: "building_design", label: "Building Design" },
  { value: "approval_drawing", label: "Approval Drawing" },
  { value: "building", label: "Building" },
  { value: "building_floor", label: "Floor" },
  { value: "building_unit", label: "Unit" },
  { value: "land_parcel", label: "Land Parcel" },
  { value: "land_owner", label: "Landowner" },
  { value: "land_valuation", label: "Land Valuation" },
  { value: "land_proposal", label: "Acquisition Proposal" },
  { value: "land_agreement", label: "Land Agreement" },
  { value: "land_payment", label: "Land Payment" },
  { value: "land_registration", label: "Land Registration" },
  { value: "land_shareholder", label: "Land Investor" },
  { value: "engineering_assessment", label: "Engineering Assessment" },
  { value: "apartment_sale", label: "Apartment Sale" },
  { value: "payment", label: "Money Receipt" },
  { value: "client", label: "Client" },
  { value: "owner", label: "Owner" },
  { value: "development_agreement", label: "Development Agreement" },
  { value: "equipment", label: "Equipment" },
  { value: "equipment_work_order", label: "Equipment Work Order" },
  { value: "equipment_inspection", label: "Equipment Inspection" },
  { value: "equipment_rental", label: "Equipment Hire Contract" },
];

export const TEMPLATE_TYPES = [
  { value: "sale", label: "Sales / POS Invoice" },
  { value: "purchase", label: "Purchase Order" },
  { value: "requisition", label: "Purchase Requisition" },
  { value: "work_order", label: "Contractor Work Order" },
];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatSequenceCode(seq: {
  prefix: string;
  suffix: string;
  separator: string;
  padding: number;
  nextNumber: number;
  yearInCode: boolean;
}): string {
  const sep = seq.separator ?? "-";
  const num = String(seq.nextNumber).padStart(Math.max(1, seq.padding), "0");
  const parts: string[] = [];
  if (seq.prefix) parts.push(seq.prefix);
  if (seq.yearInCode) parts.push("2026");
  parts.push(num);
  const core = parts.join(sep);
  return seq.suffix ? `${core}${sep}${seq.suffix}` : core;
}

export async function allocateSequenceCode(
  key: string,
  fallbackPrefix: string
): Promise<string> {
  const seq = await prisma.codeSequence.findUnique({ where: { key } });
  if (!seq) {
    return `${fallbackPrefix}-2026-${String(Date.now()).slice(-4)}`;
  }
  const code = formatSequenceCode(seq);
  await prisma.codeSequence.update({
    where: { id: seq.id },
    data: { nextNumber: { increment: 1 } },
  });
  return code;
}

export async function recordAudit(
  userName: string,
  event: "created" | "updated" | "deleted" | "restored",
  recordTitle: string,
  recordType: string,
  fieldsList: string[]
) {
  try {
    await prisma.auditLog.create({
      data: {
        userName: userName || "System Administrator",
        ipAddress: "127.0.0.1",
        event,
        recordTitle,
        recordType,
        fieldsCount: fieldsList.length || 1,
        fieldsList: fieldsList.slice(0, 6).join(", "),
        whenLabel: "Just now",
      },
    });
  } catch {
    // non-blocking audit log
  }
}

export function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "—"
  );
}
