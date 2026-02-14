import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Send, MousePointerClick, Star, Mail, Zap } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [clientsRes, sentRes, clickedRes, ratingsRes, recentRes, weekBatchRes] =
    await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase
        .from("review_requests")
        .select("id", { count: "exact", head: true })
        .neq("source", "test")
        .gte("sent_at", monthStart),
      supabase
        .from("review_requests")
        .select("id", { count: "exact", head: true })
        .neq("source", "test")
        .eq("status", "clicked"),
      supabase.from("click_events").select("rating"),
      supabase
        .from("review_requests")
        .select("*, clients(name)")
        .neq("source", "test")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("send_batches")
        .select("*, clients(name)")
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const totalClients = clientsRes.count || 0;
  const emailsSent = sentRes.count || 0;
  const totalClicked = clickedRes.count || 0;
  const totalSent = emailsSent > 0 ? emailsSent : 1;
  const clickRate = emailsSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

  const ratings = ratingsRes.data || [];
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : "\u2014";

  const recentRequests = recentRes.data || [];
  const weekBatches = weekBatchRes.data || [];

  const stats = [
    { label: "Total Clients", value: totalClients, icon: Building2 },
    { label: "Sent (Month)", value: emailsSent, icon: Send },
    { label: "Click Rate", value: `${clickRate}%`, icon: MousePointerClick },
    { label: "Avg Rating", value: avgRating, icon: Star },
  ];

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        Dashboard
      </h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3">
              <div className="p-2 bg-brand-light rounded-lg shrink-0">
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-brand" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* This Week Automation Summary */}
      {weekBatches.length > 0 && (
        <Card className="mb-6 sm:mb-8">
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                This Week&apos;s Automation
              </h3>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {weekBatches.map((batch) => (
              <div key={batch.id} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {(batch.clients as { name: string })?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {batch.total_new} new patients \u00b7 {batch.total_sent} emails sent
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      batch.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : batch.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Client</th>
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Rating</th>
                <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((req) => (
                <tr key={req.id} className="border-b border-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900">{req.customer_name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {(req.clients as { name: string })?.name}
                  </td>
                  <td className="px-6 py-3">
                    <Badge status={req.status as "pending" | "sent" | "opened" | "clicked"} />
                  </td>
                  <td className="px-6 py-3 text-sm text-yellow-500">
                    {req.rating_clicked ? "\u2605".repeat(req.rating_clicked) : <span className="text-gray-300">{"\u2014"}</span>}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No review requests yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked list */}
        <div className="sm:hidden divide-y divide-gray-100">
          {recentRequests.map((req) => (
            <div key={req.id} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{req.customer_name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {(req.clients as { name: string })?.name} \u00b7 {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {req.rating_clicked && (
                  <span className="text-sm text-yellow-500">{"\u2605".repeat(req.rating_clicked)}</span>
                )}
                <Badge status={req.status as "pending" | "sent" | "opened" | "clicked"} />
              </div>
            </div>
          ))}
          {recentRequests.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No review requests yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
