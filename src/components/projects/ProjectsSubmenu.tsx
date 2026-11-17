"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUBMENU_ITEMS = [
  { href: "/projects/projects", icon: "fa-solid fa-city", label: "All Projects", exact: true },
  { href: "/projects/projects/create", icon: "fa-solid fa-circle-plus", label: "New Project", exact: true },
  { href: "/buildings", icon: "fa-solid fa-building", label: "Buildings", exact: false },
  { href: "/projects/types", icon: "fa-solid fa-shapes", label: "Project Types", exact: false },
  { href: "/projects/categories", icon: "fa-solid fa-folder-tree", label: "Project Categories", exact: false },
  { href: "/projects/projects/task-templates", icon: "fa-solid fa-list-check", label: "Task & Cost Setup", exact: true },
  { href: "/projects/projects/wbs-templates", icon: "fa-solid fa-layer-group", label: "WBS Templates", exact: true },
  { href: "/projects/projects/cbs-templates", icon: "fa-solid fa-sitemap", label: "CBS Templates", exact: true },
  { href: "/projects/projects/estimate-templates", icon: "fa-solid fa-calculator", label: "Estimate Templates", exact: true },
  { href: "/projects/projects/parameters", icon: "fa-solid fa-ruler-combined", label: "Project Parameters", exact: true },
  { href: "/projects/projects/itp-templates", icon: "fa-solid fa-clipboard-check", label: "Inspection Plans (ITP)", exact: true },
  { href: "/projects/projects/cost-breakdown", icon: "fa-solid fa-sitemap", label: "Cost Breakdown (CBS)", exact: true },
  { href: "/projects/inspection-checklists", icon: "fa-solid fa-clipboard-check", label: "Inspection Checklists", exact: true },
];

export function ProjectsSubmenu() {
  const pathname = usePathname();
  return (
    <nav className="erp-submenubar" aria-label="Section navigation">
      <div className="erp-submenubar-scroll">
        {SUBMENU_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`erp-submenu-btn${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <i className={item.icon} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
