import { PrismaClient } from "@prisma/client";
import permissionsCatalog from "../src/lib/permissions-catalog.json";
import tier1Seed from "./data/tier1-seed.json";

const prisma = new PrismaClient();

async function main() {
  // 1. Default Admin User
  await prisma.user.upsert({
    where: { email: "admin@ehishabi.com" },
    update: {},
    create: {
      email: "admin@ehishabi.com",
      username: "admin",
      password: "password",
      name: "System Administrator",
      role: "Administrator",
      jobTitle: "System Administrator",
      isSuperAdmin: true,
      isActive: true,
      theme: "light",
      navLayout: "side",
      sidebarColor: "light",
    },
  });

  // 2. Default Company
  const existingCompany = await prisma.company.findFirst();
  if (!existingCompany) {
    await prisma.company.create({
      data: {
        code: "HQ",
        name: "E-Hishabi ERP",
        legalName: "e-Hishabi Real Estate & Development Ltd.",
        email: "info@ehishabi.com",
        city: "Dhaka",
        country: "Bangladesh",
        currency: "BDT",
        timezone: "Asia/Dhaka",
        fyStartMonth: 7,
        fyStartDay: 1,
        branch: "HQ",
        fiscalYear: "1 Jul – 30 Jun",
        isDefault: true,
        isActive: true,
      },
    });
  }

  // 3. Default Branch
  await prisma.branch.upsert({
    where: { code: "HO" },
    update: {},
    create: {
      code: "HO",
      name: "Head Office",
      type: "head_office",
      companyId: 1,
      city: "Dhaka",
      country: "Bangladesh",
      isActive: true,
    },
  });

  // 4. All 26 Departments
  const topDepts = [
    { code: "ADMIN", name: "Administration" },
    { code: "CRM", name: "Business Development & CRM" },
    { code: "CONTRACT", name: "Contracts & Tendering" },
    { code: "CS", name: "Customer Service & Handover" },
    { code: "DESIGN", name: "Design & Architecture" },
    { code: "ENGG", name: "Engineering" },
    { code: "MGMT", name: "Executive Management" },
    { code: "FM", name: "Facility Management" },
    { code: "FIN", name: "Finance & Accounts" },
    { code: "HSE", name: "Health, Safety & Environment" },
    { code: "HR", name: "Human Resources" },
    { code: "IT", name: "IT & MIS" },
    { code: "AUDIT", name: "Internal Audit" },
    { code: "STORE", name: "Inventory & Stores" },
    { code: "LAND", name: "Land Acquisition & Management" },
    { code: "LEGAL", name: "Legal & Compliance" },
    { code: "MKTG", name: "Marketing" },
    { code: "QS", name: "Planning, Estimation & QS" },
    { code: "PLANT", name: "Plant, Equipment & Fleet" },
    { code: "PROC", name: "Procurement" },
    { code: "PROJ", name: "Project Management & Construction" },
    { code: "QC", name: "Quality Control" },
    { code: "SALES", name: "Sales & Marketing" },
  ];

  for (const d of topDepts) {
    await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: { code: d.code, name: d.name, companyId: 1, isActive: true },
    });
  }

  const engg = await prisma.department.findUnique({ where: { code: "ENGG" } });
  const subDepts = [
    { code: "ENGG-CIV", name: "Civil Engineering" },
    { code: "ENGG-MEP", name: "MEP / Electro-Mechanical" },
    { code: "ENGG-STR", name: "Structural Engineering" },
  ];
  for (const sd of subDepts) {
    await prisma.department.upsert({
      where: { code: sd.code },
      update: {},
      create: {
        code: sd.code,
        name: sd.name,
        companyId: 1,
        parentId: engg?.id ?? null,
        isActive: true,
      },
    });
  }

  // 5. Designations
  const existingDesigCount = await prisma.designation.count();
  if (existingDesigCount === 0) {
    const mgmt = await prisma.department.findUnique({ where: { code: "MGMT" } });
    const proj = await prisma.department.findUnique({ where: { code: "PROJ" } });
    const fin = await prisma.department.findUnique({ where: { code: "FIN" } });
    const enggCiv = await prisma.department.findUnique({ where: { code: "ENGG-CIV" } });
    const sales = await prisma.department.findUnique({ where: { code: "SALES" } });
    const proc = await prisma.department.findUnique({ where: { code: "PROC" } });
    const hr = await prisma.department.findUnique({ where: { code: "HR" } });
    const land = await prisma.department.findUnique({ where: { code: "LAND" } });

    const designations = [
      { code: "CEO", name: "Chief Executive Officer", departmentId: mgmt?.id, grade: "1", isManagerial: true, description: "Ultimate accountability for the company's strategy and board governance." },
      { code: "MD", name: "Managing Director", departmentId: mgmt?.id, grade: "1", isManagerial: true, description: "Day-to-day head of the business, answering to the board." },
      { code: "PC", name: "Project Coordinator", departmentId: proj?.id, grade: "1", isManagerial: false, description: null, createdBy: "System Administrator" },
      { code: "CFO", name: "Chief Financial Officer", departmentId: fin?.id, grade: "2", isManagerial: true, description: "Owns the company's finances, funding and statutory reporting." },
      { code: "COO", name: "Chief Operating Officer", departmentId: mgmt?.id, grade: "2", isManagerial: true, description: "Owns delivery across projects, procurement and operations." },
      { code: "DMD", name: "Deputy Managing Director", departmentId: mgmt?.id, grade: "2", isManagerial: true, description: "Second to the MD, standing in and carrying delegated sign-off." },
      { code: "CE", name: "Chief Engineer", departmentId: enggCiv?.id, grade: "3", isManagerial: true, description: "Heads structural, civil and site engineering execution." },
      { code: "HOS", name: "Head of Sales", departmentId: sales?.id, grade: "3", isManagerial: true, description: "Leads apartment sales, channel partners and collections." },
      { code: "HOP", name: "Head of Procurement", departmentId: proc?.id, grade: "3", isManagerial: true, description: "Manages BOQ sourcing, rate negotiation and vendor RFQs." },
      { code: "HRM", name: "HR Manager", departmentId: hr?.id, grade: "4", isManagerial: true, description: "Leads recruitment, attendance, shifts and payroll runs." },
      { code: "LM", name: "Land Acquisition Manager", departmentId: land?.id, grade: "4", isManagerial: true, description: "Manages mouza vetting, landowner negotiations and deeds." },
      { code: "SR-ENG", name: "Senior Site Engineer", departmentId: enggCiv?.id, grade: "6", isManagerial: false, description: "Supervises daily structural casting and quality checklists." },
    ];

    for (const ds of designations) {
      await prisma.designation.create({
        data: {
          code: ds.code,
          name: ds.name,
          departmentId: ds.departmentId ?? null,
          employmentType: "full_time",
          grade: ds.grade,
          description: ds.description,
          isManagerial: ds.isManagerial,
          isActive: true,
          createdBy: ds.createdBy ?? "—",
        },
      });
    }
  }

  // 6. Fiscal Year
  await prisma.fiscalYear.upsert({
    where: { code: "FY2627" },
    update: {},
    create: {
      code: "FY2627",
      name: "FY 2026–2027",
      startDate: "2026-07-01",
      endDate: "2027-06-30",
      periodCadence: "monthly",
      hasAdjustmentPeriod: false,
      isCurrent: true,
      status: "open",
      notes: "Active statutory fiscal window.",
    },
  });

  // 7. Default Shift
  await prisma.shift.upsert({
    where: { code: "GEN" },
    update: {},
    create: {
      code: "GEN",
      name: "General Office Shift",
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: 60,
      graceInMinutes: 15,
      graceOutMinutes: 15,
      fullDayMinutes: 480,
      halfDayMinutes: 240,
      workingDays: "sun,mon,tue,wed,thu",
      appliesTo: "all",
      isDefault: true,
      isActive: true,
    },
  });

  // 8. Roles & Permissions (5 exact roles)
  const allPermKeys = permissionsCatalog.flatMap((m) =>
    m.subjects.flatMap((s) => s.perms.map((p) => p.key))
  );

  const rolesSeed = [
    { name: "Super Admin", scope: "global", isSuper: true, count: allPermKeys.length, perms: allPermKeys },
    { name: "Administrator", scope: "global", isSuper: false, count: Math.min(577, allPermKeys.length), perms: allPermKeys.slice(0, 577) },
    { name: "Manager", scope: "global", isSuper: false, count: Math.min(336, allPermKeys.length), perms: allPermKeys.slice(0, 336) },
    { name: "Staff", scope: "global", isSuper: false, count: Math.min(125, allPermKeys.length), perms: allPermKeys.slice(0, 125) },
    { name: "Client", scope: "global", isSuper: false, count: 0, perms: [] },
  ];

  for (const r of rolesSeed) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        scope: r.scope,
        isSuper: r.isSuper,
        permissionsCount: r.count,
        permissionsJson: JSON.stringify(r.perms),
      },
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: "Administrator" } });
  if (adminRole) {
    await prisma.user.updateMany({
      where: { email: "admin@ehishabi.com", roleId: null },
      data: { roleId: adminRole.id },
    });
  }

  // 9. All 22 Code Sequences
  const sequences = [
    { key: "building", label: "Building Code", prefix: "BLD", suffix: "", separator: "-", padding: 4, nextNumber: 2, yearInCode: false, resetYearly: false },
    { key: "employee", label: "Employee Code", prefix: "EMP", suffix: "", separator: "-", padding: 4, nextNumber: 3, yearInCode: false, resetYearly: false },
    { key: "equipment_assignment", label: "Equipment Assignment", prefix: "EQA", suffix: "", separator: "-", padding: 4, nextNumber: 1, yearInCode: true, resetYearly: true },
    { key: "equipment", label: "Equipment Code", prefix: "EQP", suffix: "", separator: "-", padding: 4, nextNumber: 14, yearInCode: false, resetYearly: false },
    { key: "equipment_rental", label: "Equipment Hire Contract", prefix: "EHR", suffix: "", separator: "-", padding: 4, nextNumber: 3, yearInCode: true, resetYearly: true },
    { key: "equipment_inspection", label: "Equipment Inspection", prefix: "EIN", suffix: "", separator: "-", padding: 4, nextNumber: 5, yearInCode: true, resetYearly: true },
    { key: "equipment_work_order", label: "Equipment Work Order", prefix: "EWO", suffix: "", separator: "-", padding: 4, nextNumber: 5, yearInCode: true, resetYearly: true },
    { key: "fuel_log", label: "Fuel Log", prefix: "FUEL", suffix: "", separator: "-", padding: 5, nextNumber: 7, yearInCode: true, resetYearly: true },
    { key: "income_expense", label: "Income/Expense No.", prefix: "IE", suffix: "", separator: "-", padding: 4, nextNumber: 8, yearInCode: true, resetYearly: true },
    { key: "journal_voucher", label: "Journal Voucher No.", prefix: "JV", suffix: "", separator: "-", padding: 4, nextNumber: 25, yearInCode: true, resetYearly: true },
    { key: "land_parcel", label: "Land Parcel No.", prefix: "LAND", suffix: "", separator: "-", padding: 4, nextNumber: 1, yearInCode: false, resetYearly: false },
    { key: "lender", label: "Lender Code", prefix: "LND", suffix: "", separator: "-", padding: 4, nextNumber: 2, yearInCode: false, resetYearly: false },
    { key: "loan", label: "Loan Number", prefix: "LOAN", suffix: "", separator: "-", padding: 3, nextNumber: 2, yearInCode: true, resetYearly: true },
    { key: "land_owner", label: "Owner Code", prefix: "OWN", suffix: "", separator: "-", padding: 4, nextNumber: 1, yearInCode: false, resetYearly: false },
    { key: "plant_usage", label: "Plant Usage Log", prefix: "PUL", suffix: "", separator: "-", padding: 5, nextNumber: 12, yearInCode: true, resetYearly: true },
    { key: "project", label: "Project Code", prefix: "PRJ", suffix: "", separator: "-", padding: 3, nextNumber: 7, yearInCode: true, resetYearly: true },
    { key: "purchase", label: "Purchase Code", prefix: "PUR", suffix: "", separator: "", padding: 5, nextNumber: 2, yearInCode: false, resetYearly: false },
    { key: "salary", label: "Salary Disbursement", prefix: "SAL", suffix: "", separator: "-", padding: 5, nextNumber: 2, yearInCode: false, resetYearly: false },
    { key: "supplier", label: "Supplier Code", prefix: "SUP", suffix: "", separator: "-", padding: 4, nextNumber: 1, yearInCode: false, resetYearly: false },
    { key: "vendor_bill", label: "Vendor Bill No.", prefix: "VBILL", suffix: "", separator: "-", padding: 4, nextNumber: 1, yearInCode: true, resetYearly: true },
    { key: "vendor", label: "Vendor Code", prefix: "VEN", suffix: "", separator: "-", padding: 4, nextNumber: 1, yearInCode: false, resetYearly: false },
    { key: "vendor_payment", label: "Vendor Payment No.", prefix: "VPAY", suffix: "", separator: "-", padding: 4, nextNumber: 1, yearInCode: true, resetYearly: true },
  ];

  for (const seq of sequences) {
    await prisma.codeSequence.upsert({
      where: { key: seq.key },
      update: {},
      create: seq,
    });
  }

  // 10. Documents (14 seeded equipment compliance files)
  if ((await prisma.documentRecord.count()) === 0) {
    const docs = [
      { title: "Registration — EQP-0008", category: "registration", module: "equipment", uploadedDate: "30 Oct 2026", expiryDate: "2030-03-02" },
      { title: "Fitness certificate — EQP-0008", category: "fitness", module: "equipment", uploadedDate: "30 Oct 2026", expiryDate: "2027-03-30" },
      { title: "Insurance — EQP-0008", category: "insurance", module: "equipment", uploadedDate: "30 Oct 2026", expiryDate: "2026-09-30" },
      { title: "Tax token — EQP-0008", category: "tax_token", module: "equipment", uploadedDate: "30 Oct 2026", expiryDate: "2027-03-02" },
      { title: "Registration — EQP-0009", category: "registration", module: "equipment", uploadedDate: "30 Oct 2026", expiryDate: "2029-11-15" },
      { title: "Fitness certificate — EQP-0009", category: "fitness", module: "equipment", uploadedDate: "30 Oct 2026", expiryDate: "2027-06-20" },
      { title: "Insurance — EQP-0010", category: "insurance", module: "equipment", uploadedDate: "30 Oct 2026", expiryDate: "2026-10-12" },
      { title: "Load Test Certificate — EQP-0011", category: "certification", module: "equipment", uploadedDate: "30 Oct 2026", expiryDate: "2027-08-18" },
      { title: "Calibration Log — EQP-0012", category: "calibration", module: "equipment_inspection", uploadedDate: "30 Oct 2026", expiryDate: "2027-04-01" },
      { title: "Hire Agreement — EHR-2026-0001", category: "contract", module: "equipment_rental", uploadedDate: "30 Oct 2026", expiryDate: "2027-02-28" },
      { title: "South Breeze RAJUK Approval Plan", category: "approval_drawing", module: "approval_drawing", uploadedDate: "05 Nov 2026", expiryDate: null },
      { title: "Soil Investigation Report — PRJ-2026-001", category: "engineering", module: "engineering_assessment", uploadedDate: "06 Nov 2026", expiryDate: null },
      { title: "Company Trade License 2026–2027", category: "compliance", module: "project", uploadedDate: "10 Nov 2026", expiryDate: "2027-06-30" },
      { title: "VAT & BIN Registration Certificate", category: "tax", module: "project", uploadedDate: "10 Nov 2026", expiryDate: null },
    ];
    for (const d of docs) {
      await prisma.documentRecord.create({ data: d });
    }
  }

  // 11. Audit Logs
  if ((await prisma.auditLog.count()) === 0) {
    const logs = [
      { userName: "System Administrator", ipAddress: "172.68.163.168", event: "created", recordTitle: "South Breeze Tower", recordType: "Project", fieldsCount: 12, fieldsList: "code, name, location, phase, status...", whenLabel: "17 Nov 2026 · 8:08 AM" },
      { userName: "System Administrator", ipAddress: "172.68.218.186", event: "updated", recordTitle: "E-Hishabi ERP", recordType: "Company", fieldsCount: 3, fieldsList: "currency, fiscalYear, branch", whenLabel: "13 Nov 2026 · 12:55 AM" },
      { userName: "System Administrator", ipAddress: "172.68.163.168", event: "created", recordTitle: "Head Office", recordType: "Branch", fieldsCount: 8, fieldsList: "code, name, type, city, country...", whenLabel: "12 Nov 2026 · 10:15 AM" },
      { userName: "System Administrator", ipAddress: "172.68.163.168", event: "created", recordTitle: "Project Coordinator", recordType: "Designation", fieldsCount: 6, fieldsList: "code, name, department_id, grade...", whenLabel: "10 Nov 2026 · 4:20 PM" },
    ];
    for (const l of logs) {
      await prisma.auditLog.create({ data: l });
    }
  }

  // 12. Application Settings
  if ((await prisma.appSetting.count()) === 0) {
    await prisma.appSetting.create({
      data: {
        appName: "e-Hishabi ERP",
        appTagline: "Real Estate & Development Suite",
        footerText: "",
        contactEmail: "info@ehishabi.com",
        contactPhone: "+880 1700-000000",
        website: "https://erp.ehishabi.com",
        contactAddress: "Dhaka, Bangladesh",
        primaryColor: "#00c292",
      },
    });
  }

  // 13. Seed Projects
  const projects = [
    {
      code: "PRJ-2026-001",
      name: "South Breeze Tower",
      location: "Banani, Dhaka",
      phase: "Planning",
      completionPct: 12,
      soldUnits: 0,
      totalUnits: 48,
      handoverDate: "Dec 2028",
      status: "Planning",
      bookedValueCr: 0,
    },
    {
      code: "PRJ-2026-002",
      name: "Harmony Heights",
      location: "Bashundhara R/A, Dhaka",
      phase: "Structure — 12th floor",
      completionPct: 78,
      soldUnits: 246,
      totalUnits: 320,
      handoverDate: "Dec 2027",
      status: "Active",
      bookedValueCr: 118.4,
    },
    {
      code: "PRJ-2026-003",
      name: "Riverfront Residency",
      location: "Aftabnagar, Dhaka",
      phase: "Finishing — Block A",
      completionPct: 54,
      soldUnits: 178,
      totalUnits: 260,
      handoverDate: "Jun 2028",
      status: "Active",
      bookedValueCr: 71.5,
    },
    {
      code: "PRJ-2026-004",
      name: "Green Meadow Plots",
      location: "Purbachal, Dhaka",
      phase: "Utilities & landscaping",
      completionPct: 92,
      soldUnits: 410,
      totalUnits: 480,
      handoverDate: "Mar 2027",
      status: "Active",
      bookedValueCr: 96.2,
    },
    {
      code: "PRJ-2026-005",
      name: "Skyline Commercial Tower",
      location: "Gulshan-2, Dhaka",
      phase: "Foundation & piling",
      completionPct: 31,
      soldUnits: 88,
      totalUnits: 400,
      handoverDate: "Sep 2029",
      status: "Delayed",
      bookedValueCr: 41.8,
    },
    {
      code: "PRJ-2026-006",
      name: "Bay View Terrace",
      location: "Khulshi, Chattogram",
      phase: "MEP rough-in",
      completionPct: 66,
      soldUnits: 364,
      totalUnits: 480,
      handoverDate: "Feb 2028",
      status: "Active",
      bookedValueCr: 84.7,
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { code: project.code },
      update: {},
      create: project,
    });
  }

  // Tier 1: Finance & Catalog Masters
  const existingAccounts = await prisma.chartAccount.count();
  if (existingAccounts === 0) {
    const accIdMap = new Map<number, number>();
    for (const a of tier1Seed.accounts) {
      const created = await prisma.chartAccount.create({
        data: {
          companyId: 1,
          parentId: null,
          code: a.code,
          name: a.name,
          accountType: a.type,
          normalBalance: a.normalBalance || "debit",
          openingBalance: a.openingBalance || 0,
          currency: a.currency,
          isGroup: a.isGroup,
          isSystem: a.isSystem,
          isActive: a.isActive,
          description: a.description,
          createdBy: a.isSystem ? null : "System Administrator",
        },
      });
      accIdMap.set(a.extId, created.id);
    }
    for (const a of tier1Seed.accounts) {
      if (a.parentExtId) {
        const id = accIdMap.get(a.extId);
        const parentId = accIdMap.get(a.parentExtId);
        if (id && parentId) {
          await prisma.chartAccount.update({ where: { id }, data: { parentId } });
        }
      }
    }
    for (const h of tier1Seed.heads) {
      const accountId = accIdMap.get(h.accountExtId);
      if (accountId) {
        await prisma.accountHead.create({
          data: {
            companyId: 1,
            type: h.type,
            name: h.name,
            accountId,
            description: h.description,
            isActive: h.isActive,
            createdBy: "System Administrator",
          },
        });
      }
    }
  }

  await prisma.lender.upsert({
    where: { code: "LND-0001" },
    update: {},
    create: {
      companyId: 1,
      code: "LND-0001",
      name: "Brac Bank",
      lenderType: "bank",
      loansCount: 1,
      isActive: true,
      createdBy: "System Administrator",
    },
  });

  const existingUnits = await prisma.unitOfMeasure.count();
  const uomIdMap = new Map<number, number>();
  if (existingUnits === 0) {
    for (const u of tier1Seed.units) {
      const created = await prisma.unitOfMeasure.create({
        data: {
          companyId: 1,
          code: u.code,
          name: u.name,
          isBase: u.isBase,
          baseUnitId: null,
          factor: u.factor || 1,
          isActive: u.isActive,
        },
      });
      uomIdMap.set(u.extId, created.id);
    }
    for (const u of tier1Seed.units) {
      if (u.baseUnitExtId) {
        const id = uomIdMap.get(u.extId);
        const baseUnitId = uomIdMap.get(u.baseUnitExtId);
        if (id && baseUnitId) {
          await prisma.unitOfMeasure.update({ where: { id }, data: { baseUnitId } });
        }
      }
    }
  }

  const existingCats = await prisma.productCategory.count();
  const catIdMap = new Map<number, number>();
  if (existingCats === 0) {
    for (const c of tier1Seed.categories) {
      const created = await prisma.productCategory.create({
        data: {
          companyId: 1,
          code: c.code,
          name: c.name,
          parentId: null,
          description: c.description,
          isActive: c.isActive,
        },
      });
      catIdMap.set(c.extId, created.id);
    }
    for (const c of tier1Seed.categories) {
      if (c.parentExtId) {
        const id = catIdMap.get(c.extId);
        const parentId = catIdMap.get(c.parentExtId);
        if (id && parentId) {
          await prisma.productCategory.update({ where: { id }, data: { parentId } });
        }
      }
    }
  }

  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    for (const p of tier1Seed.products) {
      await prisma.product.create({
        data: {
          companyId: 1,
          code: p.code,
          name: p.name,
          type: p.type,
          categoryId: p.categoryExtId ? catIdMap.get(p.categoryExtId) ?? null : null,
          baseUomId: p.baseUnitExtId ? uomIdMap.get(p.baseUnitExtId) ?? null : null,
          sku: p.sku,
          barcode: p.barcode,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          reorderLevel: p.reorderLevel,
          description: p.description,
          isSellable: p.isSellable,
          isPurchasable: p.isPurchasable,
          isActive: p.isActive,
        },
      });
    }
  }

  console.log("Tier 0 + Tier 1 + Core Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
