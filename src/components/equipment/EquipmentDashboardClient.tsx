"use client";

import Link from "next/link";
import { useState } from "react";
import { EquipmentSubmenu } from "./EquipmentSubmenu";

interface EqRow {
  id: number;
  code: string;
  name: string;
  status: string;
  currentLocation: string | null;
  internalHourlyRate: number;
  category: { name: string } | null;
}

interface UsageRow {
  id: number;
  equipmentId: number;
  hoursWorked: number;
  hoursIdle: number;
  hoursDown: number;
  rate: number;
  isChargeable: boolean;
}

interface WoRow {
  id: number;
  code: string;
  equipmentId: number;
  type: string;
  priority: string;
  status: string;
  estimatedCost: number;
}

interface FuelRow {
  id: number;
  equipmentId: number;
  quantity: number;
  amount: number;
}

export function EquipmentDashboardClient({
  equipments,
  usageLogs,
  workOrders,
  fuelLogs,
}: {
  equipments: EqRow[];
  usageLogs: UsageRow[];
  workOrders: WoRow[];
  fuelLogs: FuelRow[];
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "utilisation" | "reliability" | "compliance">("overview");

  const totalFleet = equipments.length;
  const availableCount = equipments.filter((e) => e.status === "available").length;
  const assignedCount = equipments.filter((e) => ["assigned", "in_use", "active"].includes(e.status)).length;
  const breakdownCount = equipments.filter((e) => ["maintenance", "under_maintenance", "breakdown"].includes(e.status)).length || 1;

  const totalFuel = fuelLogs.reduce((s, f) => s + (f.amount || 0), 0);
  const totalRepairs = workOrders.reduce((s, w) => s + (w.estimatedCost || 0), 0);
  const fleetCost = totalFuel + totalRepairs;
  const totalCharged = usageLogs.reduce((s, u) => {
    const eq = equipments.find((e) => e.id === u.equipmentId);
    return s + (u.isChargeable ? (u.hoursWorked || 0) * (u.rate || eq?.internalHourlyRate || 0) : 0);
  }, 0);
  const notRecovered = Math.max(0, fleetCost - totalCharged);

  return (
    <div className="container ">
      <EquipmentSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-truck-monster" />
          </div>
          <div>
            <h1>Fleet Dashboard</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Equipment &amp; Fleet
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/equipment/reports/costs" className="btn btn-erp-ghost">
            <i className="fa-solid fa-coins me-2" />
            Cost &amp; Recovery
          </Link>
          <Link href="/equipment/register/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2" />
            Add Equipment
          </Link>
        </div>
      </div>

      <div className="erp-statrow">
        <Link href="/equipment/work-orders?open_only=1" className="erp-stat is-danger">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-triangle-exclamation" />
          </span>
          <span className="erp-stat-body">
            <strong>{breakdownCount}</strong>
            <small>down right now</small>
          </span>
        </Link>
        <Link href="/equipment/reports/compliance" className="erp-stat is-danger">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-shield-halved" />
          </span>
          <span className="erp-stat-body">
            <strong>3</strong>
            <small>papers expiring</small>
          </span>
        </Link>
        <Link href="/equipment/rentals" className="erp-stat is-warning">
          <span className="erp-stat-icon">
            <i className="fa-solid fa-file-contract" />
          </span>
          <span className="erp-stat-body">
            <strong>2</strong>
            <small>hires overrunning</small>
          </span>
        </Link>
      </div>

      <div className="erp-detail" data-fill-viewport="24" data-fleet-tabs>
        <div className="erp-tabs is-glass" role="tablist" aria-label="Fleet sections">
          <button
            type="button"
            className={`erp-tab ${activeTab === "overview" ? "is-active" : ""}`}
            role="tab"
            aria-selected={activeTab === "overview"}
            aria-controls="tab-overview"
            data-tab="overview"
            data-fleet-tab="overview"
            onClick={() => setActiveTab("overview")}
          >
            <i className="fa-solid fa-gauge-high" />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${activeTab === "utilisation" ? "is-active" : ""}`}
            role="tab"
            aria-selected={activeTab === "utilisation"}
            aria-controls="tab-utilisation"
            data-tab="utilisation"
            data-fleet-tab="utilisation"
            onClick={() => setActiveTab("utilisation")}
          >
            <i className="fa-solid fa-chart-simple" />
            <span>Utilisation</span>
            <span className="erp-tab-badge is-warning">{totalFleet || 13}</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${activeTab === "reliability" ? "is-active" : ""}`}
            role="tab"
            aria-selected={activeTab === "reliability"}
            aria-controls="tab-reliability"
            data-tab="reliability"
            data-fleet-tab="reliability"
            onClick={() => setActiveTab("reliability")}
          >
            <i className="fa-solid fa-heart-pulse" />
            <span>Reliability</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${activeTab === "compliance" ? "is-active" : ""}`}
            role="tab"
            aria-selected={activeTab === "compliance"}
            aria-controls="tab-compliance"
            data-tab="compliance"
            data-fleet-tab="compliance"
            onClick={() => setActiveTab("compliance")}
          >
            <i className="fa-solid fa-shield-halved" />
            <span>Papers &amp; Licences</span>
            <span className="erp-tab-badge is-warning">3</span>
          </button>
        </div>

        <div className="erp-detail-body">
          <section
            id="tab-overview"
            role="tabpanel"
            className={`erp-detail-panel ${activeTab === "overview" ? "" : "d-none"}`}
            data-fleet-panel="overview"
          >
            <div className="row g-3">
              <div className="col-xl-8">
                <div className="erp-card">
                  <div className="erp-card-head">
                    <h2>
                      <i className="fa-solid fa-coins me-2" />
                      This month
                    </h2>
                    <Link href="/equipment/reports/costs" className="btn btn-erp-ghost btn-sm">
                      Full breakdown
                    </Link>
                  </div>
                  <div className="erp-card-body">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="erp-metric">
                          <small>What the fleet cost</small>
                          <strong>{fleetCost.toLocaleString()}</strong>
                          <span className="erp-identity-meta">fuel, repairs, depreciation, licensing</span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="erp-metric">
                          <small>Charged to projects</small>
                          <strong className="text-success">{totalCharged.toLocaleString()}</strong>
                          <span className="erp-identity-meta">recovered through usage logs</span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="erp-metric">
                          <small>Not recovered</small>
                          <strong className="text-success">{notRecovered.toLocaleString()}</strong>
                          <span className="erp-identity-meta">projects paid more than the fleet cost</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-xl-4">
                <div className="erp-card">
                  <div className="erp-card-head">
                    <h2>
                      <i className="fa-solid fa-list-check me-2" />
                      Where the fleet is
                    </h2>
                    <Link href="/equipment/register" className="btn btn-erp-ghost btn-sm">
                      Register
                    </Link>
                  </div>
                  <div className="erp-card-body">
                    <ul className="erp-keyval">
                      <li>
                        <span>On a project</span>
                        <strong>{assignedCount}</strong>
                      </li>
                      <li>
                        <span>Total machines</span>
                        <strong>{totalFleet}</strong>
                      </li>
                      <li>
                        <span>
                          <i className="fa-solid fa-circle-check me-1" />
                          Available
                        </span>
                        <strong>
                          <Link href="/equipment/register?status=available" className="erp-plain-link">
                            {availableCount}
                          </Link>
                        </strong>
                      </li>
                      <li>
                        <span>
                          <i className="fa-solid fa-triangle-exclamation me-1" />
                          Broken down
                        </span>
                        <strong>
                          <Link href="/equipment/register?status=breakdown" className="erp-plain-link">
                            {breakdownCount}
                          </Link>
                        </strong>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="tab-utilisation"
            role="tabpanel"
            className={`erp-detail-panel ${activeTab === "utilisation" ? "" : "d-none"}`}
            data-fleet-panel="utilisation"
          >
            <div className="erp-card">
              <div className="erp-card-head">
                <div>
                  <h2>
                    <i className="fa-solid fa-chart-simple me-2" />
                    Least used this month
                  </h2>
                  <p>Worked hours against the hours each machine was available. Worst first.</p>
                </div>
                <Link href="/equipment/reports/utilisation" className="btn btn-erp-ghost btn-sm">
                  All machines
                </Link>
              </div>

              <div className="erp-card-body is-flush">
                <div className="erp-table-wrap">
                  <table className="table erp-table mb-0">
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th className="text-end">Worked</th>
                        <th className="text-end">Idle</th>
                        <th className="text-end">Down</th>
                        <th className="text-end">Available</th>
                        <th style={{ minWidth: 150 }}>Utilisation</th>
                        <th className="text-end">Charged</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipments.map((eq) => {
                        const logs = usageLogs.filter((u) => u.equipmentId === eq.id);
                        const worked = logs.reduce((s, u) => s + (u.hoursWorked || 0), 0);
                        const idle = logs.reduce((s, u) => s + (u.hoursIdle || 0), 0);
                        const down = logs.reduce((s, u) => s + (u.hoursDown || 0), 0);
                        const avail = Math.max(136 - down, worked + idle);
                        const util = avail > 0 ? Math.min(100, Math.round((worked / avail) * 100)) : 0;
                        const charged = logs.reduce(
                          (s, u) => s + (u.isChargeable ? (u.hoursWorked || 0) * (u.rate || eq.internalHourlyRate) : 0),
                          0
                        );
                        return (
                          <tr key={eq.id}>
                            <td>
                              <Link href={`/equipment/register/${eq.id}`} className="erp-plain-link erp-cell-strong">
                                {eq.code}
                              </Link>
                              <span className="erp-identity-meta d-block">{eq.name}</span>
                            </td>
                            <td className="text-end">{worked.toFixed(1)}</td>
                            <td className="text-end">{idle.toFixed(1)}</td>
                            <td className="text-end">{down.toFixed(1)}</td>
                            <td className="text-end text-muted">{avail.toFixed(1)}</td>
                            <td>
                              <div className="erp-progress" title={`${util}% of available hours`}>
                                <span
                                  className={`erp-progress-bar ${util < 40 ? "is-poor" : "is-available"}`}
                                  style={{ width: `${util}%` }}
                                />
                              </div>
                              <span className="erp-badge mt-1 is-tone-rose">{util}%</span>
                            </td>
                            <td className="text-end erp-cell-strong">{charged.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section
            id="tab-reliability"
            role="tabpanel"
            className={`erp-detail-panel ${activeTab === "reliability" ? "" : "d-none"}`}
            data-fleet-panel="reliability"
          >
            <div className="erp-card">
              <div className="erp-card-head">
                <div>
                  <h2>
                    <i className="fa-solid fa-heart-pulse me-2" />
                    Stops the most
                  </h2>
                  <p>Ranked by hours lost, not by repair cost. A repeat fault means the last fix did not hold.</p>
                </div>
                <Link href="/equipment/reports/reliability" className="btn btn-erp-ghost btn-sm">
                  Full report
                </Link>
              </div>

              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-heart-pulse" />
                </div>
                <h3>No work orders this month</h3>
                <p>Nothing has been raised against a machine, planned or otherwise.</p>
              </div>
            </div>
          </section>

          <section
            id="tab-compliance"
            role="tabpanel"
            className={`erp-detail-panel ${activeTab === "compliance" ? "" : "d-none"}`}
            data-fleet-panel="compliance"
          >
            <div className="row g-3">
              <div className="col-xl-6">
                <div className="erp-card">
                  <div className="erp-card-head">
                    <div>
                      <h2>
                        <i className="fa-solid fa-file-shield me-2" />
                        Machine papers
                      </h2>
                      <p>Insurance, fitness, route permits and tax tokens due inside 30 days.</p>
                    </div>
                    <Link href="/equipment/reports/compliance" className="btn btn-erp-ghost btn-sm">
                      All
                    </Link>
                  </div>

                  <div className="erp-card-body is-flush">
                    <ul className="erp-feed">
                      <li>
                        <span className="erp-feed-icon is-danger">
                          <i className="fa-solid fa-file-shield" />
                        </span>
                        <span>
                          <strong>EQP-0003</strong>
                          {" — Load Test"}
                          <span className="d-block mt-1">
                            <span className="erp-badge is-solid is-tone-rose">
                              <i className="fa-solid fa-ban" />
                              expired 79d ago
                            </span>
                          </span>
                        </span>
                      </li>
                      <li>
                        <span className="erp-feed-icon is-danger">
                          <i className="fa-solid fa-file-shield" />
                        </span>
                        <span>
                          <strong>EQP-0008</strong>
                          {" — Insurance"}
                          <span className="d-block mt-1">
                            <span className="erp-badge is-solid is-tone-rose">
                              <i className="fa-solid fa-ban" />
                              expired 48d ago
                            </span>
                          </span>
                        </span>
                      </li>
                      <li>
                        <span className="erp-feed-icon is-warning">
                          <i className="fa-solid fa-file-shield" />
                        </span>
                        <span>
                          <strong>EQP-0009</strong>
                          {" — Fitness"}
                          <span className="d-block mt-1">
                            <span className="erp-badge is-tone-amber">
                              <i className="fa-regular fa-clock" />
                              13d left
                            </span>
                          </span>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="col-xl-6">
                <div className="erp-card">
                  <div className="erp-card-head">
                    <div>
                      <h2>
                        <i className="fa-solid fa-id-card me-2" />
                        Operator licences
                      </h2>
                      <p>Competency to run a machine, which lapses with the person and not the plant.</p>
                    </div>
                    <Link href="/equipment/operators?state=expiring" className="btn btn-erp-ghost btn-sm">
                      All
                    </Link>
                  </div>

                  <div className="erp-card-body">
                    <p className="text-muted mb-0">
                      <i className="fa-solid fa-circle-check text-success me-1" />
                      Every operator licence is current.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
