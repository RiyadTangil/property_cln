"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/contractors", icon: "fa-solid fa-address-book", label: "Contractors", exact: true },
  { href: "/contractors/contracts", icon: "fa-solid fa-file-contract", label: "Contracts", exact: false },
  { href: "/contractors/work-orders", icon: "fa-solid fa-file-signature", label: "Work Orders", exact: false },
  { href: "/contractors/bills", icon: "fa-solid fa-file-invoice-dollar", label: "Running Bills (RA)", exact: false },
  { href: "/contractors/payments", icon: "fa-solid fa-money-bill-transfer", label: "Advances & Payments", exact: false },
];

export function ContractorsSubmenu() {
  const pathname = usePathname();
  return (
    <nav className="erp-submenubar" aria-label="Section navigation">
      <div className="erp-submenubar-scroll">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
