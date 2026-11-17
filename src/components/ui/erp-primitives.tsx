"use client";

import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function ErpPageHeader({
  icon,
  title,
  breadcrumbs,
  actions,
}: {
  icon: string;
  title: React.ReactNode;
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="erp-pagehead">
      <div className="erp-pagehead-main">
        <div className="erp-pagehead-icon">
          <i className={icon}></i>
        </div>
        <div>
          <h1>{title}</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              {breadcrumbs.map((b, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li
                    key={`${b.label}-${idx}`}
                    className={`breadcrumb-item${isLast ? " active" : ""}`}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {b.href && !isLast ? <Link href={b.href}>{b.label}</Link> : b.label}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
      {actions && <div className="erp-pagehead-actions">{actions}</div>}
    </div>
  );
}

export function ErpEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="erp-empty">
      <div className="erp-empty-icon">
        <i className={icon}></i>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErpDeleteModal({
  open,
  title,
  description,
  busy = false,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  busy?: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
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
                    {title}
                  </h5>
                  <p className="text-muted mb-0" style={{ fontSize: "13.5px" }}>
                    {description}
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button type="button" className="btn btn-erp-ghost" onClick={onCancel}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-erp"
                style={{
                  background: "var(--erp-danger)",
                  borderColor: "var(--erp-danger)",
                }}
                disabled={busy}
                onClick={onConfirm}
              >
                <i className="fa-solid fa-trash-can me-2"></i>
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function ErpContextBanner({
  companyName,
  description,
  icon = "fa-solid fa-building-columns",
  right,
}: {
  companyName: string;
  description: React.ReactNode;
  icon?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="erp-context-banner">
      <span className="erp-context-banner-icon">
        <i className={icon}></i>
      </span>
      <div className="erp-context-banner-body">
        <strong>{companyName}</strong>
        <span>{description}</span>
      </div>
      {right}
    </div>
  );
}

export function ErpFormBar({
  note,
  cancelHref,
  submitLabel,
  submittingLabel,
  submitting = false,
  submitIcon = "fa-solid fa-floppy-disk",
  actions,
}: {
  note?: React.ReactNode;
  cancelHref?: string;
  submitLabel?: string;
  submittingLabel?: string;
  submitting?: boolean;
  submitIcon?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="erp-form-bar">
      <span className="erp-form-bar-note">
        <i className="fa-solid fa-circle-info me-1"></i>
        {note ?? (
          <>
            Fields marked <span className="erp-required">*</span> are required.
          </>
        )}
      </span>
      <div className="erp-form-bar-actions">
        {actions ? (
          actions
        ) : (
          <>
            {cancelHref && (
              <Link href={cancelHref} className="btn btn-erp-ghost">
                Cancel
              </Link>
            )}
            <button type="submit" className="btn btn-erp" disabled={submitting}>
              <i className={`${submitIcon} me-2`}></i>
              {submitting ? submittingLabel ?? "Saving…" : submitLabel ?? "Save"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ErpSectionCard({
  icon,
  title,
  subtitle,
  children,
  footer,
  flush = false,
  className = "",
  headerRight,
}: {
  icon: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  flush?: boolean;
  className?: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <section className={`erp-card${className ? ` ${className}` : ""}`}>
      <div className="erp-section-head">
        <div className="erp-section-icon">
          <i className={icon}></i>
        </div>
        <div className={headerRight ? "flex-grow-1" : undefined}>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      <div className={`erp-card-body${flush ? " is-flush" : ""}`}>{children}</div>
      {footer}
    </section>
  );
}

export function ErpTableCard({
  toolbar,
  countText,
  isEmpty,
  emptyState,
  children,
  className = "",
  headerClass = "erp-toolbar",
}: {
  toolbar?: React.ReactNode;
  countText?: string;
  isEmpty: boolean;
  emptyState: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClass?: "erp-toolbar" | "erp-card-head";
}) {
  return (
    <div className={`erp-card${className ? ` ${className}` : ""}`}>
      {(toolbar || countText) && (
        <div className={headerClass}>
          {toolbar}
          {countText && (
            <span className="text-muted" style={{ fontSize: "12.5px" }}>
              {countText}
            </span>
          )}
        </div>
      )}
      {isEmpty ? (
        emptyState
      ) : (
        <div className="erp-card-body is-flush">
          <div className="erp-table-wrap">{children}</div>
        </div>
      )}
    </div>
  );
}

export type ErpPillTone = "available" | "booked" | "hold" | "neutral" | "overdue" | "sold";

export function ErpPill({
  tone = "neutral",
  icon,
  className = "",
  children,
}: {
  tone?: ErpPillTone;
  icon?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`erp-pill is-${tone}${className ? ` ${className}` : ""}`}>
      {icon && <i className={`${icon} me-1`}></i>}
      {children}
    </span>
  );
}

export function ErpIdentity({
  initials,
  avatarIcon,
  logoUrl,
  title,
  meta,
  badge,
}: {
  initials?: string;
  avatarIcon?: string;
  logoUrl?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="erp-identity">
      {logoUrl !== undefined ? (
        <span className="erp-logo-thumb d-flex align-items-center justify-content-center fw-bold">
          {logoUrl ? <img src={logoUrl} alt="" /> : initials}
        </span>
      ) : (
        <span className="erp-initials">
          {avatarIcon ? <i className={avatarIcon}></i> : initials}
        </span>
      )}
      <span>
        <span className="erp-identity-name">
          {title}
          {badge}
        </span>
        {meta && <span className="erp-identity-meta">{meta}</span>}
      </span>
    </div>
  );
}
