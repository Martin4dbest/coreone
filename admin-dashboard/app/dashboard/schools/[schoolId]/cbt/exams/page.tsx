"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  FileText,
  Plus,
  Search,
  RotateCcw,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  HelpCircle,
  Edit,
  Globe,
  GlobeOff,
  Copy,
  Trash2,
  ArrowLeft,
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface SchoolClass {
  id: string;
  name: string;
}

interface AcademicSession {
  id: string;
  name: string;
}

interface Term {
  id: string;
  name: string;
}

// Flexible Record Type for raw exam data coming from backend endpoints
type RawExamData = Record<string, any>;

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  subject_name?: string;
  subject_id?: string;
  classId?: string;
  className?: string;
  class_name?: string;
  class_id?: string;
  academicSessionId?: string;
  academicSessionName?: string;
  termId?: string;
  termName?: string;
  durationMinutes?: number;
  duration_minutes?: number;
  totalMarks?: number;
  total_marks?: number;
  passingScore?: number;
  startDate?: string;
  endDate?: string;
  shuffleQuestions?: boolean;
  showResultImmediately?: boolean;
  isActive?: boolean;
  status: "Draft" | "Published" | "Closed";
  questionsCount?: number;
  total_questions?: number;
  createdAt?: string;
  created_at?: string;
}

interface CreateExamFormData {
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  academicSessionId: string;
  termId: string;
  durationMinutes: number | "";
  totalMarks: number | "";
  passingScore: number | "";
  startDate: string;
  endDate: string;
  shuffleQuestions: boolean;
  showResultImmediately: boolean;
  isActive: boolean;
}

const initialFormState: CreateExamFormData = {
  title: "",
  description: "",
  subjectId: "",
  classId: "",
  academicSessionId: "",
  termId: "",
  durationMinutes: 60,
  totalMarks: 100,
  passingScore: 50,
  startDate: "",
  endDate: "",
  shuffleQuestions: false,
  showResultImmediately: false,
  isActive: true,
};

