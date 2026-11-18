"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv } from "@/lib/csv-client";

interface ResourceRef {
  id: number;
  code: string;
  name: string;
  kind: string;
  uom: string;
  standardRate: number;
}

interface AnalysisRow {
  id: number;
  code: string;
  name: string;
  outputQty: number;
  outputUom: string;
  unitRate: number;
}

interface PayItemEntry {
  id: number;
  scopeId: string;
  group: string;
  code: string;
  title: string;
  uom: string;
  uomId: string;
  state: "none" | "draft" | "done";
}

interface ResourceLine {
  kind: "material" | "labour" | "equipment" | "subcontract" | "other";
  resourceId: string;
  uom: string;
  coeff: string;
  waste: string;
  rate: string;
}

const SCOPE_OPTIONS = [
  { value: "21", label: "ARC-01 — Plastering" },
  { value: "22", label: "ARC-02 — Screed Works" },
  { value: "23", label: "ARC-03 — Floor Finishes" },
  { value: "24", label: "ARC-04 — Wall Finishes" },
  { value: "25", label: "ARC-05 — Ceiling Works" },
  { value: "26", label: "ARC-06 — Painting Works" },
  { value: "27", label: "ARC-07 — Doors" },
  { value: "28", label: "ARC-08 — Windows" },
  { value: "29", label: "ARC-09 — Aluminium & Glazing" },
  { value: "30", label: "ARC-10 — Curtain Wall / Façade" },
  { value: "31", label: "ARC-11 — Metal Works" },
  { value: "32", label: "ARC-12 — Joinery / Carpentry" },
  { value: "33", label: "ARC-13 — Kitchen Works" },
  { value: "34", label: "ARC-14 — Toilet Accessories" },
  { value: "35", label: "ARC-15 — Roofing Works" },
  { value: "36", label: "ARC-16 — Thermal / Acoustic Insulation" },
  { value: "37", label: "ARC-17 — Expansion Joints" },
  { value: "38", label: "ARC-18 — Signage & Wayfinding" },
  { value: "51", label: "ELE-01 — Electrical LV Works" },
  { value: "52", label: "ELE-02 — MV / HT Works" },
  { value: "53", label: "ELE-03 — Transformer" },
  { value: "54", label: "ELE-04 — Generator" },
  { value: "55", label: "ELE-05 — Substation" },
  { value: "56", label: "ELE-06 — Lighting" },
  { value: "57", label: "ELE-07 — Emergency Lighting" },
  { value: "58", label: "ELE-08 — Earthing & Lightning Protection" },
  { value: "59", label: "ELE-09 — UPS / IPS" },
  { value: "60", label: "ELE-10 — Solar PV" },
  { value: "61", label: "ELE-11 — EV Charging" },
  { value: "62", label: "ELV-01 — Structured Cabling / Data" },
  { value: "63", label: "ELV-02 — Telephone System" },
  { value: "64", label: "ELV-03 — CCTV" },
  { value: "65", label: "ELV-04 — Access Control" },
  { value: "66", label: "ELV-05 — Intercom" },
  { value: "67", label: "ELV-06 — Public Address" },
  { value: "68", label: "ELV-07 — MATV / SMATV" },
  { value: "69", label: "ELV-08 — Building Management System" },
  { value: "70", label: "ELV-09 — Parking Management System" },
  { value: "71", label: "ELV-10 — Smart Home / Automation" },
  { value: "72", label: "ELV-11 — ICT / Server Room" },
  { value: "73", label: "ELV-12 — Master Clock" },
  { value: "74", label: "ELV-13 — Audio Visual" },
  { value: "93", label: "EXT-01 — External Earthworks" },
  { value: "94", label: "EXT-02 — Roads & Pavements" },
  { value: "95", label: "EXT-03 — Footpaths / Walkways" },
  { value: "96", label: "EXT-04 — External Drainage" },
  { value: "97", label: "EXT-05 — External Water Supply" },
  { value: "98", label: "EXT-06 — External Sewerage" },
  { value: "99", label: "EXT-07 — External Electrical" },
  { value: "100", label: "EXT-08 — External Lighting" },
  { value: "101", label: "EXT-09 — Boundary Wall & Fencing" },
  { value: "102", label: "EXT-10 — Gate / Guard House" },
  { value: "103", label: "EXT-11 — Hard Landscaping" },
  { value: "104", label: "EXT-12 — Soft Landscaping" },
  { value: "105", label: "EXT-13 — Irrigation" },
  { value: "106", label: "EXT-14 — Water Features" },
  { value: "107", label: "EXT-15 — Playground" },
  { value: "108", label: "EXT-16 — Swimming Pool" },
  { value: "109", label: "EXT-17 — Parking / Car Park" },
  { value: "75", label: "FIR-01 — Fire Detection & Alarm" },
  { value: "76", label: "FIR-02 — Fire Fighting" },
  { value: "77", label: "FIR-03 — Sprinkler System" },
  { value: "78", label: "FIR-04 — Fire Pump" },
  { value: "79", label: "FIR-05 — Gas Suppression" },
  { value: "80", label: "FIR-06 — Smoke Management" },
  { value: "81", label: "FIR-07 — Fire Stopping" },
  { value: "39", label: "INT-01 — Interior Fit-Out" },
  { value: "40", label: "INT-02 — Loose Furniture" },
  { value: "41", label: "INT-03 — Fixed Furniture" },
  { value: "42", label: "INT-04 — Decorative Works" },
  { value: "82", label: "MEC-01 — HVAC" },
  { value: "83", label: "MEC-02 — VRF / VRV" },
  { value: "84", label: "MEC-03 — Chiller System" },
  { value: "85", label: "MEC-04 — Ventilation" },
  { value: "86", label: "MEC-05 — Mechanical Plant Room" },
  { value: "87", label: "MEC-06 — Gas System" },
  { value: "88", label: "MEC-07 — Compressed Air" },
  { value: "43", label: "PLB-01 — Plumbing Works" },
  { value: "44", label: "PLB-02 — Sanitary Works" },
  { value: "45", label: "PLB-03 — Drainage Works" },
  { value: "46", label: "PLB-04 — Rainwater Drainage" },
  { value: "47", label: "PLB-05 — Water Treatment" },
  { value: "48", label: "PLB-06 — Sewage Treatment Plant" },
  { value: "49", label: "PLB-07 — Water Pumps" },
  { value: "50", label: "PLB-08 — Water Tanks" },
  { value: "1", label: "PRE-01 — Preliminaries & General Requirements" },
  { value: "2", label: "PRE-02 — Surveying & Setting Out" },
  { value: "3", label: "PRE-03 — Site Investigation" },
  { value: "4", label: "PRE-04 — Temporary Works" },
  { value: "5", label: "PRE-05 — Demolition Works" },
  { value: "6", label: "PRE-06 — Site Clearing" },
  { value: "7", label: "PRE-07 — Dewatering" },
  { value: "8", label: "PRE-08 — Earthwork" },
  { value: "110", label: "SPC-01 — Façade Access / BMU" },
  { value: "111", label: "SPC-02 — Garbage / Waste System" },
  { value: "112", label: "SPC-03 — Kitchen Equipment" },
  { value: "113", label: "SPC-04 — Laundry Equipment" },
  { value: "114", label: "SPC-05 — Gym Equipment" },
  { value: "115", label: "SPC-06 — Security Equipment" },
  { value: "116", label: "SPC-07 — Automatic Doors / Gates" },
  { value: "117", label: "SPC-08 — Car Parking System" },
  { value: "118", label: "SPC-09 — Acoustic Works" },
  { value: "119", label: "SPC-10 — Green Building Works" },
  { value: "14", label: "STR-01 — RCC / Structural Concrete" },
  { value: "15", label: "STR-02 — Reinforcement Works" },
  { value: "16", label: "STR-03 — Formwork" },
  { value: "17", label: "STR-04 — Precast Concrete" },
  { value: "18", label: "STR-05 — Prestressed / Post-Tension" },
  { value: "19", label: "STR-06 — Structural Steel" },
  { value: "20", label: "STR-07 — Masonry Works" },
  { value: "9", label: "SUB-01 — Piling Works" },
  { value: "10", label: "SUB-02 — Shoring / Retaining Works" },
  { value: "11", label: "SUB-03 — Pile Cap & Foundation" },
  { value: "12", label: "SUB-04 — Basement Works" },
  { value: "13", label: "SUB-05 — Waterproofing" },
  { value: "120", label: "TST-01 — Testing & Commissioning" },
  { value: "121", label: "TST-02 — MEP Commissioning" },
  { value: "122", label: "TST-03 — Third-Party Testing" },
  { value: "123", label: "TST-04 — As-Built Documentation" },
  { value: "124", label: "TST-05 — Handover Works" },
  { value: "89", label: "VTR-01 — Passenger Lift" },
  { value: "90", label: "VTR-02 — Service / Goods Lift" },
  { value: "91", label: "VTR-03 — Escalator" },
  { value: "92", label: "VTR-04 — Moving Walkway" },
];

