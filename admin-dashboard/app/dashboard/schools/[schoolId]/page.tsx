"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPin,
  Phone,
  Loader2,
  GraduationCap,
  Users,
  UserRound,
  BookOpen,
} from "lucide-react";

import api from "@/lib/api";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSchool() {
      try {
        const response = await api.get(`/schools/${schoolId}`);
        setSchool(response.data);
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

  const schoolModules = [
    {
      title: "Students",
      description: "Manage enrolled learners",
      icon: GraduationCap,
    },
    {
      title: "Teachers",
      description: "Manage teaching staff",
      icon: Users,
    },
    {
      title: "Staff",
      description: "Manage school personnel",
      icon: UserRound,
    },
    {
      title: "Academics",
      description: "Classes, subjects and results",
      icon: BookOpen,
    },
  ];

  return (
    <div className="space-y-7">
      <Link
        href="/dashboard/schools"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-rose-500"
      >
        <ArrowLeft size={17} />
        Back to Schools
      </Link>

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

            <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600">
              {school.is_active ? "Active School" : "Inactive School"}
            </span>
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
              <div
                key={module.title}
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
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
