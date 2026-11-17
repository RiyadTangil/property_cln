"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/accounting/daily", icon: "fa-solid fa-calendar-day", label: "Daily Transactions" },
  { href: "/accounting/accounts", icon: "fa-solid fa-sitemap", label: "Chart of Accounts" },
  { href: "/accounting/journals", icon: "fa-solid fa-file-invoice-dollar", label: "Journal Vouchers" },
  { href: "/accounting/contra", icon: "fa-solid fa-right-left", label: "Contra Vouchers" },
  { href: "/accounting/income-expenses", icon: "fa-solid fa-money-bill-transfer", label: "Income & Expense" },
  { href: "/accounting/heads", icon: "fa-solid fa-layer-group", label: "Income/Expense Heads" },
  { href: "/accounting/banks", icon: "fa-solid fa-building-columns", label: "Banks" },
  { href: "/accounting/loans", icon: "fa-solid fa-hand-holding-dollar", label: "Loans" },
  { href: "/accounting/lenders", icon: "fa-solid fa-landmark", label: "Lenders" },
  { href: "/accounting/ledger", icon: "fa-solid fa-book-open", label: "General Ledger" },
  { href: "/accounting/trial-balance", icon: "fa-solid fa-scale-balanced", label: "Trial Balance" },
  { href: "/accounting/balance-sheet", icon: "fa-solid fa-chart-pie", label: "Balance Sheet" },
  { href: "/accounting/cash-flow", icon: "fa-solid fa-arrow-right-arrow-left", label: "Cash Flow Statement" },
];

export default function AccountingSubmenu() {
  const pathname = usePathname();
  return (
    <nav className="erp-submenubar" aria-label="Section navigation">
      <div className="erp-submenubar-scroll">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`erp-submenu-btn${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <i className={item.icon} aria-hidden="true"></i>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
