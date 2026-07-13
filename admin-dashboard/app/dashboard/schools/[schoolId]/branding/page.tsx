"use client";

import { use, useEffect, useState } from "react";
import { Palette, Loader2 } from "lucide-react";
import api from "@/lib/api";

type Branding = {
  id: number;
  school_id: number;
  logo_url: string | null;
  app_icon_url: string | null;
  splash_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  motto: string | null;
  login_title: string | null;
  login_message: string | null;
};

export default function BrandingPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBranding() {
      try {
        const response = await api.get(
          `/school-branding/${schoolId}`
        );

        setBranding(response.data);
      } catch (error) {
        console.error("Failed to load branding:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBranding();
  }, [schoolId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-slate-500">
        <Loader2 className="animate-spin" />
        Loading branding...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8">
        <div className="flex items-center gap-3">
          <Palette className="text-rose-500" />
          <h1 className="text-3xl font-bold text-slate-900">
            School Branding
          </h1>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Manage logo, colours, splash screen and login appearance.
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-6">
        {branding ? (
          <pre className="text-sm">
            {JSON.stringify(branding, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-slate-500">
            No branding configuration found.
          </p>
        )}
      </section>
    </div>
  );
}
