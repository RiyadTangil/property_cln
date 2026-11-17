"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OWNER_KINDS } from "@/lib/land";

export default function CreateLandOwnerPage() {
  const router = useRouter();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [kind, setKind] = useState("individual");
  const [name, setName] = useState("");
  const [nid, setNid] = useState("");
  const [tin, setTin] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [spouseName, setSpouseName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isMinor, setIsMinor] = useState(false);
  const [isDeceased, setIsDeceased] = useState(false);
  const [guardianName, setGuardianName] = useState("");
  const [guardianNid, setGuardianNid] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [successionCertificateNo, setSuccessionCertificateNo] = useState("");
  const [successionDate, setSuccessionDate] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [village, setVillage] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [policeStation, setPoliceStation] = useState("");
  const [upazila, setUpazila] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [mfsProvider, setMfsProvider] = useState("");
  const [mfsNumber, setMfsNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedKind = OWNER_KINDS.find((k) => k.value === kind) ?? OWNER_KINDS[0];
  const showParentage = selectedKind.parentage;
  const showRegistration = selectedKind.registration;
  const showSuccession = selectedKind.succession || isDeceased;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (showParentage && !fatherName.trim()) {
      setError("Father's Name is required for this party type.");
      return;
    }
    if (showRegistration && !registrationNumber.trim()) {
      setError("Registration / Incorporation No. is required.");
      return;
    }
    if (isMinor && !guardianName.trim()) {
      setError("Guardian Name is required when owner is a minor.");
      return;
    }
    if (showSuccession && !successionCertificateNo.trim()) {
      setError("Succession Certificate No. is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/land/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name,
          nid,
          tin,
          father_name: fatherName,
          mother_name: motherName,
          spouse_name: spouseName,
          registration_number: registrationNumber,
          date_of_birth: dateOfBirth,
          is_minor: isMinor,
          is_deceased: isDeceased,
          guardian_name: guardianName,
          guardian_nid: guardianNid,
          guardian_relation: guardianRelation,
          succession_certificate_no: successionCertificateNo,
          succession_date: successionDate,
          date_of_death: dateOfDeath,
          phone,
          alternate_phone: alternatePhone,
          email,
          address_line1: addressLine1,
          village,
          post_office: postOffice,
          police_station: policeStation,
          upazila,
          district,
          postal_code: postalCode,
          bank_name: bankName,
          bank_branch: bankBranch,
          bank_account_name: bankAccountName,
          bank_account_no: bankAccountNo,
          routing_number: routingNumber,
          mfs_provider: mfsProvider,
          mfs_number: mfsNumber,
          notes,
          is_active: isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create landowner.");
        setSubmitting(false);
        return;
      }
      router.push("/land/owners");
      router.refresh();
    } catch {
      setError("Network error while creating landowner.");
      setSubmitting(false);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <div>
            <h1>New Landowner</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Land</li>
                <li className="breadcrumb-item">
                  <Link href="/land/owners">Landowners</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  New
                </li>
              </ol>
            </nav>
          </div>
        </div>
        <div className="erp-pagehead-actions">
          <Link href="/land/owners" className="btn btn-erp-ghost">
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
        {/* Identity */}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-address-card"></i>
            </div>
            <div>
              <h2>Identity</h2>
              <p>
                A deed names a person by their parentage &mdash; &ldquo;Md. Rahim, son
                of Late Karim&rdquo; &mdash; so the father&apos;s name is part of the
                legal identity, not an optional extra. One NID is one person: the system
                will not let the same NID be filed twice.
              </p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="erp-photo-field">
              <label className="erp-photo-preview is-passport" title="Add a photo">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Owner preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span className="erp-photo-placeholder">
                    <i className="fa-solid fa-user"></i>
                    <small>Passport photo</small>
                  </span>
                )}
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  className="d-none"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
              <div className="flex-grow-1">
                <label htmlFor="photo" className="form-label">
                  Owner Photograph
                </label>
                <p className="erp-help mb-1">
                  A passport-size portrait, so the person paid at the counter can be
                  matched to the party on the deed. JPG, PNG or WebP up to 2 MB.
                </p>
              </div>
            </div>

            <div className="erp-field">
              <label className="form-label">
                Party Type <span className="erp-required">*</span>
              </label>
              <div className="erp-scope-choices" role="radiogroup" aria-label="Party type">
                {OWNER_KINDS.map((k) => (
                  <label key={k.value} className="erp-scope-choice">
                    <input
                      type="radio"
                      name="kind"
                      value={k.value}
                      checked={kind === k.value}
                      onChange={() => setKind(k.value)}
                    />
                    <span className="erp-scope-choice-body">
                      <i className={`fa-solid ${k.icon}`}></i>
                      <span>
                        <strong>{k.label}</strong>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="name" className="form-label">
                    Full Name <span className="erp-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={190}
                    required
                    placeholder="As written on the khatian"
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="nid" className="form-label">
                    NID
                  </label>
                  <input
                    type="text"
                    id="nid"
                    name="nid"
                    className="form-control"
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    maxLength={40}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="tin" className="form-label">
                    TIN
                  </label>
                  <input
                    type="text"
                    id="tin"
                    className="form-control"
                    value={tin}
                    onChange={(e) => setTin(e.target.value)}
                    maxLength={40}
                  />
                  <small className="text-muted">
                    A seller with no TIN is withheld at a higher rate.
                  </small>
                </div>
              </div>
            </div>

            {showParentage && (
              <div className="row">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="father_name" className="form-label">
                      Father&apos;s Name <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="father_name"
                      name="father_name"
                      className="form-control"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      maxLength={190}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="mother_name" className="form-label">
                      Mother&apos;s Name
                    </label>
                    <input
                      type="text"
                      id="mother_name"
                      className="form-control"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      maxLength={190}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="spouse_name" className="form-label">
                      Spouse&apos;s Name
                    </label>
                    <input
                      type="text"
                      id="spouse_name"
                      className="form-control"
                      value={spouseName}
                      onChange={(e) => setSpouseName(e.target.value)}
                      maxLength={190}
                    />
                  </div>
                </div>
              </div>
            )}

            {showRegistration && (
              <div className="row">
                <div className="col-md-6">
                  <div className="erp-field">
                    <label htmlFor="registration_number" className="form-label">
                      Registration / Incorporation No.{" "}
                      <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="registration_number"
                      className="form-control"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      maxLength={60}
                    />
                    <small className="text-muted">
                      Proves the entity&apos;s authority to sell.
                    </small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="erp-field">
                    <label htmlFor="date_of_birth_entity" className="form-label">
                      Date of Birth / Establishment
                    </label>
                    <input
                      type="date"
                      id="date_of_birth_entity"
                      className="form-control"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Capacity to Execute a Deed */}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div>
              <h2>Capacity to Execute a Deed</h2>
              <p>
                A minor cannot sign &mdash; a guardian does, normally with the court&apos;s
                permission. A deceased owner&apos;s share passes to heirs, who can only
                transfer on a succession certificate. Recording this here stops a file
                reaching the registry office with a signatory who was never able to sign.
              </p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="is_minor"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="is_minor">
                    This owner is a minor
                  </label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="is_deceased"
                    checked={isDeceased}
                    onChange={(e) => setIsDeceased(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="is_deceased">
                    This owner is deceased
                  </label>
                </div>
              </div>
            </div>

            {isMinor && (
              <div className="row">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="guardian_name" className="form-label">
                      Guardian <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="guardian_name"
                      className="form-control"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      maxLength={190}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="guardian_nid" className="form-label">
                      Guardian NID
                    </label>
                    <input
                      type="text"
                      id="guardian_nid"
                      className="form-control"
                      value={guardianNid}
                      onChange={(e) => setGuardianNid(e.target.value)}
                      maxLength={40}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="guardian_relation" className="form-label">
                      Relationship
                    </label>
                    <input
                      type="text"
                      id="guardian_relation"
                      className="form-control"
                      value={guardianRelation}
                      onChange={(e) => setGuardianRelation(e.target.value)}
                      maxLength={60}
                    />
                  </div>
                </div>
              </div>
            )}

            {showSuccession && (
              <div className="row">
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="succession_certificate_no" className="form-label">
                      Succession Certificate No.{" "}
                      <span className="erp-required">*</span>
                    </label>
                    <input
                      type="text"
                      id="succession_certificate_no"
                      className="form-control"
                      value={successionCertificateNo}
                      onChange={(e) => setSuccessionCertificateNo(e.target.value)}
                      maxLength={60}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="erp-field">
                    <label htmlFor="succession_date" className="form-label">
                      Certificate Date
                    </label>
                    <input
                      type="date"
                      id="succession_date"
                      className="form-control"
                      value={successionDate}
                      onChange={(e) => setSuccessionDate(e.target.value)}
                    />
                  </div>
                </div>
                {isDeceased && (
                  <div className="col-md-4">
                    <div className="erp-field">
                      <label htmlFor="date_of_death" className="form-label">
                        Date of Death
                      </label>
                      <input
                        type="date"
                        id="date_of_death"
                        className="form-control"
                        value={dateOfDeath}
                        onChange={(e) => setDateOfDeath(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Contact & Address */}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-location-dot"></i>
            </div>
            <div>
              <h2>Contact &amp; Address</h2>
              <p>The address as it will appear on the deed.</p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="phone" className="form-label">
                    Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={30}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="alternate_phone" className="form-label">
                    Alternate Phone
                  </label>
                  <input
                    type="text"
                    id="alternate_phone"
                    className="form-control"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    maxLength={30}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="erp-field">
                  <label htmlFor="address_line1" className="form-label">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address_line1"
                    className="form-control"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    maxLength={190}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="village" className="form-label">
                    Village
                  </label>
                  <input
                    type="text"
                    id="village"
                    className="form-control"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="post_office" className="form-label">
                    Post Office
                  </label>
                  <input
                    type="text"
                    id="post_office"
                    className="form-control"
                    value={postOffice}
                    onChange={(e) => setPostOffice(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-3">
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
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="upazila" className="form-label">
                    Upazila
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
                  <label htmlFor="district" className="form-label">
                    District
                  </label>
                  <input
                    type="text"
                    id="district"
                    className="form-control"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    maxLength={120}
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
          </div>
        </section>

        {/* Payout Details */}
        <section className="erp-card">
          <div className="erp-section-head">
            <div className="erp-section-icon">
              <i className="fa-solid fa-building-columns"></i>
            </div>
            <div>
              <h2>Payout Details</h2>
              <p>
                Where this seller&apos;s money goes. Held here rather than on each
                voucher so a repeat installment does not re-key an account number.
              </p>
            </div>
          </div>
          <div className="erp-card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="bank_name" className="form-label">
                    Bank
                  </label>
                  <input
                    type="text"
                    id="bank_name"
                    className="form-control"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    maxLength={150}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="bank_branch" className="form-label">
                    Branch
                  </label>
                  <input
                    type="text"
                    id="bank_branch"
                    className="form-control"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    maxLength={150}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="bank_account_name" className="form-label">
                    Account Name
                  </label>
                  <input
                    type="text"
                    id="bank_account_name"
                    className="form-control"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    maxLength={190}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <div className="erp-field">
                  <label htmlFor="bank_account_no" className="form-label">
                    Account No.
                  </label>
                  <input
                    type="text"
                    id="bank_account_no"
                    className="form-control"
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    maxLength={60}
                  />
                </div>
              </div>
              <div className="col-md-2">
                <div className="erp-field">
                  <label htmlFor="routing_number" className="form-label">
                    Routing No.
                  </label>
                  <input
                    type="text"
                    id="routing_number"
                    className="form-control"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    maxLength={40}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="mfs_provider" className="form-label">
                    MFS Provider
                  </label>
                  <input
                    type="text"
                    id="mfs_provider"
                    className="form-control"
                    value={mfsProvider}
                    onChange={(e) => setMfsProvider(e.target.value)}
                    maxLength={40}
                    placeholder="bKash / Nagad"
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="erp-field">
                  <label htmlFor="mfs_number" className="form-label">
                    MFS Number
                  </label>
                  <input
                    type="text"
                    id="mfs_number"
                    className="form-control"
                    value={mfsNumber}
                    onChange={(e) => setMfsNumber(e.target.value)}
                    maxLength={30}
                  />
                </div>
              </div>
            </div>

            <div className="erp-field">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                id="notes"
                className="form-control"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={5000}
              />
            </div>

            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="is_active">
                Active
              </label>
            </div>
          </div>
        </section>

        <div className="erp-form-bar">
          <span className="erp-form-bar-note">
            <i className="fa-solid fa-circle-info me-1"></i>
            Fields marked <span className="erp-required">*</span> are required.
          </span>
          <div className="erp-form-bar-actions">
            <Link href="/land/owners" className="btn btn-erp-ghost">
              Cancel
            </Link>
            <button type="submit" className="btn btn-erp" disabled={submitting}>
              <i className="fa-solid fa-floppy-disk me-2"></i>
              {submitting ? "Saving..." : "Add Landowner"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
