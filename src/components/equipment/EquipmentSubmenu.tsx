"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/equipment", icon: "fa-solid fa-gauge-high", label: "Fleet Dashboard", exact: true },
  { href: "/equipment/register", icon: "fa-solid fa-tractor", label: "Equipment Register", exact: false },
  { href: "/equipment/categories", icon: "fa-solid fa-folder-tree", label: "Categories", exact: false },
  { href: "/equipment/assignments", icon: "fa-solid fa-truck-arrow-right", label: "Assignments & Transfers", exact: false },
  { href: "/equipment/usage", icon: "fa-solid fa-clock", label: "Plant Usage Logs", exact: false },
  { href: "/equipment/fuel", icon: "fa-solid fa-gas-pump", label: "Fuel Logs", exact: false },
  { href: "/equipment/maintenance/due", icon: "fa-solid fa-calendar-check", label: "Maintenance Due", exact: false },
  { href: "/equipment/work-orders", icon: "fa-solid fa-screwdriver-wrench", label: "Work Orders & Breakdowns", exact: false },
  { href: "/equipment/inspections", icon: "fa-solid fa-clipboard-check", label: "Inspections", exact: false },
  { href: "/equipment/operators", icon: "fa-solid fa-id-card", label: "Operator Certifications", exact: false },
  { href: "/equipment/rentals", icon: "fa-solid fa-file-contract", label: "Hire Contracts", exact: false },
  { href: "/equipment/reports/costs", icon: "fa-solid fa-coins", label: "Cost & Recovery", exact: false },
  { href: "/equipment/reports/utilisation", icon: "fa-solid fa-chart-simple", label: "Utilisation", exact: false },
  { href: "/equipment/reports/reliability", icon: "fa-solid fa-heart-pulse", label: "Reliability & Downtime", exact: false },
  { href: "/equipment/reports/project-cost", icon: "fa-solid fa-diagram-project", label: "Plant Cost by Project", exact: false },
  { href: "/equipment/reports/compliance", icon: "fa-solid fa-shield-halved", label: "Compliance & Expiry", exact: false },
  { href: "/equipment/reports/depreciation", icon: "fa-solid fa-arrow-trend-down", label: "Depreciation Run", exact: false },
];

export function EquipmentSubmenu() {
  const pathname = usePathname();
  return (
    <nav className="erp-submenubar" aria-label="Section navigation">
      <div className="erp-submenubar-scroll">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`erp-submenu-btn ${active ? "is-active" : ""}`}
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
