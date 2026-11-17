"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccountingSubmenu from "./AccountingSubmenu";
import { ErpDeleteModal, ErpPageHeader, ErpPill, type ErpPillTone } from "@/components/ui";

export interface ChartAccountRow {
  id: number;
  parentId: number | null;
  parentLabel: string;
  depth: number;
  code: string;
  name: string;
  accountType: string;
  normalBalance: string;
  openingBalance: number;
  currency: string | null;
  isGroup: boolean;
  isSystem: boolean;
  isActive: boolean;
  description: string | null;
  hasChildren: boolean;
}

export interface AccountSummary {
  asset: number;
  liability: number;
  equity: number;
  income: number;
  expense: number;
  total: number;
}

const CLASS_META: Record<string, { label: string; tone: ErpPillTone; icon: string }> = {
  asset: { label: "Assets", tone: "booked", icon: "fa-solid fa-building-columns" },
  liability: { label: "Liabilities", tone: "overdue", icon: "fa-solid fa-file-invoice-dollar" },
  equity: { label: "Equity", tone: "sold", icon: "fa-solid fa-scale-balanced" },
  income: { label: "Income", tone: "available", icon: "fa-solid fa-arrow-trend-up" },
  expense: { label: "Expenses", tone: "hold", icon: "fa-solid fa-arrow-trend-down" },
};

