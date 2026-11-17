"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErpDeleteModal, ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

interface ProjectDetailProps {
  project: {
    id: number;
    code: string;
    name: string;
    status: string;
    priority: string;
    progress: number;
    completionPct: number;
    location: string;
    city: string | null;
    country: string;
    startDate: string | null;
    expectedCompletionDate: string | null;
    actualCompletionDate: string | null;
    description: string | null;
    currency: string;
    budget: number;
    estimatedCost: number;
    actualCost: number;
    managerName: string | null;
    clientName: string | null;
    projectType: { id: number; name: string } | null;
    projectCategory: { id: number; name: string } | null;
    buildings: { id: number; code: string; name: string }[];
    tasks: { id: number; title: string; category: string | null; status: string; assigneeNames: string | null; startDate: string | null; dueDate: string | null; estimatedCost: number }[];
    teams: { id: number; name: string; departmentName: string | null; leadName: string | null; type: string }[];
    costs: { id: number; category: string; costDate: string; amount: number; notes: string | null }[];
    consumptions: { id: number; materialName: string; costCode: string | null; qtyUsed: number; wastage: number; uom: string; unitCost: number; consumptionDate: string | null; notes: string | null; building: { name: string } | null }[];
  };
  allProjects: { id: number; code: string; name: string }[];
  buildings: { id: number; name: string }[];
  taskTemplates: { id: number; name: string; category: string | null }[];
}

