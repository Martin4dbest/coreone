"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Plus, Trash2, X, Loader2 } from "lucide-react";

type Result = {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  class_name: string;
  subject_name: string;
  term_name: string;
  session_name: string;
  total_score: number;
  grade: string | null;
};

type Option = {
  id: number;
  name: string;
  teacher_id?: number | null;
  teacher_ids?: number[];
  teacher?: { id: number } | null;
  staff_id?: number | null;
  assigned?: boolean;
};

type Student = {
  id: number;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  admission_number: string;
  class_id?: number;
};

export default function ResultsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [results, setResults] = useState<Result[]>([]);
  const [userRole, setUserRole] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [sessions, setSessions] = useState<Option[]>([]);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStudents, setBulkStudents] = useState<Student[]>([]);
  const [bulkScores, setBulkScores] = useState<
    Record<number, { ca: string; exam: string }>
  >({});
  const [bulkClassId, setBulkClassId] = useState("");
  const [bulkSubjectId, setBulkSubjectId] = useState("");
  const [bulkTermId, setBulkTermId] = useState("");
  const [bulkSessionId, setBulkSessionId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [ca, setCa] = useState("");
  const [exam, setExam] = useState("");

  const formatErrorMessage = (error: any): string => {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail
        .map((err) => {
          const field = err.loc ? err.loc[err.loc.length - 1] : "Field";
          return `${field}: ${err.msg}`;
        })
        .join("\n");
    }
    if (typeof detail === "string") return detail;
    return "Operation failed";
  };

  async function loadData() {
    try {
      const me = await api.get("/auth/me");

      const role = (
        typeof me.data.role === "string"
          ? me.data.role
          : me.data.role?.name || ""
      ).toUpperCase();

      const isTeacher = role === "TEACHER";
      setUserRole(role);

      const commonParams = { school_id: schoolId };

      // Helper to extract arrays safely from direct array or wrapped API structures ({ data: [...] })
      const extractArray = (res: any) => {
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.data?.data)) return res.data.data;
        if (Array.isArray(res?.data?.results)) return res.data.results;
        return [];
      };

      // 1. Query base school data endpoints
      const [
        resultsRes,
        studentsRes,
        classesRes,
        subjectsRes,
        termsRes,
        sessionsRes,
      ] = await Promise.all([
        isTeacher
          ? api.get("/results/teacher").catch(() => api.get("/results", { params: commonParams }))
          : api.get("/results", { params: commonParams }),

        api.get("/students", { params: commonParams }),
        api.get("/classes", { params: commonParams }),
        api.get("/subjects", { params: commonParams }),
        api.get("/terms", { params: commonParams }),
        api.get("/academic-sessions", { params: commonParams }),
      ]);

      const fetchedClasses: Option[] = extractArray(classesRes);
      const fetchedSubjects: Option[] = extractArray(subjectsRes);
      const fetchedStudents: Student[] = extractArray(studentsRes);

      if (isTeacher) {
        // 2. Query allocation endpoints used by the Teacher Workspace
        let teacherAllocations: any[] = [];
        try {
          const allocRes = await api.get("/teachers/me/allocations", { params: commonParams });
          teacherAllocations = extractArray(allocRes);
        } catch (e) {
          if (Array.isArray(me.data?.allocations)) {
            teacherAllocations = me.data.allocations;
          }
        }

        if (teacherAllocations.length > 0) {
          // Extract class IDs and subject IDs assigned in the Workspace
          const assignedClassIds = new Set(
            teacherAllocations
              .map((a: any) => a.class_id || a.class?.id)
              .filter(Boolean)
          );
          const assignedSubjectIds = new Set(
            teacherAllocations
              .map((a: any) => a.subject_id || a.subject?.id)
              .filter(Boolean)
          );

          const assignedClasses = fetchedClasses.filter((c) => assignedClassIds.has(c.id));
          const assignedSubjects = fetchedSubjects.filter((s) => assignedSubjectIds.has(s.id));

          setClasses(assignedClasses.length > 0 ? assignedClasses : fetchedClasses);
          setSubjects(assignedSubjects.length > 0 ? assignedSubjects : fetchedSubjects);

          // Filter students assigned to the teacher's classes
          const filteredStudents = fetchedStudents.filter(
            (student) => student.class_id && assignedClassIds.has(student.class_id)
          );
          setStudents(filteredStudents.length > 0 ? filteredStudents : fetchedStudents);

        } else {
          // Fallback: Check teacher_id field matches across response items
          const teacherId = me.data.id || me.data.teacher_id || me.data.user_id;

          const matchesTeacher = (item: any) => {
            if (item.assigned === true) return true;
            if (item.teacher_id === teacherId || item.staff_id === teacherId) return true;
            if (item.teacher?.id === teacherId) return true;
            if (Array.isArray(item.teacher_ids) && item.teacher_ids.includes(teacherId)) return true;
            return false;
          };

          const filteredClasses = fetchedClasses.filter(matchesTeacher);
          const filteredSubjects = fetchedSubjects.filter(matchesTeacher);

          setClasses(filteredClasses.length > 0 ? filteredClasses : fetchedClasses);
          setSubjects(filteredSubjects.length > 0 ? filteredSubjects : fetchedSubjects);

          const assignedClassIds = new Set(
            (filteredClasses.length > 0 ? filteredClasses : fetchedClasses).map((c) => c.id)
          );
          const filteredStudents = fetchedStudents.filter(
            (student) => student.class_id && assignedClassIds.has(student.class_id)
          );
          setStudents(filteredStudents.length > 0 ? filteredStudents : fetchedStudents);
        }
      } else {
        // Admin View (unfiltered)
        setClasses(fetchedClasses);
        setSubjects(fetchedSubjects);
        setStudents(fetchedStudents);
      }

      setResults(extractArray(resultsRes));
      setTerms(extractArray(termsRes));
      setSessions(extractArray(sessionsRes));
    } catch (error) {
      console.error("FAILED TO LOAD DATA:", error);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createResult() {
    if (Number(ca) > 40) {
      alert("CA score cannot exceed 40");
      return;
    }
    if (Number(exam) > 60) {
      alert("Exam score cannot exceed 60");
      return;
    }

    setSaving(true);

    try {
      await api.post("/results", {
        school_id: Number(schoolId),
        student_id: Number(studentId),
        class_id: Number(classId),
        subject_id: Number(subjectId),
        term_id: Number(termId),
        academic_session_id: Number(sessionId),
        ca_score: Number(ca),
        exam_score: Number(exam),
      });

      setOpen(false);
      await loadData();
    } catch (error: any) {
      console.error("CREATE RESULT FAILED:", error);
      alert(formatErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function deleteResult(id: number) {
    if (!confirm("Delete this result?")) return;

    try {
      await api.delete(`/results/${id}`);
      await loadData();
    } catch (error: any) {
      alert("Failed to delete result");
    }
  }

  async function deleteAllResults() {
    if (!confirm("Delete all results permanently?")) return;

    setDeletingAll(true);
    try {
      await api.delete("/results");
      await loadData();
    } catch (error: any) {
      alert("Failed to delete all results");
    } finally {
      setDeletingAll(false);
    }
  }

  async function loadBulkStudents() {
    if (!bulkClassId) {
      alert("Please select a class first");
      return;
    }

    setBulkLoading(true);

    try {
      const res = await api.get("/students", {
        params: {
          class_id: bulkClassId,
          school_id: schoolId,
        },
      });

      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setBulkStudents(list);

      const scores: Record<number, { ca: string; exam: string }> = {};
      list.forEach((student: Student) => {
        scores[student.id] = { ca: "", exam: "" };
      });

      setBulkScores(scores);
    } catch (error) {
      console.error("LOAD BULK STUDENTS FAILED:", error);
      alert("Failed to load students");
    } finally {
      setBulkLoading(false);
    }
  }

  function updateBulkScore(id: number, field: "ca" | "exam", value: string) {
    setBulkScores((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  }

  async function saveBulkResults() {
    for (const student of bulkStudents) {
      const score = bulkScores[student.id];
      const caScore = Number(score?.ca || 0);
      const examScore = Number(score?.exam || 0);

      if (caScore > 40) {
        alert(
          `CA Score for ${student.first_name} ${student.last_name} cannot exceed 40`
        );
        return;
      }
      if (examScore > 60) {
        alert(
          `Exam Score for ${student.first_name} ${student.last_name} cannot exceed 60`
        );
        return;
      }
    }

    setBulkSaving(true);

    try {
      await api.post("/results/bulk-entry", {
        school_id: Number(schoolId),
        class_id: Number(bulkClassId),
        subject_id: Number(bulkSubjectId),
        term_id: Number(bulkTermId),
        academic_session_id: Number(bulkSessionId),

        results: bulkStudents.map((student) => ({
          student_id: student.id,
          ca_score: Number(bulkScores[student.id]?.ca || 0),
          exam_score: Number(bulkScores[student.id]?.exam || 0),
        })),
      });

      await loadData();
      setBulkOpen(false);
    } catch (error: any) {
      console.error("BULK ERROR:", error?.response?.data || error);
      alert(formatErrorMessage(error));
    } finally {
      setBulkSaving(false);
    }
  }

  const filteredStudents = classId
    ? students.filter((s) => s.class_id === Number(classId))
    : students;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Results</h1>
          {userRole === "TEACHER" && (
            <p className="text-sm text-slate-500">
              Assigned Classes & Subjects Portal
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Add Result
          </button>

          <button
            onClick={() => setBulkOpen(true)}
            disabled={bulkSaving || saving}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            Bulk Entry
          </button>

          {userRole !== "TEACHER" && (
            <button
              onClick={deleteAllResults}
              disabled={deletingAll}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
            >
              {deletingAll ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
              Delete All
            </button>
          )}
        </div>
      </div>

      {/* Bulk Entry Modal */}
      {bulkOpen && (
        <div className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold text-lg">
              {userRole === "TEACHER"
                ? "Bulk Entry (Assigned Classes)"
                : "Bulk Result Entry"}
            </h2>
            <button
              onClick={() => setBulkOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            <select
              className="border p-2 rounded-lg bg-white"
              value={bulkClassId}
              onChange={(e) => setBulkClassId(e.target.value)}
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={loadBulkStudents}
              disabled={bulkLoading || !bulkClassId}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {bulkLoading && <Loader2 size={16} className="animate-spin" />}
              {bulkLoading ? "Loading..." : "Load Students"}
            </button>

            <select
              className="border p-2 rounded-lg bg-white"
              value={bulkSubjectId}
              onChange={(e) => setBulkSubjectId(e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded-lg bg-white"
              value={bulkTermId}
              onChange={(e) => setBulkTermId(e.target.value)}
            >
              <option value="">Select Term</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded-lg bg-white"
              value={bulkSessionId}
              onChange={(e) => setBulkSessionId(e.target.value)}
            >
              <option value="">Select Session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {bulkStudents.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-3 text-left">Student</th>
                    <th className="p-3 text-left w-36">CA Score (Max 40)</th>
                    <th className="p-3 text-left w-36">Exam Score (Max 60)</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="p-3">
                        {student.first_name}{" "}
                        {student.middle_name ? `${student.middle_name} ` : ""}
                        {student.last_name}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          max={40}
                          className="border p-1.5 rounded w-28"
                          placeholder="0 - 40"
                          value={bulkScores[student.id]?.ca || ""}
                          onChange={(e) =>
                            updateBulkScore(student.id, "ca", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min={0}
                          max={60}
                          className="border p-1.5 rounded w-28"
                          placeholder="0 - 60"
                          value={bulkScores[student.id]?.exam || ""}
                          onChange={(e) =>
                            updateBulkScore(student.id, "exam", e.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {bulkStudents.length > 0 && (
            <button
              onClick={saveBulkResults}
              disabled={bulkSaving}
              className="mt-5 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              {bulkSaving && <Loader2 size={16} className="animate-spin" />}
              {bulkSaving ? "Saving..." : "Save Bulk Results"}
            </button>
          )}
        </div>
      )}

      {/* Single Result Modal */}
      {open && (
        <div className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold text-lg">Add Result</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              className="border p-2 rounded-lg bg-white"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setStudentId("");
              }}
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded-lg bg-white"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">
                {classId ? "Select Student" : "Select Class First"}
              </option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name}{" "}
                  {s.middle_name ? `${s.middle_name} ` : ""}
                  {s.last_name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded-lg bg-white"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded-lg bg-white"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
            >
              <option value="">Select Term</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded-lg bg-white col-span-1 sm:col-span-2"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
            >
              <option value="">Select Session</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={0}
              max={40}
              className="border p-2 rounded-lg"
              placeholder="CA Score (Max 40)"
              value={ca}
              onChange={(e) => setCa(e.target.value)}
            />

            <input
              type="number"
              min={0}
              max={60}
              className="border p-2 rounded-lg"
              placeholder="Exam Score (Max 60)"
              value={exam}
              onChange={(e) => setExam(e.target.value)}
            />
          </div>

          <button
            onClick={createResult}
            disabled={saving}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving..." : "Save Result"}
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Admission No</th>
              <th className="p-3">Class</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Term</th>
              <th className="p-3">Session</th>
              <th className="p-3">Total</th>
              <th className="p-3">Grade</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {results.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-3">{r.student_name}</td>
                <td className="p-3">{r.admission_number}</td>
                <td className="p-3">{r.class_name}</td>
                <td className="p-3">{r.subject_name}</td>
                <td className="p-3">{r.term_name}</td>
                <td className="p-3">{r.session_name}</td>
                <td className="p-3 font-semibold">{r.total_score}</td>
                <td className="p-3">{r.grade ?? "-"}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/schools/${schoolId}/students/${r.student_id}/report-card`}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      Report Card
                    </Link>

                    <button
                      onClick={() => deleteResult(r.id)}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {results.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">
                  {userRole === "TEACHER"
                    ? "No assigned results found"
                    : "No results found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}