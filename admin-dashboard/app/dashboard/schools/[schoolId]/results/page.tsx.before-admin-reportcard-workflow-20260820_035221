"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Search,
  AlertTriangle,
  UserPlus,
  Eye,
  BookOpen,
  Filter,
  FileText,
} from "lucide-react";

type Result = {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  class_name: string;
  subject_name: string;
  term_name: string;
  session_name: string;
  ca_score?: number;
  exam_score?: number;
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
  class_id?: number | string;
  classroom_id?: number | string;
};

type ErrorModalState = {
  title: string;
  message: string;
} | null;

// Helper type for student grouping
type GroupedStudent = {
  student_id: number;
  student_name: string;
  admission_number: string;
  class_name: string;
  results: Result[];
};

export default function ResultsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [results, setResults] = useState<Result[]>([]);
  const [userRole, setUserRole] = useState("");
  const [resolvedSchoolId, setResolvedSchoolId] = useState<number | null>(null);

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [sessions, setSessions] = useState<Option[]>([]);

  // Main Search Filter State
  const [searchQuery, setSearchQuery] = useState("");

  // Single Result Modal State
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Quick Add Student Modal State
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [newStudentFirstName, setNewStudentFirstName] = useState("");
  const [newStudentMiddleName, setNewStudentMiddleName] = useState("");
  const [newStudentLastName, setNewStudentLastName] = useState("");
  const [newStudentAdmNo, setNewStudentAdmNo] = useState("");
  const [newStudentClassId, setNewStudentClassId] = useState("");
  const [newStudentGender, setNewStudentGender] = useState("");
  const [newStudentDob, setNewStudentDob] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  // Dedicated state for fetching modal students on demand
  const [modalStudents, setModalStudents] = useState<Student[]>([]);
  const [loadingModalStudents, setLoadingModalStudents] = useState(false);

  // Bulk Entry State
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
  const [bulkSearchQuery, setBulkSearchQuery] = useState("");

  // Teacher Review Drawer & View Scores Modal State
  const [savedResultsDrawerOpen, setSavedResultsDrawerOpen] = useState(false);
  const [drawerSearchQuery, setDrawerSearchQuery] = useState("");
  const [drawerClassFilter, setDrawerClassFilter] = useState("");
  const [selectedStudentForScores, setSelectedStudentForScores] = useState<{
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    admission_number: string;
    class_name?: string;
  } | null>(null);
  const [studentScoresModalOpen, setStudentScoresModalOpen] = useState(false);
  const [studentScoresLoading, setStudentScoresLoading] = useState(false);
  const [studentFetchedResults, setStudentFetchedResults] = useState<Result[]>([]);

  // Error / Warning Dialog State
  const [errorModal, setErrorModal] = useState<ErrorModalState>(null);

  // Single Add Inputs
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [ca, setCa] = useState("");
  const [exam, setExam] = useState("");

  const canEnterResults = ["TEACHER", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(userRole);
  const isTeacher = userRole === "TEACHER";

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
    if (typeof detail === "string") {
      if (
        detail.includes("uq_student_subject_term_session_result") ||
        detail.includes("already exists")
      ) {
        return "A result entry already exists for this student, subject, term, and session combination.";
      }
      return detail;
    }
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

      const teacherFlag = role === "TEACHER";
      setUserRole(role);

      let numericSchoolId = Number(me.data?.school_id);

      if (!Number.isInteger(numericSchoolId) || numericSchoolId <= 0) {
        const routeSchoolId = String(schoolId || "").trim();
        const routeNumericId = Number(routeSchoolId);

        if (Number.isInteger(routeNumericId) && routeNumericId > 0) {
          numericSchoolId = routeNumericId;
        } else if (routeSchoolId) {
          try {
            const schoolRes = await api.get(
              `/schools/by-slug/${encodeURIComponent(routeSchoolId)}`
            );

            const resolvedFromSlug = Number(
              schoolRes.data?.id ??
              schoolRes.data?.school_id ??
              schoolRes.data?.data?.id ??
              schoolRes.data?.data?.school_id
            );

            if (Number.isInteger(resolvedFromSlug) && resolvedFromSlug > 0) {
              numericSchoolId = resolvedFromSlug;
            }
          } catch (schoolResolveError) {
            console.error("RESULTS SCHOOL SLUG RESOLUTION FAILED:", schoolResolveError);
          }
        }
      }

      if (!Number.isInteger(numericSchoolId) || numericSchoolId <= 0) {
        throw new Error("Unable to determine the active school's numeric ID.");
      }

      setResolvedSchoolId(numericSchoolId);
      const commonParams = { school_id: numericSchoolId };

      const extractArray = (res: any) => {
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.data?.data)) return res.data.data;
        if (Array.isArray(res?.data?.results)) return res.data.results;
        if (Array.isArray(res?.data?.items)) return res.data.items;
        if (Array.isArray(res?.data?.allocations)) return res.data.allocations;
        if (Array.isArray(res?.data?.teacher_allocations)) return res.data.teacher_allocations;
        if (Array.isArray(res?.data?.assignments)) return res.data.assignments;
        return [];
      };

      const safeGet = (url: string, params?: any) =>
        api.get(url, { params }).catch((error) => {
          console.error(`[RESULTS API FAILED] ${url}`, error?.response?.status, error?.response?.data || error?.message || error);
          return { data: [] };
        });

      const [
        resultsRes,
        studentsRes,
        classesRes,
        subjectsRes,
        termsRes,
        sessionsRes,
      ] = await Promise.all([
        safeGet("/results", commonParams),
        safeGet("/students", commonParams),
        safeGet("/classes", commonParams),
        safeGet("/subjects", commonParams),
        safeGet("/terms", commonParams),
        safeGet("/academic-sessions", commonParams),
      ]);

      const fetchedClasses: Option[] = extractArray(classesRes);
      const fetchedSubjects: Option[] = extractArray(subjectsRes);
      const fetchedStudents: Student[] = extractArray(studentsRes);
      const fetchedResults: Result[] = extractArray(resultsRes);

      setAllStudents(fetchedStudents);
      setStudents(fetchedStudents);
      setClasses(fetchedClasses);

      if (teacherFlag) {
        try {
          const mySubjectsRes = await api.get("/teachers/me/subjects");
          const teacherSubjects = Array.isArray(mySubjectsRes.data)
            ? mySubjectsRes.data
            : Array.isArray(mySubjectsRes.data?.data)
            ? mySubjectsRes.data.data
            : [];

          const normalizedTeacherSubjects = teacherSubjects
            .map((subject: any) => ({
              id: Number(subject.id ?? subject.subject_id),
              name: subject.name ?? subject.subject_name ?? `Subject ${subject.id ?? subject.subject_id}`,
            }))
            .filter((subject: Option) => Number.isFinite(subject.id) && subject.id > 0);

          setSubjects(normalizedTeacherSubjects);
        } catch (subjectError) {
          console.error("[teacher-results] Failed to load teacher subjects:", subjectError);
          setSubjects([]);
        }
      }

      setResults(fetchedResults);
      setTerms(extractArray(termsRes));
      setSessions(extractArray(sessionsRes));
    } catch (error) {
      console.error("FAILED TO LOAD DATA:", error);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!open || !classId) {
      setModalStudents([]);
      return;
    }

    async function fetchStudentsByClass() {
      setLoadingModalStudents(true);
      try {
        const res = await api.get("/students", {
          params: {
            class_id: classId,
            school_id: resolvedSchoolId!,
          },
        });

        const extracted = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.results || [];

        if (extracted.length === allStudents.length && allStudents.length > 0) {
          const clientFiltered = extracted.filter(
            (s: any) => String(s.class_id || s.classroom_id) === String(classId)
          );
          setModalStudents(clientFiltered);
        } else {
          setModalStudents(extracted);
        }
      } catch (error) {
        console.error("FAILED TO FETCH STUDENTS FOR CLASS:", error);
        const clientFiltered = allStudents.filter(
          (s: any) => String(s.class_id || s.classroom_id) === String(classId)
        );
        setModalStudents(clientFiltered);
      } finally {
        setLoadingModalStudents(false);
      }
    }

    fetchStudentsByClass();
  }, [classId, open, schoolId, allStudents]);

  const getAvailableSubjects = (_selectedClassId: string) => subjects;

  async function handleQuickAddStudent() {
    if (
      !newStudentFirstName ||
      !newStudentLastName ||
      !newStudentClassId ||
      !newStudentGender ||
      !newStudentDob ||
      !newStudentEmail ||
      !newStudentPassword
    ) {
      setErrorModal({
        title: "Validation Error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    setAddingStudent(true);

    try {
      const res = await api.post("/students", {
        school_id: resolvedSchoolId!,
        first_name: newStudentFirstName,
        middle_name: newStudentMiddleName || null,
        last_name: newStudentLastName,
        admission_number: newStudentAdmNo || undefined,
        classroom_id: Number(newStudentClassId),
        gender: newStudentGender,
        date_of_birth: newStudentDob,
        email: newStudentEmail,
        password: newStudentPassword,
      });

      const createdStudent = res.data?.data || res.data;
      await loadData();

      setNewStudentFirstName("");
      setNewStudentMiddleName("");
      setNewStudentLastName("");
      setNewStudentAdmNo("");
      setNewStudentClassId("");
      setNewStudentGender("");
      setNewStudentDob("");
      setNewStudentEmail("");
      setNewStudentPassword("");
      setAddStudentOpen(false);

      if (open && createdStudent?.id) {
        setClassId(String(createdStudent.class_id || newStudentClassId));
        setStudentId(String(createdStudent.id));
      }
    } catch (error: any) {
      console.error("ADD STUDENT FAILED:", error);
      setErrorModal({
        title: "Failed to Add Student",
        message: formatErrorMessage(error),
      });
    } finally {
      setAddingStudent(false);
    }
  }

  async function createResult() {
    if (!studentId || !classId || !subjectId || !termId || !sessionId) {
      setErrorModal({
        title: "Validation Error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    const caScore = Number(ca) || 0;
    const examScore = Number(exam) || 0;

    if (caScore > 40) {
      setErrorModal({ title: "Validation Error", message: "CA score cannot exceed 40" });
      return;
    }
    if (examScore > 60) {
      setErrorModal({ title: "Validation Error", message: "Exam score cannot exceed 60" });
      return;
    }

    setSaving(true);

    try {
      await api.post("/results", {
        school_id: resolvedSchoolId!,
        student_id: Number(studentId),
        class_id: Number(classId),
        subject_id: Number(subjectId),
        term_id: Number(termId),
        academic_session_id: Number(sessionId),
        ca_score: caScore,
        exam_score: examScore,
      });

      setOpen(false);
      setCa("");
      setExam("");
      await loadData();
    } catch (error: any) {
      console.error("CREATE RESULT FAILED:", error);
      setErrorModal({
        title: "Creation Failed",
        message: formatErrorMessage(error) || "Network error. Please check server.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAllResults() {
    if (!confirm("Delete all results permanently?")) return;

    setDeletingAll(true);
    try {
      await api.delete("/results");
      await loadData();
    } catch (error: any) {
      setErrorModal({
        title: "Delete Failed",
        message: "Failed to delete all results",
      });
    } finally {
      setDeletingAll(false);
    }
  }

  async function loadBulkStudents() {
    if (!bulkClassId) {
      setErrorModal({
        title: "Validation Error",
        message: "Please select a class first",
      });
      return;
    }

    setBulkLoading(true);

    try {
      const res = await api.get("/students", {
        params: {
          class_id: bulkClassId,
          school_id: resolvedSchoolId!,
        },
      });

      let list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (!list.length) {
        const sourceList = allStudents.length > 0 ? allStudents : students;
        list = sourceList.filter(
          (s) => String(s.class_id || s.classroom_id) === String(bulkClassId)
        );
      }

      setBulkStudents(list);

      const scores: Record<number, { ca: string; exam: string }> = {};
      list.forEach((student: Student) => {
        scores[student.id] = { ca: "", exam: "" };
      });

      setBulkScores(scores);
    } catch (error) {
      console.error("LOAD BULK STUDENTS FAILED:", error);
      const sourceList = allStudents.length > 0 ? allStudents : students;
      const fallbackList = sourceList.filter(
        (s) => String(s.class_id || s.classroom_id) === String(bulkClassId)
      );
      setBulkStudents(fallbackList);

      const scores: Record<number, { ca: string; exam: string }> = {};
      fallbackList.forEach((student: Student) => {
        scores[student.id] = { ca: "", exam: "" };
      });
      setBulkScores(scores);
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
        setErrorModal({
          title: "Validation Error",
          message: `CA Score for ${student.first_name} ${student.last_name} cannot exceed 40`,
        });
        return;
      }
      if (examScore > 60) {
        setErrorModal({
          title: "Validation Error",
          message: `Exam Score for ${student.first_name} ${student.last_name} cannot exceed 60`,
        });
        return;
      }
    }

    if (!resolvedSchoolId) {
      setErrorModal({
        title: "Error Saving Results",
        message: "Unable to determine the active school's numeric ID.",
      });
      return;
    }

    setBulkSaving(true);

    try {
      await api.post("/results/bulk-entry", {
        school_id: resolvedSchoolId!,
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
      setBulkScores({});
      setBulkStudents([]);
      setBulkClassId("");
      setBulkSubjectId("");

      setErrorModal({
        title: "Success",
        message: "Bulk results saved successfully!",
      });
    } catch (error: any) {
      console.error("BULK ERROR:", error?.response?.data || error);
      setErrorModal({
        title: "Error Saving Results",
        message: formatErrorMessage(error),
      });
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleOpenStudentScores(student: {
    id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    admission_number: string;
    class_name?: string;
  }) {
    setSelectedStudentForScores(student);
    setStudentScoresModalOpen(true);
    setStudentScoresLoading(true);
    setStudentFetchedResults([]);

    try {
      const response = await api.get(`/results/student/${student.id}/report`);
      const report = response?.data ?? {};
      const reportSubjects = Array.isArray(report?.subjects) ? report.subjects : [];

      const normalizedResults: Result[] = reportSubjects.map((subject: any, index: number) => ({
        id: Number(subject?.id ?? index + 1),
        student_id: student.id,
        student_name: report?.student?.name ?? `${student.first_name} ${student.last_name}`,
        admission_number: report?.student?.admission_number ?? student.admission_number,
        class_name: report?.student?.class_name ?? student.class_name ?? "",
        subject_name: subject?.name ?? subject?.subject_name ?? "Unknown",
        term_name: subject?.term_name ?? report?.term_name ?? "",
        session_name: subject?.session_name ?? report?.session_name ?? "",
        ca_score: Number(subject?.ca ?? subject?.ca_score ?? 0),
        exam_score: Number(subject?.exam ?? subject?.exam_score ?? 0),
        total_score: Number(subject?.total ?? subject?.total_score ?? 0),
        grade: subject?.grade ?? null,
      }));

      setStudentFetchedResults(normalizedResults);
    } catch (error) {
      console.error("VIEW STUDENT SCORES ERROR:", error);
      const fallback = results.filter((r) => Number(r.student_id) === Number(student.id));
      setStudentFetchedResults(fallback);
    } finally {
      setStudentScoresLoading(false);
    }
  }

  // --- Grouping results by unique student ---
  const groupedStudentsMap = results.reduce<Record<number, GroupedStudent>>((acc, r) => {
    if (!acc[r.student_id]) {
      acc[r.student_id] = {
        student_id: r.student_id,
        student_name: r.student_name,
        admission_number: r.admission_number,
        class_name: r.class_name,
        results: [],
      };
    }
    acc[r.student_id].results.push(r);
    return acc;
  }, {});

  const groupedStudents = Object.values(groupedStudentsMap).filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.student_name && item.student_name.toLowerCase().includes(q)) ||
      (item.admission_number && item.admission_number.toLowerCase().includes(q)) ||
      (item.class_name && item.class_name.toLowerCase().includes(q))
    );
  });

  const filteredBulkStudents = bulkStudents.filter((student) => {
    const q = bulkSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.toLowerCase();
    const adm = (student.admission_number || "").toLowerCase();
    return fullName.includes(q) || adm.includes(q);
  });

  const filteredDrawerStudents = students.filter((student) => {
    const rawClassId = student.class_id ?? student.classroom_id;
    if (drawerClassFilter && String(rawClassId) !== String(drawerClassFilter)) {
      return false;
    }

    const q = drawerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.toLowerCase();
    const adm = (student.admission_number || "").toLowerCase();
    return fullName.includes(q) || adm.includes(q);
  });

  const getClassName = (student: Student) => {
    const rawClassId = student.class_id ?? student.classroom_id;
    if (!rawClassId) return "N/A";
    const found = classes.find((c) => String(c.id) === String(rawClassId));
    return found ? found.name : "N/A";
  };

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen">
      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-100">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full text-red-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{errorModal.title}</h3>
                <div className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                  {errorModal.message}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setErrorModal(null)}
                className="bg-red-700 hover:bg-red-800 text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors"
              >
                Understand & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Student Modal */}
      {addStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-red-700 font-bold text-lg">
                <UserPlus size={22} />
                <span>Quick Add Student</span>
              </div>
              <button
                onClick={() => setAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <input
                type="text"
                placeholder="First Name *"
                className="w-full border p-2 rounded-lg text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={newStudentFirstName}
                onChange={(e) => setNewStudentFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Middle Name"
                className="w-full border p-2 rounded-lg text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={newStudentMiddleName}
                onChange={(e) => setNewStudentMiddleName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Last Name *"
                className="w-full border p-2 rounded-lg text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={newStudentLastName}
                onChange={(e) => setNewStudentLastName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Admission No."
                className="w-full border p-2 rounded-lg text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={newStudentAdmNo}
                onChange={(e) => setNewStudentAdmNo(e.target.value)}
              />
              <select
                className="w-full border p-2 rounded-lg bg-white text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={newStudentGender}
                onChange={(e) => setNewStudentGender(e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <input
                type="date"
                className="w-full border p-2 rounded-lg text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={newStudentDob}
                onChange={(e) => setNewStudentDob(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email *"
                className="w-full border p-2 rounded-lg text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={newStudentEmail}
                onChange={(e) => setNewStudentEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password *"
                className="w-full border p-2 rounded-lg text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={newStudentPassword}
                onChange={(e) => setNewStudentPassword(e.target.value)}
              />
              <select
                className="w-full border p-2 rounded-lg bg-white text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 sm:col-span-2"
                value={newStudentClassId}
                onChange={(e) => setNewStudentClassId(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddStudentOpen(false)}
                className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickAddStudent}
                disabled={addingStudent}
                className="bg-red-700 hover:bg-red-800 text-white font-medium px-5 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {addingStudent && <Loader2 size={16} className="animate-spin" />}
                {addingStudent ? "Adding..." : "Save Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-red-950">Academic Results</h1>
          {isTeacher && (
            <p className="text-sm text-slate-500">
              Teacher Results Management Portal
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {!canEnterResults && (
            <button
              onClick={() => {
                if (classId) setNewStudentClassId(classId);
                setAddStudentOpen(true);
              }}
              className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm shadow-xs"
            >
              <UserPlus size={18} />
              Add Student
            </button>
          )}

          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm shadow-xs"
          >
            <Plus size={18} />
            Add Single Result
          </button>

          {!canEnterResults && (
            <button
              onClick={deleteAllResults}
              disabled={deletingAll}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl disabled:opacity-50 transition-colors font-medium text-sm shadow-xs"
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

      {/* Single Result Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-red-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-red-950">Add Single Result</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                className="border p-2 rounded-lg bg-white text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={classId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setClassId(selectedId);
                  setStudentId("");
                  setSubjectId("");
                }}
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <select
                  className="border p-2 rounded-lg bg-white text-sm flex-1 border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={!classId || loadingModalStudents}
                >
                  <option value="">
                    {!classId
                      ? "Select Class First"
                      : loadingModalStudents
                      ? "Loading students..."
                      : modalStudents.length === 0
                      ? "No Students Found"
                      : "Select Student"}
                  </option>
                  {modalStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.middle_name ? `${s.middle_name} ` : ""}{s.last_name}
                      {s.admission_number ? ` (${s.admission_number})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <select
                className="border p-2 rounded-lg bg-white text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">Select Subject</option>
                {getAvailableSubjects(classId).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                className="border p-2 rounded-lg bg-white text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
              >
                <option value="">Select Term</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select
                className="border p-2 rounded-lg bg-white text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 col-span-1 sm:col-span-2"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              >
                <option value="">Select Session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                max={40}
                className="border p-2 rounded-lg text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="CA Score (Max 40)"
                value={ca}
                onChange={(e) => setCa(e.target.value)}
              />

              <input
                type="number"
                min={0}
                max={60}
                className="border p-2 rounded-lg text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Exam Score (Max 60)"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={createResult}
                disabled={saving || !studentId || !classId || !subjectId}
                className="bg-red-700 hover:bg-red-800 text-white font-medium px-5 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Saving..." : "Save Result"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER WORKFLOW */}
      {isTeacher ? (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h2 className="font-bold text-lg text-red-950 mb-4">Bulk Result Entry</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
              <select
                className="border p-2 rounded-lg bg-white text-sm border-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
                value={bulkClassId}
                onChange={(e) => {
                  setBulkClassId(e.target.value);
                  setBulkSubjectId("");
                  setBulkStudents([]);
                }}
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={loadBulkStudents}
                disabled={bulkLoading || !bulkClassId}
                className="bg-red-700 hover:bg-red-800 text-white rounded-lg flex items-center justify-center gap-2 px-3 py-2 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {bulkLoading && <Loader2 size={16} className="animate-spin" />}
                {bulkLoading ? "Loading..." : "Load Students"}
              </button>

              <select
                className="border p-2 rounded-lg bg-white text-sm border-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
                value={bulkSubjectId}
                onChange={(e) => setBulkSubjectId(e.target.value)}
              >
                <option value="">Select Subject</option>
                {getAvailableSubjects(bulkClassId).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                className="border p-2 rounded-lg bg-white text-sm border-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
                value={bulkTermId}
                onChange={(e) => setBulkTermId(e.target.value)}
              >
                <option value="">Select Term</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select
                className="border p-2 rounded-lg bg-white text-sm border-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
                value={bulkSessionId}
                onChange={(e) => setBulkSessionId(e.target.value)}
              >
                <option value="">Select Session</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {bulkStudents.length > 0 && (
              <>
                <div className="mb-4 relative max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search loaded students..."
                    value={bulkSearchQuery}
                    onChange={(e) => setBulkSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
                  />
                  {bulkSearchQuery && (
                    <button onClick={() => setBulkSearchQuery("")} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-red-50/50 border-b border-slate-200 text-sm text-red-950 font-semibold">
                      <tr>
                        <th className="p-3 text-left">Student</th>
                        <th className="p-3 text-left w-36">CA Score (Max 40)</th>
                        <th className="p-3 text-left w-36">Exam Score (Max 60)</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredBulkStudents.map((student) => (
                        <tr key={student.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-800">
                            {student.first_name} {student.middle_name ? `${student.middle_name} ` : ""}{student.last_name}
                            {student.admission_number && (
                              <span className="text-xs text-slate-400 ml-1">({student.admission_number})</span>
                            )}
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              max={40}
                              className="border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 p-1.5 rounded w-28 text-sm"
                              placeholder="0 - 40"
                              value={bulkScores[student.id]?.ca || ""}
                              onChange={(e) => updateBulkScore(student.id, "ca", e.target.value)}
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              min={0}
                              max={60}
                              className="border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-600 p-1.5 rounded w-28 text-sm"
                              placeholder="0 - 60"
                              value={bulkScores[student.id]?.exam || ""}
                              onChange={(e) => updateBulkScore(student.id, "exam", e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={saveBulkResults}
                  disabled={bulkSaving}
                  className="mt-5 bg-red-700 hover:bg-red-800 text-white font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors text-sm shadow-xs"
                >
                  {bulkSaving && <Loader2 size={16} className="animate-spin" />}
                  {bulkSaving ? "Saving..." : "Save Bulk Results"}
                </button>
              </>
            )}
          </div>

          <div className="flex justify-start">
            <button
              onClick={() => setSavedResultsDrawerOpen(true)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors shadow-xs"
            >
              <BookOpen size={18} />
              View Saved Results
            </button>
          </div>
        </div>
      ) : (
        /* ADMIN/GENERAL WORKFLOW - GROUPED BY STUDENT */
        <>
          <div className="mb-6 relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, admission no, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 text-sm shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-red-50/50 border-b border-slate-200 text-red-950">
                <tr>
                  <th className="p-3 font-semibold">Student Name</th>
                  <th className="p-3 font-semibold">Admission No</th>
                  <th className="p-3 font-semibold">Class</th>
                  <th className="p-3 font-semibold">Subjects Entered</th>
                  <th className="p-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {groupedStudents.map((item) => (
                  <tr key={item.student_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900">{item.student_name}</td>
                    <td className="p-3 text-slate-600">{item.admission_number || "N/A"}</td>
                    <td className="p-3 text-slate-600">{item.class_name || "N/A"}</td>
                    <td className="p-3 text-slate-600">
                      <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-medium">
                        {item.results.length} Subject(s)
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleOpenStudentScores({
                              id: item.student_id,
                              first_name: item.student_name,
                              last_name: "",
                              admission_number: item.admission_number,
                              class_name: item.class_name,
                            })
                          }
                          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Eye size={14} />
                          View
                        </button>

                        <Link
                          href={`/dashboard/schools/${schoolId}/students/${item.student_id}/report-card`}
                          className="bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          Report Card
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {groupedStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      {searchQuery
                        ? `No students match "${searchQuery}"`
                        : "No student records found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TEACHER REVIEW DRAWER */}
      {savedResultsDrawerOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6 border-l border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-red-900 font-bold text-lg">
                <BookOpen size={20} />
                <span>Saved Results Review</span>
              </div>
              <button
                onClick={() => setSavedResultsDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 my-4">
              <select
                value={drawerClassFilter}
                onChange={(e) => setDrawerClassFilter(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assigned students..."
                  value={drawerSearchQuery}
                  onChange={(e) => setDrawerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredDrawerStudents.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-all"
                >
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800">
                      {s.first_name} {s.middle_name ? `${s.middle_name} ` : ""}{s.last_name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Class: {getClassName(s)} • Adm: {s.admission_number || "N/A"}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenStudentScores(s)}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200/60"
                  >
                    <Eye size={14} />
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW SCORES MODAL */}
      {studentScoresModalOpen && selectedStudentForScores && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedStudentForScores.first_name} {selectedStudentForScores.last_name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Admission: <span className="font-semibold text-slate-700">{selectedStudentForScores.admission_number || "N/A"}</span>
                  {selectedStudentForScores.class_name && (
                    <> | Class: <span className="font-semibold text-slate-700">{selectedStudentForScores.class_name}</span></>
                  )}
                </p>
              </div>

              <button
                onClick={() => {
                  setStudentScoresModalOpen(false);
                  setSelectedStudentForScores(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {studentScoresLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-red-700" />
                  <span className="text-sm">Fetching recorded scores...</span>
                </div>
              ) : studentFetchedResults.length > 0 ? (
                studentFetchedResults.map((res, index) => (
                  <div
                    key={res.id || index}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 shadow-2xs"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-800 text-sm">{res.subject_name}</h4>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          res.grade === "F9" || res.grade === "F"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        Grade: {res.grade ?? "N/A"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-200/80">
                      <div>
                        <span className="text-slate-500 block">CA Score</span>
                        <span className="font-semibold text-slate-800 text-sm">
                          {res.ca_score !== undefined && res.ca_score !== null ? res.ca_score : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Exam Score</span>
                        <span className="font-semibold text-slate-800 text-sm">
                          {res.exam_score !== undefined && res.exam_score !== null ? res.exam_score : "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total</span>
                        <span className="font-bold text-slate-900 text-sm">{res.total_score}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No recorded scores found for this student.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => {
                  setStudentScoresModalOpen(false);
                  setSelectedStudentForScores(null);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}