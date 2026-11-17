"use client";

import React from "react";
import Link from "next/link";

export default function ProfileTabs({
  active,
}: {
  active: "profile" | "preferences" | "security";
}) {
  return (
    <nav className="erp-profile-tabs" aria-label="Profile sections">
      <Link
        href="/profile"
        className={`erp-profile-tab${active === "profile" ? " is-active" : ""}`}
        aria-current={active === "profile" ? "page" : undefined}
      >
        <i className="fa-solid fa-user"></i>My Profile
      </Link>
      <Link
        href="/profile/preferences"
        className={`erp-profile-tab${active === "preferences" ? " is-active" : ""}`}
        aria-current={active === "preferences" ? "page" : undefined}
      >
        <i className="fa-solid fa-sliders"></i>Preferences
      </Link>
      <Link
        href="/profile/security"
        className={`erp-profile-tab${active === "security" ? " is-active" : ""}`}
        aria-current={active === "security" ? "page" : undefined}
      >
        <i className="fa-solid fa-shield-halved"></i>Security
      </Link>
    </nav>
  );
}