const UOM_OPTIONS = [
  { id: "1", label: "Piece — PCS", short: "PCS" },
  { id: "2", label: "Number — NOS", short: "NOS" },
  { id: "3", label: "Unit — UNIT", short: "UNIT" },
  { id: "4", label: "Set — SET", short: "SET" },
  { id: "5", label: "Pair — PAIR", short: "PAIR" },
  { id: "6", label: "Dozen — DOZ", short: "DOZ" },
  { id: "7", label: "Gross — GROSS", short: "GROSS" },
  { id: "8", label: "Hundred — HUND", short: "HUND" },
  { id: "9", label: "Thousand — THOU", short: "THOU" },
  { id: "10", label: "Box — BOX", short: "BOX" },
  { id: "11", label: "Carton — CTN", short: "CTN" },
  { id: "12", label: "Packet — PKT", short: "PKT" },
  { id: "13", label: "Bundle — BDL", short: "BDL" },
  { id: "14", label: "Roll — ROLL", short: "ROLL" },
  { id: "15", label: "Coil — COIL", short: "COIL" },
  { id: "16", label: "Sheet — SHEET", short: "SHEET" },
  { id: "17", label: "Panel — PANEL", short: "PANEL" },
  { id: "18", label: "Leaf — LEAF", short: "LEAF" },
  { id: "19", label: "Drum — DRUM", short: "DRUM" },
  { id: "20", label: "Can — CAN", short: "CAN" },
  { id: "21", label: "Tin — TIN", short: "TIN" },
  { id: "22", label: "Tube — TUBE", short: "TUBE" },
  { id: "23", label: "Pail — PAIL", short: "PAIL" },
  { id: "24", label: "Sack — SACK", short: "SACK" },
  { id: "25", label: "Bag — BAG", short: "BAG" },
  { id: "26", label: "Lot — LOT", short: "LOT" },
  { id: "27", label: "Job — JOB", short: "JOB" },
  { id: "28", label: "Trip — TRIP", short: "TRIP" },
  { id: "29", label: "Truck Load — TRUCK", short: "TRUCK" },
  { id: "30", label: "Metre — M", short: "M" },
  { id: "31", label: "Millimetre — MM", short: "MM" },
  { id: "32", label: "Centimetre — CM", short: "CM" },
  { id: "33", label: "Kilometre — KM", short: "KM" },
  { id: "34", label: "Inch — IN", short: "IN" },
  { id: "35", label: "Foot — FT", short: "FT" },
  { id: "36", label: "Yard — YD", short: "YD" },
  { id: "37", label: "Running Foot — RFT", short: "RFT" },
  { id: "38", label: "Running Metre — RM", short: "RM" },
  { id: "39", label: "Square Metre — SQM", short: "SQM" },
  { id: "40", label: "Square Foot — SQFT", short: "SQFT" },
  { id: "41", label: "Square Yard — SQYD", short: "SQYD" },
  { id: "42", label: "Square Inch — SQIN", short: "SQIN" },
  { id: "43", label: "Square Millimetre — SQMM", short: "SQMM" },
  { id: "44", label: "Katha — KATHA", short: "KATHA" },
  { id: "45", label: "Bigha — BIGHA", short: "BIGHA" },
  { id: "46", label: "Decimal (Shotok) — DECIMAL", short: "DECIMAL" },
  { id: "47", label: "Acre — ACRE", short: "ACRE" },
  { id: "48", label: "Hectare — HECTARE", short: "HECTARE" },
  { id: "49", label: "Kani — KANI", short: "KANI" },
  { id: "50", label: "Cubic Metre — CUM", short: "CUM" },
  { id: "51", label: "Cubic Foot — CFT", short: "CFT" },
  { id: "52", label: "Cubic Yard — CUYD", short: "CUYD" },
  { id: "53", label: "Brass (100 CFT) — BRASS", short: "BRASS" },
  { id: "54", label: "Litre — LTR", short: "LTR" },
  { id: "55", label: "Millilitre — ML", short: "ML" },
  { id: "56", label: "Gallon (US) — GAL", short: "GAL" },
  { id: "57", label: "Kilogram — KG", short: "KG" },
  { id: "58", label: "Gram — G", short: "G" },
  { id: "59", label: "Metric Ton — MT", short: "MT" },
  { id: "60", label: "Quintal — QTL", short: "QTL" },
  { id: "61", label: "Pound — LB", short: "LB" },
  { id: "62", label: "Maund — MAUND", short: "MAUND" },
  { id: "63", label: "Seer — SEER", short: "SEER" },
  { id: "64", label: "Day — DAY", short: "DAY" },
  { id: "65", label: "Hour — HR", short: "HR" },
  { id: "66", label: "Man-Day — MANDAY", short: "MANDAY" },
  { id: "67", label: "Man-Hour — MANHR", short: "MANHR" },
  { id: "68", label: "Week — WEEK", short: "WEEK" },
  { id: "69", label: "Month — MONTH", short: "MONTH" },
  { id: "70", label: "Shift — SHIFT", short: "SHIFT" },
  { id: "71", label: "Lump Sum — LS", short: "LS" },
  { id: "72", label: "Percent — PCT", short: "PCT" },
  { id: "73", label: "Kilowatt Hour — KWH", short: "KWH" },
  { id: "74", label: "KVA — KVA", short: "KVA" },
];

