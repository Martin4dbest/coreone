"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
} from "lucide-react";

import api from "@/lib/api";

function getApiErrorMessage(
  error: unknown,
  fallback: string
): string {
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

type Attendance = {
  total_days: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  excused_days: number;
  attendance_percentage: number;
};

type ClassSummary = {
  classroom_id: number;
  classroom_name: string;
  student_count: number;
  academic_average: number;
  attendance_percentage: number;
};

type SubjectSummary = {
  subject_id: number;
  subject_name: string;
  average_score: number;
  result_count: number;
};

type AttentionStudent = {
  student_id: number;
  student_name: string;
  admission_number: string;
  classroom_id: number | null;
  classroom_name: string | null;
  academic_average: number;
  attendance_percentage: number;
  risk_level: "low" | "moderate" | "high";
  reasons: string[];
};

type AIInsight = {
  scope: "student" | "class" | "school";
  title: string;
  summary: string;
  key_findings: string[];
  recommendations: string[];
  priority: "low" | "moderate" | "high";
};

type SchoolIntelligence = {
  school_id: number;
  school_name: string;
  student_count: number;
  students_with_results: number;
  classroom_count: number;
  academic_average: number;
  attendance: Attendance;
  classes: ClassSummary[];
  subjects: SubjectSummary[];
  students_needing_attention: AttentionStudent[];
};

function scoreLabel(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function riskClasses(level: string) {
  if (level === "high") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (level === "moderate") {
    return "bg-amber-50 text-amber-700 border-amber-100";
  }

  return "bg-emerald-50 text-emerald-700 border-emerald-100";
}

export default function PerformanceIntelligencePage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [data, setData] = useState<SchoolIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(
    null
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");


  async function loadIntelligence(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(
        "/performance-intelligence/school"
      );

      setData(response.data);
    } catch (err: unknown) {
      console.error(
        "Failed to load Performance Intelligence:",
        err
      );

      setError(
        getApiErrorMessage(
          err,
          "Unable to load Performance Intelligence."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadIntelligence();
  }, [schoolId]);

  async function generateAIInsight() {
    try {
      setAiLoading(true);
      setAiError("");

      const response = await api.get(
        "/ai/performance/school"
      );

      setAiInsight(response.data);
    } catch (err: unknown) {
      console.error(
        "Failed to generate Performance AI insight:",
        err
      );

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const response = (
          err as {
            response?: {
              data?: {
                detail?: unknown;
              };
            };
          }
        ).response;

        const detail = response?.data?.detail;

        if (
          typeof detail === "string" &&
          detail.trim()
        ) {
          setAiError(detail);
        } else {
          setAiError(
            "Unable to generate the AI insight."
          );
        }
      } else if (err instanceof Error) {
        setAiError(err.message);
      } else {
        setAiError(
          "Unable to generate the AI insight."
        );
      }
    } finally {
      setAiLoading(false);
    }
  }

  const basePath = `/dashboard/schools/${schoolId}`;

  if (loading) {
    return (
      <main className="space-y-6">
        <section className="rounded-[28px] border border-slate-100 bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-72 rounded-xl bg-slate-100" />
            <div className="h-5 w-[28rem] max-w-full rounded-lg bg-slate-100" />
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border border-slate-100 bg-white"
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
          <div className="flex items-start gap-4">
            <AlertTriangle className="mt-1 h-6 w-6 text-red-600" />
            <div>
              <h1 className="text-xl font-bold text-red-800">
                Performance Intelligence unavailable
              </h1>
              <p className="mt-2 text-sm text-red-700">
                {error || "No intelligence data was returned."}
              </p>

              <button
                type="button"
                onClick={() => loadIntelligence(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4"
              style={
                refreshing
                  ? { animation: "coreone-refresh-spin 0.8s linear infinite" }
                  : undefined
              } />
                Try again
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const classes = data.classes || [];
  const subjects = data.subjects || [];
  const attention = data.students_needing_attention || [];

  const strongestClass = classes.length
    ? [...classes].sort(
        (a, b) => b.academic_average - a.academic_average
      )[0]
    : null;

  const weakestClass = classes.length
    ? [...classes].sort(
        (a, b) => a.academic_average - b.academic_average
      )[0]
    : null;

  const strongestSubject = subjects.length
    ? [...subjects].sort(
        (a, b) => b.average_score - a.average_score
      )[0]
    : null;

  const weakestSubject = subjects.length
    ? [...subjects].sort(
        (a, b) => a.average_score - b.average_score
      )[0]
    : null;

  return (
    <main className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                <BrainCircuit className="h-7 w-7" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">
                  CoreOne Intelligence
                </p>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  Performance Intelligence
                </h1>
              </div>
            </div>

            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              A school-wide view of academic performance, attendance,
              class performance and students who may require timely
              academic or attendance support.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadIntelligence(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className="h-4 w-4"
            />
            {refreshing ? "Refreshing..." : "Refresh Intelligence"}
          </button>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<BarChart3 className="h-5 w-5" />}
          title="Academic Average"
          value={scoreLabel(data.academic_average)}
          description={`${data.students_with_results} students with published results`}
          tone="violet"
        />

        <MetricCard
          icon={<Activity className="h-5 w-5" />}
          title="Attendance Rate"
          value={scoreLabel(
            data.attendance.attendance_percentage
          )}
          description={`${data.attendance.absent_days} absences recorded`}
          tone="emerald"
        />

        <MetricCard
          icon={<GraduationCap className="h-5 w-5" />}
          title="Students"
          value={String(data.student_count)}
          description={`${data.classroom_count} active classes`}
          tone="amber"
        />

        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Needs Attention"
          value={String(attention.length)}
          description="Moderate or high risk indicators"
          tone="red"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Class Performance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Compare academic averages and attendance by class.
              </p>
            </div>

            <Link
              href={`${basePath}/classes`}
              className="text-sm font-bold text-violet-600 hover:text-violet-700"
            >
              View classes
            </Link>
          </div>

          {classes.length === 0 ? (
            <EmptyState text="No active class data is available yet." />
          ) : (
            <div className="mt-5 space-y-3">
              {classes.slice(0, 8).map((item) => (
                <div
                  key={item.classroom_id}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">
                        {item.classroom_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.student_count} students
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-slate-900">
                        {scoreLabel(item.academic_average)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {scoreLabel(item.attendance_percentage)} attendance
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            item.academic_average
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Subject Intelligence
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Identify stronger and weaker academic areas across
              the school.
            </p>
          </div>

          {subjects.length === 0 ? (
            <EmptyState text="No published subject results are available yet." />
          ) : (
            <div className="mt-5 space-y-3">
              {subjects.slice(0, 10).map((item) => (
                <div
                  key={item.subject_id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
                >
                  <div>
                    <p className="font-bold text-slate-900">
                      {item.subject_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.result_count} published results
                    </p>
                  </div>

                  <p className="text-lg font-black text-slate-900">
                    {scoreLabel(item.average_score)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

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
                AI Performance Insight
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Let CoreOne AI interpret the verified academic and
                attendance intelligence already calculated for this school.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={generateAIInsight}
            disabled={aiLoading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BrainCircuit
              className={`h-4 w-4 ${
                aiLoading ? "animate-pulse" : ""
              }`}
            />
            {aiLoading
              ? "Generating Insight..."
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

        {!aiInsight && !aiError && !aiLoading && (
          <div className="mt-5 rounded-xl border border-dashed border-violet-200 bg-white/70 p-5 text-sm text-slate-500">
            No AI insight has been generated yet. Click
            <span className="mx-1 font-bold text-violet-600">
              Generate AI Insight
            </span>
            to analyze the current school performance data.
          </div>
        )}

        {aiLoading && (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="h-24 animate-pulse rounded-xl bg-white/80" />
            <div className="h-24 animate-pulse rounded-xl bg-white/80" />
            <div className="h-24 animate-pulse rounded-xl bg-white/80" />
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
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase ${riskClasses(
                    aiInsight.priority
                  )}`}
                >
                  {aiInsight.priority} priority
                </span>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-white p-5">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
                  Key Findings
                </h3>

                <div className="mt-4 space-y-3">
                  {aiInsight.key_findings.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No additional findings were returned.
                    </p>
                  ) : (
                    aiInsight.key_findings.map(
                      (finding, index) => (
                        <div
                          key={`${finding}-${index}`}
                          className="flex gap-3"
                        >
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-black text-violet-600">
                            {index + 1}
                          </div>

                          <p className="text-sm leading-6 text-slate-600">
                            {finding}
                          </p>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-5">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
                  Recommended Actions
                </h3>

                <div className="mt-4 space-y-3">
                  {aiInsight.recommendations.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No recommendations were returned.
                    </p>
                  ) : (
                    aiInsight.recommendations.map(
                      (recommendation, index) => (
                        <div
                          key={`${recommendation}-${index}`}
                          className="flex gap-3"
                        >
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                          <p className="text-sm leading-6 text-slate-600">
                            {recommendation}
                          </p>
                        </div>
                      )
                    )
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-400">
              AI insights are generated from CoreOne&apos;s
              calculated academic and attendance data. They should
              support professional educational judgment rather than
              replace it.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Key Intelligence Signals
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Highlights generated from the available academic and
              attendance data.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SignalCard
            icon={<ArrowUpRight className="h-5 w-5" />}
            label="Strongest Class"
            value={
              strongestClass
                ? `${strongestClass.classroom_name} · ${scoreLabel(
                    strongestClass.academic_average
                  )}`
                : "No data"
            }
            text="Highest academic average"
          />

          <SignalCard
            icon={<ArrowDownRight className="h-5 w-5" />}
            label="Weakest Class"
            value={
              weakestClass
                ? `${weakestClass.classroom_name} · ${scoreLabel(
                    weakestClass.academic_average
                  )}`
                : "No data"
            }
            text="Lowest academic average"
          />

          <SignalCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Strongest Subject"
            value={
              strongestSubject
                ? `${strongestSubject.subject_name} · ${scoreLabel(
                    strongestSubject.average_score
                  )}`
                : "No data"
            }
            text="Highest subject average"
          />

          <SignalCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Weakest Subject"
            value={
              weakestSubject
                ? `${weakestSubject.subject_name} · ${scoreLabel(
                    weakestSubject.average_score
                  )}`
                : "No data"
            }
            text="Lowest subject average"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">
              Students Needing Attention
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Students with moderate or high academic and/or
              attendance risk indicators.
            </p>
          </div>
        </div>

        {attention.length === 0 ? (
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-700">
            No moderate or high-risk students were detected from
            the available published results and attendance records.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Academic</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Indicators</th>
                </tr>
              </thead>

              <tbody>
                {attention.slice(0, 25).map((student) => (
                  <tr
                    key={student.student_id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`${basePath}/students/${student.student_id}/performance-intelligence`}
                        className="group"
                      >
                        <p className="font-bold text-slate-900 group-hover:text-violet-600">
                          {student.student_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {student.admission_number}
                        </p>
                      </Link>
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {student.classroom_name || "Unassigned"}
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-900">
                      {scoreLabel(student.academic_average)}
                    </td>

                    <td className="px-4 py-4 font-bold text-slate-900">
                      {scoreLabel(
                        student.attendance_percentage
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${riskClasses(
                          student.risk_level
                        )}`}
                      >
                        {student.risk_level}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="max-w-[340px] space-y-1">
                        {student.reasons
                          .slice(0, 3)
                          .map((reason) => (
                            <p
                              key={reason}
                              className="text-xs text-slate-500"
                            >
                              • {reason}
                            </p>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  title,
  value,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  tone: "violet" | "emerald" | "amber" | "red";
}) {
  const tones = {
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        {icon}
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SignalCard({
  icon,
  label,
  value,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 font-black text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {text}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
      {text}
    </div>
  );
}
