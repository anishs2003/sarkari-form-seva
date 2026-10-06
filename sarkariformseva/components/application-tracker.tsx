"use client";

import { useState, type FormEvent } from "react";
import type { ApplicationSummary } from "@/lib/types";

export function ApplicationTracker({ initialApplicationId }: { initialApplicationId: string }) {
  const [applicationId, setApplicationId] = useState(initialApplicationId);
  const [mobile, setMobile] = useState("");
  const [application, setApplication] = useState<ApplicationSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setApplication(null);
    try {
      const response = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, mobile }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error ?? "Unable to find this application.");
        return;
      }
      setApplication(result.application as ApplicationSummary);
    } catch {
      setError("Could not check status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-main">
      <div className="directory-heading">
        <div><p className="eyebrow">Student services</p><h1>Track your application</h1></div>
      </div>
      <section className="portal-section tracker-panel">
        <div className="portal-section-heading"><h2>Application status lookup</h2></div>
        <form className="tracker-form" onSubmit={checkStatus}>
          <label>Application ID<input required value={applicationId} onChange={(event) => setApplicationId(event.target.value)} placeholder="ASF-2026001" /></label>
          <label>Registered mobile number<input required inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={mobile} onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" /></label>
          <button type="submit" disabled={loading}>{loading ? "Checking..." : "Check Status"}</button>
        </form>
        {error && <p className="tracker-error" role="alert">{error}</p>}
      </section>

      {application && (
        <section className="portal-section tracker-result" aria-live="polite">
          <div className="portal-section-heading"><h2>Application details</h2><span>{application.id}</span></div>
          <dl className="detail-facts">
            <div><dt>Applicant</dt><dd>{application.studentName}</dd></div>
            <div><dt>Service</dt><dd>{application.service}</dd></div>
            <div><dt>Application status</dt><dd>{application.status}</dd></div>
            <div><dt>Payment status</dt><dd>{application.paymentStatus}</dd></div>
            <div><dt>Current step</dt><dd>{application.currentStep}</dd></div>
            <div><dt>Last updated</dt><dd>{application.lastUpdated}</dd></div>
          </dl>
          <p className="tracker-message">{application.adminMessage}</p>
        </section>
      )}
    </main>
  );
}
