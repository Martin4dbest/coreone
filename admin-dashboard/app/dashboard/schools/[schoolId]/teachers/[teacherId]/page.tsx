"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Loader2, 
  Trash2, 
  AlertCircle, 
  BookOpen, 
  Plus, 
  X, 
  GraduationCap, 
  Users, 
  UserRound, 
  School, 
  CheckCircle 
} from "lucide-react";
import api from "@/lib/api";

// Types
interface Assignment {
  id: number;
  classroom: string;
  subject: string;
}

interface TeacherSummary {
  teacher: string;
  class_teacher_of: string[];
  subjects: Assignment[];
}

interface ClassroomOption {
  id: number;
  name: string;
}

interface SubjectOption {
  id: number;
  name: string;
}

interface AcademicSessionOption {
  id: number;
  name: string;
  is_active: boolean;
}

interface TeacherPageProps {
  params: Promise<{
    schoolId: string;
    teacherId: string;
  }>;
}

interface ApiError {
  response?: {
    data?: {
      detail?: string | string[] | Record<string, unknown>;
    };
  };
  message?: string;
}

// Helper to normalize backend error responses
const parseApiError = (err: unknown): string => {
  const apiError = err as ApiError;
  const detail = apiError.response?.data?.detail;

  if (!detail) {
    return apiError.message || "An unexpected network error occurred.";
  }
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.join(", ");
  }
  if (typeof detail === "object" && detail !== null) {
    return Object.entries(detail)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
  }
  return "Failed to complete operation due to a validation error.";
};

