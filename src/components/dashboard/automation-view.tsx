"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Zap, Play, CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Client, Location } from "@/lib/supabase/types";

interface SendBatchWithClient {
  id: string;
  client_id: string;
  week_start: string;
  week_end: string;
  total_new: number;
  total_sent: number;
  status: string;
  created_at: string;
  clients: { name: string };
}

interface AutomationViewProps {
  clients: (Client & { locations: Location[] })[];
  recentBatches: SendBatchWithClient[];
}

export function AutomationView({ clients, recentBatches }: AutomationViewProps) {
  const [running, setRunning] = useState(false);
  const acuityEnabled = true; // We can't read env from client, show based on config

  async function handleRunNow() {
    setRunning(true);
    try {
      const res = await fetch("/api/cron/weekly-review", {
        headers: { Authorization: `Bearer manual-trigger` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          data.results?.length
            ? `Processed ${data.results.length} clients`
            : data.message || "Done"
        );
      } else {
        toast.error(data.error || "Automation failed — check that Acuity credentials and client calendars are configured in Settings.");
      }
    } catch {
      toast.error("Could not reach the server. Check your internet connection and try again.");
    }
    setRunning(false);
  }

  const autoSendClients = clients.filter((c) => c.auto_send_enabled);

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${acuityEnabled ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              <Zap className={`h-5 w-5 ${acuityEnabled ? "text-emerald-400" : "text-red-400"}`} />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Acuity Connection</p>
              <p className="text-sm font-semibold text-ink">
                {acuityEnabled ? "Configured" : "Not Connected"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 bg-brand-light rounded-lg">
              <Calendar className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Auto-Send Clients</p>
              <p className="text-sm font-semibold text-ink">{autoSendClients.length} active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-ink-muted">Schedule</p>
              <p className="text-sm font-semibold text-ink">Every Friday 1 PM ET</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual trigger */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Manual Trigger</CardTitle>
            <Button
              onClick={handleRunNow}
              loading={running}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run Now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-muted">
            Manually trigger the weekly review process for all auto-send clients.
            This fetches appointments from Acuity, detects first-time patients,
            and sends review request emails.
          </p>
        </CardContent>
      </Card>

      {/* Per-client configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Client Configuration</CardTitle>
        </CardHeader>
        <div className="divide-y divide-edge-subtle">
          {clients.map((client) => (
            <div key={client.id} className="px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {client.name}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {(client.acuity_calendar_ids || []).length > 0
                      ? `${client.acuity_calendar_ids.length} calendar(s)`
                      : "No calendars configured"}
                    {client.locations?.length > 0 &&
                      ` · ${client.locations.length} location(s)`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {client.auto_send_enabled ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      Auto-send
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-ink-muted">
                      <XCircle className="h-4 w-4" />
                      Manual only
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-ink-muted">
              No clients yet. Add a client from the Clients page to configure automation.
            </div>
          )}
        </div>
      </Card>

      {/* Recent batches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Batches</CardTitle>
        </CardHeader>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-edge-subtle">
                <th className="text-left text-xs font-medium text-ink-muted px-6 py-3">Client</th>
                <th className="text-left text-xs font-medium text-ink-muted px-6 py-3">Week</th>
                <th className="text-left text-xs font-medium text-ink-muted px-6 py-3">New</th>
                <th className="text-left text-xs font-medium text-ink-muted px-6 py-3">Sent</th>
                <th className="text-left text-xs font-medium text-ink-muted px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((batch) => (
                <tr key={batch.id} className="border-b border-edge-subtle hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-3 text-sm text-ink">
                    {batch.clients?.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-ink-secondary">
                    {new Date(batch.week_start).toLocaleDateString()} – {new Date(batch.week_end).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-sm text-ink-secondary">{batch.total_new}</td>
                  <td className="px-6 py-3 text-sm text-ink-secondary">{batch.total_sent}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        batch.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : batch.status === "failed"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentBatches.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-ink-muted">
                    No automated batches yet. Enable auto-send on a client and run automation to see results here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="sm:hidden divide-y divide-edge-subtle">
          {recentBatches.map((batch) => (
            <div key={batch.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink truncate">
                  {batch.clients?.name}
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    batch.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : batch.status === "failed"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}
                >
                  {batch.status}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                {new Date(batch.week_start).toLocaleDateString()} – {new Date(batch.week_end).toLocaleDateString()} · {batch.total_sent} sent
              </p>
            </div>
          ))}
          {recentBatches.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-ink-muted">
              No automated batches yet. Enable auto-send on a client and run automation to see results here.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
