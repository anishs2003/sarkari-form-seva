"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

const navigation = [
  ["Home", "/", "nav-home"],
  ["Latest Job", "/notifications?category=jobs", "nav-jobs"],
  ["New Forms", "/new-forms", "nav-new-forms"],
  ["Admit Card", "/notifications?category=Admit%20Card", "nav-admit"],
  ["Results", "/notifications?category=Results", "nav-results"],
  ["Admission", "/notifications?category=admission", "nav-admission"],
  ["Scholarship", "/notifications?category=Scholarship", "nav-scholarship"],
  ["Answer Key", "/notifications?category=Answer%20Key", "nav-answer"],
  ["Syllabus", "/notifications?category=Syllabus", "nav-syllabus"],
  ["Important", "/#important", "nav-important"],
];

export function SiteShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="site-frame">
      <header className="site-header">
        <div className="portal-container">
          <div className="brand-row">
            <Link href="/" className="brand-lockup" aria-label="Sarkari Form Seva home">
              <span className="brand-mark" aria-hidden="true"><span>SF</span></span>
            </Link>
            <div className="brand-copy">
              <strong>SARKARI FORM SEVA</strong>
              <small>Government Jobs • Results • Admit Card • Forms</small>
            </div>
            <div className="header-actions">
              <Link href="/#portal-search" className="header-search" aria-label="Search the portal" title="Search">⌕</Link>
              <Link href="/admin" className="admin-shortcut">Admin Panel</Link>
              <button
                type="button"
                className="menu-toggle"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-controls="primary-navigation"
                aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                <span /><span /><span />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="secondary-navigation" aria-label="Main navigation">
        <div id="primary-navigation" className={`portal-container secondary-nav-inner${menuOpen ? " is-open" : ""}`}>
          {navigation.map(([label, href, colorClass]) => (
            <Link
              key={label}
              href={href}
              className={`${colorClass} ${label === "Home" ? "active" : ""}`.trim()}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <details className="more-menu">
            <summary>More <span aria-hidden="true">▾</span></summary>
            <div className="more-menu-list">
              <Link href="/notifications" onClick={() => setMenuOpen(false)}>All Notifications</Link>
              <Link href="/apply-through-us" onClick={() => setMenuOpen(false)}>Apply Through Us</Link>
              <Link href="/track-application" onClick={() => setMenuOpen(false)}>Application Status</Link>
              <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
            </div>
          </details>
        </div>
      </nav>

      {children}

      <footer className="site-footer">
        <div className="portal-container footer-grid">
          <div className="footer-brand">
            <strong>Sarkari Form Seva</strong>
            <p>Independent information and student form-filling support.</p>
          </div>
          <div>
            <h2>Quick Links</h2>
            <Link href="/notifications?category=jobs">Latest Jobs</Link>
            <Link href="/notifications?category=Results">Results</Link>
            <Link href="/notifications?category=Admit%20Card">Admit Card</Link>
            <Link href="/notifications?category=Scholarship">Scholarship</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <h2>Important</h2>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-conditions">Terms</Link>
            <Link href="/refund-policy">Refund Policy</Link>
            <Link href="/terms-conditions#disclaimer">Disclaimer</Link>
          </div>
          <div>
            <h2>Contact</h2>
            <a href="tel:+917091670016">+91 7091670016</a>
            <a href="mailto:anishsingh@outlook.in">anishsingh@outlook.in</a>
          </div>
          <p className="footer-disclaimer">This website is an independent information and form-filling service and is not affiliated with any government department unless explicitly stated.</p>
        </div>
      </footer>
    </div>
  );
}
