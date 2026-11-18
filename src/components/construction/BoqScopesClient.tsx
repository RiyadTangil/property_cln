"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";

interface BoqScopeRow {
  id: number;
  code: string;
  name: string;
  discipline: string;
  coverage: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface StandardItemRow {
  id: number;
  parent_id: number | null;
  item_type: "section" | "work" | "material";
  code: string;
  description: string;
  uom_id: string;
  uom: string;
  item_id: string;
  resource_analysis_id: string;
  default_rate: string;
  note: string;
  is_active: boolean;
}

const TRADES: { code: string; label: string; icon: string }[] = [
  { code: "PRE", label: "Preliminaries & Site Works", icon: "fa-solid fa-person-digging" },
  { code: "SUB", label: "Substructure & Foundation", icon: "fa-solid fa-bore-hole" },
  { code: "STR", label: "Structure", icon: "fa-solid fa-building" },
  { code: "ARC", label: "Architectural & Finishes", icon: "fa-solid fa-paint-roller" },
  { code: "INT", label: "Interior Fit-Out", icon: "fa-solid fa-couch" },
  { code: "PLB", label: "Plumbing & Public Health", icon: "fa-solid fa-faucet-drip" },
  { code: "ELE", label: "Electrical", icon: "fa-solid fa-bolt" },
  { code: "ELV", label: "Extra-Low Voltage & ICT", icon: "fa-solid fa-network-wired" },
  { code: "FIR", label: "Fire Protection", icon: "fa-solid fa-fire-extinguisher" },
  { code: "MEC", label: "Mechanical & HVAC", icon: "fa-solid fa-fan" },
  { code: "VTR", label: "Vertical Transportation", icon: "fa-solid fa-elevator" },
  { code: "EXT", label: "External Works & Infrastructure", icon: "fa-solid fa-road" },
  { code: "SPC", label: "Specialist Systems", icon: "fa-solid fa-gears" },
  { code: "TST", label: "Testing, Commissioning & Handover", icon: "fa-solid fa-clipboard-check" },
];

const UOM_OPTIONS: { id: string; label: string; short: string }[] = [
  { id: "47", label: "Acre — ACRE", short: "ACRE" },
  { id: "25", label: "Bag — BAG", short: "BAG" },
  { id: "13", label: "Bundle — BDL", short: "BDL" },
  { id: "45", label: "Bigha — BIGHA", short: "BIGHA" },
  { id: "10", label: "Box — BOX", short: "BOX" },
  { id: "53", label: "Brass (100 CFT) — BRASS", short: "BRASS" },
  { id: "20", label: "Can — CAN", short: "CAN" },
  { id: "51", label: "Cubic Foot — CFT", short: "CFT" },
  { id: "32", label: "Centimetre — CM", short: "CM" },
  { id: "15", label: "Coil — COIL", short: "COIL" },
  { id: "11", label: "Carton — CTN", short: "CTN" },
  { id: "50", label: "Cubic Metre — CUM", short: "CUM" },
  { id: "52", label: "Cubic Yard — CUYD", short: "CUYD" },
  { id: "64", label: "Day — DAY", short: "DAY" },
  { id: "46", label: "Decimal (Shotok) — DECIMAL", short: "DECIMAL" },
  { id: "6", label: "Dozen — DOZ", short: "DOZ" },
  { id: "19", label: "Drum — DRUM", short: "DRUM" },
  { id: "35", label: "Foot — FT", short: "FT" },
  { id: "58", label: "Gram — G", short: "G" },
  { id: "56", label: "Gallon (US) — GAL", short: "GAL" },
  { id: "7", label: "Gross — GROSS", short: "GROSS" },
  { id: "48", label: "Hectare — HECTARE", short: "HECTARE" },
  { id: "65", label: "Hour — HR", short: "HR" },
  { id: "8", label: "Hundred — HUND", short: "HUND" },
  { id: "34", label: "Inch — IN", short: "IN" },
  { id: "27", label: "Job — JOB", short: "JOB" },
  { id: "49", label: "Kani — KANI", short: "KANI" },
  { id: "44", label: "Katha — KATHA", short: "KATHA" },
  { id: "57", label: "Kilogram — KG", short: "KG" },
  { id: "33", label: "Kilometre — KM", short: "KM" },
  { id: "74", label: "KVA — KVA", short: "KVA" },
  { id: "73", label: "Kilowatt Hour — KWH", short: "KWH" },
  { id: "61", label: "Pound — LB", short: "LB" },
  { id: "18", label: "Leaf — LEAF", short: "LEAF" },
  { id: "26", label: "Lot — LOT", short: "LOT" },
  { id: "71", label: "Lump Sum — LS", short: "LS" },
  { id: "54", label: "Litre — LTR", short: "LTR" },
  { id: "30", label: "Metre — M", short: "M" },
  { id: "66", label: "Man-Day — MANDAY", short: "MANDAY" },
  { id: "67", label: "Man-Hour — MANHR", short: "MANHR" },
  { id: "62", label: "Maund — MAUND", short: "MAUND" },
  { id: "55", label: "Millilitre — ML", short: "ML" },
  { id: "31", label: "Millimetre — MM", short: "MM" },
  { id: "69", label: "Month — MONTH", short: "MONTH" },
  { id: "59", label: "Metric Ton — MT", short: "MT" },
  { id: "2", label: "Number — NOS", short: "NOS" },
  { id: "23", label: "Pail — PAIL", short: "PAIL" },
  { id: "5", label: "Pair — PAIR", short: "PAIR" },
  { id: "17", label: "Panel — PANEL", short: "PANEL" },
  { id: "1", label: "Piece — PCS", short: "PCS" },
  { id: "72", label: "Percent — PCT", short: "PCT" },
  { id: "12", label: "Packet — PKT", short: "PKT" },
  { id: "60", label: "Quintal — QTL", short: "QTL" },
  { id: "37", label: "Running Foot — RFT", short: "RFT" },
  { id: "38", label: "Running Metre — RM", short: "RM" },
  { id: "14", label: "Roll — ROLL", short: "ROLL" },
  { id: "24", label: "Sack — SACK", short: "SACK" },
  { id: "63", label: "Seer — SEER", short: "SEER" },
  { id: "4", label: "Set — SET", short: "SET" },
  { id: "16", label: "Sheet — SHEET", short: "SHEET" },
  { id: "70", label: "Shift — SHIFT", short: "SHIFT" },
  { id: "40", label: "Square Foot — SQFT", short: "SQFT" },
  { id: "42", label: "Square Inch — SQIN", short: "SQIN" },
  { id: "39", label: "Square Metre — SQM", short: "SQM" },
  { id: "43", label: "Square Millimetre — SQMM", short: "SQMM" },
  { id: "41", label: "Square Yard — SQYD", short: "SQYD" },
  { id: "9", label: "Thousand — THOU", short: "THOU" },
  { id: "21", label: "Tin — TIN", short: "TIN" },
  { id: "28", label: "Trip — TRIP", short: "TRIP" },
  { id: "29", label: "Truck Load — TRUCK", short: "TRUCK" },
  { id: "22", label: "Tube — TUBE", short: "TUBE" },
  { id: "3", label: "Unit — UNIT", short: "UNIT" },
  { id: "68", label: "Week — WEEK", short: "WEEK" },
  { id: "36", label: "Yard — YD", short: "YD" },
];

const PRODUCT_OPTIONS: { id: string; label: string }[] = [
  { id: "54", label: "BLOCK-AAC — AAC Block" },
  { id: "215", label: "WPF-APP — APP Membrane" },
  { id: "1", label: "CEM-OPC-53 — Cement OPC 53 Grade (50 kg Bag)" },
  { id: "4", label: "CEM-PCC-50 — Cement PCC (50 kg Bag)" },
  { id: "51", label: "BRICK-1 — Clay Brick 1st Class" },
  { id: "13", label: "REBAR-10 — Deformed Bar 10 mm (60 Grade)" },
  { id: "14", label: "REBAR-12 — Deformed Bar 12 mm (60 Grade)" },
  { id: "15", label: "REBAR-16 — Deformed Bar 16 mm (60 Grade)" },
  { id: "16", label: "REBAR-20 — Deformed Bar 20 mm (60 Grade)" },
  { id: "18", label: "REBAR-25 — Deformed Bar 25 mm (60 Grade)" },
  { id: "62", label: "RMC-C25 — Ready Mix Concrete C25" },
  { id: "63", label: "RMC-C30 — Ready Mix Concrete C30" },
  { id: "41", label: "SAND-RIVER — River Sand" },
  { id: "38", label: "SAND-SYL — Sylhet Sand (Coarse)" },
  { id: "42", label: "STONE-20 — Stone Chips 20 mm" },
  { id: "75", label: "TILE-FL-VIT — Vitrified Floor Tile" },
];

const DEFAULT_PRE01_ITEMS: StandardItemRow[] = [
  { id: 1, parent_id: null, item_type: "work", code: "PRE-01.01", description: "Mobilization", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 2, parent_id: null, item_type: "work", code: "PRE-01.02", description: "Demobilization", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 3, parent_id: null, item_type: "work", code: "PRE-01.03", description: "Site Establishment", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 4, parent_id: null, item_type: "work", code: "PRE-01.04", description: "Site Office", uom_id: "69", uom: "MONTH", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 5, parent_id: null, item_type: "work", code: "PRE-01.05", description: "Consultant / Engineer Office", uom_id: "69", uom: "MONTH", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 6, parent_id: null, item_type: "work", code: "PRE-01.06", description: "Temporary Storage", uom_id: "39", uom: "SQM", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 7, parent_id: null, item_type: "work", code: "PRE-01.07", description: "Worker Facilities", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 8, parent_id: null, item_type: "work", code: "PRE-01.08", description: "Temporary Toilets", uom_id: "2", uom: "NOS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 9, parent_id: null, item_type: "work", code: "PRE-01.09", description: "Temporary Electricity", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 10, parent_id: null, item_type: "work", code: "PRE-01.10", description: "Temporary Water", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 11, parent_id: null, item_type: "work", code: "PRE-01.11", description: "Temporary Lighting", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 12, parent_id: null, item_type: "work", code: "PRE-01.12", description: "Temporary Drainage", uom_id: "38", uom: "RM", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 13, parent_id: null, item_type: "work", code: "PRE-01.13", description: "Site Security", uom_id: "69", uom: "MONTH", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 14, parent_id: null, item_type: "work", code: "PRE-01.14", description: "Safety / PPE", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 15, parent_id: null, item_type: "work", code: "PRE-01.15", description: "Safety Signage", uom_id: "2", uom: "NOS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 16, parent_id: null, item_type: "work", code: "PRE-01.16", description: "First Aid Facilities", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 17, parent_id: null, item_type: "work", code: "PRE-01.17", description: "Fire Safety Equipment", uom_id: "2", uom: "NOS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 18, parent_id: null, item_type: "work", code: "PRE-01.18", description: "Hoarding / Fencing", uom_id: "38", uom: "RM", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 19, parent_id: null, item_type: "work", code: "PRE-01.19", description: "Project Signboard", uom_id: "2", uom: "NOS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 20, parent_id: null, item_type: "work", code: "PRE-01.20", description: "Temporary Access", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 21, parent_id: null, item_type: "work", code: "PRE-01.21", description: "Site Cleaning", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 22, parent_id: null, item_type: "work", code: "PRE-01.22", description: "Waste Disposal", uom_id: "28", uom: "TRIP", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 23, parent_id: null, item_type: "work", code: "PRE-01.23", description: "Dust / Noise Control", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 24, parent_id: null, item_type: "work", code: "PRE-01.24", description: "Temporary Communication / Internet", uom_id: "69", uom: "MONTH", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 25, parent_id: null, item_type: "work", code: "PRE-01.25", description: "Quality Control Facilities", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  { id: 26, parent_id: null, item_type: "work", code: "PRE-01.26", description: "Document / Reporting Requirements", uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
];

function getTradeForScope(scope: BoqScopeRow): string {
  const prefix = scope.code.split("-")[0]?.toUpperCase() ?? "";
  if (TRADES.some((t) => t.code === prefix)) return prefix;
  const d = scope.discipline.toUpperCase();
  if (TRADES.some((t) => t.code === d)) return d;
  return "PRE";
}

function generateDefaultItemsForScope(scope: BoqScopeRow): StandardItemRow[] {
  if (scope.code.toUpperCase() === "PRE-01") return DEFAULT_PRE01_ITEMS;
  return [
    { id: 1, parent_id: null, item_type: "work", code: `${scope.code}.01`, description: `${scope.name} — Supply & Installation`, uom_id: "39", uom: "SQM", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
    { id: 2, parent_id: null, item_type: "work", code: `${scope.code}.02`, description: `${scope.name} — Testing & Accessories`, uom_id: "71", uom: "LS", item_id: "", resource_analysis_id: "", default_rate: "", note: "", is_active: true },
  ];
}

export function BoqScopesClient({
  scopes: initial,
  stats,
}: {
  scopes: BoqScopeRow[];
  stats: { packages: number; active: number; retired: number };
}) {
  const router = useRouter();
  const [scopes, setScopes] = useState<BoqScopeRow[]>(initial);
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedScopeId, setSelectedScopeId] = useState<number>(initial[0]?.id ?? 1);

  // Per-scope items dictionary
  const [itemsByScope, setItemsByScope] = useState<Record<number, StandardItemRow[]>>(() => {
    const map: Record<number, StandardItemRow[]> = {};
    for (const s of initial) {
      map[s.id] = generateDefaultItemsForScope(s);
    }
    return map;
  });

  // Modals state
  const [scopeModalOpen, setScopeModalOpen] = useState(false);
  const [editingScope, setEditingScope] = useState<BoqScopeRow | null>(null);
  const [scopeForm, setScopeForm] = useState({
    code: "",
    name: "",
    coverage: "",
    sort_order: "",
    is_active: true,
  });
  const [scopeFormError, setScopeFormError] = useState("");

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StandardItemRow | null>(null);
  const [itemForm, setItemForm] = useState({
    item_type: "work" as "section" | "work" | "material",
    parent_id: "",
    code: "",
    description: "",
    uom_id: "71",
    resource_analysis_id: "",
    item_id: "",
    default_rate: "",
    note: "",
    is_active: true,
  });
  const [itemFormError, setItemFormError] = useState("");

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState([
    { code: "", name: "", coverage: "" },
    { code: "", name: "", coverage: "" },
    { code: "", name: "", coverage: "" },
    { code: "", name: "", coverage: "" },
    { code: "", name: "", coverage: "" },
  ]);
  const [bulkError, setBulkError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<BoqScopeRow | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = scopes.filter((s) => {
    const trade = getTradeForScope(s);
    if (disciplineFilter && trade !== disciplineFilter) return false;
    if (statusFilter === "" && !s.isActive) return false;
    if (statusFilter === "retired" && s.isActive) return false;
    if (
      search &&
      !s.code.toLowerCase().includes(search.toLowerCase()) &&
      !s.name.toLowerCase().includes(search.toLowerCase()) &&
      !(s.coverage ?? "").toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const selectedScope =
    scopes.find((s) => s.id === selectedScopeId) ?? filtered[0] ?? scopes[0] ?? null;

  const selectedScopeItems = selectedScope
    ? itemsByScope[selectedScope.id] ?? generateDefaultItemsForScope(selectedScope)
    : [];

  const selectedTradeObj = selectedScope
    ? TRADES.find((t) => t.code === getTradeForScope(selectedScope)) ?? TRADES[0]
    : TRADES[0];

  function openAddScopeModal() {
    setEditingScope(null);
    setScopeFormError("");
    setScopeForm({
      code: "",
      name: "",
      coverage: "",
      sort_order: "",
      is_active: true,
    });
    setScopeModalOpen(true);
  }

  function openEditScopeModal(s: BoqScopeRow) {
    setEditingScope(s);
    setScopeFormError("");
    setScopeForm({
      code: s.code,
      name: s.name,
      coverage: s.coverage ?? "",
      sort_order: String(s.sortOrder ?? ""),
      is_active: s.isActive,
    });
    setScopeModalOpen(true);
  }

  async function handleSaveScope(e: React.FormEvent) {
    e.preventDefault();
    setScopeFormError("");
    const code = scopeForm.code.trim().toUpperCase();
    const name = scopeForm.name.trim();
    if (!code || !name) {
      setScopeFormError("Code and Name are required.");
      return;
    }
    const prefix = code.split("-")[0] ?? "PRE";
    setBusy(true);
    try {
      if (editingScope) {
        setScopes((prev) =>
          prev.map((x) =>
            x.id === editingScope.id
              ? {
                  ...x,
                  code,
                  name,
                  discipline: prefix,
                  coverage: scopeForm.coverage || null,
                  sortOrder: Number(scopeForm.sort_order) || x.sortOrder,
                  isActive: scopeForm.is_active,
                }
              : x
          )
        );
        setScopeModalOpen(false);
      } else {
        const res = await fetch("/api/construction/boq-scopes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            name,
            discipline: prefix,
            coverage: scopeForm.coverage || null,
            sort_order: Number(scopeForm.sort_order) || 10,
            is_active: scopeForm.is_active,
          }),
        });
        if (res.ok) {
          const d = await res.json();
          const created: BoqScopeRow = d.scope;
          setScopes((prev) => [...prev, created]);
          setItemsByScope((prev) => ({
            ...prev,
            [created.id]: generateDefaultItemsForScope(created),
          }));
          setSelectedScopeId(created.id);
          setScopeModalOpen(false);
          router.refresh();
        } else {
          const err = await res.json().catch(() => ({}));
          setScopeFormError(err.error || "Failed to save package.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleBulkCreate(e: React.FormEvent) {
    e.preventDefault();
    setBulkError("");
    const validRows = bulkRows.filter((r) => r.code.trim() && r.name.trim());
    if (validRows.length === 0) {
      setBulkError("Enter at least one row with a Code and Name.");
      return;
    }
    setBusy(true);
    try {
      const createdList: BoqScopeRow[] = [];
      for (const r of validRows) {
        const code = r.code.trim().toUpperCase();
        const prefix = code.split("-")[0] ?? "PRE";
        const res = await fetch("/api/construction/boq-scopes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            name: r.name.trim(),
            discipline: prefix,
            coverage: r.coverage.trim() || null,
            sort_order: 10,
            is_active: true,
          }),
        });
        if (res.ok) {
          const d = await res.json();
          createdList.push(d.scope);
        }
      }
      if (createdList.length > 0) {
        setScopes((prev) => [...prev, ...createdList]);
        setBulkModalOpen(false);
        setBulkRows([
          { code: "", name: "", coverage: "" },
          { code: "", name: "", coverage: "" },
          { code: "", name: "", coverage: "" },
          { code: "", name: "", coverage: "" },
          { code: "", name: "", coverage: "" },
        ]);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteScope() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/construction/boq-scopes/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const nextScopes = scopes.filter((x) => x.id !== deleteTarget.id);
        setScopes(nextScopes);
        if (selectedScopeId === deleteTarget.id && nextScopes[0]) {
          setSelectedScopeId(nextScopes[0].id);
        }
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  function handleToggleScope(s: BoqScopeRow) {
    setScopes((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, isActive: !x.isActive } : x))
    );
  }

  function openAddItemModal(parentId: number | null) {
    if (!selectedScope) return;
    setEditingItem(null);
    setItemFormError("");
    const nextNum = String(selectedScopeItems.length + 1).padStart(2, "0");
    setItemForm({
      item_type: "work",
      parent_id: parentId ? String(parentId) : "",
      code: `${selectedScope.code}.${nextNum}`,
      description: "",
      uom_id: "71",
      resource_analysis_id: "",
      item_id: "",
      default_rate: "",
      note: "",
      is_active: true,
    });
    setItemModalOpen(true);
  }

  function openEditItemModal(item: StandardItemRow) {
    setEditingItem(item);
    setItemFormError("");
    setItemForm({
      item_type: item.item_type,
      parent_id: item.parent_id ? String(item.parent_id) : "",
      code: item.code,
      description: item.description,
      uom_id: item.uom_id || "71",
      resource_analysis_id: item.resource_analysis_id,
      item_id: item.item_id,
      default_rate: item.default_rate,
      note: item.note,
      is_active: item.is_active,
    });
    setItemModalOpen(true);
  }

  function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedScope) return;
    if (!itemForm.description.trim()) {
      setItemFormError("Description is required.");
      return;
    }
    const uomShort =
      UOM_OPTIONS.find((u) => u.id === itemForm.uom_id)?.short ?? "LS";
    const list = [...selectedScopeItems];
    if (editingItem) {
      const updated = list.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              item_type: itemForm.item_type,
              parent_id: itemForm.parent_id ? Number(itemForm.parent_id) : null,
              code: itemForm.code.trim(),
              description: itemForm.description.trim(),
              uom_id: itemForm.uom_id,
              uom: uomShort,
              resource_analysis_id: itemForm.resource_analysis_id,
              item_id: itemForm.item_id,
              default_rate: itemForm.default_rate,
              note: itemForm.note,
              is_active: itemForm.is_active,
            }
          : it
      );
      setItemsByScope((prev) => ({ ...prev, [selectedScope.id]: updated }));
    } else {
      const newItem: StandardItemRow = {
        id: Date.now(),
        parent_id: itemForm.parent_id ? Number(itemForm.parent_id) : null,
        item_type: itemForm.item_type,
        code: itemForm.code.trim() || `${selectedScope.code}.${String(list.length + 1).padStart(2, "0")}`,
        description: itemForm.description.trim(),
        uom_id: itemForm.uom_id,
        uom: uomShort,
        resource_analysis_id: itemForm.resource_analysis_id,
        item_id: itemForm.item_id,
        default_rate: itemForm.default_rate,
        note: itemForm.note,
        is_active: itemForm.is_active,
      };
      setItemsByScope((prev) => ({
        ...prev,
        [selectedScope.id]: [...list, newItem],
      }));
    }
    setItemModalOpen(false);
  }

  function handleMoveItem(itemId: number, direction: "up" | "down") {
    if (!selectedScope) return;
    const list = [...selectedScopeItems];
    const idx = list.findIndex((i) => i.id === itemId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const tmp = list[idx];
    list[idx] = list[swapIdx];
    list[swapIdx] = tmp;
    setItemsByScope((prev) => ({ ...prev, [selectedScope.id]: list }));
  }

  function handleToggleItem(itemId: number) {
    if (!selectedScope) return;
    const updated = selectedScopeItems.map((it) =>
      it.id === itemId ? { ...it, is_active: !it.is_active } : it
    );
    setItemsByScope((prev) => ({ ...prev, [selectedScope.id]: updated }));
  }

  function handleDeleteItem(itemId: number) {
    if (!selectedScope) return;
    const updated = selectedScopeItems.filter((it) => it.id !== itemId);
    setItemsByScope((prev) => ({ ...prev, [selectedScope.id]: updated }));
  }

  const totalPackagesCount = scopes.length || stats.packages || 124;
  const retiredPackagesCount = scopes.filter((s) => !s.isActive).length;

  return (
    <div className="container ">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-layer-group" />
          </div>
          <div>
            <h1>BOQ Scope Library</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Home</a>
                </li>
                <li className="breadcrumb-item">
                  <a href="/boqs">Bills of Quantities</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Scope Library
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() =>
              downloadCsv(
                "boq-scopes.csv",
                ["Code", "Name", "Discipline", "Coverage", "Active"],
                filtered.map((s) => [s.code, s.name, s.discipline, s.coverage, s.isActive])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2" />
            Export
          </button>
          <button
            type="button"
            className="btn btn-erp-ghost"
            data-bs-toggle="modal"
            data-bs-target="#scopeBulkModal"
            onClick={() => setBulkModalOpen(true)}
          >
            <i className="fa-solid fa-table-list me-2" />
            Add Several
          </button>
          <button
            type="button"
            className="btn btn-erp"
            data-scope-add
            data-action="/boq-scopes"
            onClick={openAddScopeModal}
          >
            <i className="fa-solid fa-plus me-2" />
            Add Package
          </button>
        </div>
      </div>

      <div data-stats-slot>
        <div className="erp-sale-strip">
          <div className="erp-sale-stat">
            <span className="erp-sale-stat-label">Packages</span>
            <strong>{totalPackagesCount}</strong>
            <span className="erp-sale-stat-foot">In this company&apos;s library</span>
          </div>
          <div className="erp-sale-stat">
            <span className="erp-sale-stat-label">Standard Items</span>
            <strong>950</strong>
            <span className="erp-sale-stat-foot">Pay items a bill can be built from</span>
          </div>
          <div className="erp-sale-stat ">
            <span className="erp-sale-stat-label">Without a Template</span>
            <strong>0</strong>
            <span className="erp-sale-stat-foot">Still retyped on every project</span>
          </div>
          <div className="erp-sale-stat">
            <span className="erp-sale-stat-label">Retired</span>
            <strong>{retiredPackagesCount}</strong>
            <span className="erp-sale-stat-foot">Kept for the bills that name them</span>
          </div>
        </div>
      </div>

      <div className="erp-card erp-scope-shell" data-scope-library>
        <div className="erp-scope-split">
          <aside className="erp-scope-side">
            <div className="erp-scope-side-head">
              <form
                method="GET"
                action="/boq-scopes"
                className="erp-scope-filters"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="erp-search erp-search-sm">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    type="search"
                    name="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Code, name or coverage…"
                    aria-label="Search packages"
                  />
                </div>
                <div className="d-flex gap-2">
                  <select
                    name="discipline"
                    className="erp-select erp-select-sm"
                    aria-label="Trade"
                    value={disciplineFilter}
                    onChange={(e) => setDisciplineFilter(e.target.value)}
                  >
                    <option value="">All trades</option>
                    {TRADES.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <select
                    name="status"
                    className="erp-select erp-select-sm"
                    aria-label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Active</option>
                    <option value="retired">Retired</option>
                    <option value="all">All</option>
                  </select>
                  <button type="submit" className="btn btn-erp-ghost btn-sm" title="Filter">
                    <i className="fa-solid fa-filter" />
                  </button>
                </div>
              </form>
            </div>

            <div className="erp-scope-side-body" data-list-slot>
              {TRADES.map((trade) => {
                const groupItems = filtered.filter((s) => getTradeForScope(s) === trade.code);
                if (groupItems.length === 0) return null;
                return (
                  <div key={trade.code} className="erp-scope-group">
                    <div className="erp-scope-group-head">
                      <i className={trade.icon} />
                      <span>{trade.label}</span>
                      <span className="erp-scope-group-count">{groupItems.length}</span>
                    </div>
                    {groupItems.map((s) => {
                      const count =
                        (itemsByScope[s.id] ?? generateDefaultItemsForScope(s)).length;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`erp-scope-row ${selectedScope?.id === s.id ? "is-active" : ""}`}
                          data-scope-pick={s.id}
                          data-tree-url={`/boq-scopes/${s.id}/tree`}
                          title={s.coverage ?? s.name}
                          onClick={() => setSelectedScopeId(s.id)}
                        >
                          <span className="erp-scope-row-code">{s.code}</span>
                          <span className="erp-scope-row-name">{s.name}</span>
                          <span className={`erp-scope-row-count ${count > 0 ? "is-filled" : ""}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="erp-scope-main" data-pane-slot>
            {selectedScope ? (
              <>
                <div className="erp-scope-pane-head">
                  <div className="erp-scope-pane-id">
                    <span className="erp-scope-pane-icon">
                      <i className={selectedTradeObj.icon} />
                    </span>
                    <div>
                      <h3>
                        {selectedScope.code} <span>{selectedScope.name}</span>
                      </h3>
                      <p>{selectedScope.coverage || "—"}</p>
                    </div>
                  </div>

                  <div className="erp-scope-pane-actions">
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm"
                      data-scope-edit={`/boq-scopes/${selectedScope.id}`}
                      onClick={() => openEditScopeModal(selectedScope)}
                    >
                      <i className="fa-solid fa-pen me-1" />
                      Edit Package
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm"
                      data-scope-toggle={`/boq-scopes/${selectedScope.id}/toggle`}
                      onClick={() => handleToggleScope(selectedScope)}
                    >
                      <i
                        className={`fa-solid ${selectedScope.isActive ? "fa-toggle-on" : "fa-toggle-off"} me-1`}
                      />
                      {selectedScope.isActive ? "Retire" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm text-danger"
                      data-scope-delete={`/boq-scopes/${selectedScope.id}`}
                      data-scope-code={selectedScope.code}
                      onClick={() => setDeleteTarget(selectedScope)}
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp btn-sm"
                      data-item-add
                      data-action={`/boq-scopes/${selectedScope.id}/items`}
                      onClick={() => openAddItemModal(null)}
                    >
                      <i className="fa-solid fa-plus me-1" />
                      Add Item
                    </button>
                  </div>
                </div>

                <div className="erp-scope-pane-body" data-tree-scroll>
                  <div className="erp-loc-tree">
                    {selectedScopeItems.map((item) => (
                      <div
                        key={item.id}
                        className={`erp-loc-node ${!item.is_active ? "opacity-50" : ""}`}
                        style={{ "--loc-depth": item.parent_id ? 1 : 0 } as React.CSSProperties}
                      >
                        <div className="erp-loc-row">
                          <span className="erp-loc-rail" aria-hidden="true" />

                          <span className="erp-loc-icon ">
                            <i
                              className={
                                item.item_type === "section"
                                  ? "fa-solid fa-folder-tree"
                                  : item.item_type === "material"
                                  ? "fa-solid fa-cubes"
                                  : "fa-solid fa-trowel-bricks"
                              }
                            />
                          </span>

                          <span className="erp-loc-id">
                            <strong>{item.code}</strong> <span>{item.description}</span>
                          </span>

                          <span className="erp-pill is-booked">
                            {item.item_type === "section"
                              ? "Section"
                              : item.item_type === "material"
                              ? "Material"
                              : "Work item"}
                          </span>

                          {item.item_type !== "section" && (
                            <span className="erp-pill is-neutral">{item.uom}</span>
                          )}

                          {item.item_type !== "section" && !item.default_rate && (
                            <span
                              className="erp-pill is-overdue"
                              title="No analysis and no default rate — this becomes a bill line priced at nothing"
                            >
                              <i className="fa-solid fa-triangle-exclamation me-1" />
                              No rate
                            </span>
                          )}

                          {item.item_type !== "section" && item.default_rate && (
                            <span className="erp-pill is-available">
                              BDT {Number(item.default_rate).toLocaleString()}
                            </span>
                          )}

                          <span className="erp-loc-actions">
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm"
                              title="Move up"
                              data-item-move={`/boq-scopes/${selectedScope.id}/items/${item.id}/move`}
                              data-direction="up"
                              onClick={() => handleMoveItem(item.id, "up")}
                            >
                              <i className="fa-solid fa-chevron-up" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm"
                              title="Move down"
                              data-item-move={`/boq-scopes/${selectedScope.id}/items/${item.id}/move`}
                              data-direction="down"
                              onClick={() => handleMoveItem(item.id, "down")}
                            >
                              <i className="fa-solid fa-chevron-down" />
                            </button>

                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm"
                              title="Add inside"
                              data-item-add
                              data-parent={item.id}
                              data-action={`/boq-scopes/${selectedScope.id}/items`}
                              onClick={() => openAddItemModal(item.id)}
                            >
                              <i className="fa-solid fa-plus" />
                            </button>

                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm"
                              title={item.is_active ? "Mark inactive" : "Mark active"}
                              data-item-toggle={`/boq-scopes/${selectedScope.id}/items/${item.id}/toggle`}
                              onClick={() => handleToggleItem(item.id)}
                            >
                              <i
                                className={`fa-solid ${item.is_active ? "fa-toggle-on" : "fa-toggle-off"}`}
                              />
                            </button>

                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm"
                              title="Edit"
                              data-item-edit={`/boq-scopes/${selectedScope.id}/items/${item.id}`}
                              onClick={() => openEditItemModal(item)}
                            >
                              <i className="fa-solid fa-pen" />
                            </button>

                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              title="Delete"
                              data-item-delete={`/boq-scopes/${selectedScope.id}/items/${item.id}`}
                              data-item-label={item.description}
                              data-item-inside="0"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <i className="fa-solid fa-trash-can" />
                            </button>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-layer-group" />
                </div>
                <h3>Select a package</h3>
                <p>Pick a work package on the left to inspect its standard pay items.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* #scopeModal */}
      <div
        className={`modal fade ${scopeModalOpen ? "show d-block" : ""}`}
        id="scopeModal"
        tabIndex={-1}
        aria-hidden={!scopeModalOpen}
        style={scopeModalOpen ? { background: "rgba(0,0,0,0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered">
          <form
            method="POST"
            className="modal-content erp-form"
            data-scope-form
            data-submit-lock="off"
            style={{ border: "none", borderRadius: 14 }}
            onSubmit={handleSaveScope}
          >
            <div className="modal-body p-4">
              <h5 className="mb-1" style={{ fontSize: 16, fontWeight: 600 }} data-scope-title>
                {editingScope ? "Edit package" : "Add package"}
              </h5>
              <p className="text-muted mb-3" style={{ fontSize: "12.5px" }}>
                The code&apos;s first three letters decide which trade it groups under.
              </p>

              <div
                className="alert alert-danger py-2"
                role="alert"
                data-form-error
                hidden={!scopeFormError}
                style={{ borderRadius: 10, fontSize: "12.5px" }}
              >
                <i className="fa-solid fa-circle-exclamation me-1" />
                <span data-form-error-text>{scopeFormError}</span>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">
                      Code <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      className="form-control text-uppercase"
                      maxLength={20}
                      data-field="code"
                      placeholder="STR-08"
                      required
                      value={scopeForm.code}
                      onChange={(e) => setScopeForm({ ...scopeForm, code: e.target.value })}
                    />
                    <span className="erp-help" data-scope-prefix-hint>
                      Three letters, a dash, a number.
                    </span>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="erp-field">
                    <label className="form-label">
                      Name <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      maxLength={190}
                      data-field="name"
                      placeholder="Shear Wall Works"
                      required
                      value={scopeForm.name}
                      onChange={(e) => setScopeForm({ ...scopeForm, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <div className="erp-field">
                    <label className="form-label">Coverage</label>
                    <textarea
                      name="coverage"
                      className="form-control"
                      rows={2}
                      maxLength={500}
                      data-field="coverage"
                      placeholder="What this package is understood to include"
                      value={scopeForm.coverage}
                      onChange={(e) => setScopeForm({ ...scopeForm, coverage: e.target.value })}
                    />
                    <span className="erp-help">
                      The line that stops two estimators disagreeing about what was priced in here.
                    </span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="erp-field">
                    <label className="form-label">Sort Order</label>
                    <input
                      type="number"
                      name="sort_order"
                      className="form-control"
                      min="0"
                      max="999999"
                      data-field="sort_order"
                      value={scopeForm.sort_order}
                      onChange={(e) => setScopeForm({ ...scopeForm, sort_order: e.target.value })}
                    />
                    <span className="erp-help">
                      Where it sits in build order. Leave blank for the end of its trade.
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field mt-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="is_active"
                        value="1"
                        id="scopeActive"
                        data-field="is_active"
                        checked={scopeForm.is_active}
                        onChange={(e) =>
                          setScopeForm({ ...scopeForm, is_active: e.target.checked })
                        }
                      />
                      <label className="form-check-label" htmlFor="scopeActive">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setScopeModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" disabled={busy}>
                <i className="fa-solid fa-check me-2" />
                Save Package
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* #scopeItemModal */}
      <div
        className={`modal fade ${itemModalOpen ? "show d-block" : ""}`}
        id="scopeItemModal"
        tabIndex={-1}
        aria-hidden={!itemModalOpen}
        style={itemModalOpen ? { background: "rgba(0,0,0,0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <form
            method="POST"
            className="modal-content erp-form"
            data-item-form
            data-submit-lock="off"
            style={{ border: "none", borderRadius: 14 }}
            onSubmit={handleSaveItem}
          >
            <div className="modal-body p-4">
              <h5 className="mb-1" style={{ fontSize: 16, fontWeight: 600 }} data-item-title>
                {editingItem ? "Edit standard item" : "Add standard item"}
              </h5>
              <p className="text-muted mb-3" style={{ fontSize: "12.5px" }} data-item-type-hint>
                {itemForm.item_type === "section"
                  ? "A heading that groups lines underneath it."
                  : itemForm.item_type === "material"
                  ? "A catalogue product measured directly on the bill."
                  : "A measured activity priced from a rate analysis or default rate."}
              </p>

              <div
                className="alert alert-danger py-2"
                role="alert"
                data-form-error
                hidden={!itemFormError}
                style={{ borderRadius: 10, fontSize: "12.5px" }}
              >
                <i className="fa-solid fa-circle-exclamation me-1" />
                <span data-form-error-text>{itemFormError}</span>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label className="form-label">
                      Kind <span className="erp-required">*</span>
                    </label>
                    <select
                      name="item_type"
                      className="form-select"
                      data-field="item_type"
                      required
                      value={itemForm.item_type}
                      onChange={(e) =>
                        setItemForm({
                          ...itemForm,
                          item_type: e.target.value as "section" | "work" | "material",
                        })
                      }
                    >
                      <option value="section">Section</option>
                      <option value="work">Work item</option>
                      <option value="material">Material</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="erp-field">
                    <label className="form-label">Inside</label>
                    <select
                      name="parent_id"
                      className="form-select"
                      data-field="parent_id"
                      data-select2
                      data-dropdown-parent="#scopeItemModal"
                      data-parent-picker
                      data-placeholder="— Top level —"
                      value={itemForm.parent_id}
                      onChange={(e) => setItemForm({ ...itemForm, parent_id: e.target.value })}
                    >
                      <option value="">— Top level —</option>
                      {selectedScopeItems.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-md-3">
                  <div className="erp-field">
                    <label className="form-label">Code</label>
                    <input
                      type="text"
                      name="code"
                      className="form-control"
                      maxLength={40}
                      data-field="code"
                      placeholder="01"
                      value={itemForm.code}
                      onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                    />
                    <span className="erp-help">Optional.</span>
                  </div>
                </div>
                <div className="col-md-9">
                  <div className="erp-field">
                    <label className="form-label">
                      Description <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="description"
                      className="form-control"
                      maxLength={500}
                      data-field="description"
                      placeholder="RCC in columns, M25"
                      required
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    />
                    <span className="erp-help">The text that lands on the bill.</span>
                  </div>
                </div>

                {itemForm.item_type !== "section" && (
                  <div className="col-md-4" data-when="priced">
                    <div className="erp-field">
                      <label className="form-label">
                        Unit <span className="erp-required">*</span>
                      </label>
                      <select
                        name="uom_id"
                        className="form-select"
                        data-field="uom_id"
                        data-select2
                        data-dropdown-parent="#scopeItemModal"
                        data-placeholder="Unit"
                        value={itemForm.uom_id}
                        onChange={(e) => setItemForm({ ...itemForm, uom_id: e.target.value })}
                      >
                        <option value="" />
                        {UOM_OPTIONS.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                      <span className="erp-help">
                        What makes one project&apos;s rate comparable to another&apos;s.
                      </span>
                    </div>
                  </div>
                )}

                {itemForm.item_type === "work" && (
                  <div className="col-md-8" data-when="work">
                    <div className="erp-field">
                      <label className="form-label">Resource Analysis</label>
                      <select
                        name="resource_analysis_id"
                        className="form-select"
                        data-field="resource_analysis_id"
                        data-select2
                        data-dropdown-parent="#scopeItemModal"
                        data-allow-clear="1"
                        data-placeholder="No build-up yet"
                        value={itemForm.resource_analysis_id}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, resource_analysis_id: e.target.value })
                        }
                      >
                        <option value="">No build-up yet</option>
                      </select>
                      <span className="erp-help">
                        The build-up this item is normally priced from. Attaching it here is the
                        step a hurried estimator skips.
                      </span>
                    </div>
                  </div>
                )}

                {itemForm.item_type === "material" && (
                  <div className="col-md-8" data-when="material">
                    <div className="erp-field">
                      <label className="form-label">
                        Product <span className="erp-required">*</span>
                      </label>
                      <select
                        name="item_id"
                        className="form-select"
                        data-field="item_id"
                        data-select2
                        data-dropdown-parent="#scopeItemModal"
                        data-allow-clear="1"
                        data-placeholder="Pick a product"
                        value={itemForm.item_id}
                        onChange={(e) => setItemForm({ ...itemForm, item_id: e.target.value })}
                      >
                        <option value="">Pick a product</option>
                        {PRODUCT_OPTIONS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {itemForm.item_type !== "section" && (
                  <div className="col-md-4" data-when="priced">
                    <div className="erp-field">
                      <label className="form-label">Default Rate</label>
                      <input
                        type="number"
                        name="default_rate"
                        className="form-control"
                        step="0.0001"
                        min="0"
                        data-field="default_rate"
                        value={itemForm.default_rate}
                        onChange={(e) => setItemForm({ ...itemForm, default_rate: e.target.value })}
                      />
                      <span className="erp-help">
                        A fallback for work with no analysis. The analysis wins when there is one.
                      </span>
                    </div>
                  </div>
                )}

                <div className="col-md-8">
                  <div className="erp-field">
                    <label className="form-label">Note</label>
                    <input
                      type="text"
                      name="note"
                      className="form-control"
                      maxLength={500}
                      data-field="note"
                      placeholder="Measurement convention, inclusions, exclusions"
                      value={itemForm.note}
                      onChange={(e) => setItemForm({ ...itemForm, note: e.target.value })}
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="erp-field mt-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="is_active"
                        value="1"
                        id="itemActive"
                        data-field="is_active"
                        checked={itemForm.is_active}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, is_active: e.target.checked })
                        }
                      />
                      <label className="form-check-label" htmlFor="itemActive">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setItemModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp">
                <i className="fa-solid fa-check me-2" />
                Save Item
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* #scopeBulkModal */}
      <div
        className={`modal fade ${bulkModalOpen ? "show d-block" : ""}`}
        id="scopeBulkModal"
        tabIndex={-1}
        aria-hidden={!bulkModalOpen}
        style={bulkModalOpen ? { background: "rgba(0,0,0,0.45)" } : undefined}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
          <form
            method="POST"
            action="/boq-scopes/bulk"
            className="modal-content erp-form"
            data-scope-bulk-form
            data-submit-lock="off"
            style={{ border: "none", borderRadius: 14 }}
            onSubmit={handleBulkCreate}
          >
            <div className="modal-header border-0 px-4 pt-4 pb-0">
              <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                <i className="fa-solid fa-table-list me-2 text-muted" />
                Add several packages
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setBulkModalOpen(false)}
              />
            </div>

            <div className="modal-body p-4">
              <p className="erp-note mb-3">
                <i className="fa-solid fa-circle-info" />
                <span>
                  All of them are saved together or none of them are. The code&apos;s first three
                  letters decide the trade it groups under, so they have to be one the app knows —
                  PRE, SUB, STR, ARC, INT, PLB, ELE, ELV, FIR, MEC, VTR, EXT, SPC, TST.
                </span>
              </p>

              <div
                className="alert alert-danger py-2"
                role="alert"
                data-form-error
                hidden={!bulkError}
                style={{ borderRadius: 10, fontSize: "12.5px" }}
              >
                <i className="fa-solid fa-circle-exclamation me-1" />
                <span data-form-error-text>{bulkError}</span>
              </div>

              <div className="erp-table-wrap">
                <table className="table erp-table mb-0" data-bulk-table>
                  <thead>
                    <tr>
                      <th style={{ width: 130 }}>
                        Code <span className="erp-required">*</span>
                      </th>
                      <th style={{ minWidth: 220 }}>
                        Name <span className="erp-required">*</span>
                      </th>
                      <th style={{ minWidth: 300 }}>Coverage</th>
                      <th style={{ width: 44 }} />
                    </tr>
                  </thead>
                  <tbody data-bulk-rows>
                    {bulkRows.map((r, idx) => (
                      <tr key={idx} data-bulk-row>
                        <td>
                          <input
                            type="text"
                            name={`rows[${idx}][code]`}
                            className="form-control form-control-sm text-uppercase"
                            maxLength={20}
                            placeholder="SPC-11"
                            value={r.code}
                            onChange={(e) =>
                              setBulkRows(
                                bulkRows.map((x, i) =>
                                  i === idx ? { ...x, code: e.target.value } : x
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name={`rows[${idx}][name]`}
                            className="form-control form-control-sm"
                            maxLength={190}
                            placeholder="Pneumatic Waste System"
                            value={r.name}
                            onChange={(e) =>
                              setBulkRows(
                                bulkRows.map((x, i) =>
                                  i === idx ? { ...x, name: e.target.value } : x
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name={`rows[${idx}][coverage]`}
                            className="form-control form-control-sm"
                            maxLength={500}
                            placeholder="What the package includes"
                            value={r.coverage}
                            onChange={(e) =>
                              setBulkRows(
                                bulkRows.map((x, i) =>
                                  i === idx ? { ...x, coverage: e.target.value } : x
                                )
                              )
                            }
                          />
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            data-bulk-remove
                            title="Remove row"
                            onClick={() =>
                              setBulkRows(
                                bulkRows.length > 1
                                  ? bulkRows.filter((_, i) => i !== idx)
                                  : [{ code: "", name: "", coverage: "" }]
                              )
                            }
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="btn btn-erp-ghost btn-sm mt-3"
                data-bulk-add
                onClick={() =>
                  setBulkRows([...bulkRows, { code: "", name: "", coverage: "" }])
                }
              >
                <i className="fa-solid fa-plus me-1" />
                Add row
              </button>
              <span className="erp-help ms-2">Blank rows are ignored.</span>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-erp-ghost"
                data-bs-dismiss="modal"
                onClick={() => setBulkModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-erp" disabled={busy}>
                <i className="fa-solid fa-check me-2" />
                Create Packages
              </button>
            </div>
          </form>
        </div>
      </div>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete scope package?"
        description={
          <>
            <strong>{deleteTarget?.name ?? ""}</strong> will be removed.
          </>
        }
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteScope}
      />
    </div>
  );
}
