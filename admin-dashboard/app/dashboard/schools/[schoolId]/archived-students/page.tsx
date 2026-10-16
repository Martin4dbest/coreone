"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import api from "@/lib/api";

type Student = {
  id: number;
  school_id: number;
  classroom_id: number | null;
  class_name: string | null;
  session_name: string | null;
  admission_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string;
  date_of_birth: string | null;
  lifecycle_status: string;
};

type Classroom = {
  id: number;
  name: string;
  level_id: number;
};

type Session = {
  id: number;
  name: string;
  is_current: boolean;
};

export default function ArchivedStudentsPage() {
  const params = useParams<{ schoolId: string }>();
  const router = useRouter();
  const schoolId = String(params.schoolId ?? "");
  const base = `/admissions-lifecycle/schools/${schoolId}`;

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadArchivedStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [studentResponse, optionsResponse] = await Promise.all([
        api.get<Student[]>(`${base}/students`, {
          params: { include_archived: true },
        }),
        api.get<{ classes: Classroom[]; sessions: Session[] }>(
          `${base}/options`,
        ),
      ]);

      setStudents(
        studentResponse.data.filter(
          (student) => student.lifecycle_status === "ARCHIVED",
        ),
      );
      setClasses(optionsResponse.data.classes);
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;

      setError(
        detail || "Unable to load archived students. Check your access and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    void loadArchivedStudents();
  }, [loadArchivedStudents]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students.filter((student) => {
      const fullName = [
        student.first_name,
        student.middle_name || "",
        student.last_name,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        student.admission_number.toLowerCase().includes(term) ||
        String(student.id).includes(term);

      const matchesClass =
        !classFilter ||
        String(student.classroom_id ?? "") === classFilter;

      return matchesSearch && matchesClass;
    });
  }, [students, search, classFilter]);

  async function restoreStudent(student: Student) {
    const confirmed = window.confirm(
      `Restore ${student.first_name} ${student.last_name} to ACTIVE status?`,
    );

    if (!confirmed) return;

    setRestoringId(student.id);
    setError("");
    setNotice("");

    try {
      await api.patch(
        `${base}/students/${student.id}/status`,
        { new_status: "ACTIVE" },
        { params: { school_id: Number(schoolId) } },
      );

      setStudents((current) =>
        current.filter((item) => item.id !== student.id),
      );
      setNotice(
        `${student.first_name} ${student.last_name} has been restored successfully.`,
      );
    } catch (err: unknown) {
      const detail = (
        err as { response?: { data?: { detail?: string } } }
      )?.response?.data?.detail;

      setError(
        detail || "Unable to restore this student. Please try again.",
      );
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => router.push(`/dashboard/schools/${schoolId}/admissions`)}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Admission Lifecycle
          </button>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-200 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Archive className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Archived Students
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Search archived records, view student profiles, or restore students.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => void loadArchivedStudents()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {notice}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Archived Students</span>
            <Archive className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {students.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Search Results</span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {filteredStudents.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-sm font-medium text-slate-500">Available Classes</span>
          <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {classes.length}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by student name, admission number or student ID..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">All classes</option>
            {classes.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading archived students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <Archive className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 font-bold text-slate-800 dark:text-slate-200">
              No archived students found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Try another search term or class filter.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/60">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Admission Number</th>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">Session</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {student.first_name} {student.middle_name || ""} {student.last_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Student ID: {student.id}</p>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {student.admission_number}
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                        {student.class_name || "Unassigned"}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {student.session_name || "No session"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => router.push(`/dashboard/schools/${schoolId}/students/${student.id}`)}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => void restoreStudent(student)}
                            disabled={restoringId === student.id}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {restoringId === student.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {filteredStudents.map((student) => (
                <article key={student.id} className="space-y-3 p-4">
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white">
                      {student.first_name} {student.middle_name || ""} {student.last_name}
                    </h2>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {student.admission_number}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {student.class_name || "Unassigned"} · {student.session_name || "No session"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/schools/${schoolId}/students/${student.id}`)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:text-slate-200"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => void restoreStudent(student)}
                      disabled={restoringId === student.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
