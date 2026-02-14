import { createClient } from "@/lib/supabase/server";
import { SendForm } from "@/components/dashboard/send-form";

export default async function SendPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-ink mb-4 sm:mb-6">
        Send Reviews
      </h2>
      <SendForm clients={clients || []} />
    </div>
  );
}
