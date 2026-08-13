"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";
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
  BarChart3,
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  X,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
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

// Fallback metadata options matching exact specifications
const DEFAULT_CLASSES: SchoolClass[] = [
  { id: "1", name: "JSS1" },
  { id: "2", name: "SS1" },
];

const DEFAULT_SESSIONS: AcademicSession[] = [
  { id: "1", name: "2029/2030" },
  { id: "2", name: "2028/2029" },
  { id: "3", name: "2027/2028" },
  { id: "4", name: "2026/2027" },
];

const DEFAULT_TERMS: Term[] = [
  { id: "1", name: "First Term" },
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exams, setExams] = useState<RawExamData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>(DEFAULT_CLASSES);
  const [sessions, setSessions] = useState<AcademicSession[]>(DEFAULT_SESSIONS);
  const [terms, setTerms] = useState<Term[]>(DEFAULT_TERMS);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [duplicateSuccessMessage, setDuplicateSuccessMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formData, setFormData] = useState<CreateExamFormData>(initialFormState);

  // --- Bulk Import Modal States ---
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [selectedExamForImport, setSelectedExamForImport] = useState<string>("");
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState<string>("");
  const [importing, setImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showExampleTable, setShowExampleTable] = useState<boolean>(false);

  const handleBack = () => {
    setActionLoading("back");
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
          : raw?.data?.data ||
            raw?.data ||
            raw?.subjects ||
            raw?.results ||
            [];

        const schoolSubjects = list
          .filter((item: Record<string, any>) => {
            if (item.school_id == null) {
              return true;
            }

            return String(item.school_id) === String(schoolId);
          })
          .map((item: Record<string, any>) => ({
            id: String(item.id || item._id),
            name:
              item.name ||
              item.title ||
              item.subject_name ||
              item.label ||
              "Unnamed Subject",
          }));

        setSubjects(schoolSubjects);
      } else {
        setSubjects([]);
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

        if (list.length > 0) {
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

        if (list.length > 0) {
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
      }

      if (termsRes.status === "fulfilled") {
        const raw = termsRes.value.data;
        const list = Array.isArray(raw)
          ? raw
          : raw?.data?.data || raw?.data || raw?.terms || raw?.results || [];

        if (list.length > 0) {
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
      }
    } catch (err) {
      console.error("Failed to fetch metadata, falling back to defaults:", err);
    }
  }, [schoolId]);

  const fetchExams = useCallback(
    async (silent = false) => {
      if (!schoolId) return;
      if (!silent) setLoading(true);
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
        if (!silent) setLoading(false);
      }
    },
    [schoolId]
  );

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
        school_id: Number(schoolId),
        title: formData.title.trim(),
        description: formData.description,

        subject_id: Number(formData.subjectId),
        class_id: Number(formData.classId),

        duration_minutes: Number(formData.durationMinutes),
        total_marks: Number(formData.totalMarks),
        pass_mark: Number(formData.passingScore),

        randomize_questions: formData.shuffleQuestions,
        randomize_options: true,
        allow_resume: true,
        show_result_immediately: formData.showResultImmediately,
        negative_marking: false,
        negative_mark: 0,
      };

      await api.post(`/cbt/exams`, payload);
      setSuccessMessage("CBT Exam created successfully!");
      setFormData(initialFormState);
      await fetchExams(true);
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

  // --- IMMEDIATE PUBLISH (OPTIMISTIC UPDATE) ---
  const handlePublish = async (examId: string) => {
    const confirmPublish = window.confirm(
      "Do you want to publish this exam? Students will be able to see it on their portal."
    );

    if (!confirmPublish) return;

    setActionLoading(`publish-${examId}`);

    // 1. Instantly update UI from Draft -> Published
    setExams((prevExams) =>
      prevExams.map((exam) =>
        String(exam.id) === examId
          ? { ...exam, is_active: true, status: "Published" }
          : exam
      )
    );

    try {
      // 2. Make API Request
      await api.post(`/cbt/exams/${examId}/publish`, {});
      // Quiet background refresh to ensure sync with server
      fetchExams(true);
    } catch (err: unknown) {
      // 3. Rollback UI on Failure
      setExams((prevExams) =>
        prevExams.map((exam) =>
          String(exam.id) === examId
            ? {
              ...exam,
              is_active: false,
              is_published: false,
              status: "Draft",
            }
            : exam
        )
      );
      const errorObj = err as Record<string, any>;
      alert(errorObj?.response?.data?.message || "Failed to publish exam.");
    } finally {
      setActionLoading(null);
    }
  };

  // --- IMMEDIATE UNPUBLISH (OPTIMISTIC UPDATE) ---
  const handleUnpublish = async (examId: string) => {
    setActionLoading(`unpublish-${examId}`);

    // 1. Instantly update UI from Published -> Draft
    setExams((prevExams) =>
      prevExams.map((exam) =>
        String(exam.id) === examId
          ? {
              ...exam,
              is_active: false,
              is_published: false,
              status: "Draft",
            }
          : exam
      )
    );

    try {
      // 2. Make API Request
      await api.post(`/cbt/exams/${examId}/unpublish`, {});

      // 3. Keep the successful server state in the UI.
      setExams((prevExams) =>
        prevExams.map((exam) =>
          String(exam.id) === examId
            ? { ...exam, is_active: false, is_published: false, status: "Draft" }
            : exam
        )
      );
    } catch (err: unknown) {
      // 3. Rollback UI on Failure
      setExams((prevExams) =>
        prevExams.map((exam) =>
          String(exam.id) === examId
            ? { ...exam, is_active: true, status: "Published" }
            : exam
        )
      );
      const errorObj = err as Record<string, any>;
      alert(errorObj?.response?.data?.message || "Failed to unpublish exam.");
    } finally {
      setActionLoading(null);
    }
  };

  // --- IMMEDIATE DUPLICATE WITH SUCCESS MESSAGE ---
  const handleDuplicate = async (examId: string) => {
    setActionLoading(`duplicate-${examId}`);
    setDuplicateSuccessMessage(null);

    const originalExam = exams.find((e) => String(e.id) === examId);
    
    try {
      const response = await api.post(`/cbt/exams/${examId}/duplicate`, {});
      const newExam = response.data?.data || response.data;
      
      // Fallback object structure if API response varies
      const examToAdd = (newExam && typeof newExam === "object" && newExam.id)
        ? newExam
        : {
            ...originalExam,
            id: String(Date.now()),
            title: originalExam?.title ? `${originalExam.title} (Copy)` : "Duplicated Exam",
            status: "Draft",
            is_active: false,
            created_at: new Date().toISOString(),
          };

      // 1. Prepend duplicated exam immediately to the top of the UI list
      setExams((prev) => [examToAdd, ...prev]);

      // 2. Show clear pop-up / success banner
      const titleName = examToAdd.title || originalExam?.title || "Exam";
      setDuplicateSuccessMessage(`"${titleName}" duplicated successfully!`);

      // 3. Scroll view to top so user instantly sees success banner & new item
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setDuplicateSuccessMessage(null);
      }, 5000);

      // 4. Quiet background refetch for complete synchronization
      await fetchExams(true);
    } catch (err: unknown) {
      const errorObj = err as Record<string, any>;
      alert(errorObj?.response?.data?.message || "Failed to duplicate exam.");
    } finally {
      setActionLoading(null);
    }
  };

  // --- IMMEDIATE DELETE ---
  const handleDelete = async (examId: string) => {
    if (!confirm("Are you sure you want to delete this exam? This action cannot be undone.")) {
      return;
    }

    setActionLoading(`delete-${examId}`);

    // Store original array for potential rollback
    const previousExams = [...exams];

    // Instantly remove from UI
    setExams((prev) => prev.filter((exam) => String(exam.id) !== examId));

    try {
      await api.delete(`/cbt/exams/${examId}`);
    } catch (err: unknown) {
      // Rollback UI state if deletion fails on server
      setExams(previousExams);
      const errorObj = err as Record<string, any>;
      alert(errorObj?.response?.data?.message || "Failed to delete exam.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleNavigate = (path: string, actionKey: string) => {
    setActionLoading(actionKey);
    router.push(path);
  };

  // --- Bulk Import Methods ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result;
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setImportError("The uploaded spreadsheet contains no data.");
          setParsedQuestions([]);
          return;
        }

        const formatted = jsonData.map((row: any, idx) => ({
          question_number: idx + 1,
          question_text: row["question_text"] || row["Question"] || row["question"] || "",
          question_type: row["question_type"] || row["Type"] || "multiple_choice",
          marks: Number(row["marks"] || row["Marks"] || 1),
          explanation: row["explanation"] || row["Explanation"] || "",
          options: [
            { text: String(row["option_a"] || row["Option A"] || ""), is_correct: String(row["correct_option"] || "").toUpperCase() === "A" },
            { text: String(row["option_b"] || row["Option B"] || ""), is_correct: String(row["correct_option"] || "").toUpperCase() === "B" },
            { text: String(row["option_c"] || row["Option C"] || ""), is_correct: String(row["correct_option"] || "").toUpperCase() === "C" },
            { text: String(row["option_d"] || row["Option D"] || ""), is_correct: String(row["correct_option"] || "").toUpperCase() === "D" },
          ].filter((opt) => opt.text.trim() !== ""),
        }));

        setParsedQuestions(formatted);
      } catch (err) {
        setImportError("Failed to parse the file. Ensure it is a valid Excel or CSV file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleProcessImport = async () => {
    if (!selectedExamForImport) {
      setImportError("Please select a target exam to attach these questions.");
      return;
    }
    if (parsedQuestions.length === 0) {
      setImportError("No valid questions found to import.");
      return;
    }

    setImporting(true);
    setImportError(null);

    try {
      await api.post(`/cbt/exams/${selectedExamForImport}/questions/bulk`, {
        questions: parsedQuestions,
      });

      alert(`Successfully imported ${parsedQuestions.length} questions!`);
      setIsImportModalOpen(false);
      setParsedQuestions([]);
      setImportFileName("");
      await fetchExams(true);
    } catch (err: unknown) {
      const errorObj = err as Record<string, any>;
      setImportError(errorObj?.response?.data?.message || "Failed to import questions.");
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        question_text: "What is the capital of France?",
        question_type: "multiple_choice",
        marks: 2,
        option_a: "Paris",
        option_b: "London",
        option_c: "Berlin",
        option_d: "Madrid",
        correct_option: "A",
        explanation: "Paris is the capital city of France.",
      },
      {
        question_text: "Water freezes at 0 degrees Celsius.",
        question_type: "true_false",
        marks: 1,
        option_a: "True",
        option_b: "False",
        option_c: "",
        option_d: "",
        correct_option: "A",
        explanation: "Standard freezing point of water.",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions_Template");
    XLSX.writeFile(wb, "CBT_Bulk_Questions_Template.xlsx");
  };

  // Resolve Real Subject Name for Display
  const getSubjectName = (exam: RawExamData) => {
    if (exam.subjectName) return exam.subjectName;
    if (exam.subject_name) return exam.subject_name;
    const rawId = String(exam.subjectId || exam.subject_id || "");
    const found = subjects.find((s) => s.id === rawId);
    return found ? found.name : rawId || "-";
  };

  // Resolve Real Class Name for Display
  const getClassName = (exam: RawExamData) => {
    if (exam.className) return exam.className;
    if (exam.class_name) return exam.class_name;
    const rawId = String(exam.classId || exam.class_id || "");
    const found = classes.find((c) => c.id === rawId);
    return found ? found.name : rawId || "-";
  };

  // Resolve Status accurately from object keys
  const getExamStatus = (exam: RawExamData): "Published" | "Closed" | "Draft" => {
    if (exam.status === "Published" || exam.status === "Closed" || exam.status === "Draft") {
      return exam.status;
    }
    return exam.is_active ? "Published" : "Draft";
  };

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    const query = searchQuery.toLowerCase();
    return exams.filter((exam) => {
      const title = String(exam.title || "").toLowerCase();
      const subject = String(getSubjectName(exam)).toLowerCase();
      const className = String(getClassName(exam)).toLowerCase();
      const status = getExamStatus(exam).toLowerCase();

      return (
        title.includes(query) ||
        subject.includes(query) ||
        className.includes(query) ||
        status.includes(query)
      );
    });
  }, [exams, searchQuery, subjects, classes]);

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
        
        {/* Duplication Success Banner Notification */}
        {duplicateSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-500 text-white shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2.5 font-medium text-sm">
              <CheckCircle2 size={20} className="shrink-0" />
              <span>{duplicateSuccessMessage}</span>
            </div>
            <button
              onClick={() => setDuplicateSuccessMessage(null)}
              className="p-1 hover:bg-emerald-600 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Header Banner */}
        <div className="flex flex-col gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <button
              onClick={handleBack}
              disabled={actionLoading === "back"}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition shadow-sm w-fit disabled:opacity-50"
            >
              {actionLoading === "back" ? (
                <Loader2 size={16} className="animate-spin text-indigo-600" />
              ) : (
                <ArrowLeft size={16} />
              )}
              <span>{actionLoading === "back" ? "Loading..." : "Back to Hub"}</span>
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

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm w-fit"
            >
              <Upload size={16} />
              <span>Bulk Import Questions</span>
            </button>
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
                  placeholder="e.g. Mid-Term Assessment"
                  className={inputStyles}
                  required
                />
              </div>

              {/* Subject Dropdown */}
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

              {/* Class Dropdown */}
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

              {/* Academic Session Dropdown */}
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

              {/* Term Dropdown */}
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
                    <span>Processing...</span>
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
                onClick={() => fetchExams()}
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
                    const subjectDisplay = getSubjectName(exam);
                    const classDisplay = getClassName(exam);
                    const durationDisplay = exam.durationMinutes || exam.duration_minutes || 0;
                    const questionsDisplay = exam.questionsCount ?? exam.total_questions ?? 0;
                    const totalMarksDisplay = exam.totalMarks ?? exam.total_marks ?? "-";
                    const createdDateRaw = exam.createdAt || exam.created_at;

                    const isDeleting = actionLoading === `delete-${examId}`;
                    const isPublishing = actionLoading === `publish-${examId}`;
                    const isUnpublishing = actionLoading === `unpublish-${examId}`;
                    const isDuplicating = actionLoading === `duplicate-${examId}`;
                    const isViewing = actionLoading === `view-${examId}`;
                    const isQuestions = actionLoading === `questions-${examId}`;
                    const isEditing = actionLoading === `edit-${examId}`;
                    const isResults = actionLoading === `results-${examId}`;

                    const currentStatus = getExamStatus(exam);

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
                        <td className="py-3.5 px-4">{renderStatusBadge(currentStatus)}</td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs">
                          {createdDateRaw ? new Date(createdDateRaw).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View */}
                            <button
                              title="View Exam"
                              disabled={Boolean(actionLoading)}
                              onClick={() =>
                                handleNavigate(
                                  `/dashboard/schools/${schoolId}/cbt/exams/${examId}`,
                                  `view-${examId}`
                                )
                              }
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-40"
                            >
                              {isViewing ? <Loader2 size={15} className="animate-spin text-indigo-600" /> : <Eye size={15} />}
                            </button>

                            {/* Questions */}
                            <button
                              title="Manage Questions"
                              disabled={Boolean(actionLoading)}
                              onClick={() =>
                                handleNavigate(
                                  `/dashboard/schools/${schoolId}/cbt/questions?examId=${examId}`,
                                  `questions-${examId}`
                                )
                              }
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition disabled:opacity-40"
                            >
                              {isQuestions ? <Loader2 size={15} className="animate-spin" /> : <HelpCircle size={15} />}
                            </button>

                            {/* Edit */}
                            <button
                              title="Edit Exam"
                              disabled={Boolean(actionLoading)}
                              onClick={() =>
                                handleNavigate(
                                  `/dashboard/schools/${schoolId}/cbt/exams/${examId}/edit`,
                                  `edit-${examId}`
                                )
                              }
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-40"
                            >
                              {isEditing ? <Loader2 size={15} className="animate-spin text-slate-700" /> : <Edit size={15} />}
                            </button>

                            {/* Publish / Unpublish Toggle */}
                            {currentStatus === "Published" ? (
                              <button
                                title="Unpublish Exam"
                                disabled={Boolean(actionLoading)}
                                onClick={() => handleUnpublish(examId)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition disabled:opacity-40"
                              >
                                {isUnpublishing ? <Loader2 size={15} className="animate-spin" /> : <GlobeOff size={15} />}
                              </button>
                            ) : (
                              <button
                                title="Publish Exam"
                                disabled={Boolean(actionLoading)}
                                onClick={() => handlePublish(examId)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-40"
                              >
                                {isPublishing ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
                              </button>
                            )}

                            {/* Duplicate */}
                            <button
                              title="Duplicate"
                              disabled={Boolean(actionLoading)}
                              onClick={() => handleDuplicate(examId)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-40"
                            >
                              {isDuplicating ? <Loader2 size={15} className="animate-spin text-indigo-600" /> : <Copy size={15} />}
                            </button>

                            {/* Results */}
                            <button
                              title="View Results"
                              disabled={Boolean(actionLoading)}
                              onClick={() =>
                                handleNavigate(
                                  `/dashboard/schools/${schoolId}/cbt/results?examId=${examId}`,
                                  `results-${examId}`
                                )
                              }
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-40"
                            >
                              {isResults ? <Loader2 size={15} className="animate-spin" /> : <BarChart3 size={15} />}
                            </button>

                            {/* Delete */}
                            <button
                              title="Delete"
                              disabled={Boolean(actionLoading)}
                              onClick={() => handleDelete(examId)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition disabled:opacity-40"
                            >
                              {isDeleting ? <Loader2 size={15} className="animate-spin text-rose-600" /> : <Trash2 size={15} />}
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

        {/* --- BULK IMPORT QUESTIONS MODAL --- */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-5 border border-slate-100 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-600" size={22} />
                  <h3 className="text-lg font-bold text-slate-900">Bulk Import Questions</h3>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Requirement Instructions Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Info size={14} className="text-indigo-600" /> Required Excel Columns
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowExampleTable((prev) => !prev)}
                    className="text-xs font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    {showExampleTable ? "Hide Example Sheet" : "Preview Format Table"}
                    {showExampleTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                
                <p>Your spreadsheet column headers must match the following names exactly:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold">
                    question_text <span className="text-rose-500">*</span>
                  </div>
                  <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold">
                    option_a <span className="text-rose-500">*</span>
                  </div>
                  <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold">
                    option_b <span className="text-rose-500">*</span>
                  </div>
                  <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-800">option_c</div>
                  <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-800">option_d</div>
                  <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold">
                    correct_option <span className="text-rose-500">*</span>
                  </div>
                  <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-800">marks</div>
                  <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-800">explanation</div>
                  <div className="p-1.5 bg-white border border-slate-200 rounded text-slate-800">question_type</div>
                </div>

                {/* Example Table Accordion */}
                {showExampleTable && (
                  <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead className="bg-slate-100 font-semibold border-b border-slate-200 text-slate-700">
                        <tr>
                          <th className="p-2 border-r">question_text</th>
                          <th className="p-2 border-r">option_a</th>
                          <th className="p-2 border-r">option_b</th>
                          <th className="p-2 border-r">option_c</th>
                          <th className="p-2 border-r">option_d</th>
                          <th className="p-2 border-r">correct_option</th>
                          <th className="p-2">marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono text-slate-600 bg-white">
                        <tr>
                          <td className="p-2 border-r whitespace-nowrap">Capital of France?</td>
                          <td className="p-2 border-r">Paris</td>
                          <td className="p-2 border-r">London</td>
                          <td className="p-2 border-r">Berlin</td>
                          <td className="p-2 border-r">Rome</td>
                          <td className="p-2 border-r font-bold text-emerald-600">A</td>
                          <td className="p-2">2</td>
                        </tr>
                        <tr>
                          <td className="p-2 border-r whitespace-nowrap">Earth is flat.</td>
                          <td className="p-2 border-r">True</td>
                          <td className="p-2 border-r">False</td>
                          <td className="p-2 border-r"></td>
                          <td className="p-2 border-r"></td>
                          <td className="p-2 border-r font-bold text-emerald-600">B</td>
                          <td className="p-2">1</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {importError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{importError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelStyles}>Target Exam</label>
                  <select
                    value={selectedExamForImport}
                    onChange={(e) => setSelectedExamForImport(e.target.value)}
                    className={inputStyles}
                  >
                    <option value="">-- Select Target Exam --</option>
                    {exams.map((ex) => (
                      <option key={String(ex.id)} value={String(ex.id)}>
                        {ex.title || "Untitled Exam"} ({getSubjectName(ex)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelStyles}>Upload Excel File (.xlsx / .csv)</label>
                    <button
                      type="button"
                      onClick={downloadSampleTemplate}
                      className="text-xs text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <Download size={13} /> Download .XLSX Template
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center transition flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-indigo-50/20"
                  >
                    <Upload size={24} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-slate-700">
                      {importFileName ? importFileName : "Click to select Excel spreadsheet"}
                    </span>
                    <span className="text-xs text-slate-400">Supports .xlsx, .xls, and .csv files</span>
                  </button>
                </div>

                {parsedQuestions.length > 0 && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 font-medium flex items-center justify-between">
                    <span>Questions Ready to Upload:</span>
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md font-bold">
                      {parsedQuestions.length} Questions
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  disabled={importing || parsedQuestions.length === 0}
                  onClick={handleProcessImport}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 shadow-sm"
                >
                  {importing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Import Questions</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}