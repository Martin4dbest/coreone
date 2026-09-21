"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  UserCog,
  FileSpreadsheet,
} from "lucide-react";

export default function PeoplePage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const modules = [
    {
      title: "All Users",
      description: "View and manage all registered users",
      icon: Users,
      href: `/dashboard/schools/${schoolId}/people/users`,
    },
    {
      title: "Students",
      description: "Manage student profiles and enrollments",
      icon: GraduationCap,
      href: `/dashboard/schools/${schoolId}/students`,
    },
    {
      title: "Staff",
      description: "Manage teachers and school staff members",
      icon: Briefcase,
      href: `/dashboard/schools/${schoolId}/staff`,
    },
    {
      title: "Guardians",
      description: "Manage parents and student guardians",
      icon: UserCheck,
      href: `/dashboard/schools/${schoolId}/people/guardians`,
    },
    {
      title: "Admins",
      description: "Manage school administrators and permissions",
      icon: UserCog,
      href: `/dashboard/schools/${schoolId}/people/admins`,
    },
    {
      title: "Suspended",
      description: "View and manage suspended accounts",
      icon: UserX,
      href: `/dashboard/schools/${schoolId}/people/suspended`,
    },
    {
      title: "Roles & Permissions",
      description: "Configure user access roles and permissions",
      icon: ShieldAlert,
      href: `/dashboard/schools/${schoolId}/people/roles`,
    },
    {
      title: "Imports",
      description: "Bulk import users and student records",
      icon: FileSpreadsheet,
      href: `/dashboard/schools/${schoolId}/people/imports`,
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
          <Users size={26} />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">
          User Management
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          People
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Manage all members of the school community, including students,
          staff, guardians, admins, and role permissions.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.title}
              href={module.href}
              className="flex items-center gap-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-rose-100 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <Icon size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-slate-900">
                  {module.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500 truncate">
                  {module.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}