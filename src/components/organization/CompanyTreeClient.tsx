"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

export interface TreeDept {
  id: number;
  code: string;
  name: string;
  branchId: number | null;
  parentId: number | null;
  headName: string | null;
  designationsCount: number;
}

export interface TreeBranch {
  id: number;
  code: string;
  name: string;
  type: string;
  city: string | null;
}

export interface TreeCompany {
  id: number;
  code: string;
  name: string;
  currency: string;
}

interface TreeMember {
  initials: string;
  name: string;
  role: string;
}

const DEPT_DEFAULT_MEMBERS: Record<string, TreeMember[]> = {
  ADMIN: [
    { initials: "MG", name: "MD. GOLAM RABBANY RONY", role: "Project Coordinator" },
    { initials: "MA", name: "Muhamma Arif Al Imran", role: "Chief Executive Officer" },
  ],
};

function getDeptMembers(dept: TreeDept): TreeMember[] {
  const seeded = DEPT_DEFAULT_MEMBERS[dept.code.toUpperCase()];
  if (seeded) return seeded;
  if (dept.headName) {
    const initials = dept.headName
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return [{ initials: initials || "HD", name: dept.headName, role: "Department Head" }];
  }
  return [];
}

function DeptSubtree({
  dept,
  childrenMap,
  collapsedIds,
  toggleCollapse,
  query,
  matchIds,
  pathIds,
}: {
  dept: TreeDept;
  childrenMap: Map<number, TreeDept[]>;
  collapsedIds: Set<number | string>;
  toggleCollapse: (key: string) => void;
  query: string;
  matchIds: Set<string>;
  pathIds: Set<string>;
}) {
  const subs = childrenMap.get(dept.id) ?? [];
  const members = getDeptMembers(dept);
  const key = `dept-${dept.id}`;
  const isCollapsed = !query && collapsedIds.has(key);
  const isMatch = matchIds.has(key);
  const isOnPath = pathIds.has(key);

  return (
    <li className={`ctree-item${isCollapsed ? " is-collapsed" : ""}`}>
      <div
        className={`ctree-card is-department${isMatch ? " is-match" : ""}${
          isOnPath ? " is-on-path" : ""
        }`}
      >
        <div className="ctree-card-head">
          <span className="ctree-tile">
            <i className="fa-solid fa-people-group"></i>
          </span>
          <span className="ctree-title">
            <strong title={dept.name}>{dept.name}</strong>
            <small>{dept.code}</small>
          </span>
        </div>

        <div className="ctree-stats">
          <span title="People">
            <i className="fa-solid fa-user"></i>
            {members.length}
          </span>
          {subs.length > 0 && (
            <span title="Sub-departments">
              <i className="fa-solid fa-diagram-project"></i>
              {subs.length}
            </span>
          )}
        </div>

        {members.length > 0 ? (
          <ul className="ctree-members">
            {members.map((m) => (
              <li
                key={m.name}
                className={`ctree-member${
                  query &&
                  `${m.name} ${m.role}`.toLowerCase().includes(query)
                    ? " is-match"
                    : ""
                }`}
              >
                <span className="ctree-member-link" title={`${m.name} — ${m.role}`}>
                  <span className="ctree-avatar">{m.initials}</span>
                  <span className="ctree-member-text">
                    <b>{m.name}</b>
                    <small>{m.role}</small>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ctree-empty">No members yet</p>
        )}

        {subs.length > 0 && (
          <button
            type="button"
            className="ctree-toggle"
            aria-expanded={!isCollapsed}
            title="Collapse / expand"
            onClick={() => toggleCollapse(key)}
          >
            <i className={`fa-solid ${isCollapsed ? "fa-plus" : "fa-minus"}`}></i>
            <span>{subs.length}</span>
          </button>
        )}
      </div>

      {subs.length > 0 && (
        <ul>
          {subs.map((child) => (
            <DeptSubtree
              key={child.id}
              dept={child}
              childrenMap={childrenMap}
              collapsedIds={collapsedIds}
              toggleCollapse={toggleCollapse}
              query={query}
              matchIds={matchIds}
              pathIds={pathIds}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CompanyTreeClient({
  company,
  branches,
  departments,
}: {
  company: TreeCompany;
  branches: TreeBranch[];
  departments: TreeDept[];
}) {
  const [search, setSearch] = useState("");
  const [zoom, setZoom] = useState(1);
  const [collapsedIds, setCollapsedIds] = useState<Set<number | string>>(new Set());

  const childrenMap = useMemo(() => {
    const map = new Map<number, TreeDept[]>();
    for (const d of departments) {
      if (d.parentId) {
        const arr = map.get(d.parentId) ?? [];
        arr.push(d);
        map.set(d.parentId, arr);
      }
    }
    return map;
  }, [departments]);

  const companyWideDepts = useMemo(
    () => departments.filter((d) => !d.branchId && !d.parentId),
    [departments]
  );

  const branchDeptsMap = useMemo(() => {
    const map = new Map<number, TreeDept[]>();
    for (const d of departments) {
      if (d.branchId && !d.parentId) {
        const arr = map.get(d.branchId) ?? [];
        arr.push(d);
        map.set(d.branchId, arr);
      }
    }
    return map;
  }, [departments]);

  const totalMembers = useMemo(
    () => departments.reduce((acc, d) => acc + getDeptMembers(d).length, 0),
    [departments]
  );

  const trimmedQuery = search.trim().toLowerCase();

  const { matchIds, pathIds } = useMemo(() => {
    const matches = new Set<string>();
    const paths = new Set<string>();
    if (!trimmedQuery) return { matchIds: matches, pathIds: paths };

    if (`${company.name} ${company.code}`.toLowerCase().includes(trimmedQuery)) {
      matches.add(`company-${company.id}`);
    }

    const deptById = new Map(departments.map((d) => [d.id, d]));

    for (const b of branches) {
      if (`${b.name} ${b.code} ${b.city ?? ""}`.toLowerCase().includes(trimmedQuery)) {
        matches.add(`branch-${b.id}`);
        paths.add(`company-${company.id}`);
      }
    }

    for (const d of departments) {
      const mText = getDeptMembers(d)
        .map((m) => `${m.name} ${m.role}`)
        .join(" ");
      const hay = `${d.name} ${d.code} ${d.headName ?? ""} ${mText}`.toLowerCase();
      if (hay.includes(trimmedQuery)) {
        matches.add(`dept-${d.id}`);
        paths.add(`company-${company.id}`);
        if (d.branchId) {
          paths.add(`branch-${d.branchId}`);
        } else {
          paths.add("company-wide");
        }
        let cur = d.parentId ? deptById.get(d.parentId) : undefined;
        while (cur) {
          paths.add(`dept-${cur.id}`);
          if (cur.branchId) paths.add(`branch-${cur.branchId}`);
          else paths.add("company-wide");
          cur = cur.parentId ? deptById.get(cur.parentId) : undefined;
        }
      }
    }

    return { matchIds: matches, pathIds: paths };
  }, [trimmedQuery, company, branches, departments]);

  function toggleCollapse(key: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function expandAll() {
    setCollapsedIds(new Set());
  }

  function collapseAll() {
    const allKeys = new Set<string>();
    for (const b of branches) {
      if ((branchDeptsMap.get(b.id) ?? []).length > 0) allKeys.add(`branch-${b.id}`);
    }
    if (companyWideDepts.length > 0) allKeys.add("company-wide");
    for (const d of departments) {
      if ((childrenMap.get(d.id) ?? []).length > 0) allKeys.add(`dept-${d.id}`);
    }
    setCollapsedIds(allKeys);
  }

  const companyKey = `company-${company.id}`;
  const companyCollapsed = !trimmedQuery && collapsedIds.has(companyKey);
  const companyWideCollapsed = !trimmedQuery && collapsedIds.has("company-wide");
  const companyWideMemberCount = departments
    .filter((d) => !d.branchId)
    .reduce((acc, d) => acc + getDeptMembers(d).length, 0);
  const companyWideTotalCount = departments.filter((d) => !d.branchId).length;

  return (
    <div className="container">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-sitemap"></i>
          </div>
          <div>
            <h1>Company Tree</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Organization</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Company Tree
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/organization/branches" className="btn btn-erp-ghost">
            <i className="fa-solid fa-code-branch me-2"></i>Branches
          </Link>
          <Link href="/organization/departments" className="btn btn-erp-ghost">
            <i className="fa-solid fa-people-group me-2"></i>Departments
          </Link>
        </div>
      </div>

      <div className={`erp-card ctree-shell${trimmedQuery ? " is-searching" : ""}`}>
        <div className="erp-toolbar ctree-toolbar">
          <div className="erp-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a person, branch or department…"
              aria-label="Search the tree"
            />
          </div>

          <div className="ctree-legend">
            <span>
              <i className="ctree-dot is-company"></i>Company
            </span>
            <span>
              <i className="ctree-dot is-branch"></i>Branch
            </span>
            <span>
              <i className="ctree-dot is-department"></i>Department
            </span>
          </div>

          <div className="ctree-controls">
            <button
              type="button"
              className="btn btn-erp-ghost btn-sm"
              title="Expand all"
              onClick={expandAll}
            >
              <i className="fa-solid fa-up-right-and-down-left-from-center"></i>
            </button>
            <button
              type="button"
              className="btn btn-erp-ghost btn-sm"
              title="Collapse to branches"
              onClick={collapseAll}
            >
              <i className="fa-solid fa-down-left-and-up-right-to-center"></i>
            </button>

            <span className="ctree-zoom">
              <button
                type="button"
                title="Zoom out"
                aria-label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}
              >
                <i className="fa-solid fa-minus"></i>
              </button>
              <output>{Math.round(zoom * 100)}%</output>
              <button
                type="button"
                title="Zoom in"
                aria-label="Zoom in"
                onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))}
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            </span>

            <button
              type="button"
              className="btn btn-erp-ghost btn-sm"
              title="Fit to screen"
              onClick={() => setZoom(1)}
            >
              <i className="fa-solid fa-expand"></i>
            </button>
          </div>
        </div>

        <div className="ctree-viewport">
          <div
            className="ctree-canvas"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          >
            <ul className="ctree">
              <li className={`ctree-item${companyCollapsed ? " is-collapsed" : ""}`}>
                <div
                  className={`ctree-card is-company${
                    matchIds.has(companyKey) ? " is-match" : ""
                  }${pathIds.has(companyKey) ? " is-on-path" : ""}`}
                >
                  <div className="ctree-card-head">
                    <span className="ctree-tile">
                      <i className="fa-solid fa-building-columns"></i>
                    </span>
                    <span className="ctree-title">
                      <strong title={company.name}>{company.name}</strong>
                      <small>{company.code}</small>
                    </span>
                  </div>
                  <div className="ctree-stats">
                    <span title="People">
                      <i className="fa-solid fa-user"></i>
                      {totalMembers}
                    </span>
                    <span title="Branches">
                      <i className="fa-solid fa-code-branch"></i>
                      {branches.length + (companyWideDepts.length > 0 ? 1 : 0)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ctree-toggle"
                    aria-expanded={!companyCollapsed}
                    title="Collapse / expand"
                    onClick={() => toggleCollapse(companyKey)}
                  >
                    <i
                      className={`fa-solid ${
                        companyCollapsed ? "fa-plus" : "fa-minus"
                      }`}
                    ></i>
                    <span>
                      {branches.length + (companyWideDepts.length > 0 ? 1 : 0)}
                    </span>
                  </button>
                </div>

                <ul>
                  {branches.map((branch) => {
                    const bKey = `branch-${branch.id}`;
                    const bDepts = branchDeptsMap.get(branch.id) ?? [];
                    const bCollapsed = !trimmedQuery && collapsedIds.has(bKey);
                    const bPeople = bDepts.reduce(
                      (acc, d) => acc + getDeptMembers(d).length,
                      0
                    );
                    return (
                      <li
                        key={branch.id}
                        className={`ctree-item${bCollapsed ? " is-collapsed" : ""}`}
                      >
                        <div
                          className={`ctree-card is-branch${
                            matchIds.has(bKey) ? " is-match" : ""
                          }${pathIds.has(bKey) ? " is-on-path" : ""}`}
                        >
                          <div className="ctree-card-head">
                            <span className="ctree-tile">
                              <i className="fa-solid fa-code-branch"></i>
                            </span>
                            <span className="ctree-title">
                              <strong title={branch.name}>{branch.name}</strong>
                              <small>
                                {branch.code}
                                {branch.city ? ` · ${branch.city}` : ""}
                              </small>
                            </span>
                          </div>
                          <div className="ctree-stats">
                            <span title="People">
                              <i className="fa-solid fa-user"></i>
                              {bPeople}
                            </span>
                            <span title="Departments">
                              <i className="fa-solid fa-people-group"></i>
                              {bDepts.length}
                            </span>
                          </div>
                          {bDepts.length > 0 && (
                            <button
                              type="button"
                              className="ctree-toggle"
                              aria-expanded={!bCollapsed}
                              title="Collapse / expand"
                              onClick={() => toggleCollapse(bKey)}
                            >
                              <i
                                className={`fa-solid ${
                                  bCollapsed ? "fa-plus" : "fa-minus"
                                }`}
                              ></i>
                              <span>{bDepts.length}</span>
                            </button>
                          )}
                        </div>
                        {bDepts.length > 0 && (
                          <ul>
                            {bDepts.map((d) => (
                              <DeptSubtree
                                key={d.id}
                                dept={d}
                                childrenMap={childrenMap}
                                collapsedIds={collapsedIds}
                                toggleCollapse={toggleCollapse}
                                query={trimmedQuery}
                                matchIds={matchIds}
                                pathIds={pathIds}
                              />
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}

                  {companyWideDepts.length > 0 && (
                    <li
                      className={`ctree-item${
                        companyWideCollapsed ? " is-collapsed" : ""
                      }`}
                    >
                      <div
                        className={`ctree-card is-branch${
                          pathIds.has("company-wide") ? " is-on-path" : ""
                        }`}
                      >
                        <div className="ctree-card-head">
                          <span className="ctree-tile">
                            <i className="fa-solid fa-code-branch"></i>
                          </span>
                          <span className="ctree-title">
                            <strong title="Company-wide">Company-wide</strong>
                            <small>No branch assigned</small>
                          </span>
                        </div>
                        <div className="ctree-stats">
                          <span title="People">
                            <i className="fa-solid fa-user"></i>
                            {companyWideMemberCount}
                          </span>
                          <span title="Departments">
                            <i className="fa-solid fa-people-group"></i>
                            {companyWideTotalCount}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="ctree-toggle"
                          aria-expanded={!companyWideCollapsed}
                          title="Collapse / expand"
                          onClick={() => toggleCollapse("company-wide")}
                        >
                          <i
                            className={`fa-solid ${
                              companyWideCollapsed ? "fa-plus" : "fa-minus"
                            }`}
                          ></i>
                          <span>{companyWideDepts.length}</span>
                        </button>
                      </div>
                      <ul>
                        {companyWideDepts.map((d) => (
                          <DeptSubtree
                            key={d.id}
                            dept={d}
                            childrenMap={childrenMap}
                            collapsedIds={collapsedIds}
                            toggleCollapse={toggleCollapse}
                            query={trimmedQuery}
                            matchIds={matchIds}
                            pathIds={pathIds}
                          />
                        ))}
                      </ul>
                    </li>
                  )}
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