export default function AccountsClient({
  accounts,
  summary,
  groupParents,
}: {
  accounts: ChartAccountRow[];
  summary: AccountSummary;
  groupParents: { id: number; code: string; name: string; accountType: string }[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<Set<number>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChartAccountRow | null>(null);
  const [viewTarget, setViewTarget] = useState<ChartAccountRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChartAccountRow | null>(null);

  const [parentId, setParentId] = useState("");
  const [accountType, setAccountType] = useState("asset");
  const [normalBalance, setNormalBalance] = useState("debit");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [currency, setCurrency] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const childrenByParent = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const a of accounts) {
      if (a.parentId) {
        const arr = map.get(a.parentId) ?? [];
        arr.push(a.id);
        map.set(a.parentId, arr);
      }
    }
    return map;
  }, [accounts]);

  const visibleAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byId = new Map(accounts.map((a) => [a.id, a]));

    return accounts.filter((a) => {
      if (filterType && a.accountType !== filterType) return false;
      if (q) {
        return `${a.code} ${a.name}`.toLowerCase().includes(q);
      }
      let cur = a.parentId ? byId.get(a.parentId) : undefined;
      while (cur) {
        if (collapsedIds.has(cur.id)) return false;
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
      return true;
    });
  }, [accounts, search, filterType, collapsedIds]);

  function toggleCollapse(id: number) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setCollapsedIds(new Set());
  }

  function collapseAll() {
    const next = new Set<number>();
    for (const a of accounts) {
      if ((childrenByParent.get(a.id) ?? []).length > 0 && a.depth >= 1) {
        next.add(a.id);
      }
    }
    setCollapsedIds(next);
  }

  function openCreate(presetParentId?: number, presetType?: string) {
    setEditing(null);
    setParentId(presetParentId ? String(presetParentId) : "");
    const t = presetType || "asset";
    setAccountType(t);
    setNormalBalance(t === "asset" || t === "expense" ? "debit" : "credit");
    setCode("");
    setName("");
    setOpeningBalance("0");
    setCurrency("");
    setIsGroup(false);
    setIsActive(true);
    setDescription("");
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(a: ChartAccountRow) {
    setEditing(a);
    setParentId(a.parentId ? String(a.parentId) : "");
    setAccountType(a.accountType);
    setNormalBalance(a.normalBalance);
    setCode(a.code);
    setName(a.name);
    setOpeningBalance(String(a.openingBalance ?? 0));
    setCurrency(a.currency ?? "");
    setIsGroup(a.isGroup);
    setIsActive(a.isActive);
    setDescription(a.description ?? "");
    setFormError("");
    setModalOpen(true);
  }

  function suggestCode() {
    const siblings = accounts.filter((a) =>
      parentId ? String(a.parentId) === parentId : a.parentId === null
    );
    const nums = siblings
      .map((s) => parseInt(s.code.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 1000;
    setCode(String(maxNum + 1));
  }

  async function toggleActive(a: ChartAccountRow) {
    await fetch(`/api/accounting/accounts/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !a.isActive }),
    });
    router.refresh();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!code.trim() || !name.trim()) {
      setFormError("Code and Name are required.");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/accounting/accounts/${editing.id}`
        : "/api/accounting/accounts";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: parentId ? Number(parentId) : null,
          account_type: accountType,
          normal_balance: normalBalance,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          opening_balance: Number(openingBalance) || 0,
          currency: currency.trim() || null,
          is_group: isGroup,
          is_active: isActive,
          description: description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save account.");
        return;
      }
      setModalOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/accounting/accounts/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const header = ["Code", "Name", "Class", "Kind", "Normal Balance", "Opening", "Active"];
    const rows = accounts.map((a) => [
      a.code,
      `"${a.name.replace(/"/g, '""')}"`,
      a.accountType,
      a.isGroup ? "Group" : "Ledger",
      a.normalBalance,
      String(a.openingBalance),
      a.isActive ? "Active" : "Inactive",
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chart-of-accounts.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <AccountingSubmenu />

      <ErpPageHeader
        icon="fa-solid fa-sitemap"
        title="Chart of Accounts"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Accounting" },
          { label: "Chart of Accounts" },
        ]}
        actions={
          <>
            <button type="button" className="btn btn-erp-ghost" onClick={exportCsv}>
              <i className="fa-solid fa-file-excel me-2"></i>Export
            </button>
            <button type="button" className="btn btn-erp" onClick={() => openCreate()}>
              <i className="fa-solid fa-plus me-2"></i>New Account
            </button>
          </>
        }
      />

      <div className="erp-coa-summary">
        <div className="erp-coa-stat is-booked">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-building-columns"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{summary.asset}</strong>
            <small>Assets</small>
          </span>
        </div>
        <div className="erp-coa-stat is-overdue">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-file-invoice-dollar"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{summary.liability}</strong>
            <small>Liabilities</small>
          </span>
        </div>
        <div className="erp-coa-stat is-sold">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-scale-balanced"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{summary.equity}</strong>
            <small>Equity</small>
          </span>
        </div>
        <div className="erp-coa-stat is-available">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-arrow-trend-up"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{summary.income}</strong>
            <small>Income</small>
          </span>
        </div>
        <div className="erp-coa-stat is-hold">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-arrow-trend-down"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{summary.expense}</strong>
            <small>Expenses</small>
          </span>
        </div>
        <div className="erp-coa-stat is-neutral">
          <span className="erp-coa-stat-icon">
            <i className="fa-solid fa-list-ol"></i>
          </span>
          <span className="erp-coa-stat-body">
            <strong>{summary.total}</strong>
            <small>Total accounts</small>
          </span>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-toolbar">
          <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
            <div className="erp-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or name…"
                aria-label="Search accounts"
              />
            </div>
            <select
              className="form-select erp-select"
              aria-label="Class"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All classes</option>
              <option value="asset">Assets</option>
              <option value="liability">Liabilities</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
            <button type="button" className="btn btn-erp-ghost" onClick={expandAll}>
              <i className="fa-solid fa-angles-down me-1"></i>Expand all
            </button>
            <button type="button" className="btn btn-erp-ghost" onClick={collapseAll}>
              <i className="fa-solid fa-angles-up me-1"></i>Collapse
            </button>
          </div>
        </div>

        <div className="erp-card-body is-flush">
          <div className="erp-table-wrap">
            <table className="table erp-table erp-coa">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Class</th>
                  <th className="text-center">Kind</th>
                  <th className="text-center">Bal</th>
                  <th className="text-end">Opening</th>
                  <th className="text-center">Active</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleAccounts.map((a) => {
                  const meta = CLASS_META[a.accountType] ?? CLASS_META.asset;
                  const isCollapsed = collapsedIds.has(a.id);
                  return (
                    <tr
                      key={a.id}
                      className={`erp-coa-row${a.isGroup ? " is-group" : ""}${
                        !a.isActive ? " is-inactive" : ""
                      }`}
                    >
                      <td>
                        <div
                          className="erp-coa-name"
                          style={{ paddingLeft: search || filterType ? 0 : a.depth * 22 }}
                        >
                          {a.hasChildren && !search && !filterType ? (
                            <button
                              type="button"
                              className="erp-coa-caret"
                              aria-expanded={!isCollapsed}
                              title={isCollapsed ? "Expand" : "Collapse"}
                              onClick={() => toggleCollapse(a.id)}
                            >
                              <i
                                className={`fa-solid ${
                                  isCollapsed ? "fa-chevron-right" : "fa-chevron-down"
                                }`}
                              ></i>
                            </button>
                          ) : (
                            <span style={{ width: 22, flex: "0 0 auto" }} />
                          )}
                          <span className="erp-coa-code">{a.code}</span>
                          <span className={`erp-coa-title${a.isGroup ? " is-group" : ""}`}>
                            {a.name}
                          </span>
                          {a.isSystem && (
                            <span
                              className="erp-pill is-neutral erp-coa-badge"
                              title="Built-in account"
                            >
                              System
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <ErpPill tone={meta.tone}>
                          <i className={`${meta.icon} me-1`}></i>
                          {meta.label}
                        </ErpPill>
                      </td>
                      <td className="text-center">
                        <ErpPill tone={a.isGroup ? "booked" : "neutral"}>
                          {a.isGroup ? "Group" : "Ledger"}
                        </ErpPill>
                      </td>
                      <td className="text-center erp-cell-strong">
                        {a.normalBalance === "credit" ? "Cr" : "Dr"}
                      </td>
                      <td className="text-end erp-cell-strong">
                        {a.isGroup ? "—" : a.openingBalance.toFixed(2)}
                      </td>
                      <td className="text-center">
                        <label className="erp-switch" title="Active">
                          <input
                            type="checkbox"
                            checked={a.isActive}
                            onChange={() => toggleActive(a)}
                          />
                          <span className="erp-switch-track"></span>
                        </label>
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm"
                          title="View"
                          onClick={() => setViewTarget(a)}
                        >
                          <i className="fa-regular fa-eye"></i>
                        </button>
                        {a.isGroup && (
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm"
                            title="Add sub-account"
                            onClick={() => openCreate(a.id, a.accountType)}
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-erp-ghost btn-sm"
                          title="Edit"
                          onClick={() => openEdit(a)}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        {a.isSystem ? (
                          <span
                            className="text-muted erp-coa-locked"
                            title="Built-in accounts cannot be deleted"
                          >
                            Locked
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-erp-ghost btn-sm text-danger"
                            title="Delete"
                            onClick={() => setDeleteTarget(a)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <form
                className="modal-content erp-form"
                style={{ border: "none", borderRadius: 14 }}
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="modal-body p-4">
                  <h5 className="mb-3" style={{ fontSize: 16, fontWeight: 600 }}>
                    {editing ? `Edit account — ${editing.code}` : "New account"}
                  </h5>
                  {formError && (
                    <div
                      className="alert alert-danger py-2 px-3 mb-3"
                      role="alert"
                      style={{ borderRadius: 9, fontSize: 12.5 }}
                    >
                      {formError}
                    </div>
                  )}
                  <div className="erp-field">
                    <label htmlFor="account_parent" className="form-label">
                      Parent account
                    </label>
                    <select
                      id="account_parent"
                      className="form-select"
                      value={parentId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setParentId(val);
                        const found = groupParents.find((g) => String(g.id) === val);
                        if (found) {
                          setAccountType(found.accountType);
                          setNormalBalance(
                            found.accountType === "asset" || found.accountType === "expense"
                              ? "debit"
                              : "credit"
                          );
                        }
                      }}
                    >
                      <option value="">— None (top level) —</option>
                      {(["asset", "liability", "equity", "income", "expense"] as const).map(
                        (cls) => {
                          const items = groupParents.filter((g) => g.accountType === cls);
                          if (items.length === 0) return null;
                          return (
                            <optgroup key={cls} label={CLASS_META[cls].label}>
                              {items.map((g) => (
                                <option key={g.id} value={String(g.id)}>
                                  {g.code} · {g.name}
                                </option>
                              ))}
                            </optgroup>
                          );
                        }
                      )}
                    </select>
                    <span className="erp-help">
                      Leave empty to create a top-level class root. Only groups can be parents.
                    </span>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="account_type" className="form-label">
                          Class <span className="erp-required">*</span>
                        </label>
                        <select
                          id="account_type"
                          className="form-select"
                          value={accountType}
                          disabled={Boolean(parentId)}
                          onChange={(e) => {
                            const t = e.target.value;
                            setAccountType(t);
                            setNormalBalance(
                              t === "asset" || t === "expense" ? "debit" : "credit"
                            );
                          }}
                        >
                          <option value="asset">Assets</option>
                          <option value="liability">Liabilities</option>
                          <option value="equity">Equity</option>
                          <option value="income">Income</option>
                          <option value="expense">Expenses</option>
                        </select>
                        {parentId && (
                          <span className="erp-help">Inherited from the parent.</span>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="account_normal" className="form-label">
                          Normal balance
                        </label>
                        <select
                          id="account_normal"
                          className="form-select"
                          value={normalBalance}
                          onChange={(e) => setNormalBalance(e.target.value)}
                        >
                          <option value="debit">Debit</option>
                          <option value="credit">Credit</option>
                        </select>
                      </div>
                    </div>

                    <div className="col-md-5">
                      <div className="erp-field">
                        <label htmlFor="account_code" className="form-label">
                          Code <span className="erp-required">*</span>
                        </label>
                        <div className="input-group">
                          <input
                            type="text"
                            id="account_code"
                            className="form-control"
                            maxLength={20}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="btn btn-erp-ghost"
                            title="Suggest next code"
                            onClick={suggestCode}
                          >
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-7">
                      <div className="erp-field">
                        <label htmlFor="account_name" className="form-label">
                          Name <span className="erp-required">*</span>
                        </label>
                        <input
                          type="text"
                          id="account_name"
                          className="form-control"
                          maxLength={150}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="account_opening" className="form-label">
                          Opening balance
                        </label>
                        <input
                          type="number"
                          id="account_opening"
                          className="form-control"
                          step="0.01"
                          min="0"
                          value={openingBalance}
                          onChange={(e) => setOpeningBalance(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="erp-field">
                        <label htmlFor="account_currency" className="form-label">
                          Currency
                        </label>
                        <input
                          type="text"
                          id="account_currency"
                          className="form-control"
                          maxLength={3}
                          placeholder="Company default"
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-4 mt-1 mb-3">
                    <label className="erp-check">
                      <input
                        type="checkbox"
                        checked={isGroup}
                        onChange={(e) => setIsGroup(e.target.checked)}
                      />
                      <span>Group (header, non-posting)</span>
                    </label>
                    <label className="erp-check">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                      />
                      <span>Active</span>
                    </label>
                  </div>

                  <div className="erp-field mb-0">
                    <label htmlFor="account_description" className="form-label">
                      Description
                    </label>
                    <textarea
                      id="account_description"
                      rows={2}
                      className="form-control"
                      maxLength={500}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0 px-4 pb-4">
                  <button
                    type="button"
                    className="btn btn-erp-ghost"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-erp" disabled={saving}>
                    <i className="fa-solid fa-floppy-disk me-2"></i>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {viewTarget && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content" style={{ border: "none", borderRadius: 14 }}>
                <div className="modal-header border-0 px-4 pt-4 pb-0">
                  <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>
                    <i className="fa-regular fa-eye me-2 text-muted"></i>Account details
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setViewTarget(null)}
                  />
                </div>
                <div className="modal-body p-4">
                  <dl className="row mb-0" style={{ fontSize: 13.5 }}>
                    <dt className="col-sm-4 text-muted">Code</dt>
                    <dd className="col-sm-8 erp-cell-strong">{viewTarget.code}</dd>
                    <dt className="col-sm-4 text-muted">Name</dt>
                    <dd className="col-sm-8">{viewTarget.name}</dd>
                    <dt className="col-sm-4 text-muted">Class</dt>
                    <dd className="col-sm-8 text-capitalize">{viewTarget.accountType}</dd>
                    <dt className="col-sm-4 text-muted">Kind</dt>
                    <dd className="col-sm-8">{viewTarget.isGroup ? "Group" : "Ledger"}</dd>
                    <dt className="col-sm-4 text-muted">Parent</dt>
                    <dd className="col-sm-8">{viewTarget.parentLabel || "Top-level"}</dd>
                    <dt className="col-sm-4 text-muted">Normal Balance</dt>
                    <dd className="col-sm-8 text-capitalize">{viewTarget.normalBalance}</dd>
                    <dt className="col-sm-4 text-muted">Opening Balance</dt>
                    <dd className="col-sm-8">{viewTarget.openingBalance.toFixed(2)}</dd>
                    <dt className="col-sm-4 text-muted">Status</dt>
                    <dd className="col-sm-8">{viewTarget.isActive ? "Active" : "Inactive"}</dd>
                    <dt className="col-sm-4 text-muted">Description</dt>
                    <dd className="col-sm-8 mb-0">{viewTarget.description || "—"}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <ErpDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete account?"
        description={
          deleteTarget && (
            <>
              <strong>
                {deleteTarget.code} · {deleteTarget.name}
              </strong>{" "}
              will be deleted permanently.
            </>
          )
        }
        busy={saving}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
