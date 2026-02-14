import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <Sidebar />
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="px-4 py-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
