"use client";

import React, { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AREA_UNITS,
  LAND_SOURCES,
  LAND_TYPES,
  convertToSqft,
  sqftToKatha,
} from "@/lib/land";

const RESTRICTED_LAND_WARNINGS: Record<string, string> = {
  agricultural:
    "Agricultural land requires Deputy Commissioner (DC) / land-use conversion clearance before residential or commercial construction.",
  pond: "Pond / Water Body parcels are protected under the Water Body Conservation Act and cannot normally be filled or built on.",
  fallow: "Fallow (Patit) land should be verified for mutation history and non-encumbrance before valuation.",
  khas: "Khas (Government) land cannot be acquired from private sellers — verify lease or allotment grant.",
};

export default function CreateLandParcelPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [landType, setLandType] = useState("residential");
  const [mouza, setMouza] = useState("");
  const [jlNo, setJlNo] = useState("");
  const [mouzaMapSheet, setMouzaMapSheet] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [unionWard, setUnionWard] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [road, setRoad] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [areaValue, setAreaValue] = useState("");
  const [areaUnit, setAreaUnit] = useState("katha");
  const [boundaryNorth, setBoundaryNorth] = useState("");
  const [boundarySouth, setBoundarySouth] = useState("");
  const [boundaryEast, setBoundaryEast] = useState("");
  const [boundaryWest, setBoundaryWest] = useState("");
  const [frontageFeet, setFrontageFeet] = useState("");
  const [roadWidthFeet, setRoadWidthFeet] = useState("");
  const [currentUse, setCurrentUse] = useState("");
  const [isCornerPlot, setIsCornerPlot] = useState(false);
  const [source, setSource] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [brokerContact, setBrokerContact] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const areaPreview = useMemo(() => {
    const val = Number(areaValue);
    if (!Number.isFinite(val) || val <= 0) return "—";
    const sqft = convertToSqft(val, areaUnit);
    const katha = sqftToKatha(sqft);
    return `${sqft.toLocaleString()} sq ft · ${katha.toFixed(2)} katha`;
  }, [areaValue, areaUnit]);

  const warningText = RESTRICTED_LAND_WARNINGS[landType] ?? "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!mouza.trim() || !district.trim() || !areaValue || Number(areaValue) <= 0) {
      setError("Please fill Mouza, District, and a positive Area.");
      return;
    }
    if (source === "broker" && !brokerName.trim()) {
      setError("Broker Name is required when Source is Broker / agent.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/land/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          land_type: landType,
          mouza,
          jl_no: jlNo,
          mouza_map_sheet: mouzaMapSheet,
          division,
          district,
          upazila,
          union_ward: unionWard,
          police_station: policeStation,
          road,
          postal_code: postalCode,
          address_line: addressLine,
          latitude,
          longitude,
          area_value: areaValue,
          area_unit: areaUnit,
          boundary_north: boundaryNorth,
          boundary_south: boundarySouth,
          boundary_east: boundaryEast,
          boundary_west: boundaryWest,
          frontage_feet: frontageFeet,
          road_width_feet: roadWidthFeet,
          current_use: currentUse,
          is_corner_plot: isCornerPlot,
          source,
          broker_name: brokerName,
          broker_contact: brokerContact,
          remarks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save land file.");
        setSubmitting(false);
        return;
      }
      router.push(`/land/parcels/${data.parcel.id}`);
      router.refresh();
    } catch {
      setError("Network error while creating land file.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-map-location-dot"></i>
          </div>
          <div>
            <h1>New Land File</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Land</li>
                <li className="breadcrumb-item">
                  <Link href="/land/parcels">Parcels</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/land/parcels" className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2"></i>Back to list
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="fa-solid fa-circle-exclamation me-2"></i>
          {error}
        </div>
      )}

      <form className="erp-form" onSubmit={handleSubmit} noValidate>
        {/* Section 1: The Land */}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-map-pin"></i>
            </div>
            <div>
              <h2>The Land</h2>
              <p>
                A working name and the recorded classification. The classification
                decides whether the plot can be built on as it stands.
              </p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-8">
                <div className="erp-field">
                  <label htmlFor="title" className="form-label">
                    Working Name
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={190}
                    placeholder="Baridhara 5 acre plot"
                  />
                  <small className="text-muted">
                    What the team calls this deal. The Land ID is generated for you.
                  </small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="land_type" className="form-label">
                    Land Type <span className="erp-required">*</span>
                  </label>
                  <select
                    id="land_type"
                    name="land_type"
                    className="form-select"
                    value={landType}
                    onChange={(e) => setLandType(e.target.value)}
                    required
                  >
                    {LAND_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {warningText && (
              <div
                className="alert alert-warning"
                role="alert"
                style={{ borderRadius: 12 }}
              >
                <i className="fa-solid fa-triangle-exclamation me-2"></i>
                {warningText}
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Location */}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div>
              <h2>Location</h2>
              <p>
                The mouza and JL number identify the revenue village — they are how
                the record room finds this land. The khatian and dag rows are added
                after saving.
              </p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-5">
                <div className="erp-field">
                  <label htmlFor="mouza" className="form-label">
                    Mouza <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="mouza"
                    name="mouza"
                    className="form-control"
                    value={mouza}
                    onChange={(e) => setMouza(e.target.value)}
                    maxLength={150}
                    required
                    placeholder="Baridhara"
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="jl_no" className="form-label">
                    JL No.
                  </label>
                  <input
                    type="text"
                    id="jl_no"
                    className="form-control"
                    value={jlNo}
                    onChange={(e) => setJlNo(e.target.value)}
                    maxLength={30}
                    placeholder="25"
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="mouza_map_sheet" className="form-label">
                    Mouza Map Sheet
                  </label>
                  <input
                    type="text"
                    id="mouza_map_sheet"
                    className="form-control"
                    value={mouzaMapSheet}
                    onChange={(e) => setMouzaMapSheet(e.target.value)}
                    maxLength={60}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="division" className="form-label">
                    Division
                  </label>
                  <input
                    type="text"
                    id="division"
                    className="form-control"
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    maxLength={120}
                    placeholder="Dhaka"
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="district" className="form-label">
                    District <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="district"
                    name="district"
                    className="form-control"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    maxLength={120}
                    required
                    placeholder="Dhaka"
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="upazila" className="form-label">
                    Upazila / Thana
                  </label>
                  <input
                    type="text"
                    id="upazila"
                    className="form-control"
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="union_ward" className="form-label">
                    Union / Ward
                  </label>
                  <input
                    type="text"
                    id="union_ward"
                    className="form-control"
                    value={unionWard}
                    onChange={(e) => setUnionWard(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="police_station" className="form-label">
                    Police Station
                  </label>
                  <input
                    type="text"
                    id="police_station"
                    className="form-control"
                    value={policeStation}
                    onChange={(e) => setPoliceStation(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>
              <div className="col-md-5">
                <div className="erp-field">
                  <label htmlFor="road" className="form-label">
                    Road / Landmark
                  </label>
                  <input
                    type="text"
                    id="road"
                    className="form-control"
                    value={road}
                    onChange={(e) => setRoad(e.target.value)}
                    maxLength={190}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="postal_code" className="form-label">
                    Post Code
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    className="form-control"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="address_line" className="form-label">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address_line"
                    className="form-control"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    maxLength={255}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="latitude" className="form-label">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0000001"
                    min="-90"
                    max="90"
                    id="latitude"
                    className="form-control"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="longitude" className="form-label">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0000001"
                    min="-180"
                    max="180"
                    id="longitude"
                    className="form-control"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Area & Boundaries */}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-ruler-combined"></i>
            </div>
            <div>
              <h2>Area &amp; Boundaries</h2>
              <p>
                Enter the area in whichever unit the seller quotes. It is converted
                and stored in square feet so every parcel can be compared and totalled.
              </p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="area_value" className="form-label">
                    Area <span className="erp-required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    id="area_value"
                    name="area_value"
                    className="form-control"
                    value={areaValue}
                    onChange={(e) => setAreaValue(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="area_unit" className="form-label">
                    Unit <span className="erp-required">*</span>
                  </label>
                  <select
                    id="area_unit"
                    name="area_unit"
                    className="form-select"
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value)}
                    required
                  >
                    {AREA_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label className="form-label">Equivalent</label>
                  <div className="form-control-plaintext fw-semibold">
                    {areaPreview}
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="boundary_north" className="form-label">
                    Boundary — North
                  </label>
                  <input
                    type="text"
                    id="boundary_north"
                    className="form-control"
                    value={boundaryNorth}
                    onChange={(e) => setBoundaryNorth(e.target.value)}
                    maxLength={190}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="boundary_south" className="form-label">
                    Boundary — South
                  </label>
                  <input
                    type="text"
                    id="boundary_south"
                    className="form-control"
                    value={boundarySouth}
                    onChange={(e) => setBoundarySouth(e.target.value)}
                    maxLength={190}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="boundary_east" className="form-label">
                    Boundary — East
                  </label>
                  <input
                    type="text"
                    id="boundary_east"
                    className="form-control"
                    value={boundaryEast}
                    onChange={(e) => setBoundaryEast(e.target.value)}
                    maxLength={190}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="boundary_west" className="form-label">
                    Boundary — West
                  </label>
                  <input
                    type="text"
                    id="boundary_west"
                    className="form-control"
                    value={boundaryWest}
                    onChange={(e) => setBoundaryWest(e.target.value)}
                    maxLength={190}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="frontage_feet" className="form-label">
                    Frontage (ft)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="frontage_feet"
                    className="form-control"
                    value={frontageFeet}
                    onChange={(e) => setFrontageFeet(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="road_width_feet" className="form-label">
                    Road Width (ft)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="road_width_feet"
                    className="form-control"
                    value={roadWidthFeet}
                    onChange={(e) => setRoadWidthFeet(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="current_use" className="form-label">
                    Current Use
                  </label>
                  <input
                    type="text"
                    id="current_use"
                    className="form-control"
                    value={currentUse}
                    onChange={(e) => setCurrentUse(e.target.value)}
                    maxLength={190}
                    placeholder="Vacant / paddy / homestead"
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label className="form-label d-block">Corner Plot</label>
                  <div className="form-check form-switch mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_corner_plot"
                      checked={isCornerPlot}
                      onChange={(e) => setIsCornerPlot(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="is_corner_plot">
                      Yes, it is a corner plot
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Sourcing */}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-handshake"></i>
            </div>
            <div>
              <h2>Sourcing</h2>
              <p>
                Where the opportunity came from. A broker deal must name the broker
                — that is the commission trail.
              </p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="source" className="form-label">
                    Source
                  </label>
                  <select
                    id="source"
                    className="form-select"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  >
                    <option value="">Not recorded</option>
                    {LAND_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="broker_name" className="form-label">
                    Broker Name{" "}
                    {source === "broker" && <span className="erp-required">*</span>}
                  </label>
                  <input
                    type="text"
                    id="broker_name"
                    className="form-control"
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                    maxLength={190}
                    required={source === "broker"}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="broker_contact" className="form-label">
                    Broker Contact
                  </label>
                  <input
                    type="text"
                    id="broker_contact"
                    className="form-control"
                    value={brokerContact}
                    onChange={(e) => setBrokerContact(e.target.value)}
                    maxLength={60}
                  />
                </div>
              </div>
            </div>

            <div className="erp-field">
              <label htmlFor="remarks" className="form-label">
                Remarks
              </label>
              <textarea
                id="remarks"
                className="form-control"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                maxLength={5000}
              />
            </div>
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required. The
            khatian/dag schedule and the owners are added once the file exists.
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/land/parcels" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {submitting ? "Saving..." : "Create Land File"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
