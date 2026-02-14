import { ClientForm } from "@/components/dashboard/client-form";

export default function NewClientPage() {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Add Client</h2>
      <ClientForm />
    </div>
  );
}
