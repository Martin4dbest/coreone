"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Printer,
  BookOpen,
  School,
  Loader2,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";
import api from "@/lib/api";

type TimetableEntry = {
  id: number;
  school_id: number;
  academic_session_id: number;
  academic_session_name: string;
  term_id: number;
  term_name: string;
  classroom_id: number;
  classroom_name: string;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function formatTime(value: string) {
  const parts = value.split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1] || 0);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export default function TeacherTimetablePage() {
  const params = useParams();
  const tenant = params.tenant as string;

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadTimetable() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<TimetableEntry[]>(
          "/timetable/teacher/me"
        );

        if (mounted) {
          setEntries(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err: unknown) {
        const detail =
          typeof err === "object" &&
          err !== null &&
          "response" in err
            ? (
                err as {
                  response?: {
                    data?: {
                      detail?: unknown;
                    };
                  };
                }
              ).response?.data?.detail
            : undefined;

        if (mounted) {
          setError(
            String(detail || "Unable to load your published timetable. Please try again.")
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTimetable();

    return () => {
      mounted = false;
    };
  }, []);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, TimetableEntry[]> = {};

    for (const day of DAYS) {
      groups[day] = [];
    }

    for (const entry of entries) {
      const day = entry.day_of_week.toUpperCase();

      if (groups[day]) {
        groups[day].push(entry);
      }
    }

    for (const day of DAYS) {
      groups[day].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );
    }

    return groups;
  }, [entries]);

  const activeDays = DAYS.filter(
    (day) => groupedEntries[day].length > 0
  );

  const firstEntry = entries[0];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${tenant}/teacher/dashboard`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Teacher Dashboard
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={loading || entries.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 print:hidden"
          >
            <Printer className="h-4 w-4" />
            Print Timetable
          </button>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <CalendarDays className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Teacher Workspace
              </p>
              <h1 className="text-2xl font-extrabold text-slate-900">
                My Published Timetable
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Your approved teaching schedule and lesson periods.
              </p>
            </div>
          </div>

          {!loading && entries.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <CalendarCheck className="mb-2 h-5 w-5 text-indigo-600" />
                <p className="text-2xl font-bold text-slate-900">
                  {entries.length}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Published periods
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <BookOpen className="mb-2 h-5 w-5 text-indigo-600" />
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(entries.map((item) => item.subject_id)).size}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Subjects
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <School className="mb-2 h-5 w-5 text-indigo-600" />
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(entries.map((item) => item.classroom_id)).size}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Classrooms
                </p>
              </div>
            </div>
          )}
        </section>

        {loading && (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-white">
            <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading your published timetable...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Timetable could not be loaded</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-amber-600" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              No published timetable available
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              Your school has not published a timetable containing your
              assigned lessons yet. Once the school administrator publishes
              your timetable, it will appear here.
            </p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <CalendarCheck className="h-5 w-5" />
                <p className="font-bold">Published timetable</p>
              </div>
              <p className="mt-1 text-sm text-emerald-700">
                {firstEntry.academic_session_name} · {firstEntry.term_name}
              </p>
            </div>

            <div className="space-y-5">
              {activeDays.map((day) => (
                <section
                  key={day}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                >
                  <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <h2 className="font-extrabold text-slate-900">
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </h2>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {groupedEntries[day].map((entry) => (
                      <div
                        key={entry.id}
                        className="grid gap-3 px-5 py-5 sm:grid-cols-[1fr_1.5fr_1fr] sm:items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {formatTime(entry.start_time)}
                            </p>
                            <p className="text-xs text-slate-500">
                              to {formatTime(entry.end_time)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">
                            {entry.subject_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {entry.teacher_name}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <span className="inline-flex rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                            {entry.classroom_name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          main {
            padding: 0 !important;
            background: white !important;
          }
          main > div {
            max-width: none !important;
          }
          button,
          a {
            display: none !important;
          }
          section {
            break-inside: avoid;
            box-shadow: none !important;
          }
        }
      `}</style>
    </main>
  );
}