const INITIAL_PAY_ITEMS: PayItemEntry[] = [
  // ARC-01 — Plastering
  { id: 216, scopeId: "21", group: "ARC-01 — Plastering", code: "ARC-01.01", title: "Internal Wall Plaster", uom: "SQM", uomId: "39", state: "none" },
  { id: 217, scopeId: "21", group: "ARC-01 — Plastering", code: "ARC-01.02", title: "External Wall Plaster", uom: "SQM", uomId: "39", state: "none" },
  { id: 218, scopeId: "21", group: "ARC-01 — Plastering", code: "ARC-01.03", title: "Ceiling Plaster", uom: "SQM", uomId: "39", state: "none" },
  { id: 219, scopeId: "21", group: "ARC-01 — Plastering", code: "ARC-01.04", title: "Cement-Sand Plaster", uom: "SQM", uomId: "39", state: "none" },
  { id: 220, scopeId: "21", group: "ARC-01 — Plastering", code: "ARC-01.05", title: "Waterproof Plaster", uom: "SQM", uomId: "39", state: "none" },
  { id: 221, scopeId: "21", group: "ARC-01 — Plastering", code: "ARC-01.06", title: "Repair Plaster", uom: "SQM", uomId: "39", state: "none" },
  // ARC-02 — Screed Works
  { id: 222, scopeId: "22", group: "ARC-02 — Screed Works", code: "ARC-02.01", title: "Floor Screed", uom: "SQM", uomId: "39", state: "none" },
  { id: 223, scopeId: "22", group: "ARC-02 — Screed Works", code: "ARC-02.02", title: "Roof Screed", uom: "SQM", uomId: "39", state: "none" },
  { id: 224, scopeId: "22", group: "ARC-02 — Screed Works", code: "ARC-02.03", title: "Toilet Screed", uom: "SQM", uomId: "39", state: "none" },
  { id: 225, scopeId: "22", group: "ARC-02 — Screed Works", code: "ARC-02.04", title: "Balcony Screed", uom: "SQM", uomId: "39", state: "none" },
  // ARC-03 — Floor Finishes
  { id: 228, scopeId: "23", group: "ARC-03 — Floor Finishes", code: "ARC-03.01", title: "Ceramic Floor Tile", uom: "SQM", uomId: "39", state: "none" },
  { id: 229, scopeId: "23", group: "ARC-03 — Floor Finishes", code: "ARC-03.02", title: "Homogeneous / Porcelain Tile", uom: "SQM", uomId: "39", state: "none" },
  { id: 230, scopeId: "23", group: "ARC-03 — Floor Finishes", code: "ARC-03.03", title: "Marble Flooring", uom: "SQM", uomId: "39", state: "none" },
  { id: 231, scopeId: "23", group: "ARC-03 — Floor Finishes", code: "ARC-03.04", title: "Granite Flooring", uom: "SQM", uomId: "39", state: "none" },
  { id: 235, scopeId: "23", group: "ARC-03 — Floor Finishes", code: "ARC-03.08", title: "Wooden Flooring", uom: "SQM", uomId: "39", state: "none" },
  { id: 236, scopeId: "23", group: "ARC-03 — Floor Finishes", code: "ARC-03.09", title: "Laminate", uom: "SQM", uomId: "39", state: "none" },
  { id: 237, scopeId: "23", group: "ARC-03 — Floor Finishes", code: "ARC-03.10", title: "Epoxy Flooring", uom: "SQM", uomId: "39", state: "none" },
  { id: 238, scopeId: "23", group: "ARC-03 — Floor Finishes", code: "ARC-03.11", title: "Carpet", uom: "SQM", uomId: "39", state: "none" },
  { id: 239, scopeId: "23", group: "ARC-03 — Floor Finishes", code: "ARC-03.12", title: "Skirting", uom: "RM", uomId: "38", state: "none" },
  // ARC-04 — Wall Finishes
  { id: 240, scopeId: "24", group: "ARC-04 — Wall Finishes", code: "ARC-04.01", title: "Wall Tile", uom: "SQM", uomId: "39", state: "none" },
  { id: 241, scopeId: "24", group: "ARC-04 — Wall Finishes", code: "ARC-04.02", title: "Marble Cladding", uom: "SQM", uomId: "39", state: "none" },
  { id: 242, scopeId: "24", group: "ARC-04 — Wall Finishes", code: "ARC-04.03", title: "Granite Cladding", uom: "SQM", uomId: "39", state: "none" },
  { id: 243, scopeId: "24", group: "ARC-04 — Wall Finishes", code: "ARC-04.04", title: "Stone Cladding", uom: "SQM", uomId: "39", state: "none" },
  { id: 244, scopeId: "24", group: "ARC-04 — Wall Finishes", code: "ARC-04.05", title: "Decorative Panel", uom: "SQM", uomId: "39", state: "none" },
  { id: 245, scopeId: "24", group: "ARC-04 — Wall Finishes", code: "ARC-04.06", title: "Wallpaper", uom: "SQM", uomId: "39", state: "none" },
  { id: 246, scopeId: "24", group: "ARC-04 — Wall Finishes", code: "ARC-04.07", title: "Feature Wall", uom: "SQM", uomId: "39", state: "none" },
  { id: 247, scopeId: "24", group: "ARC-04 — Wall Finishes", code: "ARC-04.08", title: "Wall Skirting", uom: "RM", uomId: "38", state: "none" },
  // ARC-05 — Ceiling Works
  { id: 248, scopeId: "25", group: "ARC-05 — Ceiling Works", code: "ARC-05.01", title: "Gypsum Ceiling", uom: "SQM", uomId: "39", state: "none" },
  { id: 249, scopeId: "25", group: "ARC-05 — Ceiling Works", code: "ARC-05.02", title: "Suspended Ceiling", uom: "SQM", uomId: "39", state: "none" },
  { id: 250, scopeId: "25", group: "ARC-05 — Ceiling Works", code: "ARC-05.03", title: "Mineral-Fibre Ceiling", uom: "SQM", uomId: "39", state: "none" },
  { id: 251, scopeId: "25", group: "ARC-05 — Ceiling Works", code: "ARC-05.04", title: "Metal Ceiling", uom: "SQM", uomId: "39", state: "none" },
  { id: 252, scopeId: "25", group: "ARC-05 — Ceiling Works", code: "ARC-05.05", title: "Acoustic Ceiling", uom: "SQM", uomId: "39", state: "none" },
  { id: 253, scopeId: "25", group: "ARC-05 — Ceiling Works", code: "ARC-05.06", title: "PVC Ceiling", uom: "SQM", uomId: "39", state: "none" },
  { id: 254, scopeId: "25", group: "ARC-05 — Ceiling Works", code: "ARC-05.07", title: "Ceiling Access Panel", uom: "NOS", uomId: "2", state: "none" },
  { id: 255, scopeId: "25", group: "ARC-05 — Ceiling Works", code: "ARC-05.08", title: "Decorative Ceiling", uom: "SQM", uomId: "39", state: "none" },
];

