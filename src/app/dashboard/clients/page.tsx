import { createClient } from "@/lib/supabase/server";
import { ClientList } from "@/components/dashboard/client-list";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Clients</h2>
      <ClientList clients={clients || []} />
    </div>
  );
}
