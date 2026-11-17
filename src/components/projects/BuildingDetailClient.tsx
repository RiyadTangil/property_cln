"use client";

import Link from "next/link";
import { ErpPageHeader } from "@/components/ui";
import { ProjectsSubmenu } from "./ProjectsSubmenu";

interface BuildingDetail {
  id: number;
  code: string;
  name: string;
  buildingType: string;
  status: string;
  location: string | null;
  city: string | null;
  district: string | null;
  country: string | null;
  floorsAbove: number;
  floorsBelow: number;
  totalUnits: number;
  landArea: number | null;
  builtArea: number | null;
  lifts: number;
  parkingSpaces: number;
  hasGenerator: boolean;
  hasSecurity: boolean;
  hasFireSafety: boolean;
  amenities: string | null;
  ownerName: string | null;
  developerName: string | null;
  constructionStartDate: string | null;
  completionDate: string | null;
  handoverDate: string | null;
  occupancyDate: string | null;
  constructionCost: number | null;
  currentValue: number | null;
  description: string | null;
  project: { id: number; code: string; name: string } | null;
  landParcel: { id: number; code: string; title: string | null } | null;
  floors: { id: number }[];
  units: { id: number; status: string; price: number | null }[];
}

export function BuildingDetailClient({ building }: { building: BuildingDetail }) {
  const availableUnits = building.units.filter((u) => u.status === "available").length;
  const totalValue = building.units.reduce((sum, u) => sum + (u.price ?? 0), 0);

  return (
    <div className="container">
      <ProjectsSubmenu />
      <ErpPageHeader
        icon="fa-solid fa-house"
        title={building.name}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Buildings", href: "/buildings" },
          { label: building.code },
        ]}
        actions={
          <>
            <span className="erp-pill is-available align-self-center text-capitalize">
              <i className="fa-solid fa-house me-1" />{building.buildingType.replace("_", " ")}
            </span>
            <span className="erp-pill is-booked align-self-center text-capitalize">
              <i className="fa-solid fa-flag-checkered me-1" />{building.status.replace("_", " ")}
            </span>
            <Link href={`/buildings/${building.id}/edit`} className="btn btn-erp">
              <i className="fa-solid fa-pen me-2" />Edit
            </Link>
          </>
        }
      />

      <ul className="nav erp-tabs erp-tabs-nav" role="tablist">
        <li role="presentation">
          <Link className="erp-tab active" href={`/buildings/${building.id}`}>
            <i className="fa-solid fa-circle-info" /><span className="erp-tab-label">Overview</span>
          </Link>
        </li>
        <li role="presentation">
          <Link className="erp-tab" href={`/buildings/${building.id}/floors`}>
            <i className="fa-solid fa-stairs" /><span className="erp-tab-label">Floors &amp; Units</span>
          </Link>
        </li>
      </ul>

      <div className="row g-3 erp-building-stats">
        <div className="col-6 col-lg-3">
          <div className="erp-kpi is-info mb-0">
            <div className="erp-kpi-top">
              <div><p className="erp-kpi-label">Floors</p><p className="erp-kpi-value">{building.floors.length}</p></div>
              <span className="erp-kpi-icon is-info"><i className="fa-solid fa-stairs" /></span>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="erp-kpi is-purple mb-0">
            <div className="erp-kpi-top">
              <div><p className="erp-kpi-label">Units</p><p className="erp-kpi-value">{building.units.length}</p></div>
              <span className="erp-kpi-icon is-purple"><i className="fa-solid fa-door-closed" /></span>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="erp-kpi mb-0">
            <div className="erp-kpi-top">
              <div><p className="erp-kpi-label">Available</p><p className="erp-kpi-value">{availableUnits}</p></div>
              <span className="erp-kpi-icon is-primary"><i className="fa-solid fa-circle-check" /></span>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="erp-kpi is-warning mb-0">
            <div className="erp-kpi-top">
              <div>
                <p className="erp-kpi-label">Unit Value</p>
                <p className="erp-kpi-value">{totalValue > 0 ? totalValue.toLocaleString() : "—"}</p>
              </div>
              <span className="erp-kpi-icon is-warning"><i className="fa-solid fa-coins" /></span>
            </div>
            {totalValue === 0 && <div className="erp-kpi-foot"><span>No prices set</span></div>}
          </div>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-lg-4">
          <div className="erp-card p-0">
            <div className="erp-supplier-hero" style={{ textAlign: "left", padding: 20 }}>
              <span className="erp-supplier-avatar" style={{ borderRadius: 16 }}><i className="fa-solid fa-house" /></span>
              <h2 style={{ marginTop: 10 }}>{building.name}</h2>
              <p className="erp-supplier-code">{building.code}</p>
              <p className="mb-0 mt-1" style={{ fontSize: "12.5px", color: "var(--erp-muted)" }}>
                <i className="fa-solid fa-location-dot me-1" />
                {[building.location, building.city, building.country].filter(Boolean).join(", ") || "BD"}
              </p>
              <div className="erp-supplier-quick mt-3">
                <div><strong>{building.floors.length}</strong><small>Floors</small></div>
                <div><strong>{building.units.length}</strong><small>Units</small></div>
                <div><strong>{building.builtArea ?? 0}</strong><small>Sq ft</small></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="erp-card mb-3">
            <div className="erp-card-head"><div><h2>Structure &amp; Links</h2></div></div>
            <div className="erp-card-body">
              <div className="erp-deflist">
                <div className="erp-def"><span className="erp-def-label">Project</span><span className="erp-def-value">{building.project ? `${building.project.code} · ${building.project.name}` : "Standalone"}</span></div>
                <div className="erp-def"><span className="erp-def-label">Land Parcel</span><span className="erp-def-value">{building.landParcel ? `${building.landParcel.code} · ${building.landParcel.title || ""}` : "—"}</span></div>
                <div className="erp-def"><span className="erp-def-label">Floors Above / Basements</span><span className="erp-def-value">{building.floorsAbove} / {building.floorsBelow}</span></div>
                <div className="erp-def"><span className="erp-def-label">Lifts / Parking</span><span className="erp-def-value">{building.lifts} / {building.parkingSpaces}</span></div>
                <div className="erp-def"><span className="erp-def-label">Owner / Developer</span><span className="erp-def-value">{building.ownerName || "—"} / {building.developerName || "—"}</span></div>
                <div className="erp-def">
                  <span className="erp-def-label">Amenities</span>
                  <span className="erp-def-value">
                    {building.hasGenerator && <span className="erp-pill is-available me-1">Generator</span>}
                    {building.hasSecurity && <span className="erp-pill is-available me-1">Security</span>}
                    {building.hasFireSafety && <span className="erp-pill is-available me-1">Fire Safety</span>}
                    {building.amenities || (!building.hasGenerator && !building.hasSecurity && !building.hasFireSafety ? "—" : "")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="erp-card">
            <div className="erp-card-head"><div><h2>Dates &amp; Financials</h2></div></div>
            <div className="erp-card-body">
              <div className="erp-deflist">
                <div className="erp-def"><span className="erp-def-label">Construction Start</span><span className="erp-def-value">{building.constructionStartDate || "—"}</span></div>
                <div className="erp-def"><span className="erp-def-label">Completion</span><span className="erp-def-value">{building.completionDate || "—"}</span></div>
                <div className="erp-def"><span className="erp-def-label">Handover</span><span className="erp-def-value">{building.handoverDate || "—"}</span></div>
                <div className="erp-def"><span className="erp-def-label">Occupancy</span><span className="erp-def-value">{building.occupancyDate || "—"}</span></div>
                <div className="erp-def"><span className="erp-def-label">Construction Cost</span><span className="erp-def-value">{building.constructionCost?.toLocaleString() || "—"}</span></div>
                <div className="erp-def"><span className="erp-def-label">Current Value</span><span className="erp-def-value">{building.currentValue?.toLocaleString() || "—"}</span></div>
              </div>
              {building.description && <div className="small text-muted mt-3">{building.description}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
