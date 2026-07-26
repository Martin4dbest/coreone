"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import api from "@/lib/api";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        await api.get("/auth/me");
        setAuthenticated(true);
      } catch {
        localStorage.removeItem("access_token");

        const tenant = localStorage.getItem("tenant_slug");
        localStorage.removeItem("tenant_slug");

        if (tenant) {
          router.replace(`/${tenant}/login`);
        } else {
          router.replace("/login");
        }
      }
    }

    checkAuth();
  }, [router]);

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rose-50/30">
        <div className="text-center">
          <Loader2
            size={28}
            className="mx-auto animate-spin text-rose-500"
          />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
