"use client";

import { useState } from "react";

type Application = { id: string; application_id?: string; form_title?: string; student_name?: string; student_mobile?: string; student_email?: string; status?: string; payment_status?: string; created_at?: string; admin_message?: string };
type Document = { application_id: string; document_type: string; file_name: string; url: string };
const statuses = ["Payment Verification", "Under Review", "Information Required", "Form Filling In Progress", "Form Submitted", "Completed", "Rejected"];

export function AdminApplicationReview() {
  const [items, setItems] = useState<Application[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/applications", { cache: "no-store" });
      const result = await response.json() as { error?: string; items?: Application[]; documents?: Document[] };
      if (!response.ok) { setMessage(result.error || "Could not load applications."); return; }
      setItems(result.items ?? []); setDocuments(result.documents ?? []); setMessage(`${result.items?.length ?? 0} applications loaded.`);
    } catch { setMessage("Could not reach application review service."); }
    finally { setBusy(false); }
  }
  async function update(application: Application, status: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/applications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: application.id, status }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) { setMessage(result.error || "Could not update application."); return; }
      setItems((current) => current.map((entry) => entry.id === application.id ? { ...entry, status } : entry)); setMessage(`Application moved to ${status}.`);
    } catch { setMessage("Could not reach application review service."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-600">Review submitted student details and securely stored documents. Payment verification is managed separately.</p><button disabled={busy} onClick={load} className="rounded-md bg-[#0f4c81] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Loading..." : "Load applications"}</button></div>
    {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
    {items.map((item) => <article key={item.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold text-slate-900">{item.form_title || "Application"} · {item.student_name || "Student"}</h2><p className="mt-1 text-sm text-slate-600">{item.application_id} · {item.student_mobile} · {item.student_email}</p></div><div className="text-sm"><p>Status: <strong>{item.status}</strong></p><p>Payment: <strong>{item.payment_status}</strong></p></div></div>
      <div className="flex flex-wrap gap-3 text-sm">{documents.filter((doc) => doc.application_id === item.id).map((doc) => doc.url ? <a key={doc.file_name} href={doc.url} target="_blank" rel="noreferrer" className="font-semibold text-[#0f4c81] underline">{doc.document_type}: {doc.file_name}</a> : <span key={doc.file_name}>{doc.document_type}: link unavailable</span>)}</div>
      <div className="flex flex-wrap items-center gap-2"><label className="text-sm font-semibold">Process status <select disabled={busy || item.payment_status !== "Paid"} value={item.status || "Under Review"} onChange={(event) => void update(item, event.target.value)} className="ml-2 rounded-md border border-slate-300 px-3 py-2 font-normal">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>
    </article>)}
    {items.length === 0 && message.includes("loaded") && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">No submitted applications yet.</p>}
  </section>;
}
