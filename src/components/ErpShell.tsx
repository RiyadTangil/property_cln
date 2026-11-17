"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SIDEBAR_NAV, SIDEBAR_SWATCHES, findNavMeta } from "@/lib/navigation";
import type { SessionUser } from "@/lib/auth";

export interface ShellCompany {
  id: number;
  name: string;
  branch: string;
  fiscalYear: string;
}

export interface ShellProject {
  id: number;
  code: string;
  name: string;
  status: string;
}

interface ErpShellProps {
  user: SessionUser;
  company: ShellCompany;
  projects: ShellProject[];
  children: React.ReactNode;
}

type DropdownKey =
  | null
  | "company"
  | "project"
  | "search"
  | "create"
  | "approvals"
  | "notifications"
  | "visits"
  | "user";

export default function ErpShell({
  user,
  company,
  projects,
  children,
}: ErpShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeMeta = useMemo(() => findNavMeta(pathname), [pathname]);

  const [openMenuIds, setOpenMenuIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeMeta.group) initial[activeMeta.group.id] = true;
    return initial;
  });

  useEffect(() => {
    if (activeMeta.group) {
      setOpenMenuIds((prev) => ({ ...prev, [activeMeta.group!.id]: true }));
    }
  }, [activeMeta.group]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarColor, setSidebarColor] = useState(user.sidebarColor || "light");
  const [themePref, setThemePref] = useState(user.theme || "light");
  const [navLayout, setNavLayout] = useState(user.navLayout || "side");
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const activeSwatch =
    SIDEBAR_SWATCHES.find((s) => s.key === sidebarColor) ?? SIDEBAR_SWATCHES[0];

  // Apply theme, navLayout, and sidebar collapse classes on <html>
  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem("erp.sidebar.collapsed") === "1";
      setSidebarCollapsed(savedCollapsed);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (navLayout === "side") {
      root.classList.add("erp-nav-side");
    } else {
      root.classList.remove("erp-nav-side");
    }
  }, [navLayout]);

  useEffect(() => {
    const root = document.documentElement;
    if (sidebarCollapsed) {
      root.classList.add("erp-sidebar-collapsed");
    } else {
      root.classList.remove("erp-sidebar-collapsed");
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.themePreference = themePref;
    if (themePref === "system") {
      const dark =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
      root.dataset.theme = dark ? "dark" : "light";
    } else {
      root.dataset.theme = themePref;
    }
  }, [themePref]);

  // Ctrl+K shortcut & click outside listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenDropdown("search");
        setTimeout(() => searchInputRef.current?.focus(), 60);
      } else if (e.key === "Escape") {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    }

    function onClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest("[data-erp-dropdown]")) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  function toggleSidebarCollapse() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem("erp.sidebar.collapsed", next ? "1" : "0");
    } catch {
      // ignore
    }
  }

  async function saveProfile(patch: {
    theme?: string;
    navLayout?: string;
    sidebarColor?: string;
  }) {
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      // non-blocking preference save
    }
  }

  function handleSwatchSelect(key: string) {
    setSidebarColor(key);
    saveProfile({ sidebarColor: key });
  }

  function handleThemeChange(next: string) {
    setThemePref(next);
    saveProfile({ theme: next });
  }

  function handleNavLayoutChange(next: string) {
    setNavLayout(next);
    saveProfile({ navLayout: next });
  }

  function toggleGroup(id: string) {
    setOpenMenuIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const filteredProjects = useMemo(() => {
    const q = projectFilter.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
    );
  }, [projects, projectFilter]);

  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    const matches: { label: string; group: string; href: string; icon: string }[] = [];
    for (const grp of SIDEBAR_NAV) {
      for (const item of grp.items) {
        if (
          item.label.toLowerCase().includes(q) ||
          grp.label.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q)
        ) {
          matches.push({
            label: item.label,
            group: grp.label,
            href: item.href,
            icon: grp.icon,
          });
        }
      }
    }
    return matches.slice(0, 10);
  }, [globalSearch]);

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="erp-shell" ref={shellRef}>
      {/* Sidebar */}
      {navLayout === "side" && (
      <aside
        className={`erp-sidebar ${
          activeSwatch.tone === "dark" ? "is-tone-dark" : "is-tone-light"
        }`}
        aria-label="Main navigation"
        style={{ ["--sb-bg" as string]: activeSwatch.bg }}
      >
        <div className="erp-sidebar-brand">
          <Link href="/dashboard" aria-label="e-Hishabi ERP">
            <img
              src="/brand/erp-logo.jpg"
              alt="e-Hishabi ERP"
              className="erp-sidebar-logo"
            />
            <img
              src="/brand/erp-icon.svg"
              alt=""
              className="erp-sidebar-mark"
            />
          </Link>
        </div>

        <nav className="erp-sidebar-scroll">
          <ul className="erp-sidebar-nav">
            {SIDEBAR_NAV.map((group) => {
              const isGroupActive = activeMeta.group?.id === group.id;
              const isExpanded = Boolean(openMenuIds[group.id]);
              return (
                <li
                  key={group.id}
                  className={`erp-sidebar-item ${isGroupActive ? "is-active" : ""}`}
                  style={{ ["--nav-accent" as string]: group.accent }}
                >
                  <button
                    type="button"
                    className="erp-sidebar-link"
                    aria-controls={group.id}
                    aria-expanded={isExpanded}
                    title={group.label}
                    onClick={() => toggleGroup(group.id)}
                  >
                    <span className="erp-sidebar-icon">
                      <i className={group.icon}></i>
                    </span>
                    <span className="erp-sidebar-label">{group.label}</span>
                    <i className="fa-solid fa-chevron-right erp-sidebar-caret"></i>
                  </button>
                  <div
                    className={`collapse ${isExpanded ? "show" : ""}`}
                    id={group.id}
                  >
                    <ul className="erp-sidebar-sub">
                      {group.items.map((item) => {
                        const isItemActive =
                          pathname === item.href ||
                          (item.href !== "/dashboard" &&
                            pathname.startsWith(item.href + "/"));
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={`erp-sidebar-sublink ${
                                isItemActive ? "is-active" : ""
                              }`}
                              aria-current={isItemActive ? "page" : undefined}
                            >
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="erp-sidebar-foot">
          <div className="erp-sidebar-palette" hidden={!paletteOpen}>
            <span className="erp-sidebar-palette-title">Sidebar colour</span>
            <div className="erp-sidebar-swatches">
              {SIDEBAR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.key}
                  type="button"
                  className={`erp-sidebar-swatch ${
                    sidebarColor === swatch.key ? "is-active" : ""
                  }`}
                  style={{ ["--sw" as string]: swatch.bg }}
                  title={swatch.title}
                  aria-label={swatch.title}
                  onClick={() => handleSwatchSelect(swatch.key)}
                />
              ))}
            </div>
          </div>

          <div className="erp-sidebar-foot-row">
            <button
              type="button"
              className="erp-sidebar-toggle"
              aria-label="Collapse sidebar"
              title="Collapse / expand"
              onClick={toggleSidebarCollapse}
            >
              <i className="fa-solid fa-angles-left"></i>
              <span className="erp-sidebar-label">Collapse</span>
            </button>
            <button
              type="button"
              className="erp-sidebar-paint"
              aria-expanded={paletteOpen}
              aria-label="Sidebar colour"
              title="Sidebar colour"
              onClick={() => setPaletteOpen((p) => !p)}
            >
              <i className="fa-solid fa-palette"></i>
            </button>
          </div>
        </div>
      </aside>
      )}

      {/* Topbar stack */}
      <div className="erp-topbar-stack">
        <header
          className="notika-header tw:border-b tw:border-slate-200/70 tw:bg-white/80 tw:py-2 tw:shadow-[0_10px_30px_-22px_rgba(15,23,42,.45)] tw:backdrop-blur-xl tw:backdrop-saturate-150 tw:dark:border-white/10"
          id="erpUtilityHeader"
        >
          <div className="container">
            <div className="erp-topbar-row tw:flex tw:h-12 tw:min-w-0 tw:items-center tw:gap-3">
              {/* Brand + Company + Project Pickers */}
              <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
                <div className="notika-brand tw:shrink-0 tw:transition tw:hover:opacity-90">
                  <Link href="/dashboard" aria-label="e-Hishabi ERP">
                    <img
                      src="/brand/erp-logo.jpg"
                      alt="e-Hishabi ERP"
                      className="erp-brand-logo d-none d-md-block"
                    />
                    <img
                      src="/brand/erp-icon.svg"
                      alt="e-Hishabi ERP"
                      className="erp-brand-icon d-md-none"
                    />
                  </Link>
                </div>

                <span
                  className="tw:mx-1 tw:hidden tw:h-6 tw:w-px tw:shrink-0 tw:bg-linear-to-b tw:from-transparent tw:via-slate-300/80 tw:to-transparent tw:dark:via-white/15 tw:lg:block"
                  aria-hidden="true"
                />

                {/* Company Switcher */}
                <div className="d-none d-lg-flex tw:min-w-0 tw:items-center" data-erp-dropdown>
                  <div className="dropdown tw:min-w-0">
                    <button
                      type="button"
                      aria-expanded={openDropdown === "company"}
                      onClick={() =>
                        setOpenDropdown((d) => (d === "company" ? null : "company"))
                      }
                      className="tw:group tw:flex tw:max-w-[240px] tw:min-w-0 tw:items-center tw:gap-2.5 tw:rounded-xl tw:border-0 tw:bg-white tw:py-1.5 tw:pr-2.5 tw:pl-1.5 tw:text-left tw:ring-1 tw:ring-slate-200/80 tw:shadow-[0_1px_2px_rgba(15,23,42,.05)] tw:transition tw:duration-200 tw:hover:-translate-y-px tw:hover:ring-slate-300 tw:hover:shadow-[0_8px_18px_-10px_rgba(15,23,42,.35)] tw:aria-expanded:translate-y-0 tw:aria-expanded:ring-2 tw:aria-expanded:ring-emerald-500/50 tw:dark:bg-white/5 tw:dark:ring-white/10"
                    >
                      <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-linear-to-br tw:from-emerald-500 tw:to-teal-600 tw:text-[13px] tw:text-white tw:shadow-md tw:shadow-emerald-600/25">
                        <i className="fa-solid fa-building-columns"></i>
                      </span>
                      <span className="tw:min-w-0">
                        <span className="tw:block tw:truncate tw:text-[12.5px] tw:font-semibold tw:leading-tight tw:text-slate-800 tw:dark:text-slate-100">
                          {company.name}
                        </span>
                        <span className="tw:block tw:truncate tw:text-[10.5px] tw:leading-tight tw:text-slate-500 tw:dark:text-slate-400">
                          {company.branch} &middot; {company.fiscalYear}
                        </span>
                      </span>
                      <i className="fa-solid fa-chevron-down tw:ml-0.5 tw:shrink-0 tw:text-[9px] tw:text-slate-400 tw:transition-transform tw:duration-200 tw:group-aria-expanded:rotate-180"></i>
                    </button>
                    <ul
                      className={`dropdown-menu notika-dropdown erp-user-menu ${
                        openDropdown === "company" ? "show" : ""
                      }`}
                    >
                      <li className="notika-dropdown-header">Switch Company</li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item d-flex justify-content-between align-items-center gap-3 active"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <span>
                            <i className="fa-solid fa-building"></i> {company.name}
                          </span>
                          <i className="fa-solid fa-check"></i>
                        </button>
                      </li>
                      <li>
                        <hr className="dropdown-divider my-1" />
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          href="/organization/companies"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <i className="fa-solid fa-sliders"></i> Manage Companies
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Project Picker */}
                <div
                  className="erp-projectpicker d-none d-lg-flex tw:min-w-0 tw:items-center"
                  data-erp-dropdown
                >
                  <div className="dropdown tw:min-w-0">
                    <button
                      type="button"
                      aria-expanded={openDropdown === "project"}
                      onClick={() =>
                        setOpenDropdown((d) => (d === "project" ? null : "project"))
                      }
                      className="tw:group tw:flex tw:max-w-[240px] tw:min-w-0 tw:items-center tw:gap-2.5 tw:rounded-xl tw:border-0 tw:bg-white tw:py-1.5 tw:pr-2.5 tw:pl-1.5 tw:text-left tw:ring-1 tw:ring-slate-200/80 tw:shadow-[0_1px_2px_rgba(15,23,42,.05)] tw:transition tw:duration-200 tw:hover:-translate-y-px tw:hover:ring-slate-300 tw:hover:shadow-[0_8px_18px_-10px_rgba(15,23,42,.35)] tw:aria-expanded:translate-y-0 tw:aria-expanded:ring-2 tw:aria-expanded:ring-emerald-500/50 tw:dark:bg-white/5 tw:dark:ring-white/10"
                    >
                      <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-linear-to-br tw:from-sky-500 tw:to-indigo-600 tw:text-[13px] tw:text-white tw:shadow-md tw:shadow-sky-600/25">
                        <i className="fa-solid fa-diagram-project"></i>
                      </span>
                      <span className="tw:min-w-0">
                        <span className="tw:block tw:truncate tw:text-[12.5px] tw:font-semibold tw:leading-tight tw:text-slate-800 tw:dark:text-slate-100">
                          Projects
                        </span>
                        <span className="tw:block tw:truncate tw:text-[10.5px] tw:leading-tight tw:text-slate-500 tw:dark:text-slate-400">
                          {projects.length} on {company.branch}
                        </span>
                      </span>
                      <i className="fa-solid fa-chevron-down tw:ml-0.5 tw:shrink-0 tw:text-[9px] tw:text-slate-400 tw:transition-transform tw:duration-200 tw:group-aria-expanded:rotate-180"></i>
                    </button>

                    <ul
                      className={`dropdown-menu notika-dropdown erp-user-menu erp-projectpicker-menu ${
                        openDropdown === "project" ? "show" : ""
                      }`}
                    >
                      <li className="notika-dropdown-header">Go to project</li>
                      <li className="px-2 pb-1">
                        <input
                          type="search"
                          className="form-control form-control-sm"
                          placeholder="Filter projects..."
                          value={projectFilter}
                          onChange={(e) => setProjectFilter(e.target.value)}
                        />
                      </li>
                      <li>
                        <div className="erp-projectpicker-scroll">
                          {filteredProjects.map((prj) => (
                            <Link
                              key={prj.id}
                              className="dropdown-item erp-projectpicker-item"
                              href={`/projects/projects/${prj.id}`}
                              onClick={() => setOpenDropdown(null)}
                            >
                              <span className="erp-projectpicker-face">
                                <span className="erp-projectpicker-name">
                                  {prj.name}
                                </span>
                                <small>{prj.code}</small>
                              </span>
                              <span
                                className={`erp-pill ${
                                  prj.status === "Active"
                                    ? "is-available"
                                    : prj.status === "Delayed"
                                    ? "is-hold"
                                    : "is-neutral"
                                }`}
                              >
                                {prj.status}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </li>
                      {filteredProjects.length === 0 && (
                        <li className="erp-projectpicker-none">
                          <span className="dropdown-item text-muted">
                            <i className="fa-solid fa-circle-info"></i> No project matches that.
                          </span>
                        </li>
                      )}
                      <li>
                        <hr className="dropdown-divider my-1" />
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          href="/projects/projects"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <i className="fa-solid fa-list"></i> All Projects
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Cluster */}
              <div className="notika-nav erp-topbar-cluster tw:ml-auto tw:flex tw:shrink-0 tw:items-center tw:gap-2">
                {/* Search */}
                <div className="dropdown" data-erp-dropdown>
                  <button
                    type="button"
                    aria-label="Search"
                    data-topbar-search
                    aria-expanded={openDropdown === "search"}
                    onClick={() => {
                      const next = openDropdown === "search" ? null : "search";
                      setOpenDropdown(next);
                      if (next === "search") {
                        setTimeout(() => searchInputRef.current?.focus(), 60);
                      }
                    }}
                    className="tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:gap-2 tw:rounded-[11px] tw:border tw:border-solid tw:border-slate-200 tw:bg-white tw:text-[13px] tw:text-slate-400 tw:shadow-[0_1px_2px_rgba(15,23,42,.06)] tw:transition tw:duration-200 tw:hover:border-emerald-300 tw:hover:text-slate-600 tw:hover:shadow-sm tw:aria-expanded:border-emerald-400 tw:aria-expanded:ring-2 tw:aria-expanded:ring-emerald-500/30 tw:xl:w-64 tw:xl:justify-start tw:xl:px-3.5 tw:dark:border-white/15 tw:dark:bg-white/5"
                  >
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <span className="tw:hidden tw:xl:inline">Search anything&hellip;</span>
                    <kbd className="tw:ml-auto tw:hidden tw:rounded-md tw:bg-white tw:px-1.5 tw:py-0.5 tw:font-sans tw:text-[10px] tw:font-semibold tw:text-slate-500 tw:ring-1 tw:ring-slate-200 tw:shadow-sm tw:xl:inline tw:dark:bg-white/10 tw:dark:text-slate-300 tw:dark:ring-white/10">
                      Ctrl K
                    </kbd>
                  </button>
                  <div
                    className={`dropdown-menu dropdown-menu-end notika-dropdown search-dropdown ${
                      openDropdown === "search" ? "show" : ""
                    }`}
                  >
                    <div className="search-input-group">
                      <input
                        ref={searchInputRef}
                        type="text"
                        className="form-control"
                        placeholder="Search modules, routes, land…"
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                      />
                      <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="notika-dropdown-body mt-2" style={{ maxHeight: 280, overflowY: "auto" }}>
                        {searchResults.map((r) => (
                          <Link
                            key={r.href}
                            href={r.href}
                            className="notika-dropdown-item"
                            onClick={() => {
                              setOpenDropdown(null);
                              setGlobalSearch("");
                            }}
                          >
                            <div className="erp-avatar">
                              <i className={r.icon} style={{ fontSize: 12 }}></i>
                            </div>
                            <div className="notika-dropdown-content">
                              <h6>{r.label}</h6>
                              <p>{r.group}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Create */}
                <div className="dropdown d-none d-md-block" data-erp-dropdown>
                  <button
                    type="button"
                    aria-expanded={openDropdown === "create"}
                    onClick={() =>
                      setOpenDropdown((d) => (d === "create" ? null : "create"))
                    }
                    className="tw:group tw:flex tw:h-9 tw:items-center tw:gap-2 tw:rounded-xl tw:border-0 tw:bg-linear-to-b tw:from-emerald-500 tw:to-emerald-600 tw:pr-3.5 tw:pl-1.5 tw:text-[12.5px] tw:font-semibold tw:text-white tw:shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_8px_18px_-8px_rgba(16,185,129,.7)] tw:transition tw:duration-200 tw:hover:-translate-y-px tw:hover:from-emerald-400 tw:hover:to-emerald-600 tw:aria-expanded:translate-y-0"
                  >
                    <span className="tw:flex tw:size-6 tw:items-center tw:justify-center tw:rounded-lg tw:bg-white/20 tw:transition-transform tw:duration-200 tw:group-aria-expanded:rotate-45">
                      <i className="fa-solid fa-plus tw:text-[11px]"></i>
                    </span>
                    <span className="d-none d-lg-inline">Create</span>
                  </button>
                  <ul
                    className={`dropdown-menu dropdown-menu-end notika-dropdown erp-user-menu ${
                      openDropdown === "create" ? "show" : ""
                    }`}
                  >
                    <li className="notika-dropdown-header">Land &amp; Development</li>
                    <li>
                      <Link
                        className="dropdown-item"
                        href="/land/parcels/create"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <i className="fa-solid fa-map-location-dot"></i> New Land File{" "}
                        <span className="erp-qc-hint">Open parcel</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        href="/land/owners/create"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <i className="fa-solid fa-user-plus"></i> New Landowner{" "}
                        <span className="erp-qc-hint">Seller profile</span>
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider my-1" />
                    </li>
                    <li className="notika-dropdown-header">Record a transaction</li>
                    <li>
                      <Link
                        className="dropdown-item"
                        href="/accounting/income-expenses/create?type=expense"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <i className="fa-solid fa-money-bill-wave"></i> Expense{" "}
                        <span className="erp-qc-hint">Record a cost</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        href="/accounting/income-expenses/create?type=income"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <i className="fa-solid fa-hand-holding-dollar"></i> Money In{" "}
                        <span className="erp-qc-hint">Receive money</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        href="/purchases/supplier-payments/create"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <i className="fa-solid fa-file-invoice-dollar"></i> Payment{" "}
                        <span className="erp-qc-hint">Pay a bill</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        href="/accounting/journals/create"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <i className="fa-solid fa-book"></i> Journal{" "}
                        <span className="erp-qc-hint">Adjustment</span>
                      </Link>
                    </li>
                  </ul>
                </div>

                <span
                  className="tw:mx-1 tw:hidden tw:h-6 tw:w-px tw:shrink-0 tw:bg-linear-to-b tw:from-transparent tw:via-slate-300/80 tw:to-transparent tw:dark:via-white/15 tw:md:block"
                  aria-hidden="true"
                />

                {/* Icon Cluster */}
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  {/* Approvals */}
                  <div className="dropdown d-none d-sm-block" data-erp-dropdown>
                    <button
                      type="button"
                      aria-label="Approvals"
                      title="Approvals"
                      aria-expanded={openDropdown === "approvals"}
                      onClick={() =>
                        setOpenDropdown((d) =>
                          d === "approvals" ? null : "approvals"
                        )
                      }
                      className="tw:relative tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-[11px] tw:border tw:border-solid tw:border-slate-200 tw:bg-white tw:text-[14px] tw:text-slate-500 tw:shadow-[0_1px_2px_rgba(15,23,42,.06)] tw:transition tw:duration-200 tw:hover:-translate-y-px tw:hover:border-emerald-300 tw:hover:text-emerald-600 tw:dark:border-white/15 tw:dark:bg-white/5 tw:dark:text-slate-400"
                    >
                      <i className="fa-solid fa-circle-check"></i>
                      <span className="tw:pointer-events-none tw:absolute tw:-top-1.5 tw:-right-1.5 tw:flex tw:h-4 tw:min-w-4 tw:items-center tw:justify-center tw:rounded-full tw:bg-linear-to-br tw:from-rose-500 tw:to-orange-500 tw:px-1 tw:text-[9px] tw:font-bold tw:leading-none tw:text-white tw:shadow-sm tw:ring-2 tw:ring-white tw:dark:ring-slate-800">
                        4
                      </span>
                    </button>
                    <div
                      className={`dropdown-menu dropdown-menu-end notika-dropdown ${
                        openDropdown === "approvals" ? "show" : ""
                      }`}
                    >
                      <div className="notika-dropdown-header">Awaiting Your Approval</div>
                      <div className="notika-dropdown-body">
                        <Link
                          className="notika-dropdown-item"
                          href="/sales"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <div
                            className="erp-avatar"
                            style={{
                              background: "rgba(255,152,0,.16)",
                              color: "var(--erp-warning)",
                            }}
                          >
                            <i className="fa-solid fa-percent" style={{ fontSize: 13 }}></i>
                          </div>
                          <div className="notika-dropdown-content">
                            <h6>Discount 7% &mdash; Unit B-1204</h6>
                            <p>Requested by Nusrat Jahan &middot; ৳ 4,20,000</p>
                          </div>
                        </Link>
                        <Link
                          className="notika-dropdown-item"
                          href="/purchases"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <div
                            className="erp-avatar"
                            style={{
                              background: "rgba(3,169,243,.12)",
                              color: "var(--erp-info)",
                            }}
                          >
                            <i
                              className="fa-solid fa-cart-shopping"
                              style={{ fontSize: 13 }}
                            ></i>
                          </div>
                          <div className="notika-dropdown-content">
                            <h6>Purchase Order PO-2291</h6>
                            <p>Rebar 60-grade &middot; Meghna Steel &middot; ৳ 38,50,000</p>
                          </div>
                        </Link>
                        <Link
                          className="notika-dropdown-item"
                          href="/land/proposals"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <div
                            className="erp-avatar"
                            style={{
                              background: "rgba(233,30,99,.12)",
                              color: "var(--erp-danger)",
                            }}
                          >
                            <i
                              className="fa-solid fa-rotate-left"
                              style={{ fontSize: 13 }}
                            ></i>
                          </div>
                          <div className="notika-dropdown-content">
                            <h6>Booking Cancellation &mdash; A-0705</h6>
                            <p>Refund of ৳ 12,00,000 pending sign-off</p>
                          </div>
                        </Link>
                      </div>
                      <div className="notika-dropdown-footer">
                        <Link href="/settings/audit" onClick={() => setOpenDropdown(null)}>
                          View All Approvals
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="dropdown" data-erp-dropdown>
                    <button
                      type="button"
                      aria-label="Notifications"
                      title="Notifications"
                      aria-expanded={openDropdown === "notifications"}
                      onClick={() =>
                        setOpenDropdown((d) =>
                          d === "notifications" ? null : "notifications"
                        )
                      }
                      className="tw:relative tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-[11px] tw:border tw:border-solid tw:border-slate-200 tw:bg-white tw:text-[14px] tw:text-slate-500 tw:shadow-[0_1px_2px_rgba(15,23,42,.06)] tw:transition tw:duration-200 tw:hover:-translate-y-px tw:hover:border-emerald-300 tw:hover:text-emerald-600 tw:dark:border-white/15 tw:dark:bg-white/5 tw:dark:text-slate-400 tw:group"
                    >
                      <i className="fa-solid fa-bell"></i>
                    </button>
                    <div
                      className={`dropdown-menu dropdown-menu-end notika-dropdown ${
                        openDropdown === "notifications" ? "show" : ""
                      }`}
                    >
                      <div className="notika-dropdown-header">Notifications</div>
                      <div className="notika-dropdown-body">
                        <div
                          className="notika-dropdown-item text-muted"
                          style={{ fontSize: "12.5px" }}
                        >
                          You are all caught up.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Site Visits */}
                  <div className="dropdown d-none d-lg-block" data-erp-dropdown>
                    <button
                      type="button"
                      aria-label="Site visits"
                      title="Today's site visits"
                      aria-expanded={openDropdown === "visits"}
                      onClick={() =>
                        setOpenDropdown((d) => (d === "visits" ? null : "visits"))
                      }
                      className="tw:relative tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-[11px] tw:border tw:border-solid tw:border-slate-200 tw:bg-white tw:text-[14px] tw:text-slate-500 tw:shadow-[0_1px_2px_rgba(15,23,42,.06)] tw:transition tw:duration-200 tw:hover:-translate-y-px tw:hover:border-emerald-300 tw:hover:text-emerald-600 tw:dark:border-white/15 tw:dark:bg-white/5 tw:dark:text-slate-400"
                    >
                      <i className="fa-solid fa-calendar-check"></i>
                      <span className="tw:pointer-events-none tw:absolute tw:-top-1.5 tw:-right-1.5 tw:flex tw:h-4 tw:min-w-4 tw:items-center tw:justify-center tw:rounded-full tw:bg-linear-to-br tw:from-rose-500 tw:to-orange-500 tw:px-1 tw:text-[9px] tw:font-bold tw:leading-none tw:text-white tw:shadow-sm tw:ring-2 tw:ring-white tw:dark:ring-slate-800">
                        3
                      </span>
                    </button>
                    <div
                      className={`dropdown-menu dropdown-menu-end notika-dropdown ${
                        openDropdown === "visits" ? "show" : ""
                      }`}
                    >
                      <div className="notika-dropdown-header">Today&rsquo;s Site Visits</div>
                      <div className="notika-dropdown-body">
                        <Link
                          className="notika-dropdown-item"
                          href="/crm/site-visits"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <span className="erp-avatar">RI</span>
                          <div className="notika-dropdown-content">
                            <h6>Rafiqul Islam &middot; 11:00</h6>
                            <p>Harmony Heights &mdash; 3-bed show unit</p>
                          </div>
                        </Link>
                        <Link
                          className="notika-dropdown-item"
                          href="/crm/site-visits"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <span className="erp-avatar">SR</span>
                          <div className="notika-dropdown-content">
                            <h6>Sadia Rahman &middot; 15:30</h6>
                            <p>Green Meadow &mdash; plot walkthrough</p>
                          </div>
                        </Link>
                        <Link
                          className="notika-dropdown-item"
                          href="/crm/site-visits"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <span className="erp-avatar">TA</span>
                          <div className="notika-dropdown-content">
                            <h6>Tanvir Ahmed &middot; 17:00</h6>
                            <p>Riverfront Residency &mdash; duplex</p>
                          </div>
                        </Link>
                      </div>
                      <div className="notika-dropdown-footer">
                        <Link href="/crm/site-visits" onClick={() => setOpenDropdown(null)}>
                          Open Visit Planner
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <span
                  className="tw:mx-1 tw:hidden tw:h-6 tw:w-px tw:shrink-0 tw:bg-linear-to-b tw:from-transparent tw:via-slate-300/80 tw:to-transparent tw:dark:via-white/15 tw:lg:block"
                  aria-hidden="true"
                />

                {/* User Menu */}
                <div className="dropdown" data-erp-dropdown>
                  <button
                    type="button"
                    aria-expanded={openDropdown === "user"}
                    onClick={() =>
                      setOpenDropdown((d) => (d === "user" ? null : "user"))
                    }
                    className="tw:group tw:flex tw:max-w-[210px] tw:min-w-0 tw:items-center tw:gap-2.5 tw:rounded-full tw:border-0 tw:bg-transparent tw:py-1 tw:pr-1 tw:pl-1 tw:text-left tw:ring-1 tw:ring-transparent tw:transition tw:duration-200 tw:hover:bg-white tw:hover:ring-slate-200 tw:hover:shadow-sm tw:aria-expanded:bg-white tw:aria-expanded:ring-slate-200 tw:lg:pr-3 tw:dark:hover:bg-white/5"
                  >
                    <span className="tw:relative tw:shrink-0">
                      <span
                        className="erp-avatar tw:size-9 tw:rounded-full tw:ring-2 tw:ring-white tw:shadow-md tw:dark:ring-slate-800"
                        style={{
                          background: "linear-gradient(135deg,#00c292,#0f766e)",
                          color: "#fff",
                          width: 36,
                          height: 36,
                          fontSize: 13,
                        }}
                      >
                        {initials}
                      </span>
                      <span
                        className="tw:absolute tw:right-0 tw:bottom-0 tw:size-2.5 tw:rounded-full tw:bg-emerald-500 tw:ring-2 tw:ring-white tw:dark:ring-slate-800"
                        title="Online"
                      />
                    </span>
                    <span className="d-none d-lg-block tw:min-w-0 tw:leading-tight">
                      <span className="tw:block tw:truncate tw:text-[12.5px] tw:font-semibold tw:text-slate-800 tw:dark:text-slate-100">
                        {user.name}
                      </span>
                      <span className="tw:block tw:truncate tw:text-[9.5px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-emerald-600 tw:dark:text-emerald-400">
                        {user.role}
                      </span>
                    </span>
                    <i
                      className="fa-solid fa-chevron-down tw:ml-0.5 tw:shrink-0 tw:text-[9px] tw:text-slate-400 tw:transition-transform tw:duration-200 tw:group-aria-expanded:rotate-180 d-none d-lg-inline"
                      aria-hidden="true"
                    />
                  </button>

                  <ul
                    className={`dropdown-menu dropdown-menu-end notika-dropdown erp-user-menu ${
                      openDropdown === "user" ? "show" : ""
                    }`}
                  >
                    <li className="erp-user-card">
                      <span
                        className="erp-user-card-avatar d-flex align-items-center justify-content-center fw-bold"
                        style={{
                          background: "linear-gradient(135deg,#00c292,#0f766e)",
                          color: "#fff",
                        }}
                      >
                        {initials}
                      </span>
                      <span className="erp-user-card-meta">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                        <em>
                          <span className="erp-user-card-dot"></span>
                          {user.role}
                        </em>
                      </span>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        href="/profile"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <i className="fa-solid fa-user"></i> My Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        href="/profile/preferences"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <i className="fa-solid fa-sliders"></i> Preferences
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        href="/profile/security"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <i className="fa-solid fa-shield-halved"></i> Security
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider my-1" />
                    </li>
                    <li className="erp-user-menu-label">Theme</li>
                    <li>
                      <div className="erp-theme-switch">
                        {[
                          { key: "light", label: "Light", icon: "fa-sun" },
                          { key: "dark", label: "Dark", icon: "fa-moon" },
                          { key: "system", label: "System", icon: "fa-desktop" },
                        ].map((t) => (
                          <button
                            key={t.key}
                            type="button"
                            className={`erp-theme-switch-btn ${
                              themePref === t.key ? "is-active" : ""
                            }`}
                            onClick={() => handleThemeChange(t.key)}
                          >
                            <i className={`fa-solid ${t.icon}`}></i>
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </li>
                    <li>
                      <hr className="dropdown-divider my-1" />
                    </li>
                    <li className="erp-user-menu-label d-none d-lg-block">Navigation</li>
                    <li className="d-none d-lg-block">
                      <div className="erp-theme-switch">
                        <button
                          type="button"
                          className={`erp-theme-switch-btn ${
                            navLayout === "top" ? "is-active" : ""
                          }`}
                          title="Modules across the top, full width for content."
                          onClick={() => handleNavLayoutChange("top")}
                        >
                          <i className="fa-solid fa-table-columns fa-rotate-270"></i>
                          <span>Top bar</span>
                        </button>
                        <button
                          type="button"
                          className={`erp-theme-switch-btn ${
                            navLayout === "side" ? "is-active" : ""
                          }`}
                          title="Modules down the left, collapsible to icons."
                          onClick={() => handleNavLayoutChange("side")}
                        >
                          <i className="fa-solid fa-table-columns"></i>
                          <span>Sidebar</span>
                        </button>
                      </div>
                    </li>
                    <li>
                      <hr className="dropdown-divider my-1" />
                    </li>
                    <li>
                      <form
                        method="POST"
                        action="/api/auth/logout"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          await fetch("/api/auth/logout", { method: "POST" });
                          router.push("/login");
                          router.refresh();
                        }}
                      >
                        <button type="submit" className="dropdown-item text-danger">
                          <i className="fa-solid fa-arrow-right-from-bracket text-danger"></i>{" "}
                          Sign Out
                        </button>
                      </form>
                    </li>
                  </ul>
                </div>

                {/* Mobile hamburger */}
                <button
                  type="button"
                  aria-label="Menu"
                  onClick={() => setMobileOpen(true)}
                  className="tw:relative tw:flex tw:size-9 tw:items-center tw:justify-center tw:rounded-[11px] tw:border tw:border-solid tw:border-slate-200 tw:bg-white tw:text-[14px] tw:text-slate-500 d-lg-none"
                >
                  <i className="fa-solid fa-bars"></i>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Top bar horizontal nav when navLayout === "top" */}
        {navLayout === "top" && (
          <nav className="notika-navbar d-none d-lg-block" aria-label="Primary modules">
            <div className="container">
              <ul className="navbar-nav flex-row flex-wrap">
                {SIDEBAR_NAV.map((group) => {
                  const active = activeMeta.group?.id === group.id;
                  return (
                    <li key={group.id} className="nav-item">
                      <Link
                        href={group.items[0]?.href ?? "/dashboard"}
                        className={`nav-link ${active ? "active" : ""}`}
                      >
                        <i className={group.icon} style={{ color: group.accent }}></i>
                        <span>{group.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        )}
      </div>

      {/* Mobile Offcanvas */}
      {mobileOpen && (
        <>
          <div
            className="offcanvas-backdrop fade show"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="offcanvas offcanvas-start show"
            tabIndex={-1}
            id="mobileNavOffcanvas"
            aria-modal="true"
            role="dialog"
            style={{ visibility: "visible" }}
          >
            <div className="offcanvas-header border-bottom">
              <h5 className="offcanvas-title">
                <img src="/brand/erp-logo.jpg" alt="e-Hishabi ERP" style={{ height: 32 }} />
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setMobileOpen(false)}
              />
            </div>

            <div className="offcanvas-body p-0">
              <div className="p-3 border-bottom">
                <label className="form-label small text-muted mb-1">Working in</label>
                <div className="form-control form-control-sm">
                  {company.name} ({company.branch})
                </div>
              </div>

              <nav className="navbar-nav flex-column">
                {SIDEBAR_NAV.map((group) => {
                  const isExpanded = Boolean(openMenuIds[group.id]);
                  const isGroupActive = activeMeta.group?.id === group.id;
                  return (
                    <div key={group.id} className="nav-item border-bottom">
                      <button
                        type="button"
                        className={`nav-link w-100 text-start d-flex align-items-center justify-content-between px-3 py-2 border-0 bg-transparent ${
                          isGroupActive ? "active" : ""
                        }`}
                        onClick={() => toggleGroup(group.id)}
                      >
                        <span>
                          <i
                            className={`${group.icon} me-2 erp-nav-icon`}
                            style={{ ["--nav-accent" as string]: group.accent }}
                          ></i>{" "}
                          {group.label}
                        </span>
                        <i className="fa-solid fa-chevron-down small"></i>
                      </button>
                      <div className={`collapse ${isExpanded ? "show" : ""}`}>
                        <div className="nav flex-column ps-4 pb-2">
                          {group.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="nav-link py-1"
                              onClick={() => setMobileOpen(false)}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>

              <div className="p-3">
                <button
                  type="button"
                  className="btn btn-erp-ghost w-100 text-danger"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/login");
                  }}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket me-2"></i>Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="erp-main">{children}</main>

      <footer className="erp-footer">
        <span className="erp-footer-copy">
          &copy; 2026 <strong>e-Hishabi ERP</strong> &mdash; Real Estate &amp; Development
          Suite. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
