import AuthGuard from "@/components/auth-guard";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-rose-50/20">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar />

          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
