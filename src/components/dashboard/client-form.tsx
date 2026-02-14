"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Copy, MapPin, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Client, Location } from "@/lib/supabase/types";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface LocationRow {
  id?: string;
  name: string;
  google_place_id: string;
  contact_page_url: string;
}

interface ClientFormProps {
  client?: Client;
}

export function ClientForm({ client }: ClientFormProps) {
  const isEdit = !!client;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: client?.name || "",
    slug: client?.slug || "",
    google_place_id: client?.google_place_id || "",
    website_url: client?.website_url || "",
    contact_page_url: client?.contact_page_url || "",
    brand_color: client?.brand_color || "#2563EB",
    logo_url: client?.logo_url || "",
  });

  const [locations, setLocations] = useState<LocationRow[]>([]);

  // Load existing locations for edit mode
  useEffect(() => {
    if (isEdit && client?.id) {
      fetch(`/api/clients/${client.id}/locations`)
        .then((r) => r.json())
        .then((data: Location[]) => {
          if (Array.isArray(data)) {
            setLocations(
              data.map((l) => ({
                id: l.id,
                name: l.name,
                google_place_id: l.google_place_id,
                contact_page_url: l.contact_page_url,
              }))
            );
          }
        })
        .catch(() => {
          toast.error("Failed to load locations for this client.");
        });
    }
  }, [isEdit, client?.id]);

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: isEdit ? prev.slug : slugify(name),
    }));
  }

  function addLocation() {
    setLocations((prev) => [
      ...prev,
      { name: "", google_place_id: "", contact_page_url: "" },
    ]);
  }

  function removeLocation(index: number) {
    setLocations((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLocation(index: number, field: keyof LocationRow, value: string) {
    setLocations((prev) =>
      prev.map((loc, i) => (i === index ? { ...loc, [field]: value } : loc))
    );
  }

  function copyShareLink() {
    if (!client?.share_token) return;
    const url = `${window.location.origin}/shared/${client.share_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied!");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = isEdit ? `/api/clients/${client.id}` : "/api/clients";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const savedClient = await res.json();

      // Save locations if we have any
      const validLocations = locations.filter(
        (l) => l.name && l.google_place_id && l.contact_page_url
      );
      if (validLocations.length > 0) {
        const clientId = isEdit ? client.id : savedClient.id;
        await fetch(`/api/clients/${clientId}/locations`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locations: validLocations }),
        });
      }

      toast.success(isEdit ? `"${form.name}" updated` : `"${form.name}" created`);
      router.push("/dashboard/clients");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to save client. Check all required fields and try again.");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      <Input
        id="name"
        label="Client Name"
        value={form.name}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="Acme Plumbing"
        required
      />

      <Input
        id="slug"
        label="Slug"
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
        placeholder="acme-plumbing"
        required
        helperText="URL-safe identifier, auto-generated from name"
      />

      <Input
        id="google_place_id"
        label="Google Place ID"
        value={form.google_place_id}
        onChange={(e) => setForm({ ...form, google_place_id: e.target.value })}
        placeholder="ChIJ..."
        required
        helperText="Find it at developers.google.com/maps - Place ID Finder"
      />

      <Input
        id="website_url"
        label="Website URL"
        type="url"
        value={form.website_url}
        onChange={(e) => setForm({ ...form, website_url: e.target.value })}
        placeholder="https://acme-plumbing.com"
        required
      />

      <Input
        id="contact_page_url"
        label="Contact Page URL"
        type="url"
        value={form.contact_page_url}
        onChange={(e) => setForm({ ...form, contact_page_url: e.target.value })}
        placeholder="https://acme-plumbing.com/contact"
        helperText="Defaults to website_url/contact if left empty"
      />

      <div>
        <label
          htmlFor="brand_color"
          className="block text-sm font-medium text-ink-secondary mb-1.5"
        >
          Brand Color
        </label>
        <div className="flex items-center gap-3">
          <input
            id="brand_color"
            type="color"
            value={form.brand_color}
            onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
            className="h-11 w-14 rounded-lg border border-edge cursor-pointer"
          />
          <span className="text-sm text-ink-muted font-mono">{form.brand_color}</span>
        </div>
      </div>

      <Input
        id="logo_url"
        label="Logo URL (optional)"
        type="url"
        value={form.logo_url}
        onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
        placeholder="https://acme-plumbing.com/logo.png"
      />

      {/* Share Link (edit mode only) */}
      {isEdit && client?.share_token && (
        <div>
          <label className="block text-sm font-medium text-ink-secondary mb-1.5">
            <span className="flex items-center gap-1.5">
              <Link2 className="h-4 w-4" />
              Share Link
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/shared/${client.share_token}`}
              className="flex-1 px-3 py-2.5 border border-edge rounded-lg text-sm bg-surface-secondary text-ink-secondary min-h-[44px]"
            />
            <button
              type="button"
              onClick={copyShareLink}
              className="p-2.5 border border-edge rounded-lg hover:bg-surface-hover transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Copy className="h-4 w-4 text-ink-muted" />
            </button>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Share this link with the client to give them access to their dashboard
          </p>
        </div>
      )}

      {/* Locations section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-ink-secondary flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            Locations
          </label>
          <button
            type="button"
            onClick={addLocation}
            className="flex items-center gap-1 text-xs font-medium text-brand hover:text-brand/80 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Location
          </button>
        </div>

        {locations.length === 0 ? (
          <p className="text-xs text-ink-muted">
            No locations added. Single-location clients use the main Google Place ID and Contact URL above.
          </p>
        ) : (
          <div className="space-y-4">
            {locations.map((loc, i) => (
              <div
                key={i}
                className="border border-edge rounded-lg p-4 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-muted">
                    Location {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLocation(i)}
                    className="p-1 text-ink-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Input
                  id={`loc-name-${i}`}
                  label="Name"
                  value={loc.name}
                  onChange={(e) => updateLocation(i, "name", e.target.value)}
                  placeholder="Coconut Creek"
                />
                <Input
                  id={`loc-place-${i}`}
                  label="Google Place ID"
                  value={loc.google_place_id}
                  onChange={(e) => updateLocation(i, "google_place_id", e.target.value)}
                  placeholder="ChIJ..."
                />
                <Input
                  id={`loc-contact-${i}`}
                  label="Contact Page URL"
                  type="url"
                  value={loc.contact_page_url}
                  onChange={(e) => updateLocation(i, "contact_page_url", e.target.value)}
                  placeholder="https://example.com/coconut-creek/contact"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/dashboard/clients")}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="w-full sm:w-auto">
          {isEdit ? "Update Client" : "Create Client"}
        </Button>
      </div>
    </form>
  );
}
