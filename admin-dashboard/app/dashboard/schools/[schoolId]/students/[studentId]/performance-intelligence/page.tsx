"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import api from "@/lib/api";

type SubjectInsight = {
  subject_id: number;
  subject_name: string;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  result_count: number;
};

type TermInsight = {
  term_id: number;
  term_name: string;
  academic_session_id: number;
  academic_session_name: string;
  average_score: number;
  result_count: number;
  trend: "improving" | "declining" | "stable";
  change_from_previous: number;
};

type Attendance = {
  total_days: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  excused_days: number;
  attendance_percentage: number;
};

type Risk = {
  level: "low" | "moderate" | "high";
  score: number;
  flags: string[];
  summary: string;
};

type StudentIntelligence = {
  student_id: number;
  student_name: string;
  admission_number: string;
  school_id: number;
  school_name: string | null;
  classroom_id: number | null;
  classroom_name: string | null;
  academic_average: number;
  academic_result_count: number;
  strongest_subject: SubjectInsight | null;
  weakest_subject: SubjectInsight | null;
  subjects: SubjectInsight[];
  term_trends: TermInsight[];
  attendance: Attendance;
  risk: Risk;
};

type AIInsight = {
  scope: "student" | "class" | "school";
  title: string;
  summary: string;
  key_findings: string[];
  recommendations: string[];
  priority: "low" | "moderate" | "high";
};

