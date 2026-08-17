"use client";

import Link from "next/link";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LockKeyhole,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";

import api from "@/lib/api";

type CurrentUser = {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  role?:
    | string
    | {
        name?: string;
      };
};

export default function Topbar() {
  const pathname = usePathname();
  const [partnerSchoolsEnabled, setPartnerSchoolsEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    const match = pathname.match(/\/dashboard\/schools\/(\d+)/);

    /*
     * Outside a school workspace there is no current school.
     * Do NOT force Notifications ON.
     */
    if (!match) {
      setPartnerSchoolsEnabled(false);
      setNotificationsEnabled(false);

      return () => {
        mounted = false;
      };
    }

    const schoolId = match[1];

    async function loadSchoolFeatures() {
      try {
        const response = await api.get(
          `/school-features/${schoolId}`
        );

        const data = response.data;

        const features = Array.isArray(data)
          ? data
          : Array.isArray(data?.features)
            ? data.features
            : [];

        const featureEnabled = (featureKey: string) =>
          features.some(
            (feature: {
              feature_key?: string;
              enabled?: boolean;
            }) =>
              feature.feature_key === featureKey &&
              feature.enabled === true
          );

        if (mounted) {
          setPartnerSchoolsEnabled(
            featureEnabled("partner_schools")
          );

          setNotificationsEnabled(
            featureEnabled("notifications")
          );
        }
      } catch (error) {
        console.error(
          "Failed to load school features for Topbar:",
          error
        );

        if (mounted) {
          setPartnerSchoolsEnabled(false);
          setNotificationsEnabled(false);
        }
      }
    }

    loadSchoolFeatures();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const partnerSchoolsMatch = pathname.match(
    /\/dashboard\/schools\/(\d+)/
  );

  const partnerSchoolsHref = partnerSchoolsMatch
    ? `/dashboard/schools/${partnerSchoolsMatch[1]}/partner-schools`
    : null;

  const router = useRouter();


  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch {
        localStorage.removeItem("access_token");
        router.replace("/login");
      }
    }

    loadUser();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("access_token");

    const tenant = localStorage.getItem("tenant_slug");
    localStorage.removeItem("tenant_slug");

    if (tenant) {
      router.replace(`/${tenant}/login`);
    } else {
      router.replace("/login");
    }
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();

    const query = search.trim().toLowerCase();

    if (!query) return;

    const schoolMatch = pathname.match(
      /\/dashboard\/schools\/(\d+)/
    );

    const schoolId = schoolMatch?.[1];

    const globalRoutes = [
      {
        keywords: ["dashboard", "home", "overview"],
        href: "/dashboard",
      },
      {
        keywords: ["school", "schools", "institution", "institutions"],
        href: "/dashboard/schools",
      },
      {
        keywords: ["administrator", "administrators", "admin", "admins"],
        href: "/dashboard/admins",
      },
      {
        keywords: ["role", "roles", "permission", "permissions"],
        href: "/dashboard/roles",
      },
      {
        keywords: ["report", "reports"],
        href: "/dashboard/reports",
      },
      {
        keywords: ["setting", "settings"],
        href: "/dashboard/settings",
      },
    ];

    const schoolRoutes = schoolId
      ? [
          {
            keywords: ["student", "students", "pupil", "pupils", "learner", "learners"],
            href: `/dashboard/schools/${schoolId}/students`,
          },
          {
            keywords: ["teacher", "teachers"],
            href: `/dashboard/schools/${schoolId}/teachers`,
          },
          {
            keywords: ["staff", "personnel", "employee", "employees"],
            href: `/dashboard/schools/${schoolId}/staff`,
          },
          {
            keywords: ["class", "classes", "classroom", "classrooms"],
            href: `/dashboard/schools/${schoolId}/classes`,
          },
          {
            keywords: ["academic", "academics"],
            href: `/dashboard/schools/${schoolId}/academics`,
          },
          {
            keywords: ["session", "sessions", "academic session"],
            href: `/dashboard/schools/${schoolId}/academics/sessions`,
          },
          {
            keywords: ["term", "terms"],
            href: `/dashboard/schools/${schoolId}/academics/terms`,
          },
          {
            keywords: ["department", "departments"],
            href: `/dashboard/schools/${schoolId}/academics/departments`,
          },
          {
            keywords: ["subject", "subjects"],
            href: `/dashboard/schools/${schoolId}/academics/subjects`,
          },
          {
            keywords: ["level", "levels"],
            href: `/dashboard/schools/${schoolId}/levels`,
          },
          {
            keywords: ["attendance"],
            href: `/dashboard/schools/${schoolId}/attendance`,
          },
          {
            keywords: ["event", "events"],
            href: `/dashboard/schools/${schoolId}/events`,
          },
          {
            keywords: ["school setting", "school settings"],
            href: `/dashboard/schools/${schoolId}/settings`,
          },
        ]
      : [];

    const routes = [...schoolRoutes, ...globalRoutes];

    const match = routes.find((route) =>
      route.keywords.some(
        (keyword) =>
          keyword === query ||
          keyword.includes(query) ||
          query.includes(keyword)
      )
    );

    if (match) {
      setSearch("");
      router.push(match.href);
      return;
    }

    router.push(
      `/dashboard/schools?search=${encodeURIComponent(search.trim())}`
    );
  }

  const rawRoleName =
  typeof user?.role === "string"
    ? user.role
    : user?.role?.name || "";

  const isSuperAdmin = rawRoleName === "SUPER_ADMIN";

  const displayName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    (rawRoleName === "TEACHER"
      ? "Teacher"
      : isSuperAdmin
        ? "Super Admin"
        : "Admin");

  const roleName =
    rawRoleName
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
const initials = displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex min-h-20 flex-wrap items-center gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-6 lg:h-20 lg:flex-nowrap lg:gap-0 lg:py-0">
      <form
        onSubmit={handleSearch}
        className="order-2 relative w-full max-w-none lg:order-none lg:max-w-xl"
      >
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search students, schools, academics, attendance..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-rose-200 focus:bg-white focus:ring-4 focus:ring-rose-50"
        />
      </form>

      <div className="order-1 ml-auto flex items-center gap-2 sm:gap-3 lg:order-none">
        {notificationsEnabled && (
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Bell size={20} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-pink-50 text-sm font-bold text-rose-600">
              {initials || <UserRound size={18} />}
            </div>

            <div className="hidden text-left lg:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>

              <p className="mt-0.5 text-xs capitalize text-slate-400">
                {roleName.replaceAll("_", " ").toLowerCase()}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`hidden text-slate-400 transition-transform lg:block ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-slate-200/60">
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {displayName}
                </p>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {user?.email}
                </p>
              </div>

              <Link
                href="/change-password"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <LockKeyhole size={17} />
                Change Password
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
                {partnerSchoolsEnabled && partnerSchoolsHref ? (
              <a
                href={partnerSchoolsHref}
                className="hidden items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:inline-flex"
              >
                Partner Schools
              </a>
            ) : null}
</header>
  );
}
