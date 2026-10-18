"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

type RankRow = {
  rank: number;
  student_id: number;
  student_name: string;
  class_name: string;
  value: number;
  unit: string;
  cbt_attempts: number;
  attendance_days: number;
  ebook_views: number;
  youtube_opens: number;
};

type Category = {
  key: string;
  title: string;
  description: string;
  unit: string;
  total_ranked: number;
  rankings: RankRow[];
};

type Payload = {
  classrooms: { id: number; name: string }[];
  categories: Category[];
};

const medal = (rank: number) =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

export default function StudentEngagementPage() {
  const params = useParams<{ schoolId: string }>();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [classroomId, setClassroomId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/student-engagement/school", {
        params: classroomId ? { classroom_id: classroomId } : {},
      });
      setPayload(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Could not load student rankings. Check your access and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    void load();
  }, [load, params.schoolId]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-lg md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
            CoreOne • School analytics
          </p>
          <h1 className="mt-3 text-2xl font-bold md:text-3xl">
            Student Performance & Engagement
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Evidence-based rankings from recorded school activity. Each category
            uses its own metric; no activity is presented as proof of completion.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label htmlFor="engagement-class" className="text-sm text-slate-200">
              Filter by class
            </label>
            <select
              id="engagement-class"
              value={classroomId}
              onChange={(event) => setClassroomId(event.target.value)}
              className="min-w-52 rounded-xl border border-white/20 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">All classes</option>
              {(payload?.classrooms ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => void load()}
              className="rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading verified school records…
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {(payload?.categories ?? []).map((category) => (
              <article
                key={category.key}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">{category.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {category.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {category.total_ranked} ranked
                    </span>
                  </div>
                </div>

                {category.rankings.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    No qualifying records are available for this category yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Rank</th>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Class</th>
                          <th className="px-4 py-3 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {category.rankings.map((row) => (
                          <tr key={row.student_id} className="hover:bg-slate-50">
                            <td className="whitespace-nowrap px-4 py-3 font-bold">
                              {medal(row.rank)}
                            </td>
                            <td className="min-w-36 px-4 py-3 font-medium">
                              {row.student_name}
                              <p className="mt-1 text-xs font-normal text-slate-400">
                                ID: {row.student_id}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                              {row.class_name}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums">
                              {row.value}
                              {row.unit === "%" ? "%" : ` ${row.unit}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
                  Based on recorded data only. Tied scores share the same rank.
                </p>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
