"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Settings,
  Key,
  Mail,
  Zap,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Send,
  FlaskConical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

interface SettingsViewProps {
  clients: (Client & { locations: Location[] })[];
  recentBatches: SendBatchWithClient[];
}

interface SettingField {
  key: string;
  label: string;
  helpText: string;
  sensitive: boolean;
}

const integrationFields: SettingField[] = [
  {
    key: "RESEND_API_KEY",
    label: "Resend API Key",
    helpText: "Get this from resend.com/api-keys",
    sensitive: true,
  },
  {
    key: "ACUITY_USER_ID",
    label: "Acuity User ID",
    helpText: "Found in Acuity > Integrations > API",
    sensitive: false,
  },
  {
    key: "ACUITY_API_KEY",
    label: "Acuity API Key",
    helpText: "Found in Acuity > Integrations > API",
    sensitive: true,
  },
];

const generalFields: SettingField[] = [
  {
    key: "ADMIN_PASSWORD",
    label: "Admin Password",
    helpText: "Password used to log in to this dashboard",
    sensitive: true,
  },
  {
    key: "EMAIL_FROM",
    label: "Email From",
    helpText: 'e.g. "MaMaDigital <feedback@yourdomain.com>"',
    sensitive: false,
  },
  {
    key: "EMAIL_FROM_NAME",
    label: "Email From Name",
    helpText: "Default sender name when client has none set",
    sensitive: false,
  },
];

