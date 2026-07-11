"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

export default function Page({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/schools/${schoolId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500"
      >
        <ArrowLeft size={16} />
        Back to School Workspace
      </Link>

      <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
          <CalendarDays size={26} />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Events
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Create and manage school events and activities.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Events Dashboard
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          This module is ready for backend data integration.
        </p>
      </section>
    </div>
  );
}