export default function CBTExamsPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params?.schoolId as string;

  const [exams, setExams] = useState<RawExamData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formData, setFormData] = useState<CreateExamFormData>(initialFormState);

  const handleBack = () => {
    if (schoolId) {
      router.push(`/dashboard/schools/${schoolId}/cbt`);
    } else {
      router.back();
    }
  };

  const fetchMetadata = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [subjectsRes, classesRes, sessionsRes, termsRes] = await Promise.allSettled([
        api.get(`/subjects?school_id=${schoolId}`),
        api.get("/classes"),
        api.get(`/academic-sessions?school_id=${schoolId}`),
        api.get(`/terms?school_id=${schoolId}`),
      ]);

      if (subjectsRes.status === "fulfilled") {
        const raw = subjectsRes.value.data;
        const list = Array.isArray(raw)
          ? raw
          : raw?.data?.data || raw?.data || raw?.subjects || raw?.results || [];

        setSubjects(
          list.map((item: Record<string, any>) => ({
            id: String(item.id || item._id),
            name: item.name || item.title || item.subject_name || item.label || "Unnamed Subject",
          }))
        );
      }

      if (classesRes.status === "fulfilled") {
        const raw = classesRes.value.data;
        const list = Array.isArray(raw)
          ? raw
          : raw?.data?.data ||
            raw?.data ||
            raw?.classes ||
            raw?.classrooms ||
            raw?.results ||
            [];

        setClasses(
          list.map((item: Record<string, any>) => ({
            id: String(item.id || item._id),
            name:
              item.name ??
              item.class_name ??
              item.className ??
              item.title ??
              item.label ??
              `Class ${item.id}`,
          }))
        );
      }

      if (sessionsRes.status === "fulfilled") {
        const raw = sessionsRes.value.data;
        const list = Array.isArray(raw)
          ? raw
          : raw?.data?.data ||
            raw?.data ||
            raw?.sessions ||
            raw?.academicSessions ||
            raw?.results ||
            [];

        setSessions(
          list.map((item: Record<string, any>) => ({
            id: String(item.id || item._id),
            name:
              item.name ||
              item.title ||
              item.sessionName ||
              item.session_name ||
              item.session ||
              "Unnamed Session",
          }))
        );
      }

      if (termsRes.status === "fulfilled") {
        const raw = termsRes.value.data;
        const list = Array.isArray(raw)
          ? raw
          : raw?.data?.data || raw?.data || raw?.terms || raw?.results || [];

        setTerms(
          list.map((item: Record<string, any>) => ({
            id: String(item.id || item._id),
            name:
              item.name ||
              item.title ||
              item.termName ||
              item.term_name ||
              item.term ||
              "Unnamed Term",
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
    }
  }, [schoolId]);

  const fetchExams = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/cbt/schools/${schoolId}/exams`);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setExams(data);
    } catch (err: unknown) {
      const errorObj = err as Record<string, any>;
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        "Failed to load CBT exams. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) {
      fetchExams();
      fetchMetadata();
    }
  }, [schoolId, fetchExams, fetchMetadata]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setFormError("Exam Title is required.");
      return false;
    }
    if (!formData.subjectId) {
      setFormError("Please select a Subject.");
      return false;
    }
    if (!formData.classId) {
      setFormError("Please select a Class.");
      return false;
    }
    if (!formData.academicSessionId) {
      setFormError("Please select an Academic Session.");
      return false;
    }
    if (!formData.termId) {
      setFormError("Please select a Term.");
      return false;
    }
    if (formData.durationMinutes === "" || Number(formData.durationMinutes) <= 0) {
      setFormError("Duration must be a positive number.");
      return false;
    }
    if (formData.totalMarks === "" || Number(formData.totalMarks) <= 0) {
      setFormError("Total Marks must be a positive number.");
      return false;
    }
    if (formData.passingScore === "" || Number(formData.passingScore) < 0) {
      setFormError("Passing Score cannot be negative.");
      return false;
    }
    if (Number(formData.passingScore) > Number(formData.totalMarks)) {
      setFormError("Passing Score cannot exceed Total Marks.");
      return false;
    }
    if (!formData.startDate) {
      setFormError("Start Date is required.");
      return false;
    }
    if (!formData.endDate) {
      setFormError("End Date is required.");
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setFormError("End Date must be after Start Date.");
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        school_id: Number(schoolId),
        subject_id: Number(formData.subjectId),
        class_id: Number(formData.classId),
        academic_session_id: Number(formData.academicSessionId),
        term_id: Number(formData.termId),
        duration_minutes: Number(formData.durationMinutes),
        total_marks: Number(formData.totalMarks),
        pass_mark: Number(formData.passingScore),
        start_date: formData.startDate,
        end_date: formData.endDate,
        shuffle_questions: formData.shuffleQuestions,
        show_result_immediately: formData.showResultImmediately,
        is_active: formData.isActive,
      };

      await api.post(`/cbt/exams`, payload);
      setSuccessMessage("CBT Exam created successfully!");
      setFormData(initialFormState);
      await fetchExams();
    } catch (err: unknown) {
      const errorObj = err as Record<string, any>;
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        "Failed to create exam. Please check your inputs and try again.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData(initialFormState);
    setFormError(null);
    setSuccessMessage(null);
  };

  const handlePublish = async (examId: string) => {

    const confirmPublish = window.confirm(
      "Do you want to publish this exam? Students will be able to see it on their portal."
    );

    if (!confirmPublish) {
      return;
    }

    try {
      await api.post(`/cbt/exams/${examId}/publish`, {});

      alert("Exam published successfully!");

      await fetchExams();

    } catch (err: unknown) {
      const errorObj = err as Record<string, any>;
      alert(errorObj?.response?.data?.message || "Failed to publish exam.");
    }
  };

  const handleUnpublish = async (examId: string) => {
    try {
      await api.post(`/cbt/exams/${examId}/unpublish`, {});
      await fetchExams();
    } catch (err: unknown) {
      const errorObj = err as Record<string, any>;
      alert(errorObj?.response?.data?.message || "Failed to unpublish exam.");
    }
  };

  const handleDuplicate = async (examId: string) => {
    try {
      await api.post(`/cbt/exams/${examId}/duplicate`, {});
      await fetchExams();
    } catch (err: unknown) {
      const errorObj = err as Record<string, any>;
      alert(errorObj?.response?.data?.message || "Failed to duplicate exam.");
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/cbt/exams/${examId}`);
      await fetchExams();
    } catch (err: unknown) {
      const errorObj = err as Record<string, any>;
      alert(errorObj?.response?.data?.message || "Failed to delete exam.");
    }
  };

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const query = searchQuery.toLowerCase();
    return exams.filter((exam) => {
      const title = String(exam.title || "").toLowerCase();
      const subject = String(exam.subjectName || exam.subject_name || "").toLowerCase();
      const className = String(exam.className || exam.class_name || "").toLowerCase();
      const status = exam.is_active ? "published" : "draft";

      return (
        title.includes(query) ||
        subject.includes(query) ||
        className.includes(query) ||
        status.includes(query)
      );
    });
  }, [exams, searchQuery]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Published":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Published
          </span>
        );
      case "Closed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Closed
          </span>
        );
      case "Draft":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Draft
          </span>
        );
    }
  };

  const inputStyles =
    "w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm";
  const labelStyles = "block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <button
              onClick={handleBack}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition shadow-sm w-fit"
            >
              <ArrowLeft size={16} />
              <span>Back to Hub</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
                  <FileText size={22} />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  CBT Exams Management
                </h1>
              </div>
              <p className="mt-1.5 text-sm text-slate-500 max-w-2xl">
                Configure, schedule, and oversee Computer Based Tests across subject modules and academic terms.
              </p>
            </div>
          </div>
        </div>

        {/* Create Exam Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 md:p-8">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600" />
                Create New Assessment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill in the details below to create a draft exam setup.
              </p>
            </div>
          </div>

          {formError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2.5">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateExam} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <label className={labelStyles}>
                  Exam Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Mid-Term Mathematics Assessment"
                  className={inputStyles}
                  required
                />
              </div>

              <div>
                <label className={labelStyles}>
                  Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  className={inputStyles}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelStyles}>
                  Class <span className="text-rose-500">*</span>
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleInputChange}
                  className={inputStyles}
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelStyles}>
                  Academic Session <span className="text-rose-500">*</span>
                </label>
                <select
                  name="academicSessionId"
                  value={formData.academicSessionId}
                  onChange={handleInputChange}
                  className={inputStyles}
                  required
                >
                  <option value="">Select Session</option>
                  {sessions.map((ses) => (
                    <option key={ses.id} value={ses.id}>
                      {ses.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelStyles}>
                  Term <span className="text-rose-500">*</span>
                </label>
                <select
                  name="termId"
                  value={formData.termId}
                  onChange={handleInputChange}
                  className={inputStyles}
                  required
                >
                  <option value="">Select Term</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelStyles}>
                  Duration (Minutes) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  min="1"
                  className={inputStyles}
                  required
                />
              </div>

              <div>
                <label className={labelStyles}>
                  Total Marks <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="totalMarks"
                  value={formData.totalMarks}
                  onChange={handleInputChange}
                  min="1"
                  className={inputStyles}
                  required
                />
              </div>

              <div>
                <label className={labelStyles}>
                  Passing Score <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={handleInputChange}
                  min="0"
                  className={inputStyles}
                  required
                />
              </div>

              <div>
                <label className={labelStyles}>
                  Start Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className={inputStyles}
                  required
                />
              </div>

              <div>
                <label className={labelStyles}>
                  End Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={inputStyles}
                  required
                />
              </div>

              <div className="lg:col-span-3">
                <label className={labelStyles}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Provide brief instructions or guidelines for candidates..."
                  className={inputStyles}
                />
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-slate-50/70 border border-slate-200/60">
              <label className="inline-flex items-center space-x-2.5 cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 transition">
                <input
                  type="checkbox"
                  name="shuffleQuestions"
                  checked={formData.shuffleQuestions}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition"
                />
                <span>Shuffle Questions</span>
              </label>

              <label className="inline-flex items-center space-x-2.5 cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 transition">
                <input
                  type="checkbox"
                  name="showResultImmediately"
                  checked={formData.showResultImmediately}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition"
                />
                <span>Show Result Immediately</span>
              </label>

              <label className="inline-flex items-center space-x-2.5 cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900 transition">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition"
                />
                <span>Active Status</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                <RotateCcw size={15} />
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Create Exam</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Exams Repository</h2>
              <p className="text-xs text-slate-500">View and manage existing examinations</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={16} className="text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, subject..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
              <Loader2 size={18} className="animate-spin text-indigo-600" />
              Loading exams database...
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-slate-700 font-medium text-sm mb-3">{error}</p>
              <button
                onClick={fetchExams}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Retry
              </button>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">No CBT Exams Found</h3>
              <p className="mt-1 text-xs text-slate-500">
                {searchQuery
                  ? "No matches found for your query."
                  : "Get started by creating a new exam above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Questions</th>
                    <th className="py-3 px-4">Total Marks</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredExams.map((exam) => {
                    const examId = String(exam.id || "");
                    const subjectDisplay =
                      exam.subjectName || exam.subject_name || exam.subjectId || exam.subject_id || "-";
                    const classDisplay =
                      exam.className || exam.class_name || exam.classId || exam.class_id || "-";
                    const durationDisplay = exam.durationMinutes || exam.duration_minutes || 0;
                    const questionsDisplay = exam.questionsCount ?? exam.total_questions ?? 0;
                    const totalMarksDisplay = exam.totalMarks ?? exam.total_marks ?? "-";
                    const createdDateRaw = exam.createdAt || exam.created_at;

                    return (
                      <tr key={examId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {exam.title || "Untitled Exam"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{subjectDisplay}</td>
                        <td className="py-3.5 px-4 text-slate-600">{classDisplay}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} className="text-slate-400" />
                            {durationDisplay}m
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {questionsDisplay}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{totalMarksDisplay}</td>
                        <td className="py-3.5 px-4">{renderStatusBadge(exam.is_active ? "Published" : "Draft")}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">
                          {createdDateRaw ? new Date(createdDateRaw).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              title="View Exam"
                              onClick={() =>
                                router.push(`/dashboard/schools/${schoolId}/cbt/exams/${examId}`)
                              }
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              title="Manage Questions"
                              onClick={() =>
                                router.push(`/dashboard/schools/${schoolId}/cbt/questions?examId=${examId}`)
                              }
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                            >
                              <HelpCircle size={15} />
                            </button>
                            <button
                              title="Edit Exam"
                              onClick={() =>
                                router.push(`/dashboard/schools/${schoolId}/cbt/exams/${examId}/edit`)
                              }
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Edit size={15} />
                            </button>
                            {exam.is_active ? (
                              <button
                                title="Unpublish Exam"
                                onClick={() => handleUnpublish(examId)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              >
                                <GlobeOff size={15} />
                              </button>
                            ) : (
                              <button
                                title="Publish Exam"
                                onClick={() => handlePublish(examId)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              >
                                <Globe size={15} />
                              </button>
                            )}
                            <button
                              title="Duplicate"
                              onClick={() => handleDuplicate(examId)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              title="Delete"
                              onClick={() => handleDelete(examId)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}