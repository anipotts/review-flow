"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface SharedData {
  client: { name: string; brandColor: string; logoUrl: string | null };
  stats: {
    totalSent: number;
    openRate: number;
    clickRate: number;
    avgRating: string | null;
  };
  distribution: number[];
  recentActivity: Array<{
    firstName: string;
    status: string;
    rating: number | null;
    date: string;
  }>;
}

export default function SharedDashboardPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    try {
      const res = await fetch(`/api/shared/${shareToken}?${params}`);
      if (res.ok) {
        setData(await res.json());
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [shareToken, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        <p className="text-sm text-ink-muted">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-ink mb-2">Dashboard Not Found</h1>
          <p className="text-ink-muted">This share link is invalid or the client no longer exists.<br />Contact your account manager for an updated link.</p>
        </div>
      </div>
    );
  }

  const { client, stats, distribution, recentActivity } = data;
  const maxDist = Math.max(...distribution, 1);

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header
        className="bg-surface border-b-4"
        style={{ borderBottomColor: client.brandColor }}
      >
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex items-center gap-4">
            {client.logoUrl ? (
              <img
                src={client.logoUrl}
                alt={client.name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <h1
                className="text-2xl font-bold"
                style={{ color: client.brandColor }}
              >
                {client.name}
              </h1>
            )}
          </div>
          <p className="text-sm text-ink-muted mt-1">Review Performance Dashboard</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Date range */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 border border-edge rounded-lg text-sm bg-surface text-ink min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 border border-edge rounded-lg text-sm bg-surface text-ink min-h-[44px]"
            />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Emails Sent", value: stats.totalSent },
            { label: "Open Rate", value: `${stats.openRate}%` },
            { label: "Click Rate", value: `${stats.clickRate}%` },
            { label: "Avg Rating", value: stats.avgRating || "\u2014" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-surface rounded-xl border border-edge p-4"
            >
              <p className="text-xs text-ink-muted">{stat.label}</p>
              <p className="text-2xl font-bold text-ink mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Rating distribution */}
        <div className="bg-surface rounded-xl border border-edge p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-ink mb-4">
            Rating Distribution
          </h3>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = distribution[rating - 1];
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink-secondary w-12 shrink-0">
                    {rating} {"\u2605"}
                  </span>
                  <div className="flex-1 bg-surface-hover rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(count / maxDist) * 100}%`,
                        backgroundColor:
                          rating >= 4
                            ? "#22C55E"
                            : rating === 3
                            ? "#F59E0B"
                            : "#EF4444",
                      }}
                    />
                  </div>
                  <span className="text-sm text-ink-muted w-8 text-right shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface rounded-xl border border-edge overflow-hidden">
          <div className="px-4 py-3 sm:px-6 border-b border-edge-subtle">
            <h3 className="text-sm font-semibold text-ink">Recent Activity</h3>
          </div>
          <div className="divide-y divide-edge-subtle">
            {recentActivity.map((item, i) => (
              <div key={i} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink">{item.firstName}</p>
                  <p className="text-xs text-ink-muted">
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.rating && (
                    <span className="text-sm text-yellow-500">
                      {"\u2605".repeat(item.rating)}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      item.status === "clicked"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : item.status === "opened"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : item.status === "sent"
                        ? "bg-brand/10 text-brand border border-brand/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-ink-muted">
                No activity yet for this date range. Try expanding the date range above.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-ink-muted">
            Powered by{" "}
            <Link href="https://dadadigital.com" className="text-ink-secondary hover:text-brand transition-colors">
              DadaDigital
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
