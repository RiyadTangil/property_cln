"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpEmptyState, ErpPageHeader } from "@/components/ui";
import { downloadCsv } from "@/lib/csv-client";

interface PriceUnitRow {
  id: number;
  buildingId: number;
  unitNumber: string;
  unitType: string;
  status: string;
  builtArea: number | null;
  ratePerSqft: number | null;
  price: number | null;
  building: { id: number; name: string };
  floor: { id: number; floorNumber: number; name: string | null };
}

export function PriceListsClient({
  units: initial,
  buildings,
}: {
  units: PriceUnitRow[];
  buildings: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [units, setUnits] = useState(initial);
  const [buildingId, setBuildingId] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const filtered = units.filter((u) => !buildingId || String(u.buildingId) === buildingId);

  async function saveRow(u: PriceUnitRow, ratePerSqft: number | null, price: number | null) {
    setSavingId(u.id);
    try {
      const res = await fetch(`/api/inventory/units/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate_per_sqft: ratePerSqft, price }),
      });
      if (res.ok) {
        setUnits((prev) => prev.map((x) => (x.id === u.id ? { ...x, ratePerSqft, price } : x)));
        router.refresh();
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-tags"
        title="Price Lists"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Inventory" }, { label: "Price Lists" }]}
        actions={
          <button
            type="button"
            className="btn btn-erp-ghost"
            onClick={() =>
              downloadCsv(
                "unit-price-list.csv",
                ["Unit", "Building", "Floor", "Type", "Built Area", "Rate/sqft", "Total Price", "Status"],
                filtered.map((u) => [u.unitNumber, u.building.name, u.floor.name || u.floor.floorNumber, u.unitType, u.builtArea, u.ratePerSqft, u.price, u.status])
              )
            }
          >
            <i className="fa-solid fa-file-excel me-2" />Export
          </button>
        }
      />

      <div className="erp-card">
        <div className="erp-toolbar">
          <select className="form-select erp-select" value={buildingId} onChange={(e) => setBuildingId(e.target.value)}>
            <option value="">All buildings</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <span className="text-muted small ms-auto">{filtered.length} units</span>
        </div>

        <div className="erp-card-body is-flush">
          {filtered.length === 0 ? (
            <ErpEmptyState icon="fa-solid fa-tags" title="No unit price lists yet" description="Add floors and units to buildings to set price schedules." />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table mb-0">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Building</th>
                    <th>Floor</th>
                    <th className="text-end">Built Area (sf)</th>
                    <th className="text-end" style={{ width: 150 }}>Rate / sq ft</th>
                    <th className="text-end" style={{ width: 170 }}>Asking Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td className="erp-cell-strong">{u.unitNumber}</td>
                      <td>{u.building.name}</td>
                      <td>{u.floor.name || `Floor ${u.floor.floorNumber}`}</td>
                      <td className="text-end">{u.builtArea ?? "—"}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end"
                          defaultValue={u.ratePerSqft ?? ""}
                          disabled={savingId === u.id}
                          onBlur={(e) => {
                            const rate = e.target.value ? Number(e.target.value) : null;
                            const calcPrice = rate !== null && u.builtArea ? Math.round(rate * u.builtArea) : u.price;
                            if (rate !== u.ratePerSqft) saveRow(u, rate, calcPrice);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end"
                          defaultValue={u.price ?? ""}
                          disabled={savingId === u.id}
                          onBlur={(e) => {
                            const pr = e.target.value ? Number(e.target.value) : null;
                            if (pr !== u.price) saveRow(u, u.ratePerSqft, pr);
                          }}
                        />
                      </td>
                      <td><span className="erp-pill is-available text-capitalize">{u.status.replace("_", " ")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
