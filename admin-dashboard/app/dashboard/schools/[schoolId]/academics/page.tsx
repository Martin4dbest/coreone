"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Layers3,
  School,
  LibraryBig,
  CalendarDays,
  Clock3,
  Building2,
  GraduationCap,
  FileCheck2,
} from "lucide-react";

export default function AcademicsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const modules = [
    {
      title: "Academic Sessions",
      description: "Manage school academic sessions",
      icon: CalendarDays,
      href: `/dashboard/schools/${schoolId}/academics/sessions`,
    },
    {
      title: "Terms",
      description: "Manage terms within academic sessions",
      icon: Clock3,
      href: `/dashboard/schools/${schoolId}/academics/terms`,
    },
    {
      title: "Levels",
      description: "Manage academic levels",
      icon: Layers3,
      href: `/dashboard/schools/${schoolId}/levels`,
    },
    {
      title: "Classes",
      description: "Manage classes and level assignments",
      icon: School,
      href: `/dashboard/schools/${schoolId}/classes`,
    },
    {
      title: "Departments",
      description: "Manage academic departments",
      icon: Building2,
      href: `/dashboard/schools/${schoolId}/academics/departments`,
    },
    {
      title: "Subjects",
      description: "Manage subjects and curriculum",
      icon: LibraryBig,
      href: `/dashboard/schools/${schoolId}/academics/subjects`,
    },
    {
      title: "Grading System",
      description: "Configure grades, score ranges and remarks",
      icon: GraduationCap,
      href: `/dashboard/schools/${schoolId}/academics/grading`,
    },
    {
      title: "Results",
      description: "Manage assessments and student results",
      icon: FileCheck2,
      href: "#",
    },
  ];

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/schools/${schoolId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-rose-500"
      >
        <ArrowLeft size={17} />
        Back to School Workspace
      </Link>

      <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
          <BookOpen size={26} />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">
          Academic Management
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Academics
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Manage the school&apos;s academic structure, sessions,
          curriculum, grading and learning records.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => {
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

              <h2 className="mt-5 font-bold text-slate-900">
                {module.title}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {module.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
