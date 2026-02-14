import { createClient } from "@/lib/supabase/server";
import { AnalyticsView } from "@/components/dashboard/analytics-view";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-ink mb-4 sm:mb-6">Analytics</h2>
      <AnalyticsView clients={clients || []} />
    </div>
  );
}
