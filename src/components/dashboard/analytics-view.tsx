"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/loading";
import type { Client } from "@/lib/supabase/types";

interface ClickItem {
  id: string;
  rating: number;
  redirected_to: string;
  clicked_at: string;
  review_requests: {
    customer_name: string;
    customer_email: string;
    clients: { name: string };
  };
}

interface AnalyticsData {
  totalRequests: number;
  totalSent: number;
  totalClicked: number;
  totalOpened: number;
  clickRate: number;
  openRate: number;
  fiveStarRate: number;
  avgRating: string | null;
  distribution: number[];
  sourceBreakdown: Record<string, number>;
  clicks: ClickItem[];
}

export function AnalyticsView({ clients }: { clients: Client[] }) {
  const [clientId, setClientId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (clientId) params.set("clientId", clientId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await fetch(`/api/analytics?${params}`);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, [clientId, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxDistribution = data ? Math.max(...data.distribution, 1) : 1;

  const sourceLabels: Record<string, string> = {
    manual: "Manual",
    csv: "CSV Upload",
    acuity_auto: "Acuity Auto",
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Select
          id="filter-client"
          label="Client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <div>
          <label htmlFor="filter-from" className="block text-sm font-medium text-gray-700 mb-1.5">
            From
          </label>
          <input
            id="filter-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent min-h-[44px]"
          />
        </div>
        <div>
          <label htmlFor="filter-to" className="block text-sm font-medium text-gray-700 mb-1.5">
            To
          </label>
          <input
            id="filter-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent min-h-[44px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : data ? (
        <>
          {/* Stats — 3 cols on mobile, 6 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "Requests", value: data.totalRequests },
              { label: "Sent", value: data.totalSent },
              { label: "Open Rate", value: `${data.openRate}%` },
              { label: "Click Rate", value: `${data.clickRate}%` },
              { label: "5-Star Rate", value: `${data.fiveStarRate}%` },
              { label: "Avg Rating", value: data.avgRating || "\u2014" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent>
                  <p className="text-xs sm:text-sm text-gray-500">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Source Breakdown */}
          {Object.keys(data.sourceBreakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Source Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(data.sourceBreakdown).map(([source, count]) => (
                    <div key={source} className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          source === "acuity_auto"
                            ? "bg-purple-500"
                            : source === "csv"
                            ? "bg-blue-500"
                            : "bg-gray-400"
                        }`}
                      />
                      <span className="text-sm text-gray-700">
                        {sourceLabels[source] || source}: <strong>{count}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = data.distribution[rating - 1];
                  return (
                    <div key={rating} className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-gray-600 w-8 sm:w-12 shrink-0">
                        {rating}\u2605
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 sm:h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(count / maxDistribution) * 100}%`,
                            backgroundColor:
                              rating >= 4 ? "#22C55E" : rating === 3 ? "#F59E0B" : "#EF4444",
                          }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500 w-6 sm:w-8 text-right shrink-0">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Click Events */}
          <Card>
            <CardHeader>
              <CardTitle>Click Events</CardTitle>
            </CardHeader>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Customer</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Client</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Rating</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Redirected To</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.clicks.map((click) => (
                    <tr key={click.id} className="border-b border-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {click.review_requests.customer_name}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {click.review_requests.clients.name}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className="text-yellow-500">{"\u2605".repeat(click.rating)}</span>
                        <span className="text-gray-200">{"\u2605".repeat(5 - click.rating)}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {click.redirected_to}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(click.clicked_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {data.clicks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No click events yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden divide-y divide-gray-100">
              {data.clicks.map((click) => (
                <div key={click.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {click.review_requests.customer_name}
                    </p>
                    <span className="text-sm text-yellow-500 shrink-0">
                      {"\u2605".repeat(click.rating)}
                      <span className="text-gray-200">{"\u2605".repeat(5 - click.rating)}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {click.review_requests.clients.name} \u00b7 {new Date(click.clicked_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {data.clicks.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No click events yet
                </div>
              )}
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
