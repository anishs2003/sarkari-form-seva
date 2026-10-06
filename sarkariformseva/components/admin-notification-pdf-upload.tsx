"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";

function getStoredPath(downloadUrl: string): string | null {
  const match = downloadUrl.match(/^\/api\/notification-pdfs\/([a-zA-Z0-9_-]+\.pdf)$/);
  return match ? `notification-pdfs/${match[1]}` : null;
}

export function AdminNotificationPdfUpload({
  value,
  onChange,
  maxSizeMb,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  maxSizeMb: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function removeStoredPdf(downloadUrl: string) {
    const path = getStoredPath(downloadUrl);
    if (!path) return true;
    const response = await fetch("/api/admin/notification-pdfs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    return response.ok;
  }

  async function uploadPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");
    setSuccess("");
    if (!file) return;
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file.");
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`PDF must be ${maxSizeMb} MB or smaller.`);
      return;
    }
    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/admin/notification-pdfs", {
        method: "POST",
        body: formData,
      });
      const result = await response.json() as { error?: string; downloadUrl?: string };
      if (!response.ok || !result.downloadUrl) {
        setError(result.error || "PDF upload failed.");
        return;
      }

      const previousValue = value;
      onChange(result.downloadUrl);
      setSuccess(previousValue ? "Notification PDF replaced successfully." : "Notification PDF uploaded successfully.");
      if (previousValue && previousValue !== result.downloadUrl && !(await removeStoredPdf(previousValue))) {
        setError("The new PDF is uploaded, but the previous stored PDF could not be removed.");
      }
    } catch {
      setError("Could not reach secure storage. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function removePdf() {
    setError("");
    setSuccess("");
    if (!value) return;
    setBusy(true);
    try {
      if (!(await removeStoredPdf(value))) {
        setError("The stored PDF could not be removed.");
        return;
      }
      onChange("");
      setSuccess("Notification PDF removed.");
    } catch {
      setError("Could not reach secure storage. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          {busy ? "Working..." : value ? "Replace PDF" : "Upload PDF"}
          <input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={uploadPdf} className="sr-only" />
        </label>
        {value && <span className="max-w-full break-all text-xs text-slate-600">PDF uploaded</span>}
        {value && <button type="button" disabled={busy} onClick={removePdf} className="text-sm font-semibold text-red-700 hover:underline">Remove</button>}
        <span className="text-xs text-slate-500">PDF only, up to {maxSizeMb} MB</span>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error} {error.includes("Admin sign-in") && <Link href="/admin/login" className="font-semibold underline">Sign in</Link>}</p>}
      {success && <p role="status" className="text-sm text-emerald-700">{success}</p>}
    </div>
  );
}
