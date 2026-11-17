import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { convertToSqft } from "@/lib/land";
import { allocateSequenceCode, recordAudit } from "@/lib/tier0";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parcels = await prisma.landParcel.findMany({
    include: { project: true },
    orderBy: { id: "desc" },
  });
  return NextResponse.json({ parcels });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const mouza = String(body.mouza ?? "").trim();
    const district = String(body.district ?? "").trim();
    const landType = String(body.land_type ?? body.landType ?? "").trim();
    const areaValue = Number(body.area_value ?? body.areaValue);
    const areaUnit = String(body.area_unit ?? body.areaUnit ?? "katha").trim();
    const source = body.source ? String(body.source).trim() : null;
    const brokerName = body.broker_name ? String(body.broker_name).trim() : body.brokerName ? String(body.brokerName).trim() : null;

    if (!mouza || !district || !landType || !Number.isFinite(areaValue) || areaValue <= 0) {
      return NextResponse.json(
        { error: "Mouza, District, Land Type, and positive Area are required." },
        { status: 400 }
      );
    }

    if (source === "broker" && !brokerName) {
      return NextResponse.json(
        { error: "Broker Name is required when Source is Broker / agent." },
        { status: 400 }
      );
    }

    const code = await allocateSequenceCode("land_parcel", "LAND");
    const areaSqft = convertToSqft(areaValue, areaUnit);

    const optFloat = (v: unknown) => {
      if (v === null || v === undefined || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const optStr = (v: unknown) => {
      if (v === null || v === undefined) return null;
      const s = String(v).trim();
      return s === "" ? null : s;
    };

    const parcel = await prisma.landParcel.create({
      data: {
        code,
        title: optStr(body.title),
        landType,
        stage: "prospect",
        mouza,
        jlNo: optStr(body.jl_no ?? body.jlNo),
        mouzaMapSheet: optStr(body.mouza_map_sheet ?? body.mouzaMapSheet),
        division: optStr(body.division),
        district,
        upazila: optStr(body.upazila),
        unionWard: optStr(body.union_ward ?? body.unionWard),
        policeStation: optStr(body.police_station ?? body.policeStation),
        road: optStr(body.road),
        postalCode: optStr(body.postal_code ?? body.postalCode),
        addressLine: optStr(body.address_line ?? body.addressLine),
        latitude: optFloat(body.latitude),
        longitude: optFloat(body.longitude),
        areaValue,
        areaUnit,
        areaSqft,
        boundaryNorth: optStr(body.boundary_north ?? body.boundaryNorth),
        boundarySouth: optStr(body.boundary_south ?? body.boundarySouth),
        boundaryEast: optStr(body.boundary_east ?? body.boundaryEast),
        boundaryWest: optStr(body.boundary_west ?? body.boundaryWest),
        frontageFeet: optFloat(body.frontage_feet ?? body.frontageFeet),
        roadWidthFeet: optFloat(body.road_width_feet ?? body.roadWidthFeet),
        currentUse: optStr(body.current_use ?? body.currentUse),
        isCornerPlot: Boolean(body.is_corner_plot ?? body.isCornerPlot),
        source,
        brokerName,
        brokerContact: optStr(body.broker_contact ?? body.brokerContact),
        remarks: optStr(body.remarks),
      },
    });

    await recordAudit(user.name, "created", parcel.title || parcel.code, "LandParcel", [
      "code",
      "mouza",
      "district",
      "areaValue",
    ]);

    return NextResponse.json({ parcel }, { status: 201 });
  } catch (err) {
    console.error("Create parcel error:", err);
    return NextResponse.json({ error: "Failed to create land file." }, { status: 500 });
  }
}
