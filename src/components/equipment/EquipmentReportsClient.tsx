"use client";

import Link from "next/link";
import { useState } from "react";
import { downloadCsv } from "@/lib/csv-client";
import { EquipmentSubmenu } from "./EquipmentSubmenu";

type ReportKind = "costs" | "utilisation" | "reliability" | "project-cost" | "compliance" | "depreciation";

interface EqItem {
  id: number;
  code: string;
  name: string;
  status: string;
  ownershipType?: string;
  acquisitionCost?: number;
  usefulLifeYears?: number;
  salvageValue?: number;
  depreciationMethod?: string;
  internalHourlyRate: number;
  category?: { name: string } | null;
}

export function EquipmentReportsClient({
  kind,
  equipments,
  usageLogs,
  fuelLogs,
  workOrders,
  operators: _operators = [],
  projects = [],
}: {
  kind: ReportKind;
  equipments: EqItem[];
  usageLogs: { equipmentId: number; projectId?: number | null; hoursWorked: number; hoursIdle: number; hoursDown: number; rate: number; isChargeable: boolean }[];
  fuelLogs: { equipmentId: number; amount: number }[];
  workOrders: { equipmentId: number; estimatedCost: number }[];
  operators?: { id: number; equipmentId: number | null; employeeName: string; certificationType: string; licenceNo: string | null; expiresOn: string | null }[];
  projects?: { id: number; code?: string; name: string }[];
}) {
  const [from, setFrom] = useState("2026-11-01");
  const [to, setTo] = useState("2026-11-17");
  const [period, setPeriod] = useState("2026-11-01");
  const [projectId, setProjectId] = useState("");
  const [includeRetired, setIncludeRetired] = useState(false);

  const visibleEq = equipments.filter((e) => includeRetired || e.status !== "retired");

  return (
    <div className="container ">
      <EquipmentSubmenu />

      {kind === "costs" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-coins" />
              </div>
              <div>
                <h1>Cost &amp; Recovery</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Cost &amp; Recovery
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
                    "equipment-costs.csv",
                    ["Machine", "Status"],
                    visibleEq.map((e) => [`${e.code} ${e.name}`, e.status])
                  )
                }
              >
                <i className="fa-solid fa-file-excel me-2" />
                Export every line
              </button>
            </div>
          </div>

          <div className="erp-card">
            <div className="erp-toolbar">
              <form method="GET" className="d-flex flex-wrap align-items-center gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="date"
                  name="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="form-control erp-select"
                  aria-label="From"
                />
                <input
                  type="date"
                  name="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="form-control erp-select"
                  aria-label="To"
                />
                <label className="form-check form-check-inline mb-0">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="include_retired"
                    value="1"
                    checked={includeRetired}
                    onChange={(e) => setIncludeRetired(e.target.checked)}
                  />
                  <span className="form-check-label" style={{ fontSize: "12.5px" }}>
                    Include disposed
                  </span>
                </label>
                <button type="submit" className="btn btn-erp-ghost">
                  Apply
                </button>
              </form>
            </div>
          </div>

          <div className="erp-statrow mt-3">
            <div className="erp-stat">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-money-bill-wave" />
              </span>
              <span className="erp-stat-body">
                <strong>0.00</strong>
                <small>the fleet cost</small>
              </span>
            </div>
            <div className="erp-stat">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-arrow-right-to-bracket" />
              </span>
              <span className="erp-stat-body">
                <strong>0.00</strong>
                <small>charged to projects</small>
              </span>
            </div>
            <div className="erp-stat ">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-scale-unbalanced" />
              </span>
              <span className="erp-stat-body">
                <strong>0.00</strong>
                <small>over-recovered</small>
              </span>
            </div>
            <div className="erp-stat">
              <span className="erp-stat-icon">
                <i className="fa-solid fa-clock" />
              </span>
              <span className="erp-stat-body">
                <strong>0.0</strong>
                <small>hours worked</small>
              </span>
            </div>
          </div>

          <div className="erp-context-banner mt-3">
            <span className="erp-context-banner-icon">
              <i className="fa-solid fa-circle-info" />
            </span>
            <div className="erp-context-banner-body">
              <strong>How this works</strong>
              <span>
                Fuel, repairs, licensing and depreciation accumulate against each machine. Approved usage
                logs charge projects an hourly rate, crediting <em>Plant Cost Recovered</em>. Whatever is
                left over is the plant department&apos;s genuine under- or over-recovery, and it is carried by
                overheads rather than by any job.
              </span>
            </div>
          </div>

          <div className="erp-card mt-3">
            <div className="erp-card-head">
              <h2>
                <i className="fa-solid fa-table me-2" />
                By machine
              </h2>
            </div>

            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Machine</th>
                      <th className="text-end">Fuel</th>
                      <th className="text-end">Repairs</th>
                      <th className="text-end">Depreciation</th>
                      <th className="text-end">Total cost</th>
                      <th className="text-end">Hours</th>
                      <th className="text-end">Cost / hr</th>
                      <th className="text-end">Recovered</th>
                      <th className="text-end">Net</th>
                      <th>Own vs hire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEq.map((eq) => {
                      const fuel = fuelLogs.filter((f) => f.equipmentId === eq.id).reduce((s, f) => s + f.amount, 0);
                      const repairs = workOrders.filter((w) => w.equipmentId === eq.id).reduce((s, w) => s + w.estimatedCost, 0);
                      const dep = 0;
                      const totalCost = fuel + repairs + dep;
                      const hrs = usageLogs.filter((u) => u.equipmentId === eq.id).reduce((s, u) => s + u.hoursWorked, 0);
                      const recovered = usageLogs
                        .filter((u) => u.equipmentId === eq.id && u.isChargeable)
                        .reduce((s, u) => s + u.hoursWorked * (u.rate || eq.internalHourlyRate), 0);
                      return (
                        <tr key={eq.id}>
                          <td>
                            <Link href={`/equipment/register/${eq.id}`} className="erp-plain-link erp-cell-strong">
                              {eq.code}
                            </Link>
                            <span className="erp-identity-meta d-block">{eq.name}</span>
                          </td>
                          <td className="text-end">{fuel.toFixed(2)}</td>
                          <td className="text-end">{repairs.toFixed(2)}</td>
                          <td className="text-end">{dep.toFixed(2)}</td>
                          <td className="text-end erp-cell-strong">{totalCost.toFixed(2)}</td>
                          <td className="text-end">{hrs.toFixed(1)}</td>
                          <td className="text-end">
                            {hrs > 0 ? (
                              (totalCost / hrs).toFixed(2)
                            ) : (
                              <span className="text-muted" title="The machine did not work, so cost per hour is undefined">
                                —
                              </span>
                            )}
                          </td>
                          <td className="text-end text-success">{recovered.toFixed(2)}</td>
                          <td className="text-end text-success">{(recovered - totalCost).toFixed(2)}</td>
                          <td>
                            <span className="text-muted" title="Set a market hire rate on the machine to enable this">
                              —
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="erp-cell-strong">
                      <td colSpan={4} className="text-end">
                        Totals
                      </td>
                      <td className="text-end">0.00</td>
                      <td className="text-end">0.0</td>
                      <td className="text-end">—</td>
                      <td className="text-end">0.00</td>
                      <td className="text-end text-success">0.00</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {kind === "utilisation" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-chart-simple" />
              </div>
              <div>
                <h1>Utilisation</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Utilisation
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
                    "equipment-utilisation.csv",
                    ["Machine", "Status"],
                    visibleEq.map((e) => [`${e.code} ${e.name}`, e.status])
                  )
                }
              >
                <i className="fa-solid fa-file-excel me-2" />
                Export
              </button>
            </div>
          </div>

          <div className="erp-card">
            <div className="erp-toolbar">
              <form method="GET" className="d-flex flex-wrap align-items-center gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="date"
                  name="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="form-control erp-select"
                  aria-label="From"
                />
                <input
                  type="date"
                  name="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="form-control erp-select"
                  aria-label="To"
                />
                <button type="submit" className="btn btn-erp-ghost">
                  Apply
                </button>
              </form>
              <span className="text-muted" style={{ fontSize: "12.5px" }}>
                target 70% · anything under 40% is poor
              </span>
            </div>

            <div className="erp-card-body is-flush">
              <div className="erp-table-wrap">
                <table className="table erp-table">
                  <thead>
                    <tr>
                      <th>Machine</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th className="text-end">Worked</th>
                      <th className="text-end">Idle</th>
                      <th className="text-end">Down</th>
                      <th className="text-end">Available</th>
                      <th style={{ minWidth: 150 }}>Utilisation</th>
                      <th className="text-end">Charged out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEq.map((eq) => {
                      const logs = usageLogs.filter((u) => u.equipmentId === eq.id);
                      const worked = logs.reduce((s, u) => s + u.hoursWorked, 0);
                      const idle = logs.reduce((s, u) => s + u.hoursIdle, 0);
                      const down = logs.reduce((s, u) => s + u.hoursDown, 0);
                      const avail = Math.max(136 - down, worked + idle);
                      const util = avail > 0 ? Math.round((worked / avail) * 100) : 0;
                      const charged = logs.reduce(
                        (s, u) => s + (u.isChargeable ? u.hoursWorked * (u.rate || eq.internalHourlyRate) : 0),
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
                          <td>
                            <span className="erp-identity-meta">{eq.category?.name ?? "Excavator"}</span>
                          </td>
                          <td>
                            {eq.status === "available" ? (
                              <span className="erp-pill is-success">Available</span>
                            ) : (
                              <span className="erp-pill is-danger">Broken down</span>
                            )}
                          </td>
                          <td className="text-end">{worked.toFixed(1)}</td>
                          <td className="text-end text-muted">{idle.toFixed(1)}</td>
                          <td className="text-end text-muted">{down.toFixed(1)}</td>
                          <td className="text-end text-muted">{avail.toFixed(0)}</td>
                          <td>
                            <div className="erp-progress" title={`${util}% of available hours`}>
                              <span className="erp-progress-bar is-poor" style={{ width: `${util}%` }} />
                            </div>
                            <small className="text-muted" style={{ fontSize: 11 }}>
                              {util}% — never worked in this period
                            </small>
                          </td>
                          <td className="text-end">{charged.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {kind === "reliability" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-heart-pulse" />
              </div>
              <div>
                <h1>Reliability &amp; Downtime</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Reliability
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="erp-context-banner">
            <span className="erp-context-banner-icon">
              <i className="fa-solid fa-circle-info" />
            </span>
            <div className="erp-context-banner-body">
              <strong>Planned share is the number to watch</strong>
              <span>
                It is the share of jobs that were scheduled rather than forced. A fleet running below about
                half planned is firefighting, and firefighting always costs more than the maintenance it
                skipped.
              </span>
            </div>
          </div>

          <div className="erp-card mt-3">
            <div className="erp-toolbar">
              <form method="GET" className="d-flex flex-wrap align-items-center gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="date"
                  name="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="form-control erp-select"
                  aria-label="From"
                />
                <input
                  type="date"
                  name="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="form-control erp-select"
                  aria-label="To"
                />
                <button type="submit" className="btn btn-erp-ghost">
                  Apply
                </button>
              </form>
            </div>

            <div className="erp-empty">
              <div className="erp-empty-icon">
                <i className="fa-solid fa-heart-pulse" />
              </div>
              <h3>No work orders in this period</h3>
              <p>Which is either very good news, or a sign that nobody is recording them.</p>
            </div>
          </div>
        </>
      )}

      {kind === "project-cost" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-diagram-project" />
              </div>
              <div>
                <h1>Plant Cost by Project</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      By project
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="erp-card">
            <div className="erp-toolbar">
              <form
                method="GET"
                className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
                onSubmit={(e) => e.preventDefault()}
              >
                <select
                  name="project_id"
                  className="form-select erp-select"
                  data-select2
                  data-placeholder="Choose a project"
                  aria-label="Project"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Choose a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code ? `${p.code} — ${p.name}` : p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  name="from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="form-control erp-select"
                  aria-label="From"
                />
                <input
                  type="date"
                  name="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="form-control erp-select"
                  aria-label="To"
                />
                <button type="submit" className="btn btn-erp-ghost">
                  Show
                </button>
              </form>
            </div>

            {!projectId ? (
              <div className="erp-empty">
                <div className="erp-empty-icon">
                  <i className="fa-solid fa-diagram-project" />
                </div>
                <h3>Choose a project</h3>
                <p>This shows what plant has been charged to one job, machine by machine.</p>
              </div>
            ) : (
              <div className="erp-card-body is-flush">
                <div className="erp-table-wrap">
                  <table className="table erp-table">
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th className="text-end">Hours</th>
                        <th className="text-end">Charged</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleEq.map((eq) => {
                        const logs = usageLogs.filter((u) => u.equipmentId === eq.id && String(u.projectId ?? "") === projectId);
                        const hrs = logs.reduce((s, u) => s + u.hoursWorked, 0);
                        const amt = logs.reduce((s, u) => s + u.hoursWorked * (u.rate || eq.internalHourlyRate), 0);
                        return (
                          <tr key={eq.id}>
                            <td>
                              <Link href={`/equipment/register/${eq.id}`} className="erp-plain-link erp-cell-strong">
                                {eq.code}
                              </Link>
                              <span className="erp-identity-meta d-block">{eq.name}</span>
                            </td>
                            <td className="text-end">{hrs.toFixed(1)}</td>
                            <td className="text-end">{amt.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {kind === "compliance" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-shield-halved" />
              </div>
              <div>
                <h1>Compliance &amp; Expiry</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Compliance
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="erp-context-banner">
            <span className="erp-context-banner-icon">
              <i className="fa-solid fa-circle-info" />
            </span>
            <div className="erp-context-banner-body">
              <strong>Anything lapsing in the next 90 days</strong>
              <span>
                Fitness, insurance, tax token and route permit <em>block dispatch</em> once expired —
                a machine cannot leave the yard without an override. Everything else is a warning.
                The standard warning window is 30 days.
              </span>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-xl-7">
              <div className="erp-card">
                <div className="erp-card-head">
                  <h2>
                    <i className="fa-solid fa-file-shield me-2" />
                    Machine papers
                  </h2>
                  <span className="erp-pill is-warning">5</span>
                </div>

                <div className="erp-card-body is-flush">
                  <div className="erp-table-wrap">
                    <table className="table erp-table">
                      <thead>
                        <tr>
                          <th>Machine</th>
                          <th>Document</th>
                          <th>Number</th>
                          <th>Expires</th>
                          <th>Effect</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <Link href="/equipment/register/3" className="erp-plain-link erp-cell-strong">
                              EQP-0003
                            </Link>
                            <span className="erp-identity-meta d-block">Potain MDT 219 Tower Crane</span>
                          </td>
                          <td>
                            <i className="fa-solid fa-weight-hanging me-1" />
                            Load test certificate
                          </td>
                          <td>
                            <span className="erp-identity-meta">LOA-776371</span>
                          </td>
                          <td className="text-nowrap">
                            30 Aug 2026
                            <span className="erp-identity-meta d-block text-danger">79 days ago</span>
                          </td>
                          <td>
                            <span className="erp-pill is-warning">Expired</span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Link href="/equipment/register/8" className="erp-plain-link erp-cell-strong">
                              EQP-0008
                            </Link>
                            <span className="erp-identity-meta d-block">DHAKA-METRO-TA-11-2244</span>
                          </td>
                          <td>
                            <i className="fa-solid fa-shield-halved me-1" />
                            Insurance
                          </td>
                          <td>
                            <span className="erp-identity-meta">INS-791443</span>
                          </td>
                          <td className="text-nowrap">
                            30 Sep 2026
                            <span className="erp-identity-meta d-block text-danger">48 days ago</span>
                          </td>
                          <td>
                            <span className="erp-pill is-danger">
                              <i className="fa-solid fa-ban me-1" />
                              Cannot dispatch
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <Link href="/equipment/register/9" className="erp-plain-link erp-cell-strong">
                              EQP-0009
                            </Link>
                            <span className="erp-identity-meta d-block">DHAKA-METRO-TA-14-8821</span>
                          </td>
                          <td>
                            <i className="fa-solid fa-shield-halved me-1" />
                            Fitness
                          </td>
                          <td>
                            <span className="erp-identity-meta">FIT-442109</span>
                          </td>
                          <td className="text-nowrap">
                            30 Nov 2026
                            <span className="erp-identity-meta d-block text-warning">in 13 days</span>
                          </td>
                          <td>
                            <span className="erp-pill is-warning">Warning</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-5">
              <div className="erp-card">
                <div className="erp-card-head">
                  <h2>
                    <i className="fa-solid fa-id-card me-2" />
                    Operator licences
                  </h2>
                  <span className="erp-pill is-success">0</span>
                </div>

                <div className="erp-card-body">
                  <p className="text-muted mb-0">No operator certification lapses in the next 90 days.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {kind === "depreciation" && (
        <>
          <div className="erp-pagehead">
            <div className="erp-pagehead-main">
              <div className="erp-pagehead-icon">
                <i className="fa-solid fa-arrow-trend-down" />
              </div>
              <div>
                <h1>Depreciation Run</h1>
                <nav aria-label="breadcrumb">
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link href="/equipment">Equipment</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Depreciation
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>

          <div className="erp-context-banner">
            <span className="erp-context-banner-icon">
              <i className="fa-solid fa-circle-info" />
            </span>
            <div className="erp-context-banner-body">
              <strong>Dr Depreciation Expense · Cr Accumulated Depreciation</strong>
              <span>
                Only machines we own and have capitalised are written down — hired plant never is, because
                it is not our asset. Running a month twice posts nothing the second time, so it is safe to
                re-run after a correction.
              </span>
            </div>
          </div>

          <div className="erp-card mt-3">
            <div className="erp-toolbar">
              <form
                method="GET"
                className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
                onSubmit={(e) => e.preventDefault()}
              >
                <label className="form-label mb-0 me-1" htmlFor="periodPick">
                  Period
                </label>
                <input
                  type="date"
                  id="periodPick"
                  name="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="form-control erp-select"
                />
                <button type="submit" className="btn btn-erp-ghost">
                  Preview
                </button>
              </form>

              <form method="POST" action="/equipment/reports/depreciation/run" onSubmit={(e) => e.preventDefault()}>
                <input type="hidden" name="period" value={period} />
                <button className="btn btn-erp" data-submit-button>
                  <i className="fa-solid fa-play me-2" />
                  Post November 2026 — 547,639.59
                </button>
              </form>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-xl-7">
              <div className="erp-card">
                <div className="erp-card-head">
                  <h2>
                    <i className="fa-solid fa-eye me-2" />
                    What this run would post
                  </h2>
                  <span className="erp-identity-meta">November 2026</span>
                </div>

                <div className="erp-card-body is-flush">
                  <div className="erp-table-wrap">
                    <table className="table erp-table">
                      <thead>
                        <tr>
                          <th>Machine</th>
                          <th>Method</th>
                          <th className="text-end">Book value</th>
                          <th className="text-end">Charge</th>
                          <th className="text-end">After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleEq.map((eq) => {
                          const cost = eq.acquisitionCost ?? 9600000;
                          const charge =
                            cost > 0 && eq.usefulLifeYears
                              ? (cost - (eq.salvageValue ?? cost * 0.1)) / (eq.usefulLifeYears * 12)
                              : 90000;
                          return (
                            <tr key={eq.id}>
                              <td>
                                <Link href={`/equipment/register/${eq.id}`} className="erp-plain-link erp-cell-strong">
                                  {eq.code}
                                </Link>
                                <span className="erp-identity-meta d-block">{eq.name}</span>
                              </td>
                              <td>
                                <span className="erp-identity-meta">Straight line</span>
                              </td>
                              <td className="text-end">
                                {cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="text-end erp-cell-strong">
                                {charge.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="text-end text-muted">
                                {Math.max(0, cost - charge).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="erp-cell-strong">
                          <td colSpan={3} className="text-end">
                            Total
                          </td>
                          <td className="text-end">547,639.59</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-5">
              <div className="erp-card">
                <div className="erp-card-head">
                  <h2>
                    <i className="fa-solid fa-triangle-exclamation me-2" />
                    Skipped
                  </h2>
                  <span className="erp-pill is-success">0</span>
                </div>

                <div className="erp-card-body">
                  <p className="text-muted mb-0">Every capitalised machine can be depreciated for this period.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
