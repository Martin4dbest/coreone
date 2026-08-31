"use client";

import Link from "next/link";

import { use, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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
  LibraryBig,
  MonitorPlay,
  Globe,
  FileQuestion,
  Bell,
  Bus,
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

type SchoolFeature = {
  id: number;
  school_id: number;
  feature_key: string;
  enabled: boolean;
};

type NavigationItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  feature?: string;
  superAdminOnly?: boolean;
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
  const [features, setFeatures] = useState<SchoolFeature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadWorkspace() {
      try {
        const userResponse = await api.get("/auth/me");
        const user = userResponse.data;
        const role = user?.role?.name;

        // Accountant / Book Storekeeper:
        // DO NOT call school, branding, or feature endpoints.
        // They only render the School Books page.
        if (
          role === "ACCOUNTANT" ||
          role === "BOOK_STOREKEEPER"
        ) {
          if (mounted) {
            setCurrentUser(user);
            setSchool(null);
            setBranding(null);
            setFeatures([]);
            setLoading(false);
          }
          return;
        }

        const schoolResponse = await api.get(
          `/schools/${schoolId}`
        );

        let brandingData: BrandingData | null = null;

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

        let featureData: SchoolFeature[] = [];

        try {
          const featureResponse = await api.get(
            `/school-features/${schoolId}`
          );
          featureData = featureResponse.data || [];
        } catch (featureError: any) {
          console.error(
            "Failed to load school features:",
            featureError
          );
        }

        if (mounted) {
          setSchool(schoolResponse.data);

        // ------------------------------------------------------
        // COREONE TENANT SYNC
        //
        // The School Workspace URL is authoritative. Whenever
        // /dashboard/schools/{schoolId} is opened, persist the
        // selected school's code so every tenant-aware API call
        // sends the correct X-Tenant header.
        // ------------------------------------------------------
        if (typeof window !== "undefined") {
          const selectedSchool = schoolResponse.data;

          if (selectedSchool?.school_code) {
            localStorage.setItem(
              "school_code",
              String(selectedSchool.school_code)
                .trim()
                .toUpperCase()
            );

            localStorage.setItem(
              "tenant_slug",
              String(selectedSchool.school_code)
                .trim()
                .toUpperCase()
            );

            localStorage.setItem(
              "tenant",
              JSON.stringify({
                id: selectedSchool.id,
                name: selectedSchool.name,
                school_code: String(
                  selectedSchool.school_code
                )
                  .trim()
                  .toUpperCase(),
              })
            );
          }
        }
          setCurrentUser(user);
          setBranding(brandingData);
          setFeatures(featureData);
        }
      } catch (error) {
        console.error(
          "Failed to load school workspace:",
          error
        );
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

  // ----------------------------------------------------------
  // CLASS TEACHER LEARNING MODE
  //
  // Teachers are allowed to use the EXISTING school Learning
  // modules. When they enter through the teacher Learning Centre,
  // the school-admin sidebar/topbar must NOT be shown.
  //
  // ?teacherLearning=1 is only a presentation/layout flag.
  // It does NOT create another CBT, Ebooks, YouTube or Browser.
  // ----------------------------------------------------------
  const searchParams = useSearchParams();
  const teacherLearning =
    searchParams.get("teacherLearning") === "1";

  const featureEnabled = (featureKey: string) => {
    return features.some(
      (feature) =>
        feature.feature_key === featureKey &&
        feature.enabled === true
    );
  };

  const navigation: NavigationItem[] = [
    {
      name: "Overview",
      href: basePath,
      icon: LayoutDashboard,
    },
    {
      name: "Partner Schools",
      href: `${basePath}/partner-schools`,
      icon: Users,
      feature: "partner_schools",
    },
    {
      name: "Teachers",
      href: `${basePath}/teachers`,
      icon: Users,
      feature: "teachers",
    },
    {
      name: "Students",
      href: `${basePath}/students`,
      icon: GraduationCap,
      feature: "students",
    },
    {
      name: "Parents",
      href: `${basePath}/parents`,
      icon: UserRound,
    },
    {
      name: "Staff",
      href: `${basePath}/staff`,
      icon: UserRound,
      feature: "staff",
    },
    {
      name: "Academics",
      href: `${basePath}/academics`,
      icon: BookOpen,
      feature: "academics",
    },
    {
      name: "Learning",
      href: `${basePath}/learning`,
      icon: BookOpen,
      feature: "learning",
    },
    {
      name: "School Books",
      href: `${basePath}/school-books`,
      icon: BookOpen,
      feature: "school_books",
    },
    {
      name: "School Bus",
      href: `${basePath}/school-bus`,
      icon: Bus,
      feature: "school_bus",
    },
    {
      name: "Events",
      href: `${basePath}/events`,
      icon: CalendarDays,
      feature: "events",
    },
    {
      name: "Notifications",
      href: `${basePath}/notifications`,
      icon: Bell,
      feature: "notifications",
    },
    {
      name: "Settings",
      href: `${basePath}/settings`,
      icon: Settings,
      feature: "settings",
    },
    {
      name: "Branding",
      href: `${basePath}/branding`,
      icon: Palette,
      feature: "branding",
    },
    {
      name: "Licensing",
      href: `${basePath}/licensing`,
      icon: ShieldCheck,
      feature: "licensing",
    },
    {
      name: "Features",
      href: `${basePath}/features`,
      icon: ShieldCheck,
      superAdminOnly: true,
    },
    {
      name: "Results",
      href: `${basePath}/results`,
      icon: BookOpen,
      feature: "results",
    },
    {
      name: "Ebooks",
      href: `${basePath}/ebooks`,
      icon: BookOpen,
      feature: "ebooks",
    },
    {
      name: "Internal Browser",
      href: `${basePath}/browser`,
      icon: Globe,
      feature: "browser",
    },
    {
      name: "YouTube Learning",
      href: `${basePath}/youtube-learning`,
      icon: MonitorPlay,
      feature: "youtube_learning",
    },
    {
      name: "CBT",
      href: `${basePath}/cbt`,
      icon: FileQuestion,
      feature: "cbt",
    },
  ];

  const currentRole = currentUser?.role?.name;

  /*
   * ACCOUNTANT = SCHOOL BOOKKEEPER
   *
   * Accountants must NOT inherit the School Admin workspace.
   * They only need the school overview and School Books/inventory
   * functionality from this workspace.
   *
   * SUPER_ADMIN and SCHOOL_ADMIN retain the normal navigation.
   */
  const visibleNavigation = navigation.filter((item) => {
    /*
     * ACCOUNTANT = SCHOOL BOOKKEEPER
     *
     * Accountants must only see the parts of the school workspace
     * required for bookkeeping. School Books is their primary
     * workspace and must remain accessible even if the optional
     * school_books feature flag is disabled.
     */
    if (currentRole === "ACCOUNTANT") {
      return (
        item.name === "Overview" ||
        item.name === "School Books"
      );
    }

    /*
     * BOOK_STOREKEEPER has the same School Books workspace access
     * as an Accountant.
     */
    if (currentRole === "BOOK_STOREKEEPER") {
      return (
        item.name === "Overview" ||
        item.name === "School Books"
      );
    }

    /*
     * SUPER_ADMIN and SCHOOL_ADMIN retain the normal navigation.
     * Feature toggles continue to control their optional modules.
     */
    return (
      (!item.superAdminOnly ||
        currentRole === "SUPER_ADMIN") &&
      (!item.feature || featureEnabled(item.feature))
    );
  });

  // ----------------------------------------------------------
  // TEACHER LEARNING MODE
  //
  // Render the EXISTING school page directly.
  // This bypasses the School Admin sidebar/topbar only.
  // ----------------------------------------------------------
  if (teacherLearning) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={28}
            className="mx-auto animate-spin text-rose-500"
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading school workspace...
          </p>
        </div>
      </div>
    );
  }

  // ACCOUNTANT / BOOK_STOREKEEPER:
  // They do NOT use the school workspace sidebar/header.
  // They only need the School Books page.
  if (
    currentRole === "ACCOUNTANT" ||
    currentRole === "BOOK_STOREKEEPER"
  ) {
    return <>{children}</>;
  }

  if (!school) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            School unavailable
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Unable to load this school workspace.
          </p>
        </div>
      </div>
    );
  }

  const isSuperAdmin =
    currentUser?.role?.name === "SUPER_ADMIN";

  return (
    <div>
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

      <nav className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
        {visibleNavigation.map((item) => {
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

      <main className="mt-6">
        {children}
      </main>
    </div>
  );
}
