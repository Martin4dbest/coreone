"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import AuthGuard from "@/components/auth-guard";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import api from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadRole() {
      try {
        const response = await api.get("/auth/me");
        const user = response.data;

        const userRole = (
          typeof user?.role === "string"
            ? user.role
            : user?.role?.name || ""
        )
          .toUpperCase()
          .trim();

        if (mounted) {
          setRole(userRole);
        }
      } catch (error) {
        console.error("Unable to load dashboard user role:", error);
      }
    }

    loadRole();

    return () => {
      mounted = false;
    };
  }, []);

  function handleAccountantLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("tenant_slug");

    router.replace("/");
  }

  const isBookkeepingRole =
    role === "ACCOUNTANT" || role === "BOOK_STOREKEEPER";

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-rose-50/20">
        {!isBookkeepingRole && <Sidebar />}

        <div className="min-w-0 flex-1">
          {!isBookkeepingRole && <Topbar />}

          {isBookkeepingRole && (
            <div className="flex items-center justify-end border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
              <button
                type="button"
                onClick={handleAccountantLogout}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                title="Log out"
              >
                <ArrowLeft size={17} />
                <span>Logout</span>
              </button>
            </div>
          )}

          <main className="min-w-0 p-4 sm:p-5 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
