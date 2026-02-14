"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import Papa from "papaparse";
import { Upload, FileText, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CsvColumnMapper } from "@/components/dashboard/csv-column-mapper";
import { detectColumns, mapRow } from "@/lib/csv-columns";
import type { ColumnMapping } from "@/lib/csv-columns";
import type { Client, Location } from "@/lib/supabase/types";

interface CsvRow {
  name: string;
  email: string;
}

export function SendForm({ clients }: { clients: Client[] }) {
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<CsvRow[]>([]);
  const [existingRows, setExistingRows] = useState<CsvRow[]>([]);
  const [firstTimeOnly, setFirstTimeOnly] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0 });
  const [bulkSending, setBulkSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Smart CSV state
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [showMapper, setShowMapper] = useState(false);

  // Fetch locations when client changes
  useEffect(() => {
    if (!clientId) return;
    setLocationId("");
    fetch(`/api/clients/${clientId}/locations`)
      .then((r) => r.json())
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => {
        setLocations([]);
        toast.error("Failed to load locations for this client.");
      });
  }, [clientId]);

  // Filter CSV through first-time detection when toggled or rows change
  useEffect(() => {
    if (!firstTimeOnly || csvRows.length === 0 || !clientId) {
      setFilteredRows(csvRows);
      setExistingRows([]);
      return;
    }

    setFilterLoading(true);
    fetch("/api/patients/check-first-time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        patients: csvRows.map((r) => ({ name: r.name, email: r.email })),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setFilteredRows(data.firstTime || csvRows);
        setExistingRows(data.existing || []);
      })
      .catch(() => {
        setFilteredRows(csvRows);
        setExistingRows([]);
      })
      .finally(() => setFilterLoading(false));
  }, [csvRows, firstTimeOnly, clientId]);

  function applyMapping(mapping: ColumnMapping, data: Record<string, string>[]) {
    const rows = data
      .map((row) => mapRow(row, mapping))
      .filter((r): r is CsvRow => r !== null)
      .slice(0, 500);

    setCsvRows(rows);
    setShowMapper(false);
    setRawHeaders([]);
    setRawData([]);

    if (rows.length === 0) {
      toast.error("No valid rows found. Each row needs at least a name and email address.");
    } else {
      toast.success(`${rows.length} rows loaded`);
    }
  }

  async function handleSingleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/send-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        customerName,
        customerEmail,
        locationId: locationId || undefined,
      }),
    });

    if (res.ok) {
      toast.success(`Review request sent to ${customerEmail}`);
      setCustomerName("");
      setCustomerEmail("");
    } else {
      const data = await res.json();
      toast.error(data.error || `Failed to send review request to ${customerEmail}. Check your Resend API key in Settings.`);
    }

    setLoading(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields || [];
        const data = results.data;

        if (headers.length === 0 || data.length === 0) {
          toast.error("CSV appears to be empty. Make sure the file has a header row and at least one data row.");
          return;
        }

        const mapping = detectColumns(headers);

        if (mapping.confidence === "exact" || mapping.confidence === "fuzzy") {
          if (mapping.confidence === "fuzzy") {
            toast.info("Auto-detected columns (fuzzy match)");
          }
          applyMapping(mapping, data);
        } else {
          // Show mapper UI for ambiguous columns
          setRawHeaders(headers);
          setRawData(data);
          setShowMapper(true);
        }
      },
      error() {
        toast.error("Failed to parse CSV. Make sure it's a valid .csv file with comma-separated values.");
      },
    });
  }

  function handleMapperConfirm(nameColumn: string, emailColumn: string) {
    const mapping: ColumnMapping = {
      nameColumn,
      firstNameColumn: null,
      lastNameColumn: null,
      emailColumn,
      confidence: "exact",
    };
    applyMapping(mapping, rawData);
  }

  function handleMapperCancel() {
    setShowMapper(false);
    setRawHeaders([]);
    setRawData([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleBulkSend() {
    const rowsToSend = firstTimeOnly ? filteredRows : csvRows;
    if (!clientId || rowsToSend.length === 0) return;

    setBulkSending(true);
    setBulkProgress({ sent: 0, total: rowsToSend.length });

    const BATCH_SIZE = 50;
    let attempted = 0;
    let failed = 0;

    for (let i = 0; i < rowsToSend.length; i += BATCH_SIZE) {
      const batch = rowsToSend.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (row) => {
          try {
            const res = await fetch("/api/send-review", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientId,
                customerName: row.name,
                customerEmail: row.email,
                locationId: locationId || undefined,
                source: "csv",
              }),
            });
            if (!res.ok) failed++;
          } catch {
            failed++;
          }
          attempted++;
          setBulkProgress({ sent: attempted, total: rowsToSend.length });
        })
      );

      if (i + BATCH_SIZE < rowsToSend.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    const succeeded = attempted - failed;
    if (failed > 0) {
      toast.warning(`${succeeded} of ${attempted} review requests sent. ${failed} failed — check your Resend API key.`);
    } else {
      toast.success(`All ${attempted} review requests sent successfully.`);
    }
    setCsvRows([]);
    setFilteredRows([]);
    setExistingRows([]);
    setBulkSending(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const rowsToSend = firstTimeOnly ? filteredRows : csvRows;

  return (
    <div className="max-w-lg">
      {/* Mode toggle */}
      <div className="inline-flex bg-surface-hover rounded-lg p-1 mb-6">
        <button
          onClick={() => setMode("single")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-[40px] ${
            mode === "single"
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-secondary hover:text-ink"
          }`}
        >
          Single
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-[40px] ${
            mode === "bulk"
              ? "bg-surface text-ink shadow-sm"
              : "text-ink-secondary hover:text-ink"
          }`}
        >
          Bulk CSV
        </button>
      </div>

      <div className="space-y-5">
        <Select
          id="client"
          label="Client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        {/* Location selector */}
        {locations.length > 0 && (
          <Select
            id="location"
            label="Location (optional)"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
        )}

        {mode === "single" ? (
          <form onSubmit={handleSingleSend} className="space-y-5">
            <Input
              id="customerName"
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Smith"
              required
            />
            <Input
              id="customerEmail"
              label="Customer Email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              Send Review Request
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* First-time only toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={firstTimeOnly}
                  onChange={(e) => setFirstTimeOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-surface-active rounded-full peer-checked:bg-brand transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-ink-muted" />
                <span className="text-sm font-medium text-ink-secondary">
                  First-time patients only
                </span>
              </div>
            </label>

            {/* Column mapper (shown when auto-detection fails) */}
            {showMapper && (
              <CsvColumnMapper
                headers={rawHeaders}
                onConfirm={handleMapperConfirm}
                onCancel={handleMapperCancel}
              />
            )}

            {/* Upload area */}
            {!showMapper && (
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-1.5">
                  Upload CSV
                </label>
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-edge rounded-xl cursor-pointer hover:border-brand hover:bg-brand-light/30 transition-colors min-h-[100px]">
                  {csvRows.length > 0 ? (
                    <>
                      <FileText className="h-6 w-6 text-brand" />
                      <span className="text-sm font-medium text-ink">
                        {csvRows.length} rows loaded
                      </span>
                      <span className="text-xs text-ink-muted">Tap to replace</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-ink-muted" />
                      <span className="text-sm font-medium text-ink-secondary">
                        Choose a CSV file
                      </span>
                      <span className="text-xs text-ink-muted">
                        CSV with name and email columns (e.g. &quot;name&quot;, &quot;email&quot; or &quot;first_name&quot;, &quot;last_name&quot;, &quot;email&quot;)
                      </span>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* First-time filter status */}
            {csvRows.length > 0 && firstTimeOnly && (
              <div className="text-sm">
                {filterLoading ? (
                  <span className="text-ink-muted">Checking for first-time patients...</span>
                ) : (
                  <div className="flex gap-4">
                    <span className="text-green-600 font-medium">
                      {filteredRows.length} new
                    </span>
                    <span className="text-ink-muted">
                      {existingRows.length} existing (skipped)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            {rowsToSend.length > 0 && (
              <div className="bg-surface rounded-lg border border-edge overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  <div className="divide-y divide-edge-subtle">
                    {rowsToSend.slice(0, 20).map((row, i) => (
                      <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                        <span className="text-xs text-ink-muted w-5 shrink-0">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm text-ink">{row.name}</span>
                          <span className="text-xs text-ink-muted ml-2 hidden sm:inline">{row.email}</span>
                          <p className="text-xs text-ink-muted sm:hidden truncate">{row.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {rowsToSend.length > 20 && (
                  <div className="px-4 py-2 text-xs text-ink-muted bg-surface-secondary border-t">
                    + {rowsToSend.length - 20} more
                  </div>
                )}
              </div>
            )}

            {/* Progress bar */}
            {bulkSending && (
              <div>
                <div className="flex justify-between text-sm text-ink-secondary mb-1.5">
                  <span>Sending review requests...</span>
                  <span>{bulkProgress.sent} / {bulkProgress.total}</span>
                </div>
                <div className="w-full bg-surface-active rounded-full h-2.5">
                  <div
                    className="bg-brand rounded-full h-2.5 transition-all"
                    style={{
                      width: `${(bulkProgress.sent / bulkProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {rowsToSend.length > 0 && !bulkSending && (
              <Button onClick={handleBulkSend} className="w-full sm:w-auto">
                Send All ({rowsToSend.length} emails)
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
