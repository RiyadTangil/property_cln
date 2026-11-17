"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "forgot">("login");
  const [login, setLogin] = useState("admin@ehishabi.com");
  const [password, setPassword] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!login.trim() || !password) {
      setError("Please enter both your username/email and password.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password, remember }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sign in failed.");
        setSubmitting(false);
        return;
      }
      router.push(data.redirectTo || "/land/parcels");
      router.refresh();
    } catch {
      setError("Network error while signing in.");
      setSubmitting(false);
    }
  }

  return (
    <div className="nk-auth-wrapper erp-auth">
      <div className="nk-auth-brand">
        <div className="nk-auth-brand-inner">
          <h1>Run your developments end to end.</h1>
          <p>
            One platform for projects, unit inventory, bookings, collections and
            accounts &mdash; with every branch and fiscal year in the same ledger.
          </p>

          <div className="nk-auth-features">
            <div className="nk-auth-feature">
              <i className="fa-solid fa-city"></i>
              <span>Project &amp; Unit Inventory Control</span>
            </div>
            <div className="nk-auth-feature">
              <i className="fa-solid fa-file-signature"></i>
              <span>Bookings, Agreements &amp; Payment Plans</span>
            </div>
            <div className="nk-auth-feature">
              <i className="fa-solid fa-hand-holding-dollar"></i>
              <span>Collections, Ageing &amp; Receivables</span>
            </div>
            <div className="nk-auth-feature">
              <i className="fa-solid fa-shield-halved"></i>
              <span>Role-based Access &amp; Full Audit Trail</span>
            </div>
          </div>

          <div className="erp-auth-modules">
            <span>CRM</span>
            <span>Sales</span>
            <span>Finance</span>
            <span>Procurement</span>
            <span>HR</span>
            <span>Reports</span>
          </div>
        </div>
      </div>

      <div className="nk-auth-form-panel">
        <div
          className={`nk-auth-card ${view === "login" ? "toggled" : ""}`}
          id="l-login"
          style={{ display: view === "login" ? "block" : "none" }}
        >
          <div className="erp-auth-mark">
            <img src="/brand/erp-logo.jpg" alt="e-Hishabi ERP" />
          </div>

          <span className="erp-auth-secure">
            <i className="fa-solid fa-shield-halved"></i>Private &amp; audited access
          </span>

          <div className="nk-auth-card-header">
            <h2>Sign In</h2>
            <p>Use your e-Hishabi ERP credentials to continue.</p>
          </div>

          <form className="nk-auth-form" onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="login" className="form-label">
                Username or Email
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fa-solid fa-user"></i>
                </span>
                <input
                  type="text"
                  className={`form-control ${error ? "is-invalid" : ""}`}
                  id="login"
                  name="login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
              {error && <div className="invalid-feedback d-block">{error}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fa-solid fa-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-group-text nk-toggle-password"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="remember">
                  Keep me signed in
                </label>
              </div>
              <a
                href="#forgot"
                className="nk-auth-link"
                onClick={(e) => {
                  e.preventDefault();
                  setView("forgot");
                }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 nk-auth-btn"
              disabled={submitting}
            >
              <i className="fa-solid fa-arrow-right-to-bracket me-2"></i>
              {submitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="erp-auth-note">
            <strong>Access is provisioned by your administrator.</strong>
            Accounts are tied to a company, branch and role &mdash; there is no public sign-up.
          </div>

          <div className="nk-auth-footer">
            <p>
              Trouble signing in?{" "}
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  setView("forgot");
                }}
              >
                Get help
              </a>
            </p>
          </div>
        </div>

        <div
          className={`nk-auth-card ${view === "forgot" ? "toggled" : ""}`}
          id="l-forget-password"
          style={{ display: view === "forgot" ? "block" : "none" }}
        >
          <div className="nk-auth-card-header">
            <h2>Account Recovery</h2>
            <p>Password resets for e-Hishabi ERP are handled by your system administrator.</p>
          </div>

          <ul className="erp-list border rounded" style={{ ["--erp-line" as string]: "#e9edf2" }}>
            <li>
              <div className="d-flex align-items-start gap-3">
                <i className="fa-solid fa-headset mt-1" style={{ color: "var(--erp-primary)" }}></i>
                <div>
                  <strong className="d-block" style={{ fontSize: "14px" }}>
                    Contact the IT service desk
                  </strong>
                  <span className="text-muted" style={{ fontSize: "13px" }}>
                    Raise a ticket and your credentials will be reset after identity verification.
                  </span>
                </div>
              </div>
            </li>
            <li>
              <div className="d-flex align-items-start gap-3">
                <i className="fa-solid fa-id-badge mt-1" style={{ color: "var(--erp-info)" }}></i>
                <div>
                  <strong className="d-block" style={{ fontSize: "14px" }}>
                    Have your employee ID ready
                  </strong>
                  <span className="text-muted" style={{ fontSize: "13px" }}>
                    Resets are logged against your user in the audit trail.
                  </span>
                </div>
              </div>
            </li>
            <li>
              <div className="d-flex align-items-start gap-3">
                <i className="fa-solid fa-lock mt-1" style={{ color: "var(--erp-warning)" }}></i>
                <div>
                  <strong className="d-block" style={{ fontSize: "14px" }}>
                    Locked out after failed attempts?
                  </strong>
                  <span className="text-muted" style={{ fontSize: "13px" }}>
                    Accounts unlock automatically after 60 seconds.
                  </span>
                </div>
              </div>
            </li>
          </ul>

          <div className="nk-auth-footer mt-4">
            <p>
              Remembered your password?{" "}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  setView("login");
                }}
              >
                Back to Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
