"use client";

import { useParams } from "next/navigation";
import ExamTemplateCentre from "@/components/exam-templates/ExamTemplateCentre";

export default function SchoolExamTemplatesPage() {
  const params = useParams<{ schoolId: string }>();

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/70 px-4 py-8 sm:px-6 lg:px-8">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl space-y-8">
        {/* Page heading */}
        <header className="overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-r from-slate-950 via-indigo-950 to-indigo-800 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner backdrop-blur-sm">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7 text-sky-300"
                >
                  <path
                    d="M7 3.75h7l4.25 4.5v12A1.75 1.75 0 0 1 16.5 22h-9A1.75 1.75 0 0 1 5.75 20.25V5.5A1.75 1.75 0 0 1 7.5 3.75Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 4v5h4M8.5 13h7M8.5 16.5h7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1 text-xs font-semibold tracking-wide text-sky-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  EXAMINATION RESOURCES
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  School Template Centre
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100/85 sm:text-base">
                  Manage your school’s examination templates in one organised
                  workspace. Keep assessment documents accessible for the
                  appropriate school staff.
                </p>
              </div>
            </div>

            <div className="hidden shrink-0 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">
                Workspace
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                Examination
              </p>
              <p className="mt-1 text-xs text-indigo-200">
                Templates & resources
              </p>
            </div>
          </div>

          <div className="mt-7 h-px bg-gradient-to-r from-sky-300/60 via-white/20 to-transparent" />

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-indigo-100/80 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-300" />
              Centralised templates
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Organised assessment resources
            </span>
          </div>
        </header>

        {/* Existing template functionality remains unchanged */}
        <section className="relative rounded-3xl border border-slate-200/80 bg-white/90 p-4 shadow-lg shadow-slate-900/[0.04] backdrop-blur-sm sm:p-6 lg:p-8">
          <ExamTemplateCentre
            schoolId={String(params.schoolId || "")}
            mode="manage"
          />
        </section>
      </div>
    </main>
  );
}