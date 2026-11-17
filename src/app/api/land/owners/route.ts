import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { allocateSequenceCode } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owners = await prisma.landOwner.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json({ owners });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const kind = String(body.kind ?? "individual").trim();
    const name = String(body.name ?? "").trim();
    const nid = body.nid ? String(body.nid).trim() : null;
    const fatherName = body.father_name ? String(body.father_name).trim() : body.fatherName ? String(body.fatherName).trim() : null;
    const registrationNumber = body.registration_number ? String(body.registration_number).trim() : body.registrationNumber ? String(body.registrationNumber).trim() : null;
    const isMinor = Boolean(body.is_minor ?? body.isMinor);
    const isDeceased = Boolean(body.is_deceased ?? body.isDeceased);
    const guardianName = body.guardian_name ? String(body.guardian_name).trim() : body.guardianName ? String(body.guardianName).trim() : null;
    const successionCertificateNo = body.succession_certificate_no
      ? String(body.succession_certificate_no).trim()
      : body.successionCertificateNo
      ? String(body.successionCertificateNo).trim()
      : null;

    if (!name) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }
    if ((kind === "individual" || kind === "heir_group") && !fatherName) {
      return NextResponse.json({ error: "Father's Name is required for individuals and heirs." }, { status: 400 });
    }
    if ((kind === "company" || kind === "trust") && !registrationNumber) {
      return NextResponse.json({ error: "Registration / Incorporation No. is required." }, { status: 400 });
    }
    if (isMinor && !guardianName) {
      return NextResponse.json({ error: "Guardian Name is required when owner is a minor." }, { status: 400 });
    }
    if ((isDeceased || kind === "heir_group") && !successionCertificateNo) {
      return NextResponse.json({ error: "Succession Certificate No. is required." }, { status: 400 });
    }

    if (nid) {
      const existing = await prisma.landOwner.findUnique({ where: { nid } });
      if (existing) {
        return NextResponse.json({ error: `A landowner with NID ${nid} is already filed (${existing.code}).` }, { status: 409 });
      }
    }

    const code = await allocateSequenceCode("land_owner", "OWN");
    const optStr = (v: unknown) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    };

    const owner = await prisma.landOwner.create({
      data: {
        code,
        kind,
        name,
        nid,
        tin: optStr(body.tin),
        fatherName,
        motherName: optStr(body.mother_name ?? body.motherName),
        spouseName: optStr(body.spouse_name ?? body.spouseName),
        registrationNumber,
        dateOfBirth: optStr(body.date_of_birth ?? body.dateOfBirth),
        isMinor,
        isDeceased,
        guardianName,
        guardianNid: optStr(body.guardian_nid ?? body.guardianNid),
        guardianRelation: optStr(body.guardian_relation ?? body.guardianRelation),
        successionCertificateNo,
        successionDate: optStr(body.succession_date ?? body.successionDate),
        dateOfDeath: optStr(body.date_of_death ?? body.dateOfDeath),
        phone: optStr(body.phone),
        alternatePhone: optStr(body.alternate_phone ?? body.alternatePhone),
        email: optStr(body.email),
        addressLine1: optStr(body.address_line1 ?? body.addressLine1),
        village: optStr(body.village),
        postOffice: optStr(body.post_office ?? body.postOffice),
        policeStation: optStr(body.police_station ?? body.policeStation),
        upazila: optStr(body.upazila),
        district: optStr(body.district),
        postalCode: optStr(body.postal_code ?? body.postalCode),
        bankName: optStr(body.bank_name ?? body.bankName),
        bankBranch: optStr(body.bank_branch ?? body.bankBranch),
        bankAccountName: optStr(body.bank_account_name ?? body.bankAccountName),
        bankAccountNo: optStr(body.bank_account_no ?? body.bankAccountNo),
        routingNumber: optStr(body.routing_number ?? body.routingNumber),
        mfsProvider: optStr(body.mfs_provider ?? body.mfsProvider),
        mfsNumber: optStr(body.mfs_number ?? body.mfsNumber),
        notes: optStr(body.notes),
        isActive: body.is_active === undefined ? true : Boolean(body.is_active),
      },
    });

    return NextResponse.json({ owner }, { status: 201 });
  } catch (err) {
    console.error("Create owner error:", err);
    return NextResponse.json({ error: "Failed to create landowner." }, { status: 500 });
  }
}
