import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">
        404
      </p>
      <h1 className="text-4xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-4 max-w-lg text-lg text-slate-600">
        The page you are trying to access does not exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
      >
        Back to Home
      </Link>
    </main>
  );
}
