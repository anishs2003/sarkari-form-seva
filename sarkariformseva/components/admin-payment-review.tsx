"use client";

import { useState } from "react";
import Link from "next/link";

type PaymentItem = {
  id: string;
  amount: number | string;
  utr_number: string | null;
  payment_status: string;
  form_slug: string | null;
  form_title: string | null;
  service_charge: string | null;
  official_application_fee: string | null;
  created_at: string;
  screenshot_url: string;
};

export function AdminPaymentReview() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadPayments() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/payments", { cache: "no-store" });
      const result = await response.json() as { error?: string; items?: PaymentItem[] };
      if (!response.ok) {
        setMessage(result.error || "Could not load payments.");
        return;
      }
      setItems(result.items ?? []);
      setMessage(`${result.items?.length ?? 0} payment${result.items?.length === 1 ? "" : "s"} awaiting verification.`);
    } catch {
      setMessage("Could not reach the payment review service.");
    } finally {
      setBusy(false);
    }
  }

  async function reviewPayment(id: string, action: "verify" | "reject") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(result.error || "Could not update payment status.");
        return;
      }
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage(action === "verify" ? "Payment manually verified." : "Payment rejected.");
    } catch {
      setMessage("Could not reach the payment review service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">Only signed-in admin or staff accounts can access payment records.</p>
        <button type="button" disabled={busy} onClick={loadPayments} className="rounded-md bg-[#0f4c81] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Loading..." : "Load pending payments"}</button>
      </div>

      {message && <p role="status" className="text-sm text-slate-700">{message} {message.includes("Admin sign-in") && <Link href="/admin/login" className="font-semibold text-[#0f4c81] underline">Sign in</Link>}</p>}

      <div className="space-y-4">
        {items.map((payment) => (
          <article key={payment.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{payment.form_title || payment.form_slug || "Form payment"}</p>
                <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                  <div><dt className="font-semibold">Amount claimed</dt><dd>₹{payment.amount}</dd></div>
                  <div><dt className="font-semibold">UTR / Transaction ID</dt><dd>{payment.utr_number || "Not provided"}</dd></div>
                  <div><dt className="font-semibold">Official Application Fee</dt><dd>{payment.official_application_fee || "Not recorded"}</dd></div>
                  <div><dt className="font-semibold">Service Charge</dt><dd>{payment.service_charge || "Not recorded"}</dd></div>
                  <div><dt className="font-semibold">Submitted</dt><dd>{new Date(payment.created_at).toLocaleString()}</dd></div>
                  <div><dt className="font-semibold">Status</dt><dd>Payment Verification Pending</dd></div>
                </dl>
                {payment.screenshot_url ? <a href={payment.screenshot_url} target="_blank" rel="noreferrer" className="mt-3 inline-block font-semibold text-[#0f4c81] underline">View payment screenshot</a> : <p className="mt-3 text-sm text-amber-700">Screenshot unavailable</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => reviewPayment(payment.id, "verify")} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Verify Payment</button>
                <button type="button" disabled={busy} onClick={() => reviewPayment(payment.id, "reject")} className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Reject Payment</button>
              </div>
            </div>
          </article>
        ))}
        {items.length === 0 && message && !message.startsWith("Could not") && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">No pending payments to review.</p>}
      </div>
    </section>
  );
}
