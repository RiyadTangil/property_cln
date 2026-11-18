"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/crm/leads", icon: "fa-solid fa-filter", label: "Leads", exact: true },
  { href: "/crm/leads/board", icon: "fa-solid fa-diagram-project", label: "Lead Board", exact: true },
  { href: "/crm/customers", icon: "fa-solid fa-address-book", label: "Customers", exact: false },
  { href: "/crm/followups", icon: "fa-solid fa-list-check", label: "Follow-ups", exact: false },
  { href: "/crm/site-visits", icon: "fa-solid fa-location-dot", label: "Site Visits", exact: false },
  { href: "/crm/followup-types", icon: "fa-solid fa-tags", label: "Follow-up Types", exact: false },
  { href: "/crm/lost-reasons", icon: "fa-solid fa-circle-minus", label: "Lost Reasons", exact: false },
  { href: "/crm/settings/pipelines", icon: "fa-solid fa-sliders", label: "Pipelines", exact: false },
  { href: "/crm/lead-distribution", icon: "fa-solid fa-clock-rotate-left", label: "Auto-distribution", exact: false },
  { href: "/crm/assignment-rules", icon: "fa-solid fa-wand-magic-sparkles", label: "Assignment Rules", exact: false },
];

export function CrmSubmenu() {
  const pathname = usePathname();
  return (
    <nav className="erp-submenubar" aria-label="Section navigation">
      <div className="erp-submenubar-scroll">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href ||
              (item.href === "/crm/leads" &&
                pathname.startsWith("/crm/leads/") &&
                pathname !== "/crm/leads/board")
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

export default CrmSubmenu;
