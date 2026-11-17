"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/tier0";
import {
  ErpDeleteModal,
  ErpEmptyState,
  ErpIdentity,
  ErpPageHeader,
  ErpPill,
  ErpTableCard,
} from "@/components/ui";

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
      <ErpPageHeader
        icon="fa-solid fa-users-gear"
        title="Users"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Settings" },
          { label: "Users" },
        ]}
        actions={
          <>
            <Link href="/settings/roles" className="btn btn-erp-ghost">
              <i className="fa-solid fa-user-shield me-2"></i>Roles
            </Link>
            <Link href="/settings/users/create" className="btn btn-erp">
              <i className="fa-solid fa-plus me-2"></i>New User
            </Link>
          </>
        }
      />

      <ErpTableCard
        toolbar={
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
        }
        countText={`${users.length} ${users.length === 1 ? "user" : "users"} · roles shown for HQ`}
        isEmpty={users.length === 0}
        emptyState={
          <ErpEmptyState
            icon="fa-solid fa-users-gear"
            title="No users yet"
            description="Invite your team and grant them access through roles."
            action={
              <Link href="/settings/users/create" className="btn btn-erp">
                <i className="fa-solid fa-plus me-2"></i>Create User
              </Link>
            }
          />
        }
      >
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
                  <ErpIdentity
                    initials={getInitials(u.name)}
                    title={u.name}
                    meta={u.jobTitle || `@${u.username}`}
                  />
                </td>
                <td>{u.email}</td>
                <td>
                  <ErpPill tone={u.isSuperAdmin ? "sold" : "booked"}>
                    {u.isSuperAdmin ? "Super Admin" : u.role}
                  </ErpPill>
                </td>
                <td>{u.phone || "—"}</td>
                <td>
                  <ErpPill tone={u.isActive ? "available" : "neutral"}>
                    {u.isActive ? "Active" : "Suspended"}
                  </ErpPill>
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
      </ErpTableCard>

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete user?"
        description={
          deleteTarget && (
            <>
              <strong>{deleteTarget.name}</strong> ({deleteTarget.email}) will be removed from
              active use.
            </>
          )
        }
        busy={busyId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