export default function Page({ params }: TeacherPageProps) {
  const { schoolId, teacherId } = use(params);
  
  const numericSchoolId = Number(schoolId);
  const numericTeacherId = Number(teacherId);

  // State
  const [summaryData, setSummaryData] = useState<TeacherSummary | null>(null);
  const [classes, setClasses] = useState<ClassroomOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionOption[]>([]);
  
  const [isLoadingMain, setIsLoadingMain] = useState<boolean>(true);
  const [mainError, setMainError] = useState<string>("");

  // Modal Control State
  const [activeModal, setActiveModal] = useState<"assignClass" | "assignSubject" | "confirmDeleteClass" | "confirmDeleteSubject" | null>(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Action Tracking Context Targets
  const [targetClassroomName, setTargetClassroomName] = useState<string | null>(null);
  const [targetSubjectAssignmentId, setTargetSubjectAssignmentId] = useState<number | null>(null);

  // Form State Containers
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [subjectForm, setSubjectForm] = useState({
    classId: "",
    subjectId: "",
    sessionId: ""
  });

  // Data Loading
  const loadTeacherWorkspace = useCallback(async () => {
    if (!numericSchoolId || !numericTeacherId || Number.isNaN(numericSchoolId) || Number.isNaN(numericTeacherId)) {
      setIsLoadingMain(false);
      return;
    }

    try {
      setIsLoadingMain(true);
      setMainError("");
      
      const [summaryRes, classesRes, subjectsRes, sessionsRes] = await Promise.all([
        api.get<TeacherSummary>(`/teachers/${numericTeacherId}/assignments`, { params: { school_id: numericSchoolId } }),
        api.get<ClassroomOption[]>("/classes", { params: { school_id: numericSchoolId } }),
        api.get<SubjectOption[]>("/subjects", { params: { school_id: numericSchoolId } }),
        api.get<AcademicSessionOption[]>("/academic-sessions", { params: { school_id: numericSchoolId } })
      ]);

      setSummaryData(summaryRes.data);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
      setSessions(sessionsRes.data);

      // Preselect Active Academic Session Option defaults
      const activeSession = sessionsRes.data.find(s => s.is_active);
      if (activeSession) {
        setSubjectForm(prev => ({ ...prev, sessionId: String(activeSession.id) }));
      }
    } catch (err: unknown) {
      setMainError(parseApiError(err));
    } finally {
      setIsLoadingMain(false);
    }
  }, [numericSchoolId, numericTeacherId]);

  useEffect(() => {
    loadTeacherWorkspace();
  }, [loadTeacherWorkspace]);

  // Handle ESC key configuration rules to terminate active modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeModal !== null && !isModalSubmitting) {
        closeAndResetModals();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal, isModalSubmitting]);

  // Modal Cleanup Helper
  const closeAndResetModals = () => {
    setActiveModal(null);
    setModalError(null);
    setSelectedClassId("");
    setTargetClassroomName(null);
    setTargetSubjectAssignmentId(null);
    
    const activeSession = sessions.find(s => s.is_active);
    setSubjectForm({
      classId: "",
      subjectId: "",
      sessionId: activeSession ? String(activeSession.id) : ""
    });
  };

  // Event Handlers: Class Teacher Scope Assignments
  const handleAssignClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || isModalSubmitting) return;

    setIsModalSubmitting(true);
    setModalError(null);
    try {
      await api.post(`/classes/${selectedClassId}/class-teacher`, {
        teacher_id: numericTeacherId
      });
      closeAndResetModals();
      await loadTeacherWorkspace();
    } catch (err: unknown) {
      setModalError(parseApiError(err));
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const handleRemoveClassTeacher = async () => {
    if (!targetClassroomName || isModalSubmitting) return;

    // Dynamically look up class identity matching the displayed name record array matching string
    const matchingClass = classes.find(c => c.name === targetClassroomName);
    if (!matchingClass) {
      setModalError("Unable to locate mapping references for the specified class identification.");
      return;
    }

    setIsModalSubmitting(true);
    setModalError(null);
    try {
      await api.delete(`/classes/${matchingClass.id}/class-teacher`);
      closeAndResetModals();
      await loadTeacherWorkspace();
    } catch (err: unknown) {
      setModalError(parseApiError(err));
    } finally {
      setIsModalSubmitting(false);
    }
  };

  // Event Handlers: Subject Module Workload Assignments
  const handleAssignSubjectModule = async (e: React.FormEvent) => {
    e.preventDefault();
    const { classId, subjectId, sessionId } = subjectForm;
    if (!classId || !subjectId || !sessionId || isModalSubmitting) return;

    setIsModalSubmitting(true);
    setModalError(null);
    try {
      await api.post("/teacher-assignments", {
        school_id: numericSchoolId,
        teacher_id: numericTeacherId,
        classroom_id: Number(classId),
        subject_id: Number(subjectId),
        academic_session_id: Number(sessionId)
      });
      closeAndResetModals();
      await loadTeacherWorkspace();
    } catch (err: unknown) {
      setModalError(parseApiError(err));
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const handleRemoveSubjectAssignment = async () => {
    if (!targetSubjectAssignmentId || isModalSubmitting) return;

    setIsModalSubmitting(true);
    setModalError(null);
    try {
      await api.delete(`/teacher-assignments/${targetSubjectAssignmentId}`);
      closeAndResetModals();
      await loadTeacherWorkspace();
    } catch (err: unknown) {
      setModalError(parseApiError(err));
    } finally {
      setIsModalSubmitting(false);
    }
  };

  // Avatar Initials Formatter
  const getInitials = (fullName: string) => {
    if (!fullName) return "T";
    const segmentations = fullName.trim().split(/\s+/);
    if (segmentations.length === 1) return segmentations[0].charAt(0).toUpperCase();
    return (segmentations[0].charAt(0) + segmentations[segmentations.length - 1].charAt(0)).toUpperCase();
  };

  // Loading Framework
  if (isLoadingMain) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
        <p className="mt-2 text-sm text-slate-500 font-medium tracking-wide">Loading workspace environments...</p>
      </div>
    );
  }

  // Error Card Template
  if (mainError) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        <Link
          href={`/dashboard/schools/${schoolId}/teachers`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Teachers
        </Link>
        <div className="rounded-xl bg-red-50 p-5 border border-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Workspace Initialization Error</h3>
            <p className="mt-1 text-sm text-red-700">{mainError}</p>
            <button
              onClick={loadTeacherWorkspace}
              className="mt-3 rounded-md bg-red-100 px-3.5 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200 transition-colors"
            >
              Retry Connection Pipeline
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Core Fallback Check
  if (!summaryData) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        <Link
          href={`/dashboard/schools/${schoolId}/teachers`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Teachers
        </Link>
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 italic shadow-sm">
          No teacher metadata summary logs discovered inside this node workspace directory.
        </div>
      </div>
    );
  }

  // Statistics Determinations
  const assignedSubjectsCount = summaryData.subjects?.length || 0;
  const classTeacherRolesCount = summaryData.class_teacher_of?.length || 0;
  const totalTeachingResponsibilities = assignedSubjectsCount + classTeacherRolesCount;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Top Left Navigation Header */}
      <div>
        <Link
          href={`/dashboard/schools/${schoolId}/teachers`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transform transition-transform group-hover:-translate-x-0.5" />
          Back to Teachers
        </Link>
      </div>

      {/* Top Hero Section */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row items-center gap-5">
        <div className="inline-flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl tracking-wider ring-4 ring-indigo-50">
          {getInitials(summaryData.teacher)}
        </div>
        <div className="text-center sm:text-left flex-1 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{summaryData.teacher}</h1>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="text-slate-400">Teacher ID:</span> #{teacherId}
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <span className="text-slate-400">School Code:</span> #{schoolId}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subjects Assigned</p>
            <BookOpen className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{assignedSubjectsCount}</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Teacher Roles</p>
            <GraduationCap className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{classTeacherRolesCount}</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Workload Responsibilities</p>
            <Users className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{totalTeachingResponsibilities}</p>
        </div>
      </div>

      {/* Main Content Layout Sections Split */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Section 1: Teacher Information & Section 2: Class Teacher Management Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Section 1: Teacher Information Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserRound className="h-5 w-5 text-slate-400" />
              <h2 className="font-bold text-slate-900">Teacher Profile Info</h2>
            </div>
            <div className="text-sm space-y-3">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Legal Name</span>
                <span className="font-semibold text-slate-800">{summaryData.teacher}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Teacher ID</span>
                <span className="font-mono text-slate-700">#{teacherId}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">School Registration Code</span>
                <span className="font-mono text-slate-700">#{schoolId}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Class Teacher Management Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-slate-400" />
                <h2 className="font-bold text-slate-900">Class Teacher Roles</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal("assignClass")}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Assign Class
              </button>
            </div>

            <div className="space-y-2">
              {!summaryData.class_teacher_of || summaryData.class_teacher_of.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-2">
                  Not assigned as a Class Teacher.
                </p>
              ) : (
                summaryData.class_teacher_of.map((classNameString) => (
                  <div 
                    key={classNameString}
                    className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm font-semibold text-slate-800"
                  >
                    <span>{classNameString}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetClassroomName(classNameString);
                        setActiveModal("confirmDeleteClass");
                      }}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Remove Class Leadership Track"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Section 3: Subject Assignment Grid Matrix Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-slate-400" />
              <h2 className="font-bold text-slate-900">Assigned Curricular Subjects</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal("assignSubject")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Assign Subject
            </button>
          </div>

          {!summaryData.subjects || summaryData.subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-slate-50/50">
              <BookOpen className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500 font-medium">No subjects have been assigned yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th scope="col" className="px-4 py-3">Subject</th>
                      <th scope="col" className="px-4 py-3">Class / Room</th>
                      <th scope="col" className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {summaryData.subjects.map((item, index) => (
                      <tr key={`${item.classroom}-${item.subject}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900">
                          {item.subject}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 font-medium">
                          {item.classroom}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetSubjectAssignmentId(item.id);
                              setActiveModal("confirmDeleteSubject");
                            }}
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none"
                            title="Revoke Subject Allocation Linkage"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* --- Modals Framework Control Segmentations --- */}

      {/* Modal A: Assign Class Teacher */}
      {activeModal === "assignClass" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 transform transition-all animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Assign Class Homeroom Leadership</h3>
              <button 
                onClick={closeAndResetModals} 
                disabled={isModalSubmitting} 
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssignClassTeacher} className="space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-100 flex items-start gap-2 text-xs font-semibold text-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Class</label>
                <select
                  required
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white transition-colors"
                >
                  <option value="">-- Choose Classroom Option --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3 mt-5">
                <button
                  type="button"
                  onClick={closeAndResetModals}
                  disabled={isModalSubmitting}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isModalSubmitting || !selectedClassId}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 min-w-[110px]"
                >
                  {isModalSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal B: Assign Subject Module */}
      {activeModal === "assignSubject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 transform transition-all animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Assign Subject Curricular Workload</h3>
              <button 
                onClick={closeAndResetModals} 
                disabled={isModalSubmitting} 
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubjectModule} className="space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-100 flex items-start gap-2 text-xs font-semibold text-red-800">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Classroom</label>
                <select
                  required
                  value={subjectForm.classId}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, classId: e.target.value }))}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white transition-colors"
                >
                  <option value="">-- Choose Classroom Location --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Subject</label>
                <select
                  required
                  value={subjectForm.subjectId}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, subjectId: e.target.value }))}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white transition-colors"
                >
                  <option value="">-- Choose Subject Course Module --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Academic Session</label>
                <select
                  required
                  value={subjectForm.sessionId}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, sessionId: e.target.value }))}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white transition-colors"
                >
                  <option value="">-- Choose Academic Session Sequence --</option>
                  {sessions.map((ses) => (
                    <option key={ses.id} value={ses.id}>
                      {ses.name} {ses.is_active ? "(Active)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3 mt-5">
                <button
                  type="button"
                  onClick={closeAndResetModals}
                  disabled={isModalSubmitting}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isModalSubmitting || !subjectForm.classId || !subjectForm.subjectId || !subjectForm.sessionId}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 min-w-[125px]"
                >
                  {isModalSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Assign Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal C: Confirm Delete Class Teacher Relationship */}
      {activeModal === "confirmDeleteClass" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200 transform transition-all animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-bold text-slate-900">Remove Class Alignment</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Are you sure you want to remove this teacher assignment from leading <span className="font-semibold text-slate-800">({targetClassroomName})</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            {modalError && (
              <div className="rounded-lg bg-red-50 p-2.5 border border-red-100 flex items-start gap-2 mb-3 text-xs font-semibold text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3 mt-4">
              <button
                type="button"
                onClick={closeAndResetModals}
                disabled={isModalSubmitting}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveClassTeacher}
                disabled={isModalSubmitting}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none transition-colors disabled:opacity-50 min-w-[130px]"
              >
                {isModalSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Assignment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal D: Confirm Delete Subject Assignment */}
      {activeModal === "confirmDeleteSubject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200 transform transition-all animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-base font-bold text-slate-900">Remove Subject Workload</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Are you sure you want to remove this teacher assignment? This action cannot be undone.
                </p>
              </div>
            </div>

            {modalError && (
              <div className="rounded-lg bg-red-50 p-2.5 border border-red-100 flex items-start gap-2 mb-3 text-xs font-semibold text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3 mt-4">
              <button
                type="button"
                onClick={closeAndResetModals}
                disabled={isModalSubmitting}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveSubjectAssignment}
                disabled={isModalSubmitting}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none transition-colors disabled:opacity-50 min-w-[130px]"
              >
                {isModalSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Assignment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}