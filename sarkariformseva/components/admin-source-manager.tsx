"use client";

import { useState, type FormEvent } from "react";
import { useAdminValue, writeAdminValue } from "@/lib/admin-browser-store";

type Source = {
  name: string;
  website: string;
  type: string;
  checked: string;
  status: string;
};

const storageKey = "sarkariformseva.admin.sources";

export function AdminSourceManager({ initialSources }: { initialSources: Source[] }) {
  const sources = useAdminValue(storageKey, initialSources);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  function save(nextSources: Source[]) {
    writeAdminValue(storageKey, nextSources);
    setMessage("Changes saved in this browser.");
  }

  function addSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const website = String(formData.get("website") ?? "").trim();
    save([{ name, website, type: "Website", checked: "Not checked", status: "Enabled" }, ...sources]);
    setShowForm(false);
  }

  function toggleSource(name: string) {
    save(sources.map((source) => source.name === name
      ? { ...source, status: source.status === "Disabled" ? "Enabled" : "Disabled" }
      : source));
  }

  function validateSource(name: string) {
    const nextSources = sources.map((source) => {
      if (source.name !== name) return source;
      let status = "Invalid URL";
      try {
        const parsed = new URL(source.website.startsWith("http") ? source.website : `https://${source.website}`);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") status = "URL valid";
      } catch {
        status = "Invalid URL";
      }
      return { ...source, checked: new Date().toLocaleString(), status };
    });
    save(nextSources);
  }

  function deleteSource(name: string) {
    save(sources.filter((source) => source.name !== name));
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm text-slate-600">{message || "Source controls update this browser only; URL check validates format, not live availability."}</p>
        <button type="button" onClick={() => setShowForm(!showForm)} className="rounded-md bg-[#0f4c81] px-4 py-2 text-sm font-semibold text-white">
          {showForm ? "Cancel" : "Add source"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={addSource} className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
          <input name="name" required placeholder="Source name" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input name="website" required placeholder="https://example.gov.in" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Save source</button>
        </form>
      )}
      <div className="admin-source-table-wrap overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="admin-source-table min-w-[760px] divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Website</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Last checked</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {sources.map((source) => (
              <tr key={source.name} className="admin-source-row">
                <td data-label="Source" className="px-4 py-3 font-medium text-slate-900">{source.name}</td>
                <td data-label="Website" className="px-4 py-3">{source.website}</td>
                <td data-label="Type" className="px-4 py-3">{source.type}</td>
                <td data-label="Last checked" className="px-4 py-3">{source.checked}</td>
                <td data-label="Status" className="px-4 py-3">{source.status}</td>
                <td data-label="Actions" className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => toggleSource(source.name)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">{source.status === "Disabled" ? "Enable" : "Disable"}</button>
                    <button type="button" onClick={() => validateSource(source.name)} className="rounded-md border border-slate-300 px-2 py-1 text-xs">Check URL</button>
                    <button type="button" onClick={() => deleteSource(source.name)} className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {sources.length === 0 && <tr className="admin-source-empty-row"><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No sources configured.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
