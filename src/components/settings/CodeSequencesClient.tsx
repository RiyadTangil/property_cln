"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatSequenceCode } from "@/lib/tier0";

export interface SequenceRow {
  id: number;
  key: string;
  label: string;
  prefix: string;
  suffix: string;
  separator: string;
  padding: number;
  nextNumber: number;
  yearInCode: boolean;
  resetYearly: boolean;
}

export default function CodeSequencesClient({
  sequences: initialSequences,
  companyName,
  companyCode,
}: {
  sequences: SequenceRow[];
  companyName: string;
  companyCode: string;
}) {
  const router = useRouter();
  const [sequences, setSequences] = useState<SequenceRow[]>(initialSequences);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  function updateField<K extends keyof SequenceRow>(
    id: number,
    field: K,
    value: SequenceRow[K]
  ) {
    setSequences((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
    if (savedId === id) setSavedId(null);
  }

  async function saveSequence(e: FormEvent, seq: SequenceRow) {
    e.preventDefault();
    setSavingId(seq.id);
    setSavedId(null);
    try {
      const res = await fetch("/api/settings/code-sequences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: seq.id,
          label: seq.label,
          prefix: seq.prefix,
          suffix: seq.suffix,
          separator: seq.separator,
          padding: seq.padding,
          next_number: seq.nextNumber,
          year_in_code: seq.yearInCode,
          reset_yearly: seq.resetYearly,
        }),
      });
      if (res.ok) {
        setSavedId(seq.id);
        router.refresh();
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="container erp-container-form">
      <div className="erp-pagehead">
        <div className="erp-pagehead-main">
          <div className="erp-pagehead-icon">
            <i className="fa-solid fa-hashtag"></i>
          </div>
          <div>
            <h1>Code Generators</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/dashboard">Home</Link>
                </li>
                <li className="breadcrumb-item">Settings</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Code Generators
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <div className="erp-context-banner">
        <span className="erp-context-banner-icon">
          <i className="fa-solid fa-building-columns"></i>
        </span>
        <div className="erp-context-banner-body">
          <strong>{companyName}</strong>
          <span>
            These formats apply to {companyCode} — switch companies from the top bar to configure another.
          </span>
        </div>
      </div>

      {sequences.map((seq) => {
        const preview = formatSequenceCode(seq);
        return (
          <section key={seq.id} className="erp-card">
            <form
              onSubmit={(e) => saveSequence(e, seq)}
              className="erp-form"
              noValidate
            >
              <div className="erp-section-head">
                <div className="erp-section-icon">
                  <i className="fa-solid fa-hashtag"></i>
                </div>
                <div>
                  <h2>{seq.label}</h2>
                  <p>
                    How {seq.label.toLowerCase()}s are numbered. Next code:{" "}
                    <strong>{preview}</strong>
                  </p>
                </div>
              </div>

              <div className="erp-card-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="erp-field">
                      <label className="form-label">Label</label>
                      <input
                        type="text"
                        className="form-control"
                        value={seq.label}
                        onChange={(e) => updateField(seq.id, "label", e.target.value)}
                        maxLength={80}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label className="form-label">Prefix</label>
                      <input
                        type="text"
                        className="form-control"
                        value={seq.prefix}
                        onChange={(e) =>
                          updateField(seq.id, "prefix", e.target.value.toUpperCase())
                        }
                        maxLength={12}
                        placeholder="EMP"
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label className="form-label">Suffix</label>
                      <input
                        type="text"
                        className="form-control"
                        value={seq.suffix}
                        onChange={(e) => updateField(seq.id, "suffix", e.target.value)}
                        maxLength={12}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label className="form-label">Separator</label>
                      <input
                        type="text"
                        className="form-control"
                        value={seq.separator}
                        onChange={(e) => updateField(seq.id, "separator", e.target.value)}
                        maxLength={4}
                        placeholder="-"
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label className="form-label">Number Padding</label>
                      <input
                        type="number"
                        className="form-control"
                        value={seq.padding}
                        onChange={(e) =>
                          updateField(seq.id, "padding", Number(e.target.value) || 4)
                        }
                        min={1}
                        max={10}
                        required
                      />
                      <span className="erp-help">Zeros, e.g. 4 → 0001.</span>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="erp-field">
                      <label className="form-label">Next Number</label>
                      <input
                        type="number"
                        className="form-control"
                        value={seq.nextNumber}
                        onChange={(e) =>
                          updateField(seq.id, "nextNumber", Number(e.target.value) || 1)
                        }
                        min={1}
                        max={99999999}
                        required
                      />
                      <span className="erp-help">Can only move forward.</span>
                    </div>
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <div className="erp-code-preview-box">
                      <small>Preview</small>
                      <strong>{preview}</strong>
                    </div>
                  </div>
                </div>

                <div className="erp-switch-row">
                  <div>
                    <h6>Include the year</h6>
                    <p>Weaves the current year into the code, e.g. PRJ-2026-001.</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      role="switch"
                      checked={seq.yearInCode}
                      onChange={(e) =>
                        updateField(seq.id, "yearInCode", e.target.checked)
                      }
                    />
                  </div>
                </div>

                <div className="erp-switch-row">
                  <div>
                    <h6>Restart each year</h6>
                    <p>Resets the counter to 1 when the year rolls over. Best paired with the year above.</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      role="switch"
                      checked={seq.resetYearly}
                      onChange={(e) =>
                        updateField(seq.id, "resetYearly", e.target.checked)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="erp-form-bar">
                <span className="erp-form-bar-note">
                  {savedId === seq.id ? (
                    <span className="text-success fw-semibold">
                      <i className="fa-solid fa-check me-1"></i>Saved format
                    </span>
                  ) : (
                    <>Key: <code>{seq.key}</code></>
                  )}
                </span>
                <div className="erp-form-bar-actions">
                  <button
                    type="submit"
                    className="btn btn-erp"
                    disabled={savingId === seq.id}
                  >
                    <i className="fa-solid fa-floppy-disk me-2"></i>
                    {savingId === seq.id ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </section>
        );
      })}
    </div>
  );
}
