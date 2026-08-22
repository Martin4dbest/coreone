"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  BookOpen,
  Globe,
  PlayCircle,
  Trophy,
  Loader2,
} from "lucide-react";

import api from "@/lib/api";

type ActivityItem = {
  id: number;
  ebook_id?: number;
  browser_link_id?: number;
  youtube_learning_id?: number;
  ebook_title?: string | null;
  resource_title?: string | null;
  video_title?: string | null;
  activity_type: string;
  created_at: string;
};

type CBTScore = {
  attempt_id: number;
  exam_id: number | null;
  exam_title: string;
  subject: string | null;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  submitted_at: string | null;
};

type StudentActivityData = {
  student: {
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    admission_number: string;
    classroom?: string | null;
  };
  cbt_scores: CBTScore[];
  ebook_activity: ActivityItem[];
  browser_activity: ActivityItem[];
  youtube_activity: ActivityItem[];
};

export default function StudentActivityPage({
  params,
}: {
  params: Promise<{
    schoolId: string;
    studentId: string;
  }>;
}) {
  const { schoolId, studentId } = use(params);

  const [data, setData] = useState<StudentActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadActivity() {
    try {
      setLoading(true);

      const response = await api.get(
        `/students/${studentId}/activity`
      );

      setData(response.data);
    } catch (error) {
      console.error(
        "Failed to load student activity:",
        error
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, schoolId]);

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2
          className="animate-spin text-indigo-500"
          size={32}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow">
        <h2 className="text-xl font-bold">
          Student activity unavailable
        </h2>

        <Link
          href={`/dashboard/schools/${schoolId}/students`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Students
        </Link>
      </div>
    );
  }

  const {
    student,
    cbt_scores,
    ebook_activity,
    browser_activity,
    youtube_activity,
  } = data;

  const totalActivity =
    cbt_scores.length +
    ebook_activity.length +
    browser_activity.length +
    youtube_activity.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/dashboard/schools/${schoolId}/students`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={18} />
          Back to Students
        </Link>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Activity size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {student.first_name}{" "}
              {student.middle_name
                ? `${student.middle_name} `
                : ""}
              {student.last_name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Admission No: {student.admission_number}
              {student.classroom
                ? ` • ${student.classroom}`
                : ""}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          icon={<Activity size={20} />}
          title="Total Activity"
          count={totalActivity}
        />

        <SummaryCard
          icon={<Trophy size={20} />}
          title="CBT"
          count={cbt_scores.length}
        />

        <SummaryCard
          icon={<BookOpen size={20} />}
          title="E-books"
          count={ebook_activity.length}
        />

        <SummaryCard
          icon={<Globe size={20} />}
          title="Browser"
          count={browser_activity.length}
        />

        <SummaryCard
          icon={<PlayCircle size={20} />}
          title="YouTube"
          count={youtube_activity.length}
        />
      </div>

      <ActivitySection
        title="CBT Results"
        icon={<Trophy size={20} />}
      >
        {cbt_scores.length === 0 ? (
          <EmptyState text="No CBT activity recorded for this student." />
        ) : (
          <div className="divide-y divide-slate-100">
            {cbt_scores.map((attempt) => (
              <div
                key={attempt.attempt_id}
                className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {attempt.exam_title}
                  </p>

                  <p className="text-sm text-slate-500">
                    {attempt.subject || "No subject"}
                  </p>
                </div>

                <div className="text-sm">
                  <span className="font-bold">
                    {attempt.score}/{attempt.total_marks}
                  </span>

                  <span className="ml-3 text-slate-500">
                    {attempt.percentage}%
                  </span>

                  <span
                    className={`ml-3 font-bold ${
                      attempt.passed
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {attempt.passed ? "Passed" : "Failed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ActivitySection>

      <ActivitySection
        title="E-book Activity"
        icon={<BookOpen size={20} />}
      >
        {ebook_activity.length === 0 ? (
          <EmptyState text="No e-book activity recorded for this student." />
        ) : (
          <ActivityList
            items={ebook_activity}
            getTitle={(item) =>
              item.ebook_title || "E-book"
            }
          />
        )}
      </ActivitySection>

      <ActivitySection
        title="Browser Activity"
        icon={<Globe size={20} />}
      >
        {browser_activity.length === 0 ? (
          <EmptyState text="No browser activity recorded for this student." />
        ) : (
          <ActivityList
            items={browser_activity}
            getTitle={(item) =>
              item.resource_title || "Browser Resource"
            }
          />
        )}
      </ActivitySection>

      <ActivitySection
        title="YouTube Learning Activity"
        icon={<PlayCircle size={20} />}
      >
        {youtube_activity.length === 0 ? (
          <EmptyState text="No YouTube Learning activity recorded for this student." />
        ) : (
          <ActivityList
            items={youtube_activity}
            getTitle={(item) =>
              item.video_title || "YouTube Video"
            }
          />
        )}
      </ActivitySection>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="text-indigo-600">{icon}</div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {count}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActivitySection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="text-indigo-600">{icon}</div>

        <h2 className="font-bold text-slate-900">
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function ActivityList({
  items,
  getTitle,
}: {
  items: ActivityItem[];
  getTitle: (item: ActivityItem) => string;
}) {
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-1 p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="font-semibold text-slate-900">
              {getTitle(item)}
            </p>

            <p className="text-sm text-slate-500">
              {item.activity_type}
            </p>
          </div>

          <p className="text-xs text-slate-400">
            {item.created_at
              ? new Date(item.created_at).toLocaleString()
              : "Unknown date"}
          </p>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-6 text-sm text-slate-400">
      {text}
    </div>
  );
}
