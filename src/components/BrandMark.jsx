import React from "react";

// Plexa DB mark: one hub linked to three databases.
export default function BrandMark({ size = 32, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="8" fill="#0f62fe" />
      <path d="M20 20 L10 11 M20 20 L30 11 M20 20 L20 32" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="20" cy="20" r="5" fill="#ffffff" />
      <circle cx="10" cy="11" r="3.5" fill="#a6c8ff" />
      <circle cx="30" cy="11" r="3.5" fill="#a6c8ff" />
      <circle cx="20" cy="32" r="3.5" fill="#a6c8ff" />
    </svg>
  );
}
