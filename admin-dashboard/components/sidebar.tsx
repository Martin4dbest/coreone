"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogIn,
  School,
  Users,
  ShieldCheck,
  Settings,
  FileText,
  GraduationCap,
  UserRound,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  LucideIcon,
} from "lucide-react";

import Logo from "./logo";
import api from "@/lib/api";
import { useWorkspaceStore } from "@/stores/workspace-store";

interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  color: string;
  feature?: string;
  schoolPrimaryOnly?: boolean;
}

export default function Sidebar() {
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isPrimarySchoolAdmin, setIsPrimarySchoolAdmin] = useState(false);
  const [schoolLogo, setSchoolLogo] = useState("");
  const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);

  const getCurrentUser = useWorkspaceStore((state) => state.getCurrentUser);
  const getSchool = useWorkspaceStore((state) => state.getSchool);
  const clearWorkspaceCache = useWorkspaceStore(
    (state) => state.clearWorkspaceCache
  );

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const user = await getCurrentUser();

        const userRole = (
          typeof user.role === "string" ? user.role : user.role?.name || ""
        ).toUpperCase();

        const userSchoolId = user.school_id;

        if (!mounted) {
          return;
        }

        console.log("SIDEBAR ROLE:", userRole);
        console.log("SIDEBAR USER:", user);

        setRole(userRole);
        setIsPrimarySchoolAdmin(Boolean(user?.is_primary_school_admin));

        if (userSchoolId) {
          const schoolIdString = String(userSchoolId);

          setSchoolId(schoolIdString);

          // Load the school's feature-control state.
          try {
            const featuresResponse = await api.get(
              `/school-features/${schoolIdString}`
            );

            if (mounted) {
              setSchoolFeatures(
                Array.isArray(featuresResponse.data)
                  ? featuresResponse.data
                  : []
              );
              setFeaturesLoaded(true);
            }
          } catch (featureError) {
            console.error(
              "Unable to load school features for sidebar:",
              featureError
            );

            if (mounted) {
              // Fail open during a temporary API failure.
              setFeaturesLoaded(true);
            }
          }

          const school = await getSchool(schoolIdString);

          if (mounted) {
            setSchoolName(school.name || "");
          }

          try {
            const brandingResponse = await api.get(
              `/branding?school_id=${schoolIdString}`
            );

            if (mounted) {
              setSchoolLogo(brandingResponse.data.logo_url || "");
            }
          } catch (brandingError: any) {
            if (brandingError.response?.status !== 404) {
              console.error(
                "Unable to load school branding:",
                brandingError
              );
            }

            if (mounted) {
              setSchoolLogo("");
            }
          }
        }
      } catch (error) {
        console.error("Unable to load sidebar user/school:", error);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [getCurrentUser, getSchool]);

  const schoolBase = `/dashboard/schools/${schoolId}`;

  const superAdminMenu: MenuItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      color: "text-blue-400",
    },
    {
      name: "Schools Management",
      href: "/dashboard/schools",
      icon: School,
      color: "text-emerald-400",
    },
    {
      name: "Login Activity",
      href: "/dashboard/login-activity",
      icon: LogIn,
      color: "text-blue-400",
    },
    {
      name: "Licensing",
      href: "/dashboard/licensing",
      icon: FileText,
      color: "text-cyan-400",
    },
    {
      name: "Administrators",
      href: "/dashboard/admins",
      icon: Users,
      color: "text-purple-400",
    },
    {
      name: "Super Admins",
      href: "/dashboard/super-admins",
      icon: ShieldCheck,
      color: "text-rose-400",
    },
    {
      name: "Roles & Permissions",
      href: "/dashboard/roles",
      icon: ShieldCheck,
      color: "text-orange-400",
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: FileText,
      color: "text-yellow-400",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      color: "text-slate-300",
    },
  ];

  const schoolAdminMenu: MenuItem[] = [
    {
      name: "School Dashboard",
      href: schoolBase,
      icon: LayoutDashboard,
      color: "text-blue-400",
    },
    {
      name: "Teachers",
      href: `${schoolBase}/teachers`,
      icon: Users,
      color: "text-orange-400",
      feature: "teachers",
    },
    {
      name: "Academics",
      href: `${schoolBase}/academics`,
      icon: BookOpen,
      color: "text-rose-400",
      feature: "academics",
    },
    {
      name: "Results",
      href: `${schoolBase}/results`,
      icon: FileText,
      color: "text-yellow-400",
      feature: "results",
    },
    {
      name: "Licensing",
      href: `${schoolBase}/licensing`,
      icon: FileText,
      color: "text-cyan-400",
      feature: "licensing",
    },
    {
      name: "Settings",
      href: `${schoolBase}/settings`,
      icon: Settings,
      color: "text-slate-300",
    },
  ];

  const teacherMenu: MenuItem[] = [
    {
      name: "Dashboard",
      href: "/teacher/dashboard",
      icon: LayoutDashboard,
      color: "text-blue-400",
    },
    {
      name: "Results",
      href: "/teacher/results",
      icon: FileText,
      color: "text-yellow-400",
    },
    {
      name: "Learning",
      href: "/teacher/learning",
      icon: BookOpen,
      color: "text-cyan-400",
    },
  ];

  const featureEnabled = (featureKey: string) => {
    // Feature visibility is fail-closed.
    // A feature must explicitly exist and be enabled.
    // This prevents optional modules from appearing when
    // feature state has not loaded or the row is missing.
    if (!featuresLoaded) {
      return false;
    }

    const feature = schoolFeatures.find(
      (item) =>
        String(item?.feature_key || "").trim().toLowerCase() ===
        featureKey.trim().toLowerCase()
    );

    return feature?.enabled === true;
  };

  const filteredSchoolAdminMenu = schoolAdminMenu.filter((item) => {
    if (item.schoolPrimaryOnly && !isPrimarySchoolAdmin) {
      return false;
    }

    if (!item.feature) {
      return true;
    }

    return featureEnabled(item.feature);
  });

  let menu = superAdminMenu;

  if (role === "SCHOOL_ADMIN") {
    menu = filteredSchoolAdminMenu;
  }

  if (role === "TEACHER") {
    menu = teacherMenu;
  }

  function handleLogout() {
    clearWorkspaceCache();
    localStorage.removeItem("access_token");

    const tenant = localStorage.getItem("tenant_slug");
    localStorage.removeItem("tenant_slug");

    if (tenant) {
      router.replace(`/${tenant}/login`);
    } else {
      router.replace("/login");
    }
  }

  console.log("FINAL MENU ROLE:", role, menu);

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[70] flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg lg:hidden"
      >
        <Menu size={22} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[80] bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-[90] w-[min(320px,88vw)] p-3
          transition-transform duration-200 ease-out
          lg:static lg:z-auto lg:block lg:min-h-screen lg:w-80 lg:translate-x-0 lg:p-5
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="relative h-full overflow-y-auto rounded-3xl bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 p-5 shadow-2xl lg:p-6">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 lg:hidden"
          >
            <X size={20} />
          </button>

          <div className="relative min-h-40 rounded-2xl bg-white/10 p-4 backdrop-blur">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white/10">
              {schoolLogo ? (
                <Image
                  src={schoolLogo}
                  alt={schoolName || "School logo"}
                  fill
                  unoptimized
                  className="object-contain p-2"
                />
              ) : (
                <Logo />
              )}
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-indigo-200">
              {schoolName || "Smart School Platform"}
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {menu.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="group flex items-center gap-4 rounded-2xl px-4 py-3 transition hover:bg-white/10"
                >
                  <Icon size={21} className={item.color} />

                  <span className="font-semibold text-white">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-red-500/10"
            >
              <LogOut size={21} className="text-red-400" />

              <span className="font-semibold text-white">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}