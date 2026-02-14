import { createClient } from "@/lib/supabase/server";
import { SettingsView } from "@/components/dashboard/settings-view";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [clientsRes, batchesRes] = await Promise.all([
    supabase
      .from("clients")
      .select("*, locations(*)")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("send_batches")
      .select("*, clients(name)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        Settings
      </h2>
      <SettingsView
        clients={clientsRes.data || []}
        recentBatches={batchesRes.data || []}
      />
    </div>
  );
}