export function RateAnalysisClient({
  analyses: initial,
  resources,
  cbsItems,
}: {
  analyses: AnalysisRow[];
  resources: ResourceRef[];
  cbsItems: { id: number; code: string; name: string }[];
}) {
  const router = useRouter();
  const [analyses, setAnalyses] = useState(initial);
  const [payItems, setPayItems] = useState<PayItemEntry[]>(() => {
    const existingCodes = new Set(initial.map((a) => a.code.toUpperCase()));
    return INITIAL_PAY_ITEMS.map((item) => ({
      ...item,
      state: existingCodes.has(item.code.toUpperCase()) ? "draft" : item.state,
    }));
  });

  const [searchFilter, setSearchFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [tabState, setTabState] = useState<"todo" | "draft" | "done" | "all">("todo");
  const [selectedDraftIds, setSelectedDraftIds] = useState<number[]>([]);
  const [selectedPayItem, setSelectedPayItem] = useState<PayItemEntry | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [outputQty, setOutputQty] = useState("1");
  const [outputUomId, setOutputUomId] = useState("39");
  const [overheadPct, setOverheadPct] = useState("10");
  const [profitPct, setProfitPct] = useState("10");
  const [costCodeId, setCostCodeId] = useState("");
  const [lines, setLines] = useState<ResourceLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const activeCount = payItems.filter((i) => i.state === "done").length;
  const draftCount = payItems.filter((i) => i.state === "draft").length + analyses.length;
  const totalPayItems = 950;
  const noneCount = Math.max(0, totalPayItems - activeCount - draftCount);
  const pricedCount = activeCount + draftCount;
  const coveragePct = Math.round((pricedCount / totalPayItems) * 100);
  const activePct = Math.round((activeCount / totalPayItems) * 100);
  const draftPct = Math.round((draftCount / totalPayItems) * 100);

  const filteredPayItems = payItems.filter((item) => {
    if (scopeFilter && item.scopeId !== scopeFilter) return false;
    if (tabState === "todo" && item.state !== "none") return false;
    if (tabState === "draft" && item.state !== "draft") return false;
    if (tabState === "done" && item.state !== "done") return false;
    if (
      searchFilter &&
      !item.title.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !item.code.toLowerCase().includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const groups = Array.from(new Set(filteredPayItems.map((i) => i.group)));

  const rawTotal = lines.reduce((sum, l) => {
    const c = Number(l.coeff) || 0;
    const w = Number(l.waste) || 0;
    const r = Number(l.rate) || 0;
    return sum + c * (1 + w / 100) * r;
  }, 0);
  const qty = Math.max(0.0001, Number(outputQty) || 1);
  const baseUnit = rawTotal / qty;
  const unitRate =
    baseUnit * (1 + (Number(overheadPct) || 0) / 100 + (Number(profitPct) || 0) / 100);

  function selectPayItem(item: PayItemEntry) {
    setSelectedPayItem(item);
    setFormError("");
    setCode(`RA-${item.code}`);
    setName(item.title);
    setOutputQty("1");
    setOutputUomId(item.uomId || "39");
    setOverheadPct("10");
    setProfitPct("10");
    setCostCodeId("");
    setLines([]);
  }

  function addLine(kind: ResourceLine["kind"]) {
    const matchingResources = resources.filter(
      (r) => r.kind.toLowerCase() === kind || (kind === "equipment" && r.kind.toLowerCase() === "plant")
    );
    const chosen = matchingResources[0] ?? resources[0];
    setLines([
      ...lines,
      {
        kind,
        resourceId: String(chosen?.id ?? ""),
        uom: chosen?.uom ?? "NOS",
        coeff: "1",
        waste: "0",
        rate: String(chosen?.standardRate ?? 0),
      },
    ]);
  }

  async function saveCurrentAnalysis(goNext: boolean) {
    setFormError("");
    const effectiveCode = code.trim() || `RA-${Date.now().toString().slice(-4)}`;
    const effectiveName = name.trim() || selectedPayItem?.title || "Standard Rate Analysis";
    const uomShort =
      UOM_OPTIONS.find((u) => u.id === outputUomId)?.short ?? "SQM";

    setSaving(true);
    try {
      const res = await fetch("/api/construction/rate-analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: effectiveCode,
          name: effectiveName,
          output_qty: qty,
          output_uom: uomShort,
          overhead_percent: Number(overheadPct) || 0,
          profit_percent: Number(profitPct) || 0,
          cost_code: costCodeId || null,
          lines,
          unit_rate: Number(unitRate.toFixed(2)),
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setAnalyses((prev) => [d.analysis, ...prev]);
        if (selectedPayItem) {
          setPayItems((prev) =>
            prev.map((p) => (p.id === selectedPayItem.id ? { ...p, state: "draft" } : p))
          );
          if (goNext) {
            const idx = filteredPayItems.findIndex((p) => p.id === selectedPayItem.id);
            const nextItem = filteredPayItems[idx + 1] ?? null;
            if (nextItem) {
              selectPayItem(nextItem);
            }
          }
        }
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        setFormError(err.error || "Failed to save rate analysis.");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleActivateDrafts(e: React.FormEvent) {
    e.preventDefault();
    if (selectedDraftIds.length === 0) return;
    setPayItems((prev) =>
      prev.map((p) => (selectedDraftIds.includes(p.id) ? { ...p, state: "done" } : p))
    );
    setSelectedDraftIds([]);
  }

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-flask-vial" />
          </div>
          <div>
            <h1>Rate Analysis Workbench</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Home</a>
                </li>
                <li className="breadcrumb-item">
                  <a href="/resource-analyses/workbench">Resource Analysis</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Workbench
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <form
            method="POST"
            action="/resource-analyses/workbench/activate"
            id="workbenchActivateForm"
            className="d-inline"
            onSubmit={handleActivateDrafts}
          >
            <div data-activate-inputs />
            <button
              type="submit"
              className="btn btn-erp-ghost"
              data-loading
              disabled={selectedDraftIds.length === 0}
              data-activate-submit
            >
              <i className="fa-solid fa-circle-check me-2" />
              Activate drafts
              <span className="erp-pill is-neutral ms-1" data-activate-count>
                {selectedDraftIds.length}
              </span>
            </button>
          </form>

          <button
            type="button"
            className="btn btn-erp-ghost"
            data-export-coverage
            onClick={() =>
              downloadCsv(
                "rate-analyses-coverage.csv",
                ["Code", "Title", "Group", "UoM", "State"],
                payItems.map((p) => [p.code, p.title, p.group, p.uom, p.state])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2" />
            Export coverage
          </button>
          <a href="/resource-analyses/workbench" className="btn btn-erp-ghost">
            <i className="fa-solid fa-list me-2" />
            Full library
          </a>
        </div>
      </div>

      <div
        className="erp-wb"
        data-workbench
        data-worklist-url="/resource-analyses/workbench/worklist"
        data-item-url="/resource-analyses/workbench/items"
      >
        <aside className="erp-wb-side">
          <div className="erp-card h-100">
            <div className="erp-card-head">
              <div className="erp-wb-filters">
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Search pay items…"
                  data-filter="search"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />

                <select
                  className="form-select form-select-sm"
                  data-filter="scope_id"
                  data-select2
                  data-placeholder="All packages"
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
                >
                  <option value="">All packages</option>
                  {SCOPE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="erp-card-body p-0" data-worklist>
              <div data-worklist-inner>
                <div className="erp-wb-coverage" data-coverage>
                  <div className="erp-wb-coverage-head">
                    <span>
                      <strong>{pricedCount}</strong> of {totalPayItems} pay items priced
                    </span>
                    <span className="erp-wb-coverage-pct">{coveragePct}%</span>
                  </div>
                  <div
                    className="erp-wb-bar"
                    role="progressbar"
                    aria-valuenow={coveragePct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span className="erp-wb-bar-active" style={{ width: `${activePct}%` }} />
                    <span className="erp-wb-bar-draft" style={{ width: `${draftPct}%` }} />
                  </div>
                  <div className="erp-wb-coverage-legend">
                    <span>
                      <i className="fa-solid fa-circle text-success" /> {activeCount} active
                    </span>
                    <span>
                      <i className="fa-solid fa-circle text-warning" /> {draftCount} draft
                    </span>
                    <span>
                      <i className="fa-solid fa-circle text-muted" /> {noneCount} none
                    </span>
                  </div>
                </div>

                <div className="erp-wb-tabs">
                  <button
                    type="button"
                    className={`erp-wb-tab ${tabState === "todo" ? "is-active" : ""}`}
                    data-state="todo"
                    onClick={() => setTabState("todo")}
                  >
                    To write
                    <span className="erp-wb-tab-count">{noneCount}</span>
                  </button>
                  <button
                    type="button"
                    className={`erp-wb-tab ${tabState === "draft" ? "is-active" : ""}`}
                    data-state="draft"
                    onClick={() => setTabState("draft")}
                  >
                    Drafts
                    <span className="erp-wb-tab-count">{draftCount}</span>
                  </button>
                  <button
                    type="button"
                    className={`erp-wb-tab ${tabState === "done" ? "is-active" : ""}`}
                    data-state="done"
                    onClick={() => setTabState("done")}
                  >
                    Active
                    <span className="erp-wb-tab-count">{activeCount}</span>
                  </button>
                  <button
                    type="button"
                    className={`erp-wb-tab ${tabState === "all" ? "is-active" : ""}`}
                    data-state="all"
                    onClick={() => setTabState("all")}
                  >
                    All
                    <span className="erp-wb-tab-count">{totalPayItems}</span>
                  </button>
                </div>

                <ul className="erp-wb-list" data-worklist-items>
                  {groups.map((grp) => (
                    <div key={grp}>
                      <li className="erp-wb-group">{grp}</li>
                      {filteredPayItems
                        .filter((i) => i.group === grp)
                        .map((item) => (
                          <li key={item.id} className="erp-wb-row">
                            {item.state === "draft" ? (
                              <input
                                type="checkbox"
                                className="form-check-input ms-2 me-1"
                                checked={selectedDraftIds.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDraftIds([...selectedDraftIds, item.id]);
                                  } else {
                                    setSelectedDraftIds(
                                      selectedDraftIds.filter((id) => id !== item.id)
                                    );
                                  }
                                }}
                              />
                            ) : (
                              <span className="erp-wb-check-spacer" aria-hidden="true" />
                            )}

                            <button
                              type="button"
                              className={`erp-wb-item ${selectedPayItem?.id === item.id ? "is-active" : ""}`}
                              data-item={item.id}
                              data-state={item.state}
                              onClick={() => selectPayItem(item)}
                            >
                              <span
                                className={`erp-wb-item-dot is-${item.state}`}
                                aria-hidden="true"
                              />
                              <span className="erp-wb-item-body">
                                <span className="erp-wb-item-title">{item.title}</span>
                                <span className="erp-wb-item-meta">
                                  <code>{item.code}</code> <span>{item.uom}</span>
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                    </div>
                  ))}
                </ul>

                <div className="erp-wb-pager" data-worklist-pager>
                  <nav className="d-flex justify-items-center justify-content-between">
                    <div className="d-none flex-sm-fill d-sm-flex align-items-sm-center justify-content-sm-between">
                      <div className="small text-muted">
                        Showing <span className="fw-semibold">1</span> to{" "}
                        <span className="fw-semibold">{filteredPayItems.length}</span> of{" "}
                        <span className="fw-semibold">{totalPayItems}</span> results
                      </div>
                      <div>
                        <ul className="pagination mb-0">
                          <li className="page-item disabled" aria-disabled="true">
                            <span className="page-link" aria-hidden="true">
                              &lsaquo;
                            </span>
                          </li>
                          <li className="page-item active" aria-current="page">
                            <span className="page-link">1</span>
                          </li>
                          <li className="page-item">
                            <span className="page-link" aria-hidden="true">
                              &rsaquo;
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <section className="erp-wb-main">
          <div className="erp-card h-100">
            <div className="erp-card-body">
              <div className="erp-wb-editor" data-editor hidden={!selectedPayItem}>
                <form
                  data-analysis-form
                  data-currency="BDT"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveCurrentAnalysis(false);
                  }}
                >
                  <div className="erp-wb-editor-head">
                    <div>
                      <div className="erp-wb-editor-scope" data-editor-scope>
                        {selectedPayItem?.group ?? ""}
                      </div>
                      <h2 className="erp-wb-editor-title" data-editor-title>
                        {selectedPayItem?.title ?? ""}
                      </h2>
                    </div>
                    <div className="erp-wb-editor-status">
                      <span className="erp-pill is-neutral" data-editor-status>
                        {selectedPayItem?.state === "done"
                          ? "Active"
                          : selectedPayItem?.state === "draft"
                          ? "Draft"
                          : "Unpriced"}
                      </span>
                    </div>
                  </div>

                  <div
                    className="alert alert-warning py-2 mb-3"
                    data-editor-locked
                    hidden
                    style={{ borderRadius: 10, fontSize: "12.5px" }}
                  >
                    <i className="fa-solid fa-lock me-1" />
                    <span data-editor-locked-text />
                  </div>

                  <div
                    className="alert alert-danger py-2 mb-3"
                    data-form-error
                    hidden={!formError}
                    style={{ borderRadius: 10, fontSize: "12.5px" }}
                  >
                    <i className="fa-solid fa-circle-exclamation me-1" />
                    <span data-form-error-text>{formError}</span>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-3">
                      <label className="form-label">
                        Code <span className="erp-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        className="form-control form-control-sm text-uppercase"
                        maxLength={40}
                        required
                        data-editor-code
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label">
                        Name <span className="erp-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control form-control-sm"
                        maxLength={190}
                        required
                        data-editor-name
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">
                        Per <span className="erp-required">*</span>
                      </label>
                      <input
                        type="number"
                        name="output_qty"
                        step="0.0001"
                        min="0.0001"
                        className="form-control form-control-sm text-end"
                        required
                        data-analysis-output
                        data-editor-output-qty
                        value={outputQty}
                        onChange={(e) => setOutputQty(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">
                        Unit <span className="erp-required">*</span>
                      </label>
                      <select
                        name="output_uom_id"
                        className="form-select form-select-sm"
                        data-select2
                        required
                        data-placeholder="Unit"
                        data-editor-output-uom
                        value={outputUomId}
                        onChange={(e) => setOutputUomId(e.target.value)}
                      >
                        <option value="">—</option>
                        {UOM_OPTIONS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="erp-wb-grid-head">
                    <span className="erp-wb-grid-title">What one unit of this work consumes</span>
                    <div className="erp-wb-add">
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        data-add-resource="material"
                        onClick={() => addLine("material")}
                      >
                        <i className="fa-solid fa-cubes me-1" />
                        Material
                      </button>
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        data-add-resource="labour"
                        onClick={() => addLine("labour")}
                      >
                        <i className="fa-solid fa-helmet-safety me-1" />
                        Labour
                      </button>
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        data-add-resource="equipment"
                        onClick={() => addLine("equipment")}
                      >
                        <i className="fa-solid fa-truck-monster me-1" />
                        Equipment
                      </button>
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        data-add-resource="subcontract"
                        onClick={() => addLine("subcontract")}
                      >
                        <i className="fa-solid fa-handshake me-1" />
                        Subcontract
                      </button>
                      <button
                        type="button"
                        className="btn btn-erp-ghost btn-sm"
                        data-add-resource="other"
                        onClick={() => addLine("other")}
                      >
                        <i className="fa-solid fa-ellipsis me-1" />
                        Other
                      </button>
                    </div>
                  </div>

                  <div className="erp-table-wrap">
                    <table className="table erp-table mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: 112 }}>Kind</th>
                          <th style={{ minWidth: 220 }}>Resource</th>
                          <th style={{ width: 90 }}>Unit</th>
                          <th style={{ width: 112 }} className="text-end">
                            Coefficient
                          </th>
                          <th style={{ width: 90 }} className="text-end">
                            Waste %
                          </th>
                          <th style={{ width: 120 }} className="text-end">
                            Rate
                          </th>
                          <th style={{ width: 130 }} className="text-end">
                            Amount
                          </th>
                          <th style={{ width: 44 }} />
                        </tr>
                      </thead>
                      <tbody data-resource-rows>
                        {lines.length === 0 ? (
                          <tr data-empty>
                            <td colSpan={8} className="erp-cv-empty">
                              Nothing yet — add what one unit of this work consumes.
                            </td>
                          </tr>
                        ) : (
                          lines.map((ln, idx) => {
                            const amt =
                              (Number(ln.coeff) || 0) *
                              (1 + (Number(ln.waste) || 0) / 100) *
                              (Number(ln.rate) || 0);
                            return (
                              <tr key={idx}>
                                <td>
                                  <span className="erp-pill is-neutral text-capitalize">
                                    {ln.kind}
                                  </span>
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={ln.resourceId}
                                    onChange={(e) => {
                                      const r = resources.find(
                                        (x) => String(x.id) === e.target.value
                                      );
                                      setLines(
                                        lines.map((v, i) =>
                                          i === idx
                                            ? {
                                                ...v,
                                                resourceId: e.target.value,
                                                uom: r?.uom ?? v.uom,
                                                rate: String(r?.standardRate ?? v.rate),
                                              }
                                            : v
                                        )
                                      );
                                    }}
                                  >
                                    {resources.map((r) => (
                                      <option key={r.id} value={r.id}>
                                        {r.code} — {r.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>{ln.uom}</td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.0001"
                                    className="form-control form-control-sm text-end"
                                    value={ln.coeff}
                                    onChange={(e) =>
                                      setLines(
                                        lines.map((v, i) =>
                                          i === idx ? { ...v, coeff: e.target.value } : v
                                        )
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm text-end"
                                    value={ln.waste}
                                    onChange={(e) =>
                                      setLines(
                                        lines.map((v, i) =>
                                          i === idx ? { ...v, waste: e.target.value } : v
                                        )
                                      )
                                    }
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="form-control form-control-sm text-end"
                                    value={ln.rate}
                                    onChange={(e) =>
                                      setLines(
                                        lines.map((v, i) =>
                                          i === idx ? { ...v, rate: e.target.value } : v
                                        )
                                      )
                                    }
                                  />
                                </td>
                                <td className="text-end erp-cell-strong">
                                  BDT {amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="text-end">
                                  <button
                                    type="button"
                                    className="btn btn-erp-ghost btn-sm text-danger"
                                    onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                                  >
                                    <i className="fa-solid fa-xmark" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th colSpan={6} className="text-end">
                            Resource cost per unit
                          </th>
                          <th className="text-end" data-resource-subtotal>
                            {lines.length > 0
                              ? `BDT ${baseUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : "—"}
                          </th>
                          <th />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="erp-wb-foot">
                    <div className="erp-wb-markups">
                      <label className="form-label mb-0">Overhead %</label>
                      <input
                        type="number"
                        name="overhead_percent"
                        step="0.01"
                        min="0"
                        max="100"
                        className="form-control form-control-sm text-end"
                        data-analysis-overhead
                        data-editor-overhead
                        value={overheadPct}
                        onChange={(e) => setOverheadPct(e.target.value)}
                      />

                      <label className="form-label mb-0">Profit %</label>
                      <input
                        type="number"
                        name="profit_percent"
                        step="0.01"
                        min="0"
                        max="100"
                        className="form-control form-control-sm text-end"
                        data-analysis-profit
                        data-editor-profit
                        value={profitPct}
                        onChange={(e) => setProfitPct(e.target.value)}
                      />

                      <label className="form-label mb-0">Cost code</label>
                      <select
                        name="cost_code_id"
                        className="form-select form-select-sm"
                        data-select2
                        data-placeholder="No cost code"
                        data-editor-cost-code
                        value={costCodeId}
                        onChange={(e) => setCostCodeId(e.target.value)}
                      >
                        <option value="">—</option>
                        {cbsItems.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} — {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="erp-wb-rate">
                      <span className="erp-wb-rate-label">Built-up rate</span>
                      <span className="erp-wb-rate-value" data-analysis-rate>
                        {lines.length > 0
                          ? `BDT ${unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="erp-wb-actions">
                    <span className="erp-wb-hint" data-editor-hint>
                      <i className="fa-solid fa-circle-info" /> Saved as a draft. Activate from the
                      list once the rates have been checked.
                    </span>
                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-erp-ghost"
                        data-save
                        disabled={saving}
                      >
                        <i className="fa-solid fa-floppy-disk me-2" />
                        Save draft
                      </button>
                      <button
                        type="button"
                        className="btn btn-erp"
                        data-save-next
                        disabled={saving}
                        onClick={() => saveCurrentAnalysis(true)}
                      >
                        <i className="fa-solid fa-forward me-2" />
                        Save &amp; next
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div
                className="erp-wb-placeholder"
                data-editor-placeholder
                hidden={Boolean(selectedPayItem)}
              >
                <div className="erp-empty">
                  <div className="erp-empty-icon">
                    <i className="fa-solid fa-flask-vial" />
                  </div>
                  <h3>Pick a pay item to price</h3>
                  <p className="mb-0">
                    Choose one on the left and write what a single unit of it consumes — materials
                    from the catalogue, labour and plant from the resource master. The rate builds
                    itself.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
