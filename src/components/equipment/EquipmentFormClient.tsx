"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EquipmentSubmenu } from "./EquipmentSubmenu";

interface CategoryOpt {
  id: number;
  name: string;
}

interface ProjectOpt {
  id: number;
  code: string;
  name: string;
}

interface InitialEq {
  id: number;
  code: string;
  name: string;
  equipmentClass: string;
  categoryId: number | null;
  make: string | null;
  model: string | null;
  yearOfManufacture: number | null;
  serialNo: string | null;
  fuelType: string;
  registrationNo: string | null;
  ownershipType: string;
  acquiredOn: string | null;
  acquisitionCost: number;
  rateBasis: string;
  internalHourlyRate: number;
  internalDailyRate: number;
  meterType: string;
  currentHourMeter: number;
  currentOdometer: number;
  custodianName: string | null;
  operatorName: string | null;
  currentLocation: string | null;
  projectId: number | null;
  status: string;
  remarks: string | null;
}

export function EquipmentFormClient({
  categories,
  projects: _projects,
  initial,
}: {
  categories: CategoryOpt[];
  projects: ProjectOpt[];
  initial?: InitialEq;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    equipment_class: initial?.equipmentClass
      ? ["vehicle", "transport"].includes(initial.equipmentClass)
        ? "vehicle"
        : ["tool", "light_tools"].includes(initial.equipmentClass)
          ? "tool"
          : "plant"
      : "plant",
    equipment_category_id: initial?.categoryId ? String(initial.categoryId) : categories[0]?.id ? String(categories[0].id) : "",
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    make: initial?.make ?? "",
    model: initial?.model ?? "",
    year_of_manufacture: initial?.yearOfManufacture ? String(initial.yearOfManufacture) : "",
    serial_no: initial?.serialNo ?? "",
    capacity: "",
    capacity_unit: "",
    fuel_type: initial?.fuelType ?? "diesel",
    tank_capacity: isEdit ? "400.00" : "",
    registration_no: initial?.registrationNo ?? "",
    chassis_no: "",
    engine_no: "",
    ownership_type: initial?.ownershipType ?? "owned",
    supplier_id: "",
    acquired_on: initial?.acquiredOn ?? "",
    acquisition_cost: initial?.acquisitionCost ? String(initial.acquisitionCost) : "",
    depreciation_method: "straight_line",
    useful_life_years: isEdit ? "8" : "",
    salvage_value: isEdit && initial?.acquisitionCost ? String(Math.round(initial.acquisitionCost * 0.1)) : "",
    depreciation_start_date: initial?.acquiredOn ?? "",
    lifetime_units: "",
    post_acquisition: false,
    rate_basis: initial?.rateBasis ?? "hourly",
    internal_hourly_rate: initial?.internalHourlyRate ? String(initial.internalHourlyRate) : "",
    internal_daily_rate: initial?.internalDailyRate ? String(initial.internalDailyRate) : "",
    market_hourly_rate: isEdit ? "3400.00" : "",
    meter_type: initial?.meterType ?? "hours",
    current_hour_meter: initial?.currentHourMeter ? String(initial.currentHourMeter) : "",
    current_odometer: initial?.currentOdometer ? String(initial.currentOdometer) : "",
    custodian_employee_id: "",
    operator_employee_id: "",
    custodian_name: initial?.custodianName ?? "",
    operator_name: initial?.operatorName ?? "",
    current_location: initial?.currentLocation ?? "Central yard",
    project_id: initial?.projectId ? String(initial.projectId) : "",
    status: initial?.status ?? "available",
    is_bulk: false,
    quantity: "1",
    quantity_unit: "",
    remarks: initial?.remarks ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const url = isEdit ? `/api/equipment/register/${initial!.id}` : "/api/equipment/register";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save equipment");
      router.push(isEdit ? `/equipment/register/${initial!.id}` : "/equipment/register");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container ">
      <EquipmentSubmenu />

      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className={isEdit ? "fa-solid fa-tractor" : "fa-solid fa-plus"} />
          </div>
          <div>
            <h1>{isEdit ? `${initial!.code} — ${initial!.name}` : "Add Equipment"}</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/equipment">Equipment</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/equipment/register">Register</Link>
                </li>
                {isEdit ? (
                  <>
                    <li className="breadcrumb-item">
                      <Link href={`/equipment/register/${initial!.id}`}>{initial!.code}</Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Edit
                    </li>
                  </>
                ) : (
                  <li className="breadcrumb-item active" aria-current="page">
                    New
                  </li>
                )}
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href={isEdit ? `/equipment/register/${initial!.id}` : "/equipment/register"} className="btn btn-erp-ghost">
            <i className="fa-solid fa-arrow-left me-2" />
            Back
          </Link>
        </div>
      </div>

      <div className="erp-card">
        <form method="POST" action={isEdit ? `/equipment/register/${initial!.id}` : "/equipment/register"} noValidate onSubmit={handleSubmit}>
          {isEdit && <input type="hidden" name="_method" value="PUT" />}
          <div className="erp-card-body">
            {error && <div className="alert alert-danger mb-3">{error}</div>}
            <div className="erp-form" data-equipment-form>
              <fieldset className="erp-fieldset">
                <legend>
                  <i className="fa-solid fa-tag me-2" />
                  What it is
                </legend>

                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="equipment_class">
                      Class <span className="text-danger">*</span>
                    </label>
                    <select
                      id="equipment_class"
                      name="equipment_class"
                      className="form-select"
                      required
                      data-class-picker
                      value={form.equipment_class}
                      onChange={(e) => setForm({ ...form, equipment_class: e.target.value })}
                    >
                      <option value="plant">Plant &amp; Machinery</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="tool">Tools &amp; Scaffolding</option>
                    </select>
                    <div className="form-text">Vehicles carry a plate and run on kilometres; plant runs on hours.</div>
                  </div>

                  <div className="col-md-5">
                    <label className="form-label" htmlFor="equipment_category_id">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      id="equipment_category_id"
                      name="equipment_category_id"
                      className="form-select"
                      required
                      data-select2
                      data-placeholder="Choose a category"
                      value={form.equipment_category_id}
                      onChange={(e) => setForm({ ...form, equipment_category_id: e.target.value })}
                    >
                      <option value=""></option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <div className="form-text" data-category-hint>
                      Rates, service intervals and useful life are inherited from the category.
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label" htmlFor="code">
                      Equipment code
                    </label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      className="form-control"
                      maxLength={40}
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value })}
                      placeholder="Allocated automatically"
                    />
                    <div className="form-text">Leave blank to take the next code in the sequence.</div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="name">
                      Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      required
                      maxLength={160}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Komatsu PC210 Excavator"
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="make">
                      Make
                    </label>
                    <input
                      type="text"
                      id="make"
                      name="make"
                      className="form-control"
                      maxLength={100}
                      value={form.make}
                      onChange={(e) => setForm({ ...form, make: e.target.value })}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="model">
                      Model
                    </label>
                    <input
                      type="text"
                      id="model"
                      name="model"
                      className="form-control"
                      maxLength={100}
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label" htmlFor="year_of_manufacture">
                      Year
                    </label>
                    <input
                      type="number"
                      id="year_of_manufacture"
                      name="year_of_manufacture"
                      className="form-control"
                      min="1950"
                      max="2027"
                      value={form.year_of_manufacture}
                      onChange={(e) => setForm({ ...form, year_of_manufacture: e.target.value })}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="serial_no">
                      Serial number
                    </label>
                    <input
                      type="text"
                      id="serial_no"
                      name="serial_no"
                      className="form-control"
                      maxLength={100}
                      value={form.serial_no}
                      onChange={(e) => setForm({ ...form, serial_no: e.target.value })}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="capacity">
                      Capacity
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.001"
                        id="capacity"
                        name="capacity"
                        className="form-control"
                        value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      />
                      <input
                        type="text"
                        name="capacity_unit"
                        className="form-control"
                        style={{ maxWidth: 90 }}
                        placeholder="cum"
                        maxLength={20}
                        value={form.capacity_unit}
                        onChange={(e) => setForm({ ...form, capacity_unit: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label" htmlFor="fuel_type">
                      Fuel
                    </label>
                    <select
                      id="fuel_type"
                      name="fuel_type"
                      className="form-select"
                      value={form.fuel_type}
                      onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                    >
                      <option value="">Not fuelled</option>
                      <option value="diesel">Diesel</option>
                      <option value="petrol">Petrol</option>
                      <option value="octane">Octane</option>
                      <option value="cng">CNG</option>
                      <option value="lpg">LPG</option>
                      <option value="electric">Electric</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div className="col-md-2">
                    <label className="form-label" htmlFor="tank_capacity">
                      Tank
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.01"
                        id="tank_capacity"
                        name="tank_capacity"
                        className="form-control"
                        value={form.tank_capacity}
                        onChange={(e) => setForm({ ...form, tank_capacity: e.target.value })}
                      />
                      <span className="input-group-text">L</span>
                    </div>
                    <div className="form-text">Used to catch impossible fuel entries.</div>
                  </div>
                </div>

                <div className={`row g-3 mt-1 ${form.equipment_class === "vehicle" ? "" : "d-none"}`} data-vehicle-only>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="registration_no">
                      Registration number
                    </label>
                    <input
                      type="text"
                      id="registration_no"
                      name="registration_no"
                      className="form-control"
                      maxLength={40}
                      value={form.registration_no}
                      onChange={(e) => setForm({ ...form, registration_no: e.target.value })}
                      placeholder="DHK-METRO-TA-11-2244"
                    />
                    <div className="form-text">Fitness, insurance and route permits all hang off this.</div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="chassis_no">
                      Chassis number
                    </label>
                    <input
                      type="text"
                      id="chassis_no"
                      name="chassis_no"
                      className="form-control"
                      maxLength={100}
                      value={form.chassis_no}
                      onChange={(e) => setForm({ ...form, chassis_no: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="engine_no">
                      Engine number
                    </label>
                    <input
                      type="text"
                      id="engine_no"
                      name="engine_no"
                      className="form-control"
                      maxLength={100}
                      value={form.engine_no}
                      onChange={(e) => setForm({ ...form, engine_no: e.target.value })}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="erp-fieldset">
                <legend>
                  <i className="fa-solid fa-file-invoice-dollar me-2" />
                  Ownership and cost
                </legend>

                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="ownership_type">
                      Ownership <span className="text-danger">*</span>
                    </label>
                    <select
                      id="ownership_type"
                      name="ownership_type"
                      className="form-select"
                      required
                      data-ownership
                      value={form.ownership_type}
                      onChange={(e) => setForm({ ...form, ownership_type: e.target.value })}
                    >
                      <option value="owned">Owned</option>
                      <option value="rented">Rented / hired in</option>
                      <option value="leased">Leased</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="supplier_id">
                      Supplier / owner
                    </label>
                    <select
                      id="supplier_id"
                      name="supplier_id"
                      className="form-select"
                      data-select2
                      data-placeholder="None"
                      value={form.supplier_id}
                      onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                    >
                      <option value=""></option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="acquired_on">
                      Acquired on
                    </label>
                    <input
                      type="date"
                      id="acquired_on"
                      name="acquired_on"
                      className="form-control"
                      value={form.acquired_on}
                      onChange={(e) => setForm({ ...form, acquired_on: e.target.value })}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="acquisition_cost">
                      Acquisition cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="acquisition_cost"
                      name="acquisition_cost"
                      className="form-control"
                      value={form.acquisition_cost}
                      onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
                    />
                  </div>
                </div>

                <div className={`row g-3 mt-1 ${form.ownership_type === "owned" ? "" : "d-none"}`} data-owned-only>
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="depreciation_method">
                      Depreciation method
                    </label>
                    <select
                      id="depreciation_method"
                      name="depreciation_method"
                      className="form-select"
                      data-depreciation-method
                      value={form.depreciation_method}
                      onChange={(e) => setForm({ ...form, depreciation_method: e.target.value })}
                    >
                      <option value="straight_line">Straight line</option>
                      <option value="reducing_balance">Reducing balance</option>
                      <option value="units_of_production">Units of production (metered)</option>
                    </select>
                    <div className="form-text" data-method-hint />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label" htmlFor="useful_life_years">
                      Useful life
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        id="useful_life_years"
                        name="useful_life_years"
                        className="form-control"
                        value={form.useful_life_years}
                        onChange={(e) => setForm({ ...form, useful_life_years: e.target.value })}
                      />
                      <span className="input-group-text">yr</span>
                    </div>
                  </div>

                  <div className="col-md-2">
                    <label className="form-label" htmlFor="salvage_value">
                      Residual value
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="salvage_value"
                      name="salvage_value"
                      className="form-control"
                      value={form.salvage_value}
                      onChange={(e) => setForm({ ...form, salvage_value: e.target.value })}
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label" htmlFor="depreciation_start_date">
                      Depreciate from
                    </label>
                    <input
                      type="date"
                      id="depreciation_start_date"
                      name="depreciation_start_date"
                      className="form-control"
                      value={form.depreciation_start_date}
                      onChange={(e) => setForm({ ...form, depreciation_start_date: e.target.value })}
                    />
                  </div>

                  <div className={`col-md-3 ${form.depreciation_method === "units_of_production" ? "" : "d-none"}`} data-lifetime-units>
                    <label className="form-label" htmlFor="lifetime_units">
                      Expected lifetime
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="lifetime_units"
                        name="lifetime_units"
                        className="form-control"
                        value={form.lifetime_units}
                        onChange={(e) => setForm({ ...form, lifetime_units: e.target.value })}
                      />
                      <span className="input-group-text" data-lifetime-unit>
                        hr
                      </span>
                    </div>
                    <div className="form-text">Total hours or kilometres this machine should do in its life.</div>
                  </div>

                  {!isEdit && (
                    <div className="col-12">
                      <label className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          name="post_acquisition"
                          value="1"
                          checked={form.post_acquisition}
                          onChange={(e) => setForm({ ...form, post_acquisition: e.target.checked })}
                        />
                        <span className="form-check-label">
                          Post the purchase to the accounts now
                          <span className="erp-identity-meta d-block">
                            Only tick this if you are buying the machine now. A machine being
                            back-loaded onto the register had its purchase posted years ago, and
                            posting it again would create an asset the company acquired twice.
                          </span>
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </fieldset>

              <fieldset className="erp-fieldset">
                <legend>
                  <i className="fa-solid fa-coins me-2" />
                  What it charges a project
                </legend>

                <div className="erp-callout">
                  <i className="fa-solid fa-circle-info me-1" />
                  <span>
                    This is the rate that moves plant cost out of the yard and onto a job. Without it,
                    hours can be logged but nothing reaches the project, and the machine quietly becomes
                    an overhead.
                  </span>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="rate_basis">
                      Charged by
                    </label>
                    <select
                      id="rate_basis"
                      name="rate_basis"
                      className="form-select"
                      value={form.rate_basis}
                      onChange={(e) => setForm({ ...form, rate_basis: e.target.value })}
                    >
                      <option value="hourly">Per hour</option>
                      <option value="daily">Per day</option>
                      <option value="monthly">Per month</option>
                      <option value="kilometre">Per kilometre</option>
                      <option value="trip">Per trip</option>
                      <option value="lumpsum">Lump sum</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="internal_hourly_rate">
                      Hourly rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="internal_hourly_rate"
                      name="internal_hourly_rate"
                      className="form-control"
                      data-rate-hourly
                      value={form.internal_hourly_rate}
                      onChange={(e) => setForm({ ...form, internal_hourly_rate: e.target.value })}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="internal_daily_rate">
                      Daily rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="internal_daily_rate"
                      name="internal_daily_rate"
                      className="form-control"
                      data-rate-daily
                      value={form.internal_daily_rate}
                      onChange={(e) => setForm({ ...form, internal_daily_rate: e.target.value })}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="market_hourly_rate">
                      Market hire rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="market_hourly_rate"
                      name="market_hourly_rate"
                      className="form-control"
                      value={form.market_hourly_rate}
                      onChange={(e) => setForm({ ...form, market_hourly_rate: e.target.value })}
                    />
                    <div className="form-text">What a hire company would charge. Enables the own-vs-hire report.</div>
                  </div>
                </div>
              </fieldset>

              <fieldset className="erp-fieldset">
                <legend>
                  <i className="fa-solid fa-gauge me-2" />
                  Metering and location
                </legend>

                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label" htmlFor="meter_type">
                      Meter
                    </label>
                    <select
                      id="meter_type"
                      name="meter_type"
                      className="form-select"
                      data-meter-type
                      value={form.meter_type}
                      onChange={(e) => setForm({ ...form, meter_type: e.target.value })}
                    >
                      <option value="hours">Hour meter</option>
                      <option value="odometer">Odometer</option>
                      <option value="both">Hours and odometer</option>
                      <option value="none">Not metered</option>
                    </select>
                  </div>

                  {isEdit ? (
                    <div className="col-md-6">
                      <div className="erp-callout">
                        <i className="fa-solid fa-lock me-1" />
                        <span>
                          Meters read {(initial?.currentHourMeter ?? 0).toLocaleString()} hr /{" "}
                          {(initial?.currentOdometer ?? 0).toLocaleString()} km. They are changed
                          by recording a reading, not by editing this form — an edit here would
                          silently restate every efficiency figure and service date behind it.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="col-md-3">
                        <label className="form-label" htmlFor="current_hour_meter">
                          Opening hour meter
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          id="current_hour_meter"
                          name="current_hour_meter"
                          className="form-control"
                          value={form.current_hour_meter}
                          onChange={(e) => setForm({ ...form, current_hour_meter: e.target.value })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label" htmlFor="current_odometer">
                          Opening odometer
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          id="current_odometer"
                          name="current_odometer"
                          className="form-control"
                          value={form.current_odometer}
                          onChange={(e) => setForm({ ...form, current_odometer: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="custodian_employee_id">
                      Custodian
                    </label>
                    <select
                      id="custodian_employee_id"
                      name="custodian_employee_id"
                      className="form-select"
                      data-select2
                      data-placeholder="Nobody"
                      value={form.custodian_employee_id}
                      onChange={(e) => setForm({ ...form, custodian_employee_id: e.target.value, custodian_name: e.target.value })}
                    >
                      <option value=""></option>
                      <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                      <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label" htmlFor="operator_employee_id">
                      Usual operator
                    </label>
                    <select
                      id="operator_employee_id"
                      name="operator_employee_id"
                      className="form-select"
                      data-select2
                      data-placeholder="Nobody"
                      value={form.operator_employee_id}
                      onChange={(e) => setForm({ ...form, operator_employee_id: e.target.value, operator_name: e.target.value })}
                    >
                      <option value=""></option>
                      <option value="MD. GOLAM RABBANY RONY">MD. GOLAM RABBANY RONY</option>
                      <option value="Muhamma Arif Al Imran">Muhamma Arif Al Imran</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="current_location">
                      Current location
                    </label>
                    <input
                      type="text"
                      id="current_location"
                      name="current_location"
                      className="form-control"
                      maxLength={190}
                      value={form.current_location}
                      onChange={(e) => setForm({ ...form, current_location: e.target.value })}
                      placeholder="Central yard"
                    />
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-3">
                    <label className="form-check mt-4">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        name="is_bulk"
                        value="1"
                        data-bulk-toggle
                        checked={form.is_bulk}
                        onChange={(e) => setForm({ ...form, is_bulk: e.target.checked })}
                      />
                      <span className="form-check-label">Counted in bulk</span>
                    </label>
                    <div className="form-text">Scaffolding, props, shuttering — issued in part, not as a whole.</div>
                  </div>
                  <div className={`col-md-3 ${form.is_bulk ? "" : "d-none"}`} data-bulk-fields>
                    <label className="form-label" htmlFor="quantity">
                      Quantity in the set
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        id="quantity"
                        name="quantity"
                        className="form-control"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      />
                      <input
                        type="text"
                        name="quantity_unit"
                        className="form-control"
                        style={{ maxWidth: 100 }}
                        placeholder="pcs"
                        maxLength={20}
                        value={form.quantity_unit}
                        onChange={(e) => setForm({ ...form, quantity_unit: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </fieldset>

              <fieldset className="erp-fieldset">
                <legend>
                  <i className="fa-solid fa-note-sticky me-2" />
                  Notes
                </legend>
                <textarea
                  name="remarks"
                  className="form-control"
                  rows={3}
                  maxLength={2000}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Anything worth knowing about this machine"
                />
              </fieldset>
            </div>
          </div>
          <div className="erp-card-foot d-flex justify-content-end gap-2">
            <Link href={isEdit ? `/equipment/register/${initial!.id}` : "/equipment/register"} className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" data-submit-button disabled={busy}>
              <i className="fa-solid fa-check me-2" />
              {isEdit ? "Save changes" : "Add to register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
