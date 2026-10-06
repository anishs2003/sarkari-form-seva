"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useAdminValue, writeAdminValue } from "@/lib/admin-browser-store";

type PaymentSettings = { upiId: string; upiName: string; qrImage: string };

const storageKey = "sarkariformseva.admin.payment";
const defaultSettings: PaymentSettings = {
  upiId: process.env.NEXT_PUBLIC_PAYMENT_UPI_ID ?? "",
  upiName: process.env.NEXT_PUBLIC_PAYMENT_UPI_NAME ?? "Student Form Service Portal",
  qrImage: "",
};

export function AdminPaymentSettingsForm() {
  const settings = useAdminValue(storageKey, defaultSettings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file for the QR code.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("QR image must be 1 MB or smaller for browser storage.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => writeAdminValue(storageKey, { ...settings, qrImage: String(reader.result) });
    reader.onerror = () => setError("Could not read this image. Please try another file.");
    reader.readAsDataURL(file);
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeAdminValue(storageKey, settings);
    setSaved(true);
    setError("");
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <p className="text-sm font-semibold text-slate-700">QR code preview</p>
        <div className="mt-4 flex min-h-56 items-center justify-center rounded-lg bg-white p-4 shadow-inner">
          {settings.qrImage ? (
            <Image src={settings.qrImage} alt="Configured payment QR code" width={240} height={240} unoptimized className="max-h-52 w-auto object-contain" />
          ) : (
            <p className="text-center text-sm text-slate-500">No QR image configured</p>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">This preview and image are stored in this browser only.</p>
      </div>

      <form onSubmit={saveSettings} className="space-y-5">
        <div>
          <label htmlFor="upi-id" className="mb-2 block text-sm font-medium text-slate-700">UPI ID</label>
          <input id="upi-id" required value={settings.upiId} onChange={(event) => { setSaved(false); writeAdminValue(storageKey, { ...settings, upiId: event.target.value }); }} className="w-full rounded-md border border-slate-300 px-3 py-3" />
        </div>
        <div>
          <label htmlFor="upi-name" className="mb-2 block text-sm font-medium text-slate-700">UPI name</label>
          <input id="upi-name" required value={settings.upiName} onChange={(event) => { setSaved(false); writeAdminValue(storageKey, { ...settings, upiName: event.target.value }); }} className="w-full rounded-md border border-slate-300 px-3 py-3" />
        </div>
        <div>
          <label htmlFor="qr-image" className="mb-2 block text-sm font-medium text-slate-700">Upload QR image</label>
          <input id="qr-image" type="file" accept="image/*" onChange={handleImage} className="w-full rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm" />
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {saved && <p role="status" className="text-sm text-emerald-700">Payment settings saved in this browser.</p>}
        <button type="submit" className="w-full rounded-md bg-[#0f4c81] px-5 py-3 text-sm font-semibold text-white">Save payment settings</button>
      </form>
    </div>
  );
}
