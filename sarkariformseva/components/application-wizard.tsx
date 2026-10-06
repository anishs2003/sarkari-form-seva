"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getApplicationDocumentRequirements } from "@/lib/application-documents";
import { formatFeeAmount } from "@/lib/fees";
import type { NotificationItem } from "@/lib/types";

const steps = ["Student Details", "Documents", "Review", "Payment"];

type StudentDetails = { name: string; mobile: string; email: string; dob: string; gender: string };
type SelectedDocument = { file: File; previewUrl: string };

export function ApplicationWizard({ item }: { item: NotificationItem }) {
  const [step, setStep] = useState(1);
  const [student, setStudent] = useState<StudentDetails>({ name: "", mobile: "", email: "", dob: "", gender: "" });
  const [documents, setDocuments] = useState<Record<string, SelectedDocument>>({});
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState("");
  const [applicationCode, setApplicationCode] = useState("");
  const requiredDocuments = getApplicationDocumentRequirements(item.requiredDocuments);

  function updateStudent(field: keyof StudentDetails, value: string) {
    setStudent((current) => ({ ...current, [field]: value }));
  }

  async function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (step === 1 && (!student.name.trim() || !/^[0-9]{10}$/.test(student.mobile) || !student.email.includes("@"))) {
      setError("Enter your name, a valid 10-digit mobile number, and email address.");
      return;
    }
    if (step === 2 && requiredDocuments.some((document) => document.required && !documents[document.id])) {
      setError("Select all required documents to continue. Files are not uploaded or stored yet.");
      return;
    }
    if (step === 3 && !consent) {
      setError("Please confirm the service consent before continuing.");
      return;
    }
    if (step === 3) {
      if (applicationId) {
        setStep(4);
        return;
      }
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.set("formSlug", item.slug);
        formData.set("student", JSON.stringify(student));
        formData.set("documentIds", JSON.stringify(Object.keys(documents)));
        for (const [documentId, selected] of Object.entries(documents)) {
          formData.set(`document:${documentId}`, selected.file);
        }
        const response = await fetch("/api/applications", { method: "POST", body: formData });
        const result = await response.json() as { error?: string; applicationId?: string; applicationCode?: string };
        if (!response.ok || !result.applicationId || !result.applicationCode) {
          setError(result.error || "Application could not be submitted.");
          return;
        }
        setApplicationId(result.applicationId);
        setApplicationCode(result.applicationCode);
        setStep(4);
      } catch {
        setError("Could not reach application submission. Please retry.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  function selectDocument(id: string, file?: File) {
    setDocuments((current) => {
      const previous = current[id];
      if (previous) URL.revokeObjectURL(previous.previewUrl);
      if (!file) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: { file, previewUrl: URL.createObjectURL(file) } };
    });
  }

  function removeDocument(id: string) {
    selectDocument(id);
  }

  return (
    <main className="portal-main service-page">
      <div className="breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/notifications">Notifications</Link><span>/</span><span>Private form service</span></div>
      <section className="service-title">
        <div><p className="eyebrow">Private Form Filling Service</p><h1>Applying For: {item.title}</h1><p>{item.organization}</p></div>
        <span className="private-service-tag">Independent service</span>
      </section>
      <p className="service-disclaimer">Sarkari Form Seva is not a government department. This optional service is independent of the official recruitment process.</p>

      <ol className="wizard-progress" aria-label="Application steps">
        {steps.map((label, index) => <li key={label} aria-label={label} aria-current={step === index + 1 ? "step" : undefined} className={step === index + 1 ? "current" : step > index + 1 ? "complete" : ""}><span>{index + 1}</span><strong>{label}</strong></li>)}
      </ol>

      <section className="portal-section wizard-panel">
        <div className="portal-section-heading"><h2>Step {step}: {steps[step - 1]}</h2></div>
        <form onSubmit={nextStep}>
          <input type="hidden" name="formId" value={item.id} />
          <input type="hidden" name="formSlug" value={item.slug} />
          {step === 1 && (
            <div className="wizard-form-grid">
              <label>Full name<input required autoComplete="name" value={student.name} onChange={(event) => updateStudent("name", event.target.value)} /></label>
              <label>Mobile number<input required inputMode="numeric" autoComplete="tel-national" maxLength={10} value={student.mobile} onChange={(event) => updateStudent("mobile", event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10 digits" /></label>
              <label>Email address<input required type="email" autoComplete="email" value={student.email} onChange={(event) => updateStudent("email", event.target.value)} /></label>
              <label>Date of birth<input type="date" value={student.dob} onChange={(event) => updateStudent("dob", event.target.value)} /></label>
              <label>Gender<select value={student.gender} onChange={(event) => updateStudent("gender", event.target.value)}><option value="">Choose</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select></label>
            </div>
          )}

          {step === 2 && (
            <>
              <p className="upload-warning">Your documents are uploaded to private storage when you submit this application. Only authorized staff can access them to process your request.</p>
              <div className="document-grid">
                {requiredDocuments.map((document) => {
                  const selected = documents[document.id];
                  return (
                    <article key={document.id} className="document-card">
                      <div><h3>{document.label}</h3><span>{document.required ? "Required" : "Optional"}</span></div>
                      {selected ? <p className="document-filename" title={selected.file.name}>{selected.file.name}</p> : <p className="document-filename">No file selected</p>}
                      <input id={`file-${document.id}`} type="file" accept={document.accept} onChange={(event) => selectDocument(document.id, event.target.files?.[0])} />
                      <div className="document-actions">
                        <label htmlFor={`file-${document.id}`}>{selected ? "Replace" : "Choose file"}</label>
                        {selected && <><button type="button" onClick={() => window.open(selected.previewUrl, "_blank", "noopener,noreferrer")}>Preview</button><button type="button" onClick={() => removeDocument(document.id)}>Delete</button></>}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <div className="review-panel">
              <h3>Student details</h3>
              <dl className="review-facts"><div><dt>Name</dt><dd>{student.name || "Not entered"}</dd></div><div><dt>Mobile</dt><dd>{student.mobile || "Not entered"}</dd></div><div><dt>Email</dt><dd>{student.email || "Not entered"}</dd></div><div><dt>Date of birth</dt><dd>{student.dob || "Not entered"}</dd></div><div><dt>Applying For</dt><dd>{item.title}</dd></div><div><dt>Documents selected</dt><dd>{Object.keys(documents).length} of {requiredDocuments.length}</dd></div></dl>
              <label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />I authorize this independent service to use submitted information only to assist with the selected application.</label>
            </div>
          )}

          {step === 4 && (
            <div className="payment-step">
              <p className="payment-pending" role="status">Application {applicationCode} saved as a draft. Submit payment details below to send it for staff review.</p>
              <div>
                <p className="eyebrow">Payment breakdown</p>
                <dl className="review-facts">
                  <div><dt>Official Application Fee</dt><dd>{formatFeeAmount(item.applicationFee, "See official notification")}</dd></div>
                  <div><dt>Service Charge</dt><dd>{formatFeeAmount(item.serviceCharge, "Not specified")}</dd></div>
                </dl>
                <p>Service Charge is for our private form-filling assistance.</p>
                <p>The official application fee is paid separately to the official authority. Any service payment is for assistance only.</p>
              </div>
              <p>Payment confirmation requires manual verification. Do not send money until the service team provides valid payment details.</p>
              <Link href={`/payment?slug=${encodeURIComponent(item.slug)}&applicationId=${encodeURIComponent(applicationId)}`}>Continue to QR payment and submit UTR</Link>
            </div>
          )}

          {error && <p className="wizard-error" role="alert">{error}</p>}
          <div className="wizard-controls">
            <button type="button" disabled={step === 1} onClick={() => { setError(""); setStep((current) => Math.max(1, current - 1)); }}>Previous</button>
            {step < 4 && <button type="submit" disabled={submitting}>{submitting ? "Saving application..." : step === 3 ? "Continue to payment" : "Continue"}</button>}
          </div>
        </form>
      </section>
    </main>
  );
}
