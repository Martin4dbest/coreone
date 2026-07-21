"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Loader2,
  GraduationCap,
  Users,
  UserRound,
  BookOpen,
  Power,
Settings,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react";

import api from "@/lib/api";

type CurrentUser = {
  role: {
    name: string;
  };
};

type School = {
  id: number;
  name: string;
  school_code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  is_active: boolean;
};

export default function SchoolDetailsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [school, setSchool] = useState<School | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    async function loadSchool() {
      try {
        const [schoolResponse, userResponse] = await Promise.all([
          api.get(`/schools/${schoolId}`),
          api.get("/auth/me"),
        ]);

        setSchool(schoolResponse.data);
        setCurrentUser(userResponse.data);
      } catch (error) {
        console.error("Failed to load school:", error);
        setError("Unable to load this school.");
      } finally {
        setLoading(false);
      }
    }

    loadSchool();
  }, [schoolId]);

  if (loading) {
    






return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-rose-500"
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading school...
          </p>
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-10 text-center">
        <h2 className="font-bold text-slate-900">
          School unavailable
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {error}
        </p>

        <Link
          href="/dashboard/schools"
          className="mt-5 inline-flex text-sm font-semibold text-rose-500"
        >
          Return to Schools
        </Link>
      </div>
    );
  }

  const role =
    currentUser?.role?.name;

  const isSuperAdmin =
    role === "SUPER_ADMIN";

  const isSchoolAdmin =
    role === "SCHOOL_ADMIN";

  const isTeacher =
    role === "TEACHER";

  const schoolModules = [

    ...(isSuperAdmin ? [{
      title: "School Admins",
      description: "Manage administrators assigned to this school",
      icon: Settings,
      href: `/dashboard/schools/${schoolId}/admins`,
    }] : []),

    ...((isSuperAdmin || isSchoolAdmin) ? [{
      title: "Students",
      description: "Manage enrolled learners",
      icon: GraduationCap,
      href: `/dashboard/schools/${schoolId}/students`,
    },{
      title: "Teachers",
      description: "Manage teaching staff",
      icon: Users,
      href: `/dashboard/schools/${schoolId}/teachers`,
    },{
      title: "Staff",
      description: "Manage school personnel",
      icon: UserRound,
      href: `/dashboard/schools/${schoolId}/staff`,
    },{
      title: "Academics",
      description: "Levels, classes, subjects and results",
      icon: BookOpen,
      href: `/dashboard/schools/${schoolId}/academics`,
    }] : []),

    ...(isTeacher ? [{
      title: "My Students",
      description: "Students in your assigned classes",
      icon: GraduationCap,
      href: `/dashboard/schools/${schoolId}/students`,
    },{
      title: "My Classes",
      description: "Classes assigned to you",
      icon: BookOpen,
      href: `/dashboard/schools/${schoolId}/classes`,
    }] : []),

    {
      title: "Attendance",
      description: "Monitor attendance",
      icon: ClipboardCheck,
      href: `/dashboard/schools/${schoolId}/attendance`,
    },

    {
      title: "Results",
      description: "View and manage results",
      icon: BookOpen,
      href: `/dashboard/schools/${schoolId}/results`,
    },

    {
      title: "Events",
      description: "School events and activities",
      icon: CalendarDays,
      href: `/dashboard/schools/${schoolId}/events`,
    },

  ];

  async function toggleSchool() {
    if (!school) return;

    try {
      const action = school.is_active
        ? "deactivate"
        : "activate";

      const response = await api.patch(
        `/schools/${schoolId}/${action}`
      );

      setSchool(response.data);

    } catch (error) {
      console.error(
        "Failed to update school status:",
        error
      );
    }
  }


  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 shadow-sm">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-rose-100/60 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
                <Building2 size={26} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500">
                  {school.school_code}
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {school.name}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  School administration overview
                </p>
              </div>
            </div>

            <button
              onClick={toggleSchool}
              className={`flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                school.is_active
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Power size={14} />

              {school.is_active
                ? "Deactivate School"
                : "Activate School"}
            </button>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <Mail size={17} className="text-rose-400" />
              {school.email}
            </div>

            <div className="flex items-center gap-3">
              <Phone size={17} className="text-rose-400" />
              {school.phone}
            </div>

            <div className="flex items-center gap-3">
              <MapPin size={17} className="text-rose-400" />
              {school.city}, {school.state}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div>
          <p className="text-sm font-semibold text-rose-500">
            School Workspace
          </p>

          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Administration
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Open and manage this school's administrative modules.
          </p>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {schoolModules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.title}
                href={module.href}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-rose-100 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <Icon size={21} />
                </div>

                <h3 className="mt-5 font-bold text-slate-900">
                  {module.title}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  {module.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