export function SettingsView({ clients, recentBatches }: SettingsViewProps) {
  const [settings, setSettings] = useState<Record<string, { value: string; configured: boolean; masked: boolean }>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showFields, setShowFields] = useState<Record<string, boolean>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Automation state
  const [running, setRunning] = useState(false);
  const [acuityToggle, setAcuityToggle] = useState(false);

  // Test mode state
  const [testEmail, setTestEmail] = useState("martand@dadadig.com");
  const [testClientId, setTestClientId] = useState(clients[0]?.id || "");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);

      // Pre-fill non-sensitive values for editing
      const edits: Record<string, string> = {};
      for (const [key, info] of Object.entries(data) as [string, { value: string; configured: boolean; masked: boolean }][]) {
        edits[key] = info.masked ? "" : info.value;
      }
      setEditValues(edits);

      // Set acuity toggle
      setAcuityToggle(data.ACUITY_ENABLED?.value === "true");
    } catch {
      toast.error("Failed to load settings. Check your connection and refresh the page.");
    }
    setLoading(false);
  }

  async function saveSection(sectionKey: string, fields: SettingField[]) {
    setSavingSection(sectionKey);
    const toSave: Record<string, string> = {};

    for (const field of fields) {
      const val = editValues[field.key];
      if (val && val.trim()) {
        toSave[field.key] = val.trim();
      }
    }

    if (Object.keys(toSave).length === 0) {
      toast.info("No changes to save — enter a new value in at least one field.");
      setSavingSection(null);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: toSave }),
      });

      if (res.ok) {
        toast.success("Settings saved");
        await fetchSettings();
      } else {
        toast.error("Failed to save settings. The server returned an error — try again.");
      }
    } catch {
      toast.error("Failed to save settings. Check your internet connection.");
    }
    setSavingSection(null);
  }

  async function handleAcuityToggle(enabled: boolean) {
    setAcuityToggle(enabled);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { ACUITY_ENABLED: String(enabled) } }),
      });
      if (!res.ok) throw new Error("Server error");
      toast.success(enabled ? "Acuity enabled" : "Acuity disabled");
    } catch {
      toast.error("Failed to toggle Acuity integration. Check your connection and try again.");
      setAcuityToggle(!enabled);
    }
  }

  async function handleRunNow() {
    setRunning(true);
    try {
      const res = await fetch("/api/cron/weekly-review", {
        headers: { Authorization: "Bearer manual-trigger" },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          data.results?.length
            ? `Processed ${data.results.length} clients`
            : data.message || "Done"
        );
      } else {
        toast.error(data.error || "Automation failed — check that Acuity credentials and client calendars are configured.");
      }
    } catch {
      toast.error("Could not reach the server. Check your internet connection and try again.");
    }
    setRunning(false);
  }

  async function handleSendTest() {
    if (!testEmail) {
      toast.error("Please enter an email address to send the test to.");
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail, clientId: testClientId || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Test email sent to ${testEmail}`);
      } else {
        toast.error(data.error || "Failed to send test email. Make sure your Resend API key is configured in Integrations above.");
      }
    } catch {
      toast.error("Could not send test email. Check your internet connection.");
    }
    setSendingTest(false);
  }

  function renderField(field: SettingField) {
    const info = settings[field.key];
    const isConfigured = info?.configured;
    const isShown = showFields[field.key];

    return (
      <div key={field.key} className="py-4 first:pt-0 last:pb-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isConfigured ? "bg-green-500" : "bg-red-400"
                }`}
              />
              <label className="text-sm font-medium text-ink">
                {field.label}
              </label>
            </div>
            <p className="text-xs text-ink-muted mb-2">{field.helpText}</p>
            <div className="relative">
              <input
                type={field.sensitive && !isShown ? "password" : "text"}
                value={editValues[field.key] || ""}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                placeholder={
                  isConfigured
                    ? `Currently set (${info.value}) — leave blank to keep`
                    : "Not configured — enter a value"
                }
                className="w-full px-3 py-2 border border-edge rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent min-h-[44px] pr-10"
              />
              {field.sensitive && (
                <button
                  type="button"
                  onClick={() =>
                    setShowFields((prev) => ({
                      ...prev,
                      [field.key]: !prev[field.key],
                    }))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-muted hover:text-ink-secondary"
                >
                  {isShown ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ink-muted">Loading settings...</p>
      </div>
    );
  }

  const autoSendClients = clients.filter((c) => c.auto_send_enabled);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Integrations Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-brand" />
            <CardTitle>Integrations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-edge-subtle">
            {integrationFields.map(renderField)}
          </div>
          <div className="mt-4 pt-4 border-t border-edge-subtle">
            <Button
              onClick={() => saveSection("integrations", integrationFields)}
              loading={savingSection === "integrations"}
            >
              Save Integrations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* General Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-ink-secondary" />
            <CardTitle>General</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-edge-subtle">
            {generalFields.map(renderField)}
          </div>
          <div className="mt-4 pt-4 border-t border-edge-subtle">
            <Button
              onClick={() => saveSection("general", generalFields)}
              loading={savingSection === "general"}
            >
              Save General
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Automation Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            <CardTitle>Automation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Acuity toggle */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-ink">Acuity Integration</p>
              <p className="text-xs text-ink-muted">Auto-fetch appointments weekly</p>
            </div>
            <label className="relative cursor-pointer">
              <input
                type="checkbox"
                checked={acuityToggle}
                onChange={(e) => handleAcuityToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-surface-active rounded-full peer-checked:bg-brand transition-colors" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
            </label>
          </div>

          {/* Schedule info */}
          <div className="flex items-center gap-2 py-3 border-t border-edge-subtle">
            <Clock className="h-4 w-4 text-ink-muted" />
            <span className="text-sm text-ink-secondary">Schedule: Every Friday 1 PM ET</span>
          </div>

          {/* Auto-send clients summary */}
          <div className="flex items-center gap-2 py-3 border-t border-edge-subtle">
            <Calendar className="h-4 w-4 text-ink-muted" />
            <span className="text-sm text-ink-secondary">
              {autoSendClients.length} client{autoSendClients.length !== 1 ? "s" : ""} with auto-send enabled
            </span>
          </div>

          {/* Per-client status */}
          {clients.length > 0 && (
            <div className="mt-3 border-t border-edge-subtle pt-3">
              <div className="space-y-2">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-ink-secondary truncate">{client.name}</span>
                    {client.auto_send_enabled ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Auto-send
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-ink-muted">
                        <XCircle className="h-3.5 w-3.5" />
                        Manual
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Run now */}
          <div className="mt-4 pt-4 border-t border-edge-subtle flex items-center justify-between">
            <p className="text-sm text-ink-muted">Manually trigger for all auto-send clients</p>
            <Button
              onClick={handleRunNow}
              loading={running}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run Now
            </Button>
          </div>

          {/* Recent batches */}
          {recentBatches.length > 0 && (
            <div className="mt-4 pt-4 border-t border-edge-subtle">
              <p className="text-sm font-medium text-ink-secondary mb-2">Recent Batches</p>
              <div className="space-y-2">
                {recentBatches.slice(0, 5).map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <span className="text-ink">{batch.clients?.name}</span>
                      <span className="text-ink-muted ml-2">
                        {batch.total_sent} sent
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        batch.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : batch.status === "failed"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Mode Card */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-amber-500" />
            <CardTitle>Test Mode</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-secondary mb-4">
            Send a real test email to yourself to see exactly what patients receive. Pick a client to preview their branding. Test emails won&apos;t appear in analytics.
          </p>
          <div className="space-y-4">
            <Select
              id="testClient"
              label="Client (preview their branding)"
              value={testClientId}
              onChange={(e) => setTestClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              id="testEmail"
              label="Send test to this email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your@email.com"
              helperText="You'll receive the same email a patient would get"
            />
            <Button
              onClick={handleSendTest}
              loading={sendingTest}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Send className="h-4 w-4" />
              Send Test Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
