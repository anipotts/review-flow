import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-ink mb-2">404</h1>
        <p className="text-lg text-ink-secondary mb-6">Page not found</p>
        <Link
          href="/login"
          className="inline-flex items-center px-4 py-2 bg-brand text-[#0B0E14] text-sm font-medium rounded-lg hover:bg-brand-dark transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
