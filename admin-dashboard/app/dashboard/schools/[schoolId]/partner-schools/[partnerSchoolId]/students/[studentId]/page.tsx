"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Globe2,
  GraduationCap,
  PlayCircle,
  UserRound,
  XCircle,
} from "lucide-react";

import api, { getAbsoluteUploadUrl } from "@/lib/api";

type Student = {
  id: number;
  user_id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  admission_number: string;
  gender?: string | null;
  date_of_birth?: string | null;
  passport?: string | null;
  classroom?: string | null;
  school_id: number;
  partner_school_id: number;
  partner_school_name: string;
};

type CBTScore = {
  attempt_id: number;
  exam_id?: number | null;
  exam_title: string;
  subject?: string | null;
  score?: number | null;
  total_marks?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  submitted_at?: string | null;
};

type Activity = {
  id: number;
  ebook_id?: number;
  ebook_title?: string;
  browser_link_id?: number;
  resource_title?: string;
  youtube_learning_id?: number;
  video_title?: string;
  activity_type: string;
  created_at: string;
};

type StudentDetailsResponse = {
  student: Student;
  cbt_scores: CBTScore[];
  ebook_activity: Activity[];
  browser_activity: Activity[];
  youtube_activity: Activity[];
};

type SectionProps = {
  title: string;
  count: number;
  open: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
};

