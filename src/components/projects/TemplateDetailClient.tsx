"use client";

import Link from "next/link";
import { ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

export function TemplateDetailClient({
  kind,
  template,
  items,
  parameters = [],
}: {
  kind: "wbs" | "cbs" | "estimate" | "itp";
  template: {
    id: number;
    name: string;
    description?: string | null;
    status: string;
    version: number;
    itemCount: number;
    currency?: string;
    rateDate?: string | null;
    projectType: { name: string } | null;
    projectCategory: { name: string } | null;
    cbsTemplate?: { name: string } | null;
    wbsTemplate?: { name: string } | null;
  };
  items: { id: number; code?: string; name: string; category?: string | null; costType?: string; estimatedCost?: number; isGroup?: boolean }[];
  parameters?: { id: number; key: string; label: string; unit: string | null }[];
}) {
  const backMap = {
    wbs: { href: "/projects/projects/wbs-templates", label: "Work Breakdown Templates", icon: "fa-solid fa-layer-group" },
    cbs: { href: "/projects/projects/cbs-templates", label: "Cost Breakdown Templates", icon: "fa-solid fa-sitemap" },
    estimate: { href: "/projects/projects/estimate-templates", label: "Estimate Templates", icon: "fa-solid fa-calculator" },
    itp: { href: "/projects/projects/itp-templates", label: "Inspection Plans", icon: "fa-solid fa-clipboard-check" },
  }[kind];

  const appliesTo = template.projectCategory?.name
    ? `Category: ${template.projectCategory.name}`
    : template.projectType?.name
    ? `Type: ${template.projectType.name}`
    : "All project types";

  return (
    <div className="container">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon={backMap.icon}
        title={template.name}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Projects", href: "/projects/projects" },
          { label: backMap.label, href: backMap.href },
          { label: template.name },
        ]}
        actions={
          <>
            <span className="erp-pill is-success align-self-center text-capitalize">
              {template.status} · v{template.version}
            </span>
            <Link href={backMap.href} className="btn btn-erp-ghost">
              <i className="fa-solid fa-arrow-left me-2" />Back
            </Link>
          </>
        }
      />

      <div className="erp-sale-strip">
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Applies to</span>
          <strong style={{ fontSize: 15 }}>{appliesTo}</strong>
          <span className="erp-sale-stat-foot">Scope</span>
        </div>
        <div className="erp-sale-stat">
          <span className="erp-sale-stat-label">Items</span>
          <strong>{template.itemCount || items.length}</strong>
          <span className="erp-sale-stat-foot">Configured rows</span>
        </div>
        {template.wbsTemplate && (
          <div className="erp-sale-stat">
            <span className="erp-sale-stat-label">Work breakdown</span>
            <strong style={{ fontSize: 15 }}>{template.wbsTemplate.name}</strong>
          </div>
        )}
        {template.cbsTemplate && (
          <div className="erp-sale-stat">
            <span className="erp-sale-stat-label">Cost breakdown</span>
            <strong style={{ fontSize: 15 }}>{template.cbsTemplate.name}</strong>
          </div>
        )}
      </div>

      {parameters.length > 0 && (
        <div className="erp-card mt-3 p-3">
          <h3 className="h6 mb-2">Formula Parameters ({parameters.length})</h3>
          <div className="d-flex flex-wrap gap-2">
            {parameters.slice(0, 24).map((p) => (
              <span key={p.id} className="erp-pill is-neutral">
                <code>{p.key}</code> {p.unit ? `(${p.unit})` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="erp-card mt-3">
        <div className="erp-card-head">
          <div>
            <h2>Template Contents</h2>
            <p>{template.description || "Standard structure rows included in this template."}</p>
          </div>
          <span className="erp-pill is-neutral">{items.length}</span>
        </div>
        <div className="table-responsive">
          <table className="table erp-table mb-0">
            <thead>
              <tr>
                {kind !== "wbs" && <th>Code</th>}
                <th>Name</th>
                <th>{kind === "wbs" ? "Category" : "Cost Type"}</th>
                {kind === "wbs" && <th className="text-end">Est. Cost</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="text-muted text-center py-4">No rows configured yet.</td></tr>
              ) : (
                items.slice(0, 100).map((it) => (
                  <tr key={it.id}>
                    {kind !== "wbs" && <td><code>{it.code || "—"}</code></td>}
                    <td className={it.isGroup ? "erp-cell-strong" : ""}>{it.name}</td>
                    <td>{it.category || it.costType || "—"}</td>
                    {kind === "wbs" && <td className="text-end">{(it.estimatedCost ?? 0).toFixed(2)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
