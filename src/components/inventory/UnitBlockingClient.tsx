"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpEmptyState, ErpPageHeader } from "@/components/ui";

interface BlockingUnitRow {
  id: number;
  unitNumber: string;
  unitType: string;
  status: string;
  description: string | null;
  building: { name: string };
  floor: { floorNumber: number; name: string | null };
}

export function UnitBlockingClient({ units: initial }: { units: BlockingUnitRow[] }) {
  const router = useRouter();
  const [units, setUnits] = useState(initial);
  const [filter, setFilter] = useState<"all" | "blocked" | "available">("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered = units.filter((u) => (filter === "all" ? true : u.status === filter));

  async function toggleBlock(u: BlockingUnitRow) {
    setBusyId(u.id);
    const nextStatus = u.status === "blocked" ? "available" : "blocked";
    try {
      const res = await fetch(`/api/inventory/units/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setUnits((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: nextStatus } : x)));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container">
      <ErpPageHeader
        icon="fa-solid fa-ban"
        title="Unit Blocking"
        breadcrumbs={[{ label: "Home", href: "/dashboard" }, { label: "Inventory" }, { label: "Unit Blocking" }]}
      />

      <div className="erp-card">
        <div className="erp-toolbar">
          <div className="d-flex gap-2">
            {(["all", "blocked", "available"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`btn btn-sm ${filter === f ? "btn-erp" : "btn-erp-ghost"}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All units" : f === "blocked" ? "Blocked only" : "Available"}
              </button>
            ))}
          </div>
          <span className="text-muted small ms-auto">{filtered.length} units</span>
        </div>

        <div className="erp-card-body is-flush">
          {filtered.length === 0 ? (
            <ErpEmptyState icon="fa-solid fa-ban" title="No units to display" description="Units from buildings appear here for administrative hold or release." />
          ) : (
            <div className="erp-table-wrap">
              <table className="table erp-table mb-0">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Building</th>
                    <th>Floor</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id}>
                      <td className="erp-cell-strong">{u.unitNumber}</td>
                      <td>{u.building.name}</td>
                      <td>{u.floor.name || `Floor ${u.floor.floorNumber}`}</td>
                      <td className="text-capitalize">{u.unitType}</td>
                      <td>
                        <span className={`erp-pill ${u.status === "blocked" ? "is-overdue" : "is-available"} text-capitalize`}>
                          {u.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-end">
                        {["available", "blocked", "reserved", "under_construction"].includes(u.status) && (
                          <button
                            type="button"
                            className={`btn btn-sm ${u.status === "blocked" ? "btn-erp-ghost" : "btn-erp-ghost text-danger"}`}
                            disabled={busyId === u.id}
                            onClick={() => toggleBlock(u)}
                          >
                            {u.status === "blocked" ? "Release" : "Block Unit"}
                          </button>
                        )}
                      </td>
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
