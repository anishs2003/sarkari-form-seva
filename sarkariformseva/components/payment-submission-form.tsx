"use client";

import { useState, type FormEvent } from "react";

export function PaymentSubmissionForm({ applicationId, applicationCode, slug, initialAmount, maxScreenshotSizeMb, disabled = false }: { applicationId: string; applicationCode: string; slug: string; initialAmount: string; maxScreenshotSizeMb: number; disabled?: boolean }) {
  const [amount, setAmount] = useState(initialAmount);
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!slug) {
      setError("Select a form before submitting payment details.");
      return;
    }
    if (!screenshot) {
      setError("Upload a payment screenshot to submit for verification.");
      return;
    }
    if (screenshot.size > maxScreenshotSizeMb * 1024 * 1024) {
      setError(`Screenshot must be ${maxScreenshotSizeMb} MB or smaller.`);
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.set("applicationId", applicationId);
      data.set("slug", slug);
      data.set("amount", amount);
      data.set("utrNumber", utrNumber.trim());
      data.set("screenshot", screenshot);
      const response = await fetch("/api/payments", { method: "POST", body: data });
      const result = await response.json() as { error?: string; status?: string };
      if (!response.ok) {
        setError(result.error || "Payment details could not be submitted.");
        return;
      }
      setStatus(result.status || "verification-pending");
    } catch {
      setError("Could not submit payment details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status) {
    return <div className="payment-pending" role="status"><strong>Application {applicationCode} submitted.</strong><p>Payment Verification Pending. An admin will manually verify the amount, UTR, and screenshot.</p></div>;
  }
  if (disabled) return <p className="payment-pending" role="status">Application {applicationCode} already has payment under review. You do not need to submit payment details again.</p>;

  return (
    <form onSubmit={submitPayment} className="payment-submission-form">
      <label>Amount paid (service charge)<input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter amount paid" /></label>
      <label>UTR / Transaction ID<input required minLength={6} maxLength={120} value={utrNumber} onChange={(event) => setUtrNumber(event.target.value)} placeholder="Enter your transaction reference" /></label>
      <label>Payment screenshot<input required type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)} /></label>
      <p className="payment-caption">Screenshot upload submits proof for review only. It does not confirm or automatically approve payment.</p>
      {error && <p className="wizard-error" role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit for verification"}</button>
    </form>
  );
}
