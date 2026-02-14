"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Invalid password");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong — this is usually a connection issue. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-secondary px-4">
      {/* Login Card */}
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-xl border border-edge shadow-lg shadow-black/20 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              {/* Wireframe globe icon */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-brand shrink-0"
              >
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" />
                <ellipse cx="16" cy="16" rx="6" ry="13" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 12h24" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 20h24" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 3v26" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <h1 className="text-2xl font-bold text-ink tracking-tight">
                MaMaDigital
              </h1>
            </div>
            <p className="text-sm text-ink-muted">Review Dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-ink-secondary mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3.5 py-2.5 bg-surface border border-edge rounded-lg text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-colors min-h-[44px]"
                required
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-[#0B0E14] py-2.5 px-4 rounded-lg text-sm font-semibold hover:brightness-110 active:brightness-90 disabled:opacity-50 transition-all min-h-[44px] cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      {/* PWA Install Instructions - mobile only */}
      <div className="w-full max-w-sm mt-6 px-2 sm:hidden">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-3.5 h-3.5 text-ink-muted" />
          <span className="text-xs font-medium text-ink-muted">
            Install as App
          </span>
        </div>
        <div className="space-y-1 text-xs text-ink-muted leading-relaxed">
          <p>
            <span className="text-ink-secondary font-medium">iOS:</span>{" "}
            Tap the share button, then &ldquo;Add to Home Screen&rdquo;
          </p>
          <p>
            <span className="text-ink-secondary font-medium">Android:</span>{" "}
            Tap the menu, then &ldquo;Install app&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
