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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Dashboard Not Found</h1>
          <p className="text-gray-500">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const { client, stats, distribution, recentActivity } = data;
  const maxDist = Math.max(...distribution, 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="bg-white border-b-4"
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
          <p className="text-sm text-gray-500 mt-1">Review Performance Dashboard</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Date range */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[44px]"
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
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Rating distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Rating Distribution
          </h3>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = distribution[rating - 1];
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-12 shrink-0">
                    {rating} {"\u2605"}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
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
                  <span className="text-sm text-gray-500 w-8 text-right shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 sm:px-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivity.map((item, i) => (
              <div key={i} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">{item.firstName}</p>
                  <p className="text-xs text-gray-500">
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
                        ? "bg-green-100 text-green-800"
                        : item.status === "opened"
                        ? "bg-purple-100 text-purple-800"
                        : item.status === "sent"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No activity yet
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <Link href="https://dadadigital.com" className="text-gray-500 hover:text-gray-700">
              DadaDigital
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
