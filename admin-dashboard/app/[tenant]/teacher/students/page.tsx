"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Search,
  Loader2,
  GraduationCap,
  Users,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";

type Subject = {
  id: number;
  name: string;
};

type StudentResult = {
  ca: number | null;
  exam: number | null;
  total: number | null;
  grade: string | null;
  remark: string | null;
};

type StudentRow = {
  id: number;
  admission_number: string;
  name: string;
  total_score?: number;
  average?: number;
  position?: number | null;
  results: Record<string, StudentResult | null>;
};

type BroadsheetResponse = {
  classroom: {
    id: number;
    name: string;
    student_count: number;
  };
  school?: {
    name?: string | null;
    logo?: string | null;
    motto?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    accent_color?: string | null;
  };
  term: {
    id: number;
    name: string;
  };
  session: {
    id: number;
    name: string;
  };
  subjects: Subject[];
  students: StudentRow[];
};

type Option = {
  id: number;
  name: string;
};

export default function TeacherStudentsPage() {
  const params = useParams();

  const [terms, setTerms] = useState<Option[]>([]);
  const [sessions, setSessions] = useState<Option[]>([]);
  const [termId, setTermId] = useState("");
  const [sessionId, setSessionId] = useState("");

  const [report, setReport] =
    useState<BroadsheetResponse | null>(null);

  const [search, setSearch] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  async function loadOptions() {
    try {
      setLoadingOptions(true);
      setError("");

      const [termsRes, sessionsRes] = await Promise.all([
        api.get("/terms"),
        api.get("/academic-sessions"),
      ]);

      const normalize = (value: any): Option[] => {
        const data =
          Array.isArray(value?.data)
            ? value.data
            : Array.isArray(value?.data?.data)
              ? value.data.data
              : Array.isArray(value?.data?.items)
                ? value.data.items
                : [];

        return data.map((item: any) => ({
          id: Number(item.id),
          name: item.name ?? `Option ${item.id}`,
        }));
      };

      const fetchedTerms = normalize(termsRes);
      const fetchedSessions = normalize(sessionsRes);

      setTerms(fetchedTerms);
      setSessions(fetchedSessions);

      if (!termId && fetchedTerms.length > 0) {
        setTermId(String(fetchedTerms[fetchedTerms.length - 1].id));
      }

      if (!sessionId && fetchedSessions.length > 0) {
        setSessionId(
          String(fetchedSessions[fetchedSessions.length - 1].id)
        );
      }
    } catch (err: any) {
      console.error("BROADSHEET OPTIONS ERROR:", err);
      setError(
        String(
          err?.response?.data?.detail ||
          "Unable to load academic sessions and terms."
        )
      );
    } finally {
      setLoadingOptions(false);
    }
  }

  async function loadBroadsheet() {
    if (!termId || !sessionId) return;

    try {
      setLoadingReport(true);
      setError("");

      const response = await api.get(
        "/class-teachers/broadsheet",
        {
          params: {
            term_id: Number(termId),
            session_id: Number(sessionId),
          },
        }
      );

      setReport(response.data);
    } catch (err: any) {
      console.error("BROADSHEET ERROR:", err);

      setReport(null);

      setError(
        String(
          err?.response?.data?.detail ||
          "Unable to load your class broadsheet."
        )
      );
    } finally {
      setLoadingReport(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (termId && sessionId) {
      loadBroadsheet();
    }
  }, [termId, sessionId]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!report) return [];

    if (!q) return report.students;

    return report.students.filter((student) =>
      [
        student.name,
        student.admission_number,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(q)
        )
    );
  }, [report, search]);

  const selectedTermName =
    terms.find((term) => String(term.id) === String(termId))
      ?.name;

  const selectedSessionName =
    sessions.find(
      (session) =>
        String(session.id) === String(sessionId)
    )?.name;

  const primaryColor =
    report?.school?.primary_color || "#4f46e5";

  const secondaryColor =
    report?.school?.secondary_color || "#0f172a";

  const accentColor =
    report?.school?.accent_color || "#f59e0b";

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6">
      <div className="max-w-[1800px] mx-auto space-y-5">

        <div
          className="bg-white rounded-2xl shadow-sm p-5 border"
          style={{
            borderColor: `${primaryColor}35`,
          }}
        >
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

            <div>
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                  }}
                >
                  <GraduationCap size={22} />
                </div>

                <div>
                  <h1
                    className="text-xl sm:text-2xl font-bold"
                    style={{ color: secondaryColor }}
                  >
                    Class Teacher Broadsheet
                  </h1>

                  <p className="text-sm text-slate-500 mt-1">
                    View all students, subjects and recorded scores
                    for your assigned class.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <select
                value={sessionId}
                onChange={(event) =>
                  setSessionId(event.target.value)
                }
                disabled={loadingOptions}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2"
              >
                <option value="">
                  Select Academic Session
                </option>

                {sessions.map((session) => (
                  <option
                    key={session.id}
                    value={session.id}
                  >
                    {session.name}
                  </option>
                ))}
              </select>

              <select
                value={termId}
                onChange={(event) =>
                  setTermId(event.target.value)
                }
                disabled={loadingOptions}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">
                  Select Term
                </option>

                {terms.map((term) => (
                  <option
                    key={term.id}
                    value={term.id}
                  >
                    {term.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadBroadsheet}
                disabled={
                  loadingReport ||
                  !termId ||
                  !sessionId
                }
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {loadingReport ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCw size={16} />
                )}

                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loadingReport ? (
          <div className="bg-white rounded-2xl border border-slate-200 min-h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Loader2
                size={26}
                className="animate-spin text-indigo-600"
              />
              <span className="text-sm font-medium">
                Loading class broadsheet...
              </span>
            </div>
          </div>
        ) : report ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">
                  Class
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {report.classroom.name}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">
                  Students
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {report.students.length}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">
                  Subjects
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">
                  {report.subjects.length}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500 font-bold">
                  Academic Period
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {selectedSessionName || report.session.name}
                  {" • "}
                  {selectedTermName || report.term.name}
                </p>
              </div>
            </div>

            <div
              className="bg-white rounded-2xl shadow-sm overflow-hidden border"
              style={{
                borderColor: `${primaryColor}35`,
              }}
            >

              <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div>
                  <h2
                    className="font-bold"
                    style={{ color: secondaryColor }}
                  >
                    {report.classroom.name} Academic Broadsheet
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    CA + Exam + Total + Grade for every subject.
                  </p>
                </div>

                <div className="relative w-full md:w-80">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search student or admission number..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div
                className="h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor} 0%, ${accentColor} 100%)`,
                }}
              />

              <div className="overflow-auto max-h-[calc(100vh-280px)]">
                <table className="min-w-max w-full border-collapse">

                  <thead className="sticky top-0 z-20">
                    <tr
                      className="text-white"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    >
                      <th
                        rowSpan={2}
                        className="sticky left-0 z-30 px-4 py-3 text-left text-xs font-bold border-r border-slate-700 min-w-[210px] text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Student
                      </th>

                      <th
                        rowSpan={2}
                        className="sticky left-[210px] z-30 px-4 py-3 text-left text-xs font-bold border-r border-slate-700 min-w-[130px] text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Admission No.
                      </th>

                      {report.subjects.map((subject) => (
                        <th
                          key={subject.id}
                          colSpan={4}
                          className="px-3 py-2.5 text-center text-xs font-bold border-r border-slate-700 min-w-[280px]"
                        >
                          {subject.name}
                        </th>
                      ))}
                    </tr>

                    <tr
                      className="text-white"
                      style={{
                        backgroundColor: secondaryColor,
                      }}
                    >
                      {report.subjects.flatMap((subject) => [
                        <th
                          key={`${subject.id}-ca`}
                          className="px-2 py-2 text-center text-[11px] font-bold border-r border-slate-700 min-w-[70px]"
                        >
                          CA
                        </th>,
                        <th
                          key={`${subject.id}-exam`}
                          className="px-2 py-2 text-center text-[11px] font-bold border-r border-slate-700 min-w-[70px]"
                        >
                          EXAM
                        </th>,
                        <th
                          key={`${subject.id}-total`}
                          className="px-2 py-2 text-center text-[11px] font-bold border-r border-slate-700 min-w-[70px]"
                        >
                          TOTAL
                        </th>,
                        <th
                          key={`${subject.id}-grade`}
                          className="px-2 py-2 text-center text-[11px] font-bold border-r border-slate-700 min-w-[70px]"
                        >
                          GRADE
                        </th>,
                      ])}
                      <th
                        className="px-3 py-2 text-center text-[11px] font-bold border-r border-slate-700 min-w-[120px]"
                      >
                        TOTAL SCORE
                      </th>
                      <th
                        className="px-3 py-2 text-center text-[11px] font-bold border-r border-slate-700 min-w-[110px]"
                      >
                        AVERAGE
                      </th>
                      <th
                        className="px-3 py-2 text-center text-[11px] font-bold min-w-[100px]"
                      >
                        POSITION
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map(
                      (student, rowIndex) => (
                        <tr
                          key={student.id}
                          className={
                            rowIndex % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50"
                          }
                        >
                          <td className="sticky left-0 z-10 bg-inherit px-4 py-3 border-r border-b border-slate-200 text-sm font-semibold text-slate-900">
                            {student.name}
                          </td>

                          <td className="sticky left-[210px] z-10 bg-inherit px-4 py-3 border-r border-b border-slate-200 text-sm text-slate-600">
                            {student.admission_number}
                          </td>

                          {report.subjects.map(
                            (subject) => {
                              const result =
                                student.results[
                                  String(subject.id)
                                ];

                              return (
                                <td
                                  key={`${student.id}-${subject.id}`}
                                  colSpan={4}
                                  className="p-0 border-r border-b border-slate-200"
                                >
                                  <div className="grid grid-cols-4 min-w-[280px]">
                                    <div className="px-2 py-3 text-center text-sm border-r border-slate-100">
                                      {result?.ca ?? "—"}
                                    </div>

                                    <div className="px-2 py-3 text-center text-sm border-r border-slate-100">
                                      {result?.exam ?? "—"}
                                    </div>

                                    <div className="px-2 py-3 text-center text-sm font-bold border-r border-slate-100">
                                      {result?.total ?? "—"}
                                    </div>

                                    <div className="px-2 py-3 text-center text-sm font-bold">
                                      {result?.grade ?? "—"}
                                    </div>
                                  </div>
                                </td>
                              );
                            }
                          )}
                          <td
                            className="px-3 py-3 text-center text-sm font-black border-r border-b border-slate-200"
                            style={{
                              color: primaryColor,
                            }}
                          >
                            {student.total_score !== undefined
                              ? student.total_score
                              : "—"}
                          </td>

                          <td
                            className="px-3 py-3 text-center text-sm font-black border-r border-b border-slate-200"
                            style={{
                              color: primaryColor,
                            }}
                          >
                            {student.average !== undefined
                              ? `${Number(student.average).toFixed(2)}%`
                              : "—"}
                          </td>

                          <td
                            className="px-3 py-3 text-center text-sm font-black border-b border-slate-200"
                            style={{
                              color: accentColor,
                            }}
                          >
                            {student.position ?? "—"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                {filteredStudents.length === 0 && (
                  <div className="py-16 text-center text-slate-400">
                    <Users
                      size={30}
                      className="mx-auto mb-2"
                    />
                    <p className="text-sm font-medium">
                      No students match your search.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 min-h-[300px] flex items-center justify-center">
            <div className="text-center text-slate-400">
              <BookOpen
                size={34}
                className="mx-auto mb-2"
              />
              <p className="text-sm font-medium">
                Select an academic session and term to view the broadsheet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
