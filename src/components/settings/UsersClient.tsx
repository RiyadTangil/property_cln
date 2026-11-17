"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/tier0";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  jobTitle: string | null;
  phone: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function UsersClient({
  users,
  roles,
  filters,
}: {
  users: UserRow[];
  roles: string[];
  filters: { search: string; role: string; status: string };
}) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function toggleActive(u: UserRow) {
    setBusyId(u.id);
    try {
      await fetch(`/api/settings/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !u.isActive }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      await fetch(`/api/settings/users/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const hasFilter = filters.search || filters.role || filters.status;

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-users-gear"></i>
          </div>
          <div>
            <h1>Users</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Users
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/settings/roles" className="btn btn-erp-ghost">
            <i className="fa-solid fa-user-shield me-2"></i>Roles
          </Link>
          <Link href="/settings/users/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New User
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <form
            method="GET"
            action="/settings/users"
            className="d-flex flex-wrap align-items-center gap-2 flex-grow-1"
          >
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                name="search"
                defaultValue={filters.search}
                placeholder="Search name, email, job title…"
                aria-label="Search users"
              />
            </div>

            <select
              name="role"
              className="form-select erp-select"
              aria-label="Role filter"
              defaultValue={filters.role}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              name="status"
              className="form-select erp-select"
              aria-label="Status filter"
              defaultValue={filters.status}
              onChange={(e) => e.currentTarget.form?.submit()}
            >
              <option value="">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Suspended only</option>
            </select>

            <button type="submit" className="btn btn-erp-ghost">
              Filter
            </button>

            {hasFilter && (
              <Link href="/settings/users" className="btn btn-erp-ghost">
                <i className="fa-solid fa-xmark me-1"></i>Clear
              </Link>
            )}
          </form>

          <span className="text-muted" style={{ fontSize: "12.5px" }}>
            {users.length} {users.length === 1 ? "user" : "users"} &middot; roles shown for HQ
          </span>
        </div>

        {users.length === 0 ? (
          <div className="erp-empty">
            <div className="erp-empty-icon">
              <i className="fa-solid fa-users-gear"></i>
            </div>
            <h3>No users yet</h3>
            <p>Invite your team and grant them access through roles.</p>
            <Link href="/settings/users/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>Create User
            </Link>
          </div>
        ) : (
          <div className="erp-card-body is-flush">
            <div className="erp-table-wrap">
              <table className="table erp-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="erp-identity">
                          <span className="erp-initials">{getInitials(u.name)}</span>
                          <span>
                            <span className="erp-identity-name">{u.name}</span>
                            <span className="erp-identity-meta">
                              {u.jobTitle || `@${u.username}`}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={`erp-pill ${
                            u.isSuperAdmin ? "is-sold" : "is-booked"
                          }`}
                        >
                          {u.isSuperAdmin ? "Super Admin" : u.role}
                        </span>
                      </td>
                      <td>{u.phone || "—"}</td>
                      <td>
                        <span
                          className={`erp-pill ${
                            u.isActive ? "is-available" : "is-neutral"
                          }`}
                        >
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="text-nowrap">
                        <span className="erp-identity-meta">{u.createdAt}</span>
                      </td>
                      <td className="text-end text-nowrap">
                        <div className="d-inline-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm"
                            disabled={busyId === u.id}
                            onClick={() => toggleActive(u)}
                          >
                            {u.isActive ? "Suspend" : "Activate"}
                          </button>
                          {u.id !== 1 && (
                            <button
                              type="button"
                              className="btn btn-erp-ghost btn-sm text-danger"
                              onClick={() => setDeleteTarget(u)}
                              title="Delete"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {deleteTarget && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <div className="modal-body p-4">
                  <div className="d-flex gap-3">
                    <div className="erp-kpi-icon is-danger">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div>
                      <h5 className="mb-2" style={{ fontSize: 16, fontWeight: 600 }}>
                        Delete user?
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                        <strong>{deleteTarget.name}</strong> ({deleteTarget.email}) will be
                        removed from active use.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-erp"
                    style={{
                      background: "var(--erp-danger)",
                      borderColor: "var(--erp-danger)",
                    }}
                    disabled={busyId === deleteTarget.id}
                    onClick={confirmDelete}
                  >
                    <i className="fa-solid fa-trash-can me-2"></i>Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