export function ProjectDetailClient({ project: initial, allProjects, buildings, taskTemplates }: ProjectDetailProps) {
  const router = useRouter();
  const [project, setProject] = useState(initial);
  const [modal, setModal] = useState<null | "state" | "task" | "team" | "cost" | "consumption">(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // State modal
  const [statusVal, setStatusVal] = useState(project.status);
  const [progressVal, setProgressVal] = useState(project.progress || project.completionPct);
  const [actualDateVal, setActualDateVal] = useState(project.actualCompletionDate || "");

  // Task modal
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [taskStatus, setTaskStatus] = useState("new");
  const [taskStart, setTaskStart] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskAssignees, setTaskAssignees] = useState("");

  // Team modal
  const [teamName, setTeamName] = useState("");
  const [teamDept, setTeamDept] = useState("Civil Engineering");
  const [teamLead, setTeamLead] = useState("");

  // Cost modal
  const [costCategory, setCostCategory] = useState("labour");
  const [costDate, setCostDate] = useState(new Date().toISOString().slice(0, 10));
  const [costAmount, setCostAmount] = useState("");
  const [costNotes, setCostNotes] = useState("");

  // Consumption modal
  const [consMaterial, setConsMaterial] = useState("");
  const [consBuildingId, setConsBuildingId] = useState("");
  const [consTaskId, setConsTaskId] = useState("");
  const [consQty, setConsQty] = useState("");
  const [consWastage, setConsWastage] = useState("0");
  const [consUom, setConsUom] = useState("Bag");
  const [consUnitCost, setConsUnitCost] = useState("0");
  const [consDate, setConsDate] = useState(new Date().toISOString().slice(0, 10));
  const [consNotes, setConsNotes] = useState("");

  async function handleSaveState(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusVal, progress: progressVal, actual_completion_date: actualDateVal || null }),
      });
      if (res.ok) {
        setProject((p) => ({ ...p, status: statusVal, progress: progressVal, completionPct: progressVal, actualCompletionDate: actualDateVal || null }));
        setModal(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          category: taskCategory || null,
          status: taskStatus,
          start_date: taskStart || null,
          due_date: taskDue || null,
          assignee_names: taskAssignees || null,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setProject((p) => ({ ...p, tasks: [d.task, ...p.tasks] }));
        setTaskTitle("");
        setModal(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleTaskStatus(taskId: number, status: string) {
    const res = await fetch(`/api/projects/${project.id}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
    if (res.ok) {
      setProject((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)) }));
    }
  }

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName, department_name: teamDept, lead_name: teamLead || null }),
      });
      if (res.ok) {
        const d = await res.json();
        setProject((p) => ({ ...p, teams: [d.team, ...p.teams] }));
        setTeamName("");
        setModal(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCost(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const amt = Number(costAmount) || 0;
      const res = await fetch(`/api/projects/${project.id}/costs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: costCategory, cost_date: costDate, amount: amt, notes: costNotes || null }),
      });
      if (res.ok) {
        const d = await res.json();
        setProject((p) => ({ ...p, actualCost: p.actualCost + amt, costs: [d.cost, ...p.costs] }));
        setCostAmount("");
        setModal(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleAddConsumption(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/consumptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_name: consMaterial,
          building_id: consBuildingId ? Number(consBuildingId) : null,
          project_task_id: consTaskId ? Number(consTaskId) : null,
          qty_used: Number(consQty) || 0,
          wastage: Number(consWastage) || 0,
          uom: consUom,
          unit_cost: Number(consUnitCost) || 0,
          consumption_date: consDate || null,
          notes: consNotes || null,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setProject((p) => ({ ...p, consumptions: [{ ...d.consumption, building: null }, ...p.consumptions] }));
        setConsMaterial("");
        setModal(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProject() {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/projects/projects");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const taskCounts = {
    new: project.tasks.filter((t) => t.status === "new").length,
    started: project.tasks.filter((t) => t.status === "started").length,
    in_progress: project.tasks.filter((t) => t.status === "in_progress").length,
    hold: project.tasks.filter((t) => t.status === "hold").length,
    pending: project.tasks.filter((t) => t.status === "pending").length,
    done: project.tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="container">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-city"
        title={project.name}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Projects", href: "/projects/projects" },
          { label: project.code },
        ]}
        actions={
          <div className="d-flex flex-wrap gap-2">
            <select
              className="form-select erp-select"
              value={project.id}
              onChange={(e) => router.push(`/projects/projects/${e.target.value}`)}
              aria-label="Switch project"
            >
              {allProjects.map((ap) => (
                <option key={ap.id} value={ap.id}>{ap.code} · {ap.name}</option>
              ))}
            </select>
            <button type="button" className="btn btn-erp-ghost" onClick={() => setModal("state")}>
              <i className="fa-solid fa-sliders me-2" />Update Progress
            </button>
            <button type="button" className="btn btn-erp-ghost text-danger" onClick={() => setDeleteOpen(true)}>
              <i className="fa-solid fa-trash-can me-2" />Delete Project
            </button>
          </div>
        }
      />

      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="erp-card h-100 p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="h6 mb-0">Project lifecycle</h3>
              <span className="erp-pill is-available">{project.status}</span>
            </div>
            <div className="progress mb-2" style={{ height: 8 }}>
              <div className="progress-bar" style={{ width: `${project.progress || project.completionPct}%` }} />
            </div>
            <div className="small text-muted">{project.progress || project.completionPct}% complete</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="erp-card h-100 p-3">
            <h3 className="h6 mb-2">Classification</h3>
            <div className="small">Type: <strong>{project.projectType?.name || "—"}</strong></div>
            <div className="small">Category: <strong>{project.projectCategory?.name || "—"}</strong></div>
            <div className="small">Priority: <strong className="text-capitalize">{project.priority}</strong></div>
            <div className="small">Manager: <strong>{project.managerName || "—"}</strong></div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="erp-card h-100 p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="h6 mb-0">Cost &amp; Budget</h3>
              <button type="button" className="btn btn-erp-ghost btn-sm" onClick={() => setModal("cost")}>+ Cost</button>
            </div>
            <div className="small">Budget: <strong>{project.currency} {project.budget.toLocaleString()}</strong></div>
            <div className="small">Actual Cost: <strong>{project.currency} {project.actualCost.toLocaleString()}</strong></div>
            <div className="small">Location: <strong>{project.location}</strong></div>
          </div>
        </div>
      </div>

      {/* Task Status Strip */}
      <div className="erp-card mb-3 p-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
          <h3 className="h6 mb-0">Task status ({project.tasks.length})</h3>
          <button type="button" className="btn btn-erp btn-sm" onClick={() => setModal("task")}>
            <i className="fa-solid fa-plus me-1" />Add Task
          </button>
        </div>
        <div className="d-flex flex-wrap gap-2 mb-3">
          {Object.entries(taskCounts).map(([st, cnt]) => (
            <span key={st} className="erp-pill is-neutral text-capitalize">{st.replace("_", " ")}: {cnt}</span>
          ))}
        </div>
        {project.tasks.length === 0 ? (
          <p className="text-muted small mb-0">No tasks added yet.</p>
        ) : (
          <div className="erp-table-wrap">
            <table className="table erp-table mb-0">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Category</th>
                  <th>Assignees</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {project.tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="erp-cell-strong">{t.title}</td>
                    <td>{t.category || "—"}</td>
                    <td>{t.assigneeNames || "—"}</td>
                    <td className="small">{t.startDate || "—"} → {t.dueDate || "—"}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 130 }}
                        value={t.status}
                        onChange={(e) => handleTaskStatus(t.id, e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="started">Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="hold">Hold</option>
                        <option value="pending">Pending</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Teams & Consumption */}
      <div className="row g-3">
        <div className="col-md-5">
          <div className="erp-card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="h6 mb-0">Teams ({project.teams.length})</h3>
              <button type="button" className="btn btn-erp-ghost btn-sm" onClick={() => setModal("team")}>+ Add Team</button>
            </div>
            {project.teams.length === 0 ? (
              <p className="text-muted small mb-0">No teams yet.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {project.teams.map((tm) => (
                  <li key={tm.id} className="list-group-item px-0">
                    <strong>{tm.name}</strong>
                    <div className="small text-muted">{tm.departmentName || "—"} · Lead: {tm.leadName || "—"}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="col-md-7">
          <div className="erp-card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h3 className="h6 mb-0">Materials Used ({project.consumptions.length})</h3>
              <button type="button" className="btn btn-erp-ghost btn-sm" onClick={() => setModal("consumption")}>
                <i className="fa-solid fa-plus me-1" />Record Consumption
              </button>
            </div>
            {project.consumptions.length === 0 ? (
              <p className="text-muted small mb-0">No material consumption recorded yet.</p>
            ) : (
              <div className="erp-table-wrap">
                <table className="table erp-table mb-0">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Qty Used</th>
                      <th>Wastage</th>
                      <th>UoM</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.consumptions.map((c) => (
                      <tr key={c.id}>
                        <td className="erp-cell-strong">{c.materialName}</td>
                        <td>{c.qtyUsed}</td>
                        <td>{c.wastage}</td>
                        <td>{c.uom}</td>
                        <td className="small">{c.consumptionDate || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === "state" && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleSaveState}>
              <div className="modal-header">
                <h5 className="modal-title">Update Status &amp; Progress</h5>
                <button type="button" className="btn-close" onClick={() => setModal(null)} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={statusVal} onChange={(e) => setStatusVal(e.target.value)}>
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="erp-field">
                  <label className="form-label">Progress ({progressVal}%)</label>
                  <input type="range" min={0} max={100} className="form-range" value={progressVal} onChange={(e) => setProgressVal(Number(e.target.value))} />
                </div>
                <div className="erp-field">
                  <label className="form-label">Actual Completion Date</label>
                  <input type="date" className="form-control" value={actualDateVal} onChange={(e) => setActualDateVal(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "task" && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleAddTask}>
              <div className="modal-header">
                <h5 className="modal-title">Add Task</h5>
                <button type="button" className="btn-close" onClick={() => setModal(null)} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Task Title <span className="erp-required">*</span></label>
                  <input className="form-control" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} list="task-tpl-list" />
                  <datalist id="task-tpl-list">
                    {taskTemplates.slice(0, 30).map((tt) => <option key={tt.id} value={tt.name} />)}
                  </datalist>
                </div>
                <div className="row">
                  <div className="col-6 erp-field">
                    <label className="form-label">Category</label>
                    <input className="form-control" value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} />
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
                      <option value="new">New</option>
                      <option value="started">Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="hold">Hold</option>
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Start Date</label>
                    <input type="date" className="form-control" value={taskStart} onChange={(e) => setTaskStart(e.target.value)} />
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-control" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                  </div>
                </div>
                <div className="erp-field mb-0">
                  <label className="form-label">Assignees</label>
                  <input className="form-control" placeholder="Names..." value={taskAssignees} onChange={(e) => setTaskAssignees(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "team" && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleAddTeam}>
              <div className="modal-header">
                <h5 className="modal-title">Add Project Team</h5>
                <button type="button" className="btn-close" onClick={() => setModal(null)} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Team Name <span className="erp-required">*</span></label>
                  <input className="form-control" required value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                </div>
                <div className="erp-field">
                  <label className="form-label">Department</label>
                  <input className="form-control" value={teamDept} onChange={(e) => setTeamDept(e.target.value)} />
                </div>
                <div className="erp-field mb-0">
                  <label className="form-label">Team Lead</label>
                  <input className="form-control" value={teamLead} onChange={(e) => setTeamLead(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Save Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "cost" && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleAddCost}>
              <div className="modal-header">
                <h5 className="modal-title">Record Project Cost</h5>
                <button type="button" className="btn-close" onClick={() => setModal(null)} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={costCategory} onChange={(e) => setCostCategory(e.target.value)}>
                    <option value="labour">Labour</option>
                    <option value="material">Material</option>
                    <option value="equipment">Equipment</option>
                    <option value="subcontract">Subcontract</option>
                    <option value="transport">Transport</option>
                    <option value="permit">Permit / Fees</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="row">
                  <div className="col-6 erp-field">
                    <label className="form-label">Cost Date <span className="erp-required">*</span></label>
                    <input type="date" className="form-control" required value={costDate} onChange={(e) => setCostDate(e.target.value)} />
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Amount <span className="erp-required">*</span></label>
                    <input type="number" step="0.01" className="form-control" required value={costAmount} onChange={(e) => setCostAmount(e.target.value)} />
                  </div>
                </div>
                <div className="erp-field mb-0">
                  <label className="form-label">Notes</label>
                  <input className="form-control" value={costNotes} onChange={(e) => setCostNotes(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Record Cost</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "consumption" && (
        <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleAddConsumption}>
              <div className="modal-header">
                <h5 className="modal-title">Record Consumption</h5>
                <button type="button" className="btn-close" onClick={() => setModal(null)} />
              </div>
              <div className="modal-body">
                <div className="erp-field">
                  <label className="form-label">Material <span className="erp-required">*</span></label>
                  <input className="form-control" required value={consMaterial} onChange={(e) => setConsMaterial(e.target.value)} />
                </div>
                <div className="row">
                  <div className="col-6 erp-field">
                    <label className="form-label">Building</label>
                    <select className="form-select" value={consBuildingId} onChange={(e) => setConsBuildingId(e.target.value)}>
                      <option value="">—</option>
                      {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Task</label>
                    <select className="form-select" value={consTaskId} onChange={(e) => setConsTaskId(e.target.value)}>
                      <option value="">— whole project —</option>
                      {project.tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                  <div className="col-4 erp-field">
                    <label className="form-label">Qty Used</label>
                    <input type="number" step="0.01" className="form-control" required value={consQty} onChange={(e) => setConsQty(e.target.value)} />
                  </div>
                  <div className="col-4 erp-field">
                    <label className="form-label">Wastage</label>
                    <input type="number" step="0.01" className="form-control" value={consWastage} onChange={(e) => setConsWastage(e.target.value)} />
                  </div>
                  <div className="col-4 erp-field">
                    <label className="form-label">UoM</label>
                    <input className="form-control" value={consUom} onChange={(e) => setConsUom(e.target.value)} />
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Unit Cost</label>
                    <input type="number" step="0.01" className="form-control" value={consUnitCost} onChange={(e) => setConsUnitCost(e.target.value)} />
                  </div>
                  <div className="col-6 erp-field">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" value={consDate} onChange={(e) => setConsDate(e.target.value)} />
                  </div>
                </div>
                <div className="erp-field mb-0">
                  <label className="form-label">Notes</label>
                  <input className="form-control" value={consNotes} onChange={(e) => setConsNotes(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-erp-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-erp" disabled={busy}>Save Consumption</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ErpDeleteModal
        open={deleteOpen}
        title="Delete project?"
        description={<><strong>{project.name}</strong> will be removed from active use.</>}
        busy={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}
