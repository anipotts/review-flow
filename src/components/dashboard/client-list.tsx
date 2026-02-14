"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Client } from "@/lib/supabase/types";

export function ClientList({ clients: initial }: { clients: Client[] }) {
  const [clients, setClients] = useState(initial);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this client?")) return;

    setDeleting(id);
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });

    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success("Client deleted");
    } else {
      toast.error("Failed to delete client");
    }
    setDeleting(null);
  }

  async function toggleActive(client: Client) {
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !client.is_active }),
    });

    if (res.ok) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === client.id ? { ...c, is_active: !c.is_active } : c
        )
      );
      toast.success(`Client ${client.is_active ? "deactivated" : "activated"}`);
    } else {
      toast.error("Failed to update client");
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent min-h-[44px]"
          />
        </div>
        <Link href="/dashboard/clients/new" className="shrink-0">
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Client</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Slug</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">Color</th>
              <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id} className="border-b border-gray-50">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">{client.name}</td>
                <td className="px-6 py-3 text-sm text-gray-500">{client.slug}</td>
                <td className="px-6 py-3">
                  <button onClick={() => toggleActive(client)} className="min-h-[32px]">
                    <Badge status={client.is_active ? "sent" : "pending"} />
                  </button>
                </td>
                <td className="px-6 py-3">
                  <div
                    className="w-6 h-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: client.brand_color }}
                  />
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      disabled={deleting === client.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 min-w-[36px] min-h-[36px] flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  {search ? "No clients match your search" : "No clients yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {filtered.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: client.brand_color }}
                  />
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {client.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500">{client.slug}</p>
              </div>
              <button
                onClick={() => toggleActive(client)}
                className="shrink-0 min-h-[32px]"
              >
                <Badge status={client.is_active ? "sent" : "pending"} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 rounded-lg min-h-[44px] transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <div className="w-px h-5 bg-gray-200" />
              <button
                onClick={() => handleDelete(client.id)}
                disabled={deleting === client.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg disabled:opacity-50 min-h-[44px] transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
            {search ? "No clients match your search" : "No clients yet"}
          </div>
        )}
      </div>
    </div>
  );
}