function Section({
  title,
  count,
  open,
  onClick,
  icon,
  children,
}: SectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            {icon}
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {title}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {count === 0
                ? "No activity recorded"
                : `${count} ${count === 1 ? "record" : "records"}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {count}
          </span>

          <ChevronDown
            className={`h-5 w-5 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4 sm:p-6">
          {children}
        </div>
      )}
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatDateOnly(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <ClipboardCheck className="h-5 w-5 text-slate-400" />
      </div>

      <p className="mt-3 text-sm font-medium text-slate-600">{text}</p>

      <p className="mt-1 text-xs text-slate-400">
        Activity will appear here when available.
      </p>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

function ActivityRow({
  title,
  type,
  date,
}: {
  title: string;
  type: string;
  date: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4 transition hover:border-slate-200 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs capitalize text-slate-400">
          {type.replace(/_/g, " ")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400">
        <CalendarDays className="h-3.5 w-3.5" />
        {date}
      </div>
    </div>
  );
}

export default function PartnerStudentDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const schoolId = String(params.schoolId);
  const partnerSchoolId = String(params.partnerSchoolId);
  const studentId = String(params.studentId);

  const [data, setData] = useState<StudentDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openCBT, setOpenCBT] = useState(true);
  const [openEbooks, setOpenEbooks] = useState(false);
  const [openBrowser, setOpenBrowser] = useState(false);
  const [openYoutube, setOpenYoutube] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadStudentDetails() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<StudentDetailsResponse>(
          `/partner-schools/${schoolId}/${partnerSchoolId}/students/${studentId}/details`
        );

        if (mounted) {
          setData(response.data);
        }
      } catch (err: any) {
        console.error("Failed to load partner student details:", err);

        if (mounted) {
          setError(
            err?.response?.data?.detail ||
              "Unable to load this student's details."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStudentDetails();

    return () => {
      mounted = false;
    };
  }, [schoolId, partnerSchoolId, studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-6 h-5 w-44 rounded bg-slate-200" />

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="h-28 bg-slate-200" />

            <div className="p-6">
              <div className="-mt-14 h-24 w-24 rounded-full border-4 border-white bg-slate-300" />

              <div className="mt-5 h-7 w-72 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Partner School Students
          </button>

          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>

            <h1 className="mt-4 text-lg font-bold text-slate-900">
              Unable to load student
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error || "Student details were not found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const student = data.student;

  const totalActivity =
    data.cbt_scores.length +
    data.ebook_activity.length +
    data.browser_activity.length +
    data.youtube_activity.length;

  const passedExams = data.cbt_scores.filter(
    (attempt) => attempt.passed === true
  ).length;

  const averagePercentage =
    data.cbt_scores.length > 0
      ? data.cbt_scores.reduce(
          (sum, attempt) => sum + Number(attempt.percentage || 0),
          0
        ) / data.cbt_scores.length
      : 0;

  const initials =
    `${student.first_name?.charAt(0) || ""}${student.last_name?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* BACK */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Partner School Students
        </button>

        {/* PROFILE HEADER */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 sm:h-32" />

          <div className="relative px-5 pb-6 sm:px-7">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end">
              {/* AVATAR */}
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-indigo-100 shadow-md sm:h-28 sm:w-28">
                {student.passport ? (
                  <img
                    src={getAbsoluteUploadUrl(student.passport)}
                    alt={`${student.first_name} ${student.last_name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-indigo-600 sm:text-3xl">
                    {initials}
                  </span>
                )}
              </div>

              {/* NAME */}
              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {student.first_name}{" "}
                    {student.middle_name
                      ? `${student.middle_name} `
                      : ""}
                    {student.last_name}
                  </h1>

                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
                    Student
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                  <span>
                    Admission No:{" "}
                    <strong className="font-semibold text-slate-700">
                      {student.admission_number}
                    </strong>
                  </span>

                  <span>
                    Class:{" "}
                    <strong className="font-semibold text-slate-700">
                      {student.classroom || "—"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* SCHOOL BADGE */}
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                  Partner School
                </p>

                <p className="truncate text-sm font-semibold text-indigo-900">
                  {student.partner_school_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ClipboardCheck className="h-5 w-5" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                CBT
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              {data.cbt_scores.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Exams completed
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                Results
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              {passedExams}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Exams passed
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <BookOpen className="h-5 w-5" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                Learning
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              {data.ebook_activity.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              E-book activities
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Globe2 className="h-5 w-5" />
              </div>

              <span className="text-xs font-medium text-slate-400">
                Activity
              </span>
            </div>

            <p className="mt-4 text-2xl font-bold text-slate-900">
              {totalActivity}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Total learning activity
            </p>
          </div>
        </div>

        {/* STUDENT INFORMATION */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Student Information
              </h2>

              <p className="text-xs text-slate-400">
                Personal and academic information
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem
              label="First Name"
              value={student.first_name}
            />

            <DetailItem
              label="Middle Name"
              value={student.middle_name || "—"}
            />

            <DetailItem
              label="Last Name"
              value={student.last_name}
            />

            <DetailItem
              label="Admission Number"
              value={student.admission_number}
            />

            <DetailItem
              label="Gender"
              value={student.gender || "—"}
            />

            <DetailItem
              label="Date of Birth"
              value={formatDateOnly(student.date_of_birth)}
            />

            <DetailItem
              label="Class"
              value={student.classroom || "—"}
            />

            <DetailItem
              label="Partner School"
              value={student.partner_school_name}
            />
          </div>
        </div>

        {/* PERFORMANCE SUMMARY */}
        {data.cbt_scores.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Academic Performance
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Overview of completed CBT assessments
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 px-4 py-2 text-right">
                <p className="text-xs text-indigo-500">
                  Average Score
                </p>

                <p className="text-lg font-bold text-indigo-700">
                  {averagePercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        <div className="mt-6 space-y-4">
          {/* CBT */}
          <Section
            title="CBT Scores"
            count={data.cbt_scores.length}
            open={openCBT}
            onClick={() => setOpenCBT((value) => !value)}
            icon={<ClipboardCheck className="h-5 w-5" />}
          >
            {data.cbt_scores.length === 0 ? (
              <EmptyState text="This student has not completed any CBT exams." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-3 py-3">Exam</th>
                      <th className="px-3 py-3">Subject</th>
                      <th className="px-3 py-3">Score</th>
                      <th className="px-3 py-3">Percentage</th>
                      <th className="px-3 py-3">Result</th>
                      <th className="px-3 py-3">Submitted</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.cbt_scores.map((attempt) => (
                      <tr
                        key={attempt.attempt_id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="px-3 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {attempt.exam_title}
                          </p>
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-500">
                          {attempt.subject || "—"}
                        </td>

                        <td className="px-3 py-4 text-sm font-medium text-slate-700">
                          {attempt.score ?? 0} /{" "}
                          {attempt.total_marks ?? 0}
                        </td>

                        <td className="px-3 py-4">
                          <span className="font-semibold text-slate-700">
                            {attempt.percentage != null
                              ? `${Number(attempt.percentage).toFixed(1)}%`
                              : "—"}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          {attempt.passed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Passed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                              <XCircle className="h-3.5 w-3.5" />
                              Failed
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-4 text-sm text-slate-400">
                          {formatDate(attempt.submitted_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* EBOOKS */}
          <Section
            title="E-book Activity"
            count={data.ebook_activity.length}
            open={openEbooks}
            onClick={() => setOpenEbooks((value) => !value)}
            icon={<BookOpen className="h-5 w-5" />}
          >
            {data.ebook_activity.length === 0 ? (
              <EmptyState text="No e-book activity recorded for this student." />
            ) : (
              <div className="space-y-2">
                {data.ebook_activity.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    title={activity.ebook_title || "E-book"}
                    type={activity.activity_type}
                    date={formatDate(activity.created_at)}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* BROWSER */}
          <Section
            title="Browser Activity"
            count={data.browser_activity.length}
            open={openBrowser}
            onClick={() => setOpenBrowser((value) => !value)}
            icon={<Globe2 className="h-5 w-5" />}
          >
            {data.browser_activity.length === 0 ? (
              <EmptyState text="No browser activity recorded for this student." />
            ) : (
              <div className="space-y-2">
                {data.browser_activity.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    title={
                      activity.resource_title ||
                      "Browser Resource"
                    }
                    type={activity.activity_type}
                    date={formatDate(activity.created_at)}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* YOUTUBE */}
          <Section
            title="YouTube Learning Activity"
            count={data.youtube_activity.length}
            open={openYoutube}
            onClick={() => setOpenYoutube((value) => !value)}
            icon={<PlayCircle className="h-5 w-5" />}
          >
            {data.youtube_activity.length === 0 ? (
              <EmptyState text="No YouTube Learning activity recorded for this student." />
            ) : (
              <div className="space-y-2">
                {data.youtube_activity.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    title={
                      activity.video_title ||
                      "Learning Video"
                    }
                    type={activity.activity_type}
                    date={formatDate(activity.created_at)}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* FOOTER */}
        <div className="py-8 text-center">
          <p className="text-xs text-slate-400">
            Partner School Student Profile
          </p>
        </div>
      </div>
    </div>
  );
}