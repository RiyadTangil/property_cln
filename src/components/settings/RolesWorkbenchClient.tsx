"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface RoleRow {
  id: number;
  name: string;
  scope: string;
  isSuper: boolean;
  permissionsCount: number;
  permissions: string[];
}

export interface PermCatalogModule {
  module: string;
  icon: string;
  subjects: {
    name: string;
    perms: { key: string; label: string }[];
  }[];
}

function decodeLabel(s: string) {
  return s.replace(/&amp;/g, "&");
}

export default function RolesWorkbenchClient({
  roles: initialRoles,
  catalog,
}: {
  roles: RoleRow[];
  catalog: PermCatalogModule[];
}) {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleRow[]>(initialRoles);
  const [selectedId, setSelectedId] = useState<number>(initialRoles[0]?.id ?? 0);
  const [roleSearch, setRoleSearch] = useState("");
  const [permFilter, setPermFilter] = useState("");
  const [grantedOnly, setGrantedOnly] = useState(false);
  const [collapsedMods, setCollapsedMods] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);

  const allKeys = useMemo(() => {
    const keys: string[] = [];
    for (const m of catalog) {
      for (const s of m.subjects) {
        for (const p of s.perms) keys.push(p.key);
      }
    }
    return keys;
  }, [catalog]);

  const activeRole = useMemo(
    () => roles.find((r) => r.id === selectedId) ?? roles[0],
    [roles, selectedId]
  );

  const activeSet = useMemo(() => {
    if (!activeRole) return new Set<string>();
    if (activeRole.isSuper) return new Set(allKeys);
    return new Set(activeRole.permissions);
  }, [activeRole, allKeys]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(q));
  }, [roles, roleSearch]);

  async function persistPermissions(roleId: number, perms: string[]) {
    setSaving(true);
    setStatusText("Saving…");
    try {
      const res = await fetch(`/api/settings/roles/${roleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: perms }),
      });
      if (res.ok) {
        setStatusText("Saved");
        router.refresh();
      } else {
        setStatusText("Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  function updateActivePermissions(nextPerms: string[]) {
    if (!activeRole || activeRole.isSuper) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === activeRole.id
          ? { ...r, permissions: nextPerms, permissionsCount: nextPerms.length }
          : r
      )
    );
    void persistPermissions(activeRole.id, nextPerms);
  }

  function togglePerm(key: string) {
    if (!activeRole || activeRole.isSuper) return;
    const next = new Set(activeRole.permissions);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    updateActivePermissions(Array.from(next));
  }

  function toggleSubjectPerms(keys: string[]) {
    if (!activeRole || activeRole.isSuper) return;
    const next = new Set(activeRole.permissions);
    const allPresent = keys.every((k) => next.has(k));
    if (allPresent) keys.forEach((k) => next.delete(k));
    else keys.forEach((k) => next.add(k));
    updateActivePermissions(Array.from(next));
  }

  function toggleModulePerms(mod: PermCatalogModule) {
    if (!activeRole || activeRole.isSuper) return;
    const keys = mod.subjects.flatMap((s) => s.perms.map((p) => p.key));
    const next = new Set(activeRole.permissions);
    const allPresent = keys.every((k) => next.has(k));
    if (allPresent) keys.forEach((k) => next.delete(k));
    else keys.forEach((k) => next.add(k));
    updateActivePermissions(Array.from(next));
  }

  async function confirmDeleteRole() {
    if (!deleteTarget || deleteTarget.isSuper) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/settings/roles/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const remaining = roles.filter((r) => r.id !== deleteTarget.id);
        setRoles(remaining);
        if (selectedId === deleteTarget.id) {
          setSelectedId(remaining[0]?.id ?? 0);
        }
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const pq = permFilter.trim().toLowerCase();

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-user-shield"></i>
          </div>
          <div>
            <h1>Roles &amp; Permissions</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Roles
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/settings/users" className="btn btn-erp-ghost">
            <i className="fa-solid fa-users-gear me-2"></i>Users
          </Link>
          <Link href="/settings/roles/create" className="btn btn-erp">
            <i className="fa-solid fa-plus me-2"></i>New Role
          </Link>
        </div>
      </div>

      <div className="erp-roles">
        <aside className="erp-roles-list">
          <div className="erp-roles-list-head">
            <span className="erp-roles-list-title">Roles</span>
            <span className="erp-roles-list-note">{roles.length} usable in HQ</span>
          </div>

          <div className="erp-roles-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="search"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              placeholder="Find a role…"
              aria-label="Filter roles"
            />
          </div>

          <div className="erp-roles-items" role="tablist" aria-label="Roles">
            {filteredRoles.map((r) => {
              const isSelected = activeRole?.id === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  className="erp-role-item"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelectedId(r.id);
                    setStatusText("");
                  }}
                >
                  <span className="erp-role-item-icon">
                    <i
                      className={`fa-solid ${
                        r.isSuper ? "fa-crown" : "fa-user-shield"
                      }`}
                    ></i>
                  </span>
                  <span className="erp-role-item-body">
                    <span className="erp-role-item-name">{r.name}</span>
                    <span className="erp-role-item-meta">
                      <span className="erp-role-chip">
                        <i className="fa-solid fa-earth-asia"></i>
                        {r.scope === "global" ? "Shared" : "Company"}
                      </span>
                    </span>
                  </span>
                  <span className="erp-role-item-count">
                    {r.isSuper ? "All" : r.permissions.length}
                  </span>
                </button>
              );
            })}
            {filteredRoles.length === 0 && (
              <p className="erp-roles-nomatch">No role matches that.</p>
            )}
          </div>
        </aside>

        {activeRole && (
          <section className="erp-roles-detail">
            <header className="erp-roles-detail-head">
              <div className="erp-roles-detail-id">
                <h2>{activeRole.name}</h2>
                <p className="erp-roles-detail-sub">
                  {activeRole.isSuper
                    ? `Full unrestricted access across all ${allKeys.length} permissions`
                    : `${activeRole.permissions.length} of ${allKeys.length} permissions granted`}
                </p>
              </div>

              <div className="erp-roles-detail-actions">
                {statusText && <span className="erp-roles-status">{statusText}</span>}

                {!activeRole.isSuper && (
                  <>
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm"
                      disabled={saving}
                      onClick={() => updateActivePermissions(allKeys)}
                    >
                      <i className="fa-solid fa-check-double me-1"></i>Grant all
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm"
                      disabled={saving}
                      onClick={() => updateActivePermissions([])}
                    >
                      <i className="fa-solid fa-xmark me-1"></i>Revoke all
                    </button>
                    <button
                      type="button"
                      className="btn btn-erp-ghost btn-sm text-danger"
                      title="Delete role"
                      onClick={() => setDeleteTarget(activeRole)}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </>
                )}
              </div>
            </header>

            <div className="erp-roles-detail-tools">
              <div className="erp-roles-search is-inline">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="search"
                  value={permFilter}
                  onChange={(e) => setPermFilter(e.target.value)}
                  placeholder="Filter permissions — try “invoice” or “delete”…"
                  aria-label="Filter permissions"
                />
              </div>
              <label className="erp-roles-onlygranted">
                <input
                  type="checkbox"
                  checked={grantedOnly}
                  onChange={(e) => setGrantedOnly(e.target.checked)}
                />
                <span>Granted only</span>
              </label>
            </div>

            <div className="erp-roles-detail-body">
              <div className="erp-perms">
                {catalog.map((mod) => {
                  const modName = decodeLabel(mod.module);
                  const visibleSubjects = mod.subjects
                    .map((sub) => {
                      const subName = decodeLabel(sub.name);
                      const visiblePerms = sub.perms.filter((p) => {
                        if (grantedOnly && !activeSet.has(p.key)) return false;
                        if (!pq) return true;
                        return (
                          modName.toLowerCase().includes(pq) ||
                          subName.toLowerCase().includes(pq) ||
                          p.label.toLowerCase().includes(pq) ||
                          p.key.toLowerCase().includes(pq)
                        );
                      });
                      return { ...sub, name: subName, perms: visiblePerms };
                    })
                    .filter((s) => s.perms.length > 0);

                  if (visibleSubjects.length === 0) return null;

                  const modAllKeys = mod.subjects.flatMap((s) =>
                    s.perms.map((p) => p.key)
                  );
                  const modGranted = modAllKeys.filter((k) => activeSet.has(k)).length;
                  const isCollapsed = Boolean(collapsedMods[mod.module]) && !pq;

                  return (
                    <section
                      key={mod.module}
                      className={`erp-perm-mod${isCollapsed ? " is-collapsed" : ""}`}
                    >
                      <header className="erp-perm-mod-head">
                        <button
                          type="button"
                          className="erp-perm-mod-toggle"
                          aria-expanded={!isCollapsed}
                          onClick={() =>
                            setCollapsedMods((prev) => ({
                              ...prev,
                              [mod.module]: !isCollapsed,
                            }))
                          }
                        >
                          <i
                            className={`fa-solid ${
                              isCollapsed ? "fa-chevron-right" : "fa-chevron-down"
                            }`}
                          ></i>
                        </button>

                        <label className="erp-perm-mod-check">
                          <input
                            type="checkbox"
                            checked={
                              modAllKeys.length > 0 &&
                              modGranted === modAllKeys.length
                            }
                            disabled={activeRole.isSuper}
                            onChange={() => toggleModulePerms(mod)}
                          />
                          <span className="erp-perm-mod-name">
                            <i className={mod.icon}></i>
                            {modName}
                          </span>
                        </label>

                        <span className="erp-perm-mod-count">
                          <span>{modGranted}</span>/{modAllKeys.length}
                        </span>
                      </header>

                      {!isCollapsed && (
                        <div className="erp-perm-rows">
                          {visibleSubjects.map((sub) => {
                            const subKeys = sub.perms.map((p) => p.key);
                            const allSubChecked = subKeys.every((k) =>
                              activeSet.has(k)
                            );
                            return (
                              <div key={sub.name} className="erp-perm-row">
                                <label className="erp-perm-subject">
                                  <input
                                    type="checkbox"
                                    checked={allSubChecked}
                                    disabled={activeRole.isSuper}
                                    onChange={() => toggleSubjectPerms(subKeys)}
                                  />
                                  <span>{sub.name}</span>
                                </label>

                                <div className="erp-perm-abilities">
                                  {sub.perms.map((p) => (
                                    <label
                                      key={p.key}
                                      className="erp-perm-ability"
                                      title={p.key}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={activeSet.has(p.key)}
                                        disabled={activeRole.isSuper}
                                        onChange={() => togglePerm(p.key)}
                                      />
                                      <span>{decodeLabel(p.label)}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          </section>
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
                        Delete role?
                      </h5>
                      <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                        <strong>{deleteTarget.name}</strong> will be deleted permanently.
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
                    disabled={saving}
                    onClick={confirmDeleteRole}
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