function score(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function riskClasses(level: string) {
  if (level === "high") {
    return "border-red-100 bg-red-50 text-red-700";
  }

  if (level === "moderate") {
    return "border-amber-100 bg-amber-50 text-amber-700";
  }

  return "border-emerald-100 bg-emerald-50 text-emerald-700";
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            detail?: unknown;
          };
        };
      }
    ).response;

    const detail = response?.data?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default function StudentPerformanceIntelligencePage({
  params,
}: {
  params: Promise<{
    schoolId: string;
    studentId: string;
  }>;
}) {
  const { schoolId, studentId } = use(params);

  const [data, setData] =
    useState<StudentIntelligence | null>(null);

  const [aiInsight, setAiInsight] =
    useState<AIInsight | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");

  const loadStudent = useCallback(
    async (showRefresh = false) => {
      const refreshStartedAt = showRefresh ? Date.now() : 0;

      try {
        setError("");

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await api.get(
          `/performance-intelligence/student/${studentId}`
        );

        setData(response.data);
      } catch (err: unknown) {
        console.error(
          "Failed to load student Performance Intelligence:",
          err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load student Performance Intelligence."
          )
        );
      } finally {
        if (showRefresh) {
          const elapsed = Date.now() - refreshStartedAt;
          const remaining = Math.max(0, 800 - elapsed);

          if (remaining > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, remaining)
            );
          }

          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [studentId]
  );

  async function generateAIInsight() {
    try {
      setAiLoading(true);
      setAiError("");

      const response = await api.get(
        `/ai/performance/student/${studentId}`
      );

      setAiInsight(response.data);
    } catch (err: unknown) {
      console.error(
        "Failed to generate student AI insight:",
        err
      );

      setAiError(
        getErrorMessage(
          err,
          "Unable to generate the student AI insight."
        )
      );
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const basePath =
    `/dashboard/schools/${schoolId}`;

  if (loading) {
    return (
      <main className="space-y-6">
        <div className="h-10 w-72 animate-pulse rounded-xl bg-slate-100" />

        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="space-y-6">
        <section className="rounded-[28px] border border-red-100 bg-red-50 p-8">
          <h1 className="text-xl font-black text-red-800">
            Student intelligence unavailable
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error || "No student intelligence data was returned."}
          </p>

          <button
            type="button"
            onClick={() => loadStudent(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
          >
            <RefreshCw className="h-4 w-4"
              style={
                refreshing
                  ? { animation: "coreone-refresh-spin 0.8s linear infinite" }
                  : undefined
              } />
            Try again
          </button>
        </section>
      </main>
    );
  }

  const newestTerm =
    data.term_trends.length
      ? data.term_trends[data.term_trends.length - 1]
      : null;

  return (
    <main className="space-y-6 pb-10">
      <Link
        href={`${basePath}/students`}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-violet-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Link>

      <section className="rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-500">
              CoreOne Performance Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {data.student_name}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {data.admission_number}
              {data.classroom_name
                ? ` · ${data.classroom_name}`
                : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadStudent(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className="h-4 w-4"
            />
            {refreshing ? "Refreshing..." : "Refresh Intelligence"}
          </button>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <Metric
          icon={<TrendingUp className="h-5 w-5" />}
          label="Academic Average"
          value={score(data.academic_average)}
          description={`${data.academic_result_count} published results`}
          tone="violet"
        />

        <Metric
          icon={<Activity className="h-5 w-5" />}
          label="Attendance"
          value={score(
            data.attendance.attendance_percentage
          )}
          description={`${data.attendance.absent_days} absent · ${data.attendance.late_days} late`}
          tone="emerald"
        />

        <Metric
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Risk"
          value={data.risk.level.toUpperCase()}
          description={`Risk score ${data.risk.score}/100`}
          tone="red"
        />
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              data.risk.level === "high"
                ? "bg-red-50 text-red-600"
                : data.risk.level === "moderate"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">
              Risk Assessment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {data.risk.summary}
            </p>
          </div>
        </div>

        {data.risk.flags.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {data.risk.flags.map((flag) => (
              <div
                key={flag}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600"
              >
                {flag}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Subject Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Academic performance across published subjects.
          </p>

          {data.subjects.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No published subject results are available.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {data.subjects.map((subject) => (
                <div
                  key={subject.subject_id}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">
                      {subject.subject_name}
                    </p>

                    <p className="font-black text-slate-900">
                      {score(subject.average_score)}
                    </p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            subject.average_score
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Highest {score(subject.highest_score)}
                    {" · "}
                    Lowest {score(subject.lowest_score)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">
            Attendance Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Attendance records currently available in CoreOne.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <AttendanceCard
              label="Present"
              value={data.attendance.present_days}
            />

            <AttendanceCard
              label="Late"
              value={data.attendance.late_days}
            />

            <AttendanceCard
              label="Absent"
              value={data.attendance.absent_days}
            />

            <AttendanceCard
              label="Excused"
              value={data.attendance.excused_days}
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Term Performance Trend
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Changes between available published terms.
            </p>
          </div>

          {newestTerm && (
            <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
              Latest: {newestTerm.term_name}
            </span>
          )}
        </div>

        {data.term_trends.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            Not enough published term data to display a trend.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.term_trends.map((term) => (
              <div
                key={`${term.academic_session_id}-${term.term_id}`}
                className="rounded-xl border border-slate-100 p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {term.academic_session_name}
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {term.term_name}
                </p>

                <p className="mt-4 text-2xl font-black text-slate-900">
                  {score(term.average_score)}
                </p>

                <div className="mt-3 flex items-center gap-2 text-xs font-bold">
                  {term.trend === "improving" ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-600">
                        +{term.change_from_previous} points
                      </span>
                    </>
                  ) : term.trend === "declining" ? (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">
                        {term.change_from_previous} points
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">
                      Stable
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
              <BrainCircuit className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-500">
                CoreOne AI
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                Student AI Insight
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Ask CoreOne AI to interpret this student&apos;s
                verified academic and attendance intelligence.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={generateAIInsight}
            disabled={aiLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-60"
          >
            <BrainCircuit
              className={`h-4 w-4 ${
                aiLoading ? "animate-pulse" : ""
              }`}
            />

            {aiLoading
              ? "Generating..."
              : aiInsight
                ? "Regenerate Insight"
                : "Generate AI Insight"}
          </button>
        </div>

        {aiError && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {aiError}
          </div>
        )}

        {aiInsight && !aiLoading && (
          <div className="mt-5 space-y-5">
            <div className="rounded-xl border border-white bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {aiInsight.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {aiInsight.summary}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${riskClasses(
                    aiInsight.priority
                  )}`}
                >
                  {aiInsight.priority}
                </span>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <AIList
                title="Key Findings"
                items={aiInsight.key_findings}
                numbered
              />

              <AIList
                title="Recommended Actions"
                items={aiInsight.recommendations}
              />
            </div>

            <p className="text-xs leading-5 text-slate-400">
              AI-generated guidance supports professional
              educational judgment and does not replace it.
            </p>
          </div>
        )}

        {!aiInsight && !aiError && !aiLoading && (
          <div className="mt-5 rounded-xl border border-dashed border-violet-200 bg-white/70 p-5 text-sm text-slate-500">
            Generate an AI insight to receive an interpretation
            and recommended educational actions.
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  tone: "violet" | "emerald" | "red";
}) {
  const classes = {
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${classes[tone]}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function AttendanceCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function AIList({
  title,
  items,
  numbered = false,
}: {
  title: string;
  items: string[];
  numbered?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5">
      <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No items returned.
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex gap-3"
            >
              {numbered ? (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-black text-violet-600">
                  {index + 1}
                </div>
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              )}

              <p className="text-sm leading-6 text-slate-600">
                {item}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
