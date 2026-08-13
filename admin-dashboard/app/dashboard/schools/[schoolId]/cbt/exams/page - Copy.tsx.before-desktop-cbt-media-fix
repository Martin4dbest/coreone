"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

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

interface Exam {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  subjectName?: string;
  classId: string;
  className?: string;
  academicSessionId: string;
  academicSessionName?: string;
  termId: string;
  termName?: string;
  durationMinutes: number;
  totalMarks: number;
  passingScore: number;
  startDate: string;
  endDate: string;
  shuffleQuestions: boolean;
  showResultImmediately: boolean;
  isActive: boolean;
  status: "Draft" | "Published" | "Closed";
  questionsCount?: number;
  createdAt: string;
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

  const [exams, setExams] = useState<Exam[]>([]);
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

  const fetchMetadata = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [subjectsRes, classesRes, sessionsRes, termsRes] = await Promise.allSettled([
        api.get(`/subjects?school_id=${schoolId}`),
        api.get("/classes"),
        api.get(`/academic-sessions?school_id=${schoolId}`),
        api.get(`/terms?school_id=${schoolId}`),
      ]);

      // Handle Subjects response
      if (subjectsRes.status === "fulfilled") {
        const raw = subjectsRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.subjects || [];
        setSubjects(
          list.map((item: any) => ({
            id: item.id || item._id,
            name: item.name || item.title || "Unnamed Subject",
          }))
        );
      }

      // Handle Classes response
      if (classesRes.status === "fulfilled") {
        const raw = classesRes.value.data;

        console.log("Classes API:", raw);

        const list = Array.isArray(raw)
          ? raw
          : raw?.data ??
            raw?.classes ??
            raw?.classrooms ??
            raw?.results ??
            [];

        setClasses(
          list.map((item: any) => ({
            id: item.id,
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

      // Handle Academic Sessions response
      if (sessionsRes.status === "fulfilled") {
        const raw = sessionsRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.sessions || [];
        setSessions(
          list.map((item: any) => ({
            id: item.id || item._id,
            name: item.name || item.title || item.sessionName || "Unnamed Session",
          }))
        );
      }

      // Handle Terms response
      if (termsRes.status === "fulfilled") {
        const raw = termsRes.value.data;
        const list = Array.isArray(raw) ? raw : raw?.data || raw?.terms || [];
        setTerms(
          list.map((item: any) => ({
            id: item.id || item._id,
            name: item.name || item.title || item.termName || "Unnamed Term",
          }))
        );
      }
    } catch {
      // Gracefully handle missing or empty metadata
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
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
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
        ...formData,
        schoolId,
        durationMinutes: Number(formData.durationMinutes),
        totalMarks: Number(formData.totalMarks),
        passingScore: Number(formData.passingScore),
      };

      await api.post(`/cbt/exams`, payload);
      setSuccessMessage("CBT Exam created successfully!");
      setFormData(initialFormState);
      await fetchExams();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
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
    try {
      await api.post(`/cbt/exams/${examId}/publish`, {});
      await fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to publish exam.");
    }
  };

  const handleUnpublish = async (examId: string) => {
    try {
      await api.post(`/cbt/exams/${examId}/unpublish`, {});
      await fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to unpublish exam.");
    }
  };

  const handleDuplicate = async (examId: string) => {
    try {
      await api.post(`/cbt/exams/${examId}/duplicate`, {});
      await fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to duplicate exam.");
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return;
    }
    try {
      await api.post(`/cbt/exams/${examId}/delete`, {});
      await fetchExams();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete exam.");
    }
  };

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const query = searchQuery.toLowerCase();
    return exams.filter(
      (exam) =>
        exam.title.toLowerCase().includes(query) ||
        (exam.subjectName && exam.subjectName.toLowerCase().includes(query)) ||
        (exam.className && exam.className.toLowerCase().includes(query)) ||
        (exam.status && exam.status.toLowerCase().includes(query))
    );
  }, [exams, searchQuery]);

  const renderStatusBadge = (status: Exam["status"]) => {
    switch (status) {
      case "Published":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Published
          </span>
        );
      case "Closed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
            Closed
          </span>
        );
      case "Draft":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              CBT Exams
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage, configure, and issue Computer Based Tests for your school.
            </p>
          </div>
        </div>

        {/* Create Exam Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
            Create New Exam
          </h2>

          {formError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 text-sm">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleCreateExam} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Exam Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Mid-Term Mathematics Assessment"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Academic Session <span className="text-red-500">*</span>
                </label>
                <select
                  name="academicSessionId"
                  value={formData.academicSessionId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Term <span className="text-red-500">*</span>
                </label>
                <select
                  name="termId"
                  value={formData.termId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (Minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="totalMarks"
                  value={formData.totalMarks}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Passing Score <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Provide brief instructions or details about the exam..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="inline-flex items-center space-x-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="shuffleQuestions"
                  checked={formData.shuffleQuestions}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                />
                <span>Shuffle Questions</span>
              </label>

              <label className="inline-flex items-center space-x-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="showResultImmediately"
                  checked={formData.showResultImmediately}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                />
                <span>Show Result Immediately</span>
              </label>

              <label className="inline-flex items-center space-x-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Exam</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Exams Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Existing Exams
            </h2>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exams..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="animate-pulse flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/12"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/12"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/12"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-gray-800 dark:text-gray-200 font-medium mb-2">{error}</p>
              <button
                onClick={fetchExams}
                className="mt-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg transition"
              >
                Retry Loading
              </button>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No CBT Exams Found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "No exams matched your search criteria."
                  : "Get started by creating a new CBT exam using the form above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="py-3 px-4 font-semibold">Title</th>
                    <th className="py-3 px-4 font-semibold">Subject</th>
                    <th className="py-3 px-4 font-semibold">Class</th>
                    <th className="py-3 px-4 font-semibold">Duration</th>
                    <th className="py-3 px-4 font-semibold">Questions</th>
                    <th className="py-3 px-4 font-semibold">Total Marks</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Created Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  {filteredExams.map((exam) => (
                    <tr
                      key={exam.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {exam.title}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {exam.subjectName || exam.subjectId || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {exam.className || exam.classId || "-"}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {exam.durationMinutes} mins
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {exam.questionsCount ?? 0}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {exam.totalMarks}
                      </td>
                      <td className="py-3 px-4">{renderStatusBadge(exam.status)}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(exam.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/schools/${schoolId}/cbt/exams/${exam.id}`
                              )
                            }
                            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/schools/${schoolId}/cbt/questions?examId=${exam.id}`
                              )
                            }
                            className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                          >
                            Questions
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/schools/${schoolId}/cbt/exams/${exam.id}/edit`
                              )
                            }
                            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white font-medium"
                          >
                            Edit
                          </button>
                          {exam.status === "Published" ? (
                            <button
                              onClick={() => handleUnpublish(exam.id)}
                              className="px-2 py-1 text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(exam.id)}
                              className="px-2 py-1 text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => handleDuplicate(exam.id)}
                            className="px-2 py-1 text-xs text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}