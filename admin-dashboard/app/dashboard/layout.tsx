"use client";

import { useEffect, useState } from "react";

import AuthGuard from "@/components/auth-guard";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import api from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-rose-50/20">
        {role !== "ACCOUNTANT" && role !== "BOOK_STOREKEEPER" && (
          <Sidebar />
        )}

        <div className="min-w-0 flex-1">
          {role !== "ACCOUNTANT" && role !== "BOOK_STOREKEEPER" && (
            <Topbar />
          )}

          <main className="min-w-0 p-4 sm:p-5 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
