"use client";

import Link from "next/link";

import { use, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserRound,
  School,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Settings,
  Palette,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import api from "@/lib/api";

type SchoolData = {
  id: number;
  name: string;
  school_code: string;
};

type BrandingData = {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  motto: string | null;
};

type CurrentUser = {
  id: number;
  email: string;
  school_id: number | null;
  role: {
    name: string;
  };
};

export default function SchoolWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);
  const pathname = usePathname();

  const [school, setSchool] = useState<SchoolData | null>(null);
const [branding, setBranding] = useState<BrandingData | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadWorkspace() {
      try {
    const [schoolResponse, userResponse] = await Promise.all([
      api.get(`/schools/${schoolId}`),
      api.get("/auth/me"),
    ]);

    let brandingData = null;

    try {
      const brandingResponse = await api.get(
        `/branding?school_id=${schoolId}`
      );

      brandingData = brandingResponse.data;
    } catch (brandingError: any) {
      if (brandingError.response?.status !== 404) {
        console.error(
          "Failed to load school branding:",
          brandingError
        );
      }
    }

    if (mounted) {
      setSchool(schoolResponse.data);
      setCurrentUser(userResponse.data);
      setBranding(brandingData);
    }
      } catch (error) {
        console.error("Failed to load school workspace:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  const basePath = `/dashboard/schools/${schoolId}`;

  const navigation = [
    {
      name: "Overview",
      href: basePath,
      icon: LayoutDashboard,
    },
    {
      name: "Students",
      href: `${basePath}/students`,
      icon: GraduationCap,
    },
    {
      name: "Teachers",
      href: `${basePath}/teachers`,
      icon: Users,
    },
    {
      name: "Staff",
      href: `${basePath}/staff`,
      icon: UserRound,
    },
    {
      name: "Classes",
      href: `${basePath}/classes`,
      icon: School,
    },
    {
      name: "Academics",
      href: `${basePath}/academics`,
      icon: BookOpen,
    },
    {
      name: "Attendance",
      href: `${basePath}/attendance`,
      icon: ClipboardCheck,
    },
    {
      name: "Learning",
      href: `${basePath}/learning`,
      icon: BookOpen,
    },
    {
      name: "Events",
      href: `${basePath}/events`,
      icon: CalendarDays,
    },
    {
      name: "Settings",
      href: `${basePath}/settings`,
      icon: Settings,
},
{
name: "Branding",
href: `${basePath}/branding`,
icon: Palette,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2
          size={30}
          className="animate-spin text-rose-500"
        />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8">
        <h2 className="text-xl font-bold text-slate-900">
          School unavailable
        </h2>
      </div>
    );
  }

  const isSuperAdmin =
    currentUser?.role?.name === "SUPER_ADMIN";

  return (
    <div className="space-y-7">

      {/* SUPER ADMIN ONLY */}
      {isSuperAdmin && (
        <section className="flex flex-col justify-between gap-5 rounded-[28px] border border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50 p-6 md:flex-row md:items-center">

          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">
              <ShieldCheck size={17} />
              Super Admin Access
            </div>

              <h2 className="mt-3 text-xl font-bold text-slate-900">
                Managing: {school.name}
              </h2>

            <p className="mt-1 text-xs text-slate-500">
              School Code: {school.school_code}
            </p>
          </div>

          <Link
            href="/dashboard/schools"
            className="w-fit rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Exit School Workspace
          </Link>

        </section>
      )}

    
  {/* SCHOOL BRANDING */}
  {branding && (
    <section
      className="mt-5 flex items-center gap-4 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm"
      style={{
        borderColor: branding.primary_color,
      }}
    >
      {branding.logo_url && (
        <img
          src={branding.logo_url}
          alt={`${school.name} logo`}
          className="h-16 w-16 rounded-2xl border border-slate-100 object-contain bg-white"
        />
      )}

      <div>
        <h2
          className="text-xl font-bold"
          style={{
            color: branding.primary_color,
          }}
        >
          {school.name}
        </h2>

        {branding.motto && (
          <p className="mt-1 text-sm text-slate-500">
            {branding.motto}
          </p>
        )}
      </div>
    </section>
  )}

  <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === basePath
              ? pathname === basePath
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex
                shrink-0
                items-center
                gap-2
                rounded-xl
                px-4
                py-2.5
                text-sm
                font-semibold
                transition
                ${
                  active
                    ? "bg-rose-500 text-white shadow-sm"
                    : "text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                }
              `}
            >
              <Icon size={17} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {children}

    </div>
  );
}