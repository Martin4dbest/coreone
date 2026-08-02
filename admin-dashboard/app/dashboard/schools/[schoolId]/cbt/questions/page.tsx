"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

interface Exam {
  id: string;
  title: string;
  subjectName?: string;
  className?: string;
}

interface Question {
  id: string;
  examId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  marks: number;
  explanation?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

interface QuestionFormData {
  examId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  marks: number | "";
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  imageUrl: string;
  audioUrl: string;
  videoUrl: string;
}

const initialFormState: QuestionFormData = {
  examId: "",
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  marks: 1,
  explanation: "",
  difficulty: "Medium",
  imageUrl: "",
  audioUrl: "",
  videoUrl: "",
};

export default function CBTQuestionsPage() {
  const params = useParams();
  const schoolId = params?.schoolId as string;

  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");

  const [loadingExams, setLoadingExams] = useState<boolean>(true);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [formData, setFormData] = useState<QuestionFormData>(initialFormState);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionFormData | Question | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const fetchExams = useCallback(async () => {
    if (!schoolId) return;
    setLoadingExams(true);
    setPageError(null);
    try {
      const response = await api.get(`/cbt/schools/${schoolId}/exams`);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setExams(data);
      if (data.length > 0) {
        setSelectedExamId(data[0].id);
        setFormData((prev) => ({ ...prev, examId: data[0].id }));
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load CBT exams.";
      setPageError(msg);
    } finally {
      setLoadingExams(false);
    }
  }, [schoolId]);

  const fetchQuestions = useCallback(async (examId: string) => {
    if (!examId) {
      setQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    setPageError(null);
    try {
      const response = await api.get(`/cbt/exams/${examId}/questions`);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setQuestions(
        data.map((q: any) => ({
          id: String(q.id),
          examId: String(q.exam_id),
          questionText: q.question ?? "",
          optionA: q.option_a ?? "",
          optionB: q.option_b ?? "",
          optionC: q.option_c ?? "",
          optionD: q.option_d ?? "",
          correctAnswer: q.correct_answer ?? "A",
          marks: Number(q.marks ?? 1),
          explanation: q.explanation ?? "",
          difficulty: q.difficulty ?? "Medium",
          imageUrl: q.image_url ?? "",
          audioUrl: q.audio_url ?? "",
          videoUrl: q.video_url ?? "",
          createdAt: q.created_at ?? "",
        }))
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load questions for the selected exam.";
      setPageError(msg);
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions(selectedExamId);
      setFormData((prev) => ({ ...prev, examId: selectedExamId }));
      setCurrentPage(1);
    }
  }, [selectedExamId, fetchQuestions]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedExamId(id);
    setFormData((prev) => ({ ...prev, examId: id }));
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "imageUrl" | "audioUrl"
) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    const endpoint =
        fieldName === "imageUrl"
            ? "/cbt/upload/image"
            : "/cbt/upload/audio";

    try {
        const res = await api.post(endpoint, form, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        setFormData((prev) => ({
            ...prev,
            [fieldName]: res.data.url,
        }));
    } catch (err) {
        console.error(err);
        alert("File upload failed.");
    }
};

  const validateForm = (): boolean => {
    if (!formData.examId) {
      setFormError("Please select an Exam.");
      return false;
    }
    if (!formData.questionText.trim()) {
      setFormError("Question text is required.");
      return false;
    }
    if (!formData.optionA.trim()) {
      setFormError("Option A is required.");
      return false;
    }
    if (!formData.optionB.trim()) {
      setFormError("Option B is required.");
      return false;
    }
    if (!formData.optionC.trim()) {
      setFormError("Option C is required.");
      return false;
    }
    if (!formData.optionD.trim()) {
      setFormError("Option D is required.");
      return false;
    }
    if (formData.marks === "" || Number(formData.marks) <= 0) {
      setFormError("Marks must be a positive number.");
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        exam_id: Number(formData.examId),
        question: formData.questionText,
        option_a: formData.optionA,
        option_b: formData.optionB,
        option_c: formData.optionC,
        option_d: formData.optionD,
        option_e: null,
        correct_answer: formData.correctAnswer,
        explanation: formData.explanation || null,
        marks: Number(formData.marks),
        image_url: formData.imageUrl || null,
        audio_url: formData.audioUrl || null,
        video_url: formData.videoUrl || null,
      };

      if (editingQuestionId) {
        await api.post(`/cbt/questions/${editingQuestionId}/update`, payload);
        setSuccessMessage("Question updated successfully!");
      } else {
        await api.post(`/cbt/questions`, payload);
        setSuccessMessage("Question created successfully!");
      }

      handleResetForm();
      if (formData.examId) {
        await fetchQuestions(formData.examId);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save question. Please try again.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      ...initialFormState,
      examId: selectedExamId,
    });
    setEditingQuestionId(null);
    setFormError(null);
  };

  const handleEdit = (q: Question) => {
    setEditingQuestionId(q.id);
    setFormData({
      examId: q.examId ?? "",
      questionText: q.questionText ?? "",
      optionA: q.optionA ?? "",
      optionB: q.optionB ?? "",
      optionC: q.optionC ?? "",
      optionD: q.optionD ?? "",
      correctAnswer: q.correctAnswer ?? "A",
      marks: q.marks ?? 1,
      explanation: q.explanation ?? "",
      difficulty: q.difficulty ?? "Medium",
      imageUrl: q.imageUrl ?? "",
      audioUrl: q.audioUrl ?? "",
      videoUrl: q.videoUrl ?? "",
    });
    setFormError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await api.post(`/cbt/questions/${questionId}/delete`, {});
      if (selectedExamId) {
        await fetchQuestions(selectedExamId);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete question.");
    }
  };

  const handleDuplicate = async (q: Question) => {
    try {
      await api.post(`/cbt/questions/${q.id}/duplicate`);
      if (selectedExamId) {
        await fetchQuestions(selectedExamId);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to duplicate question.");
    }
  };

  const openPreview = (item: QuestionFormData | Question) => {
    setPreviewQuestion({
      ...item,
      questionText: (item as any).questionText ?? (item as any).question ?? "",
      optionA: (item as any).optionA ?? (item as any).option_a ?? "",
      optionB: (item as any).optionB ?? (item as any).option_b ?? "",
      optionC: (item as any).optionC ?? (item as any).option_c ?? "",
      optionD: (item as any).optionD ?? (item as any).option_d ?? "",
      correctAnswer: (item as any).correctAnswer ?? (item as any).correct_answer ?? "A",
    });
    setShowPreviewModal(true);
  };

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const query = searchQuery.toLowerCase();
    return questions.filter(
      (q) =>
        q.questionText.toLowerCase().includes(query) ||
        q.optionA.toLowerCase().includes(query) ||
        q.optionB.toLowerCase().includes(query) ||
        q.optionC.toLowerCase().includes(query) ||
        q.optionD.toLowerCase().includes(query) ||
        q.difficulty.toLowerCase().includes(query)
    );
  }, [questions, searchQuery]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage]);

  const renderDifficultyBadge = (difficulty: Question["difficulty"]) => {
    switch (difficulty) {
      case "Easy":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Easy
          </span>
        );
      case "Hard":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
            Hard
          </span>
        );
      case "Medium":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
            Medium
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
              CBT Question Bank
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create, manage, and configure questions for computer-based tests.
            </p>
          </div>

          <div className="w-full md:w-80">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Select Exam
            </label>
            {loadingExams ? (
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ) : (
              <select
                value={selectedExamId}
                onChange={handleExamChange}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                {exams.length === 0 ? (
                  <option value="">No Exams Available</option>
                ) : (
                  exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} {ex.subjectName ? `(${ex.subjectName})` : ""}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        </div>

        {/* Question Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
            {editingQuestionId ? "Edit Question" : "Add New Question"}
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Question <span className="text-red-500">*</span>
              </label>
              <textarea
                name="questionText"
                value={formData.questionText}
                onChange={handleInputChange}
                rows={3}
                placeholder="Type your question here..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Option A <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="optionA"
                  value={formData.optionA}
                  onChange={handleInputChange}
                  placeholder="Enter Option A"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Option B <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="optionB"
                  value={formData.optionB}
                  onChange={handleInputChange}
                  placeholder="Enter Option B"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Option C <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="optionC"
                  value={formData.optionC}
                  onChange={handleInputChange}
                  placeholder="Enter Option C"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Option D <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="optionD"
                  value={formData.optionD}
                  onChange={handleInputChange}
                  placeholder="Enter Option D"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correct Answer <span className="text-red-500">*</span>
                </label>
                <select
                  name="correctAnswer"
                  value={formData.correctAnswer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Difficulty
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Explanation (Optional)
              </label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleInputChange}
                rows={2}
                placeholder="Provide explanation for the correct answer..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Image Attachment
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "imageUrl")}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Audio Attachment
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, "audioUrl")}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Video URL
                </label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="e.g. https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 border-t border-gray-100 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={() => openPreview(formData)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none transition"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 flex items-center space-x-2"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <span>{editingQuestionId ? "Update Question" : "Add Question"}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Questions List Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Questions ({filteredQuestions.length})
            </h2>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search questions..."
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

          {loadingQuestions ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((idx) => (
                <div key={idx} className="animate-pulse flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/12"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/12"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          ) : pageError ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">{pageError}</p>
              <button
                onClick={() => selectedExamId && fetchQuestions(selectedExamId)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-xs font-semibold rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : paginatedQuestions.length === 0 ? (
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No Questions Found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? "No questions match your search."
                  : "Start adding questions using the form above."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="py-3 px-4 font-semibold w-2/5">Question</th>
                      <th className="py-3 px-4 font-semibold">Options</th>
                      <th className="py-3 px-4 font-semibold">Correct</th>
                      <th className="py-3 px-4 font-semibold">Marks</th>
                      <th className="py-3 px-4 font-semibold">Difficulty</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    {paginatedQuestions.map((q) => (
                      <tr
                        key={q.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                          <p className="line-clamp-2">{q.questionText}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">
                          <div className="space-y-0.5">
                            <div><span className="font-semibold">A:</span> {q.optionA}</div>
                            <div><span className="font-semibold">B:</span> {q.optionB}</div>
                            <div><span className="font-semibold">C:</span> {q.optionC}</div>
                            <div><span className="font-semibold">D:</span> {q.optionD}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                          Option {q.correctAnswer}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {q.marks}
                        </td>
                        <td className="py-3 px-4">{renderDifficultyBadge(q.difficulty)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openPreview(q)}
                              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleEdit(q)}
                              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-300 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDuplicate(q)}
                              className="px-2 py-1 text-xs text-teal-600 hover:text-teal-800 dark:text-teal-400 font-medium"
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
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

              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded text-xs disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showPreviewModal && previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold border-b border-gray-100 dark:border-gray-700 pb-2">
              Question Preview
            </h3>
            <p className="text-sm font-medium">{(previewQuestion as any).questionText}</p>

            <div className="space-y-2 text-sm">
              <div
                className={`p-2 rounded border ${
                  previewQuestion.correctAnswer === "A"
                    ? "bg-green-50 border-green-300 text-green-900 dark:bg-green-900/30 dark:text-green-200"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                A. {(previewQuestion as any).optionA}
              </div>
              <div
                className={`p-2 rounded border ${
                  previewQuestion.correctAnswer === "B"
                    ? "bg-green-50 border-green-300 text-green-900 dark:bg-green-900/30 dark:text-green-200"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                B. {(previewQuestion as any).optionB}
              </div>
              <div
                className={`p-2 rounded border ${
                  previewQuestion.correctAnswer === "C"
                    ? "bg-green-50 border-green-300 text-green-900 dark:bg-green-900/30 dark:text-green-200"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                C. {(previewQuestion as any).optionC}
              </div>
              <div
                className={`p-2 rounded border ${
                  previewQuestion.correctAnswer === "D"
                    ? "bg-green-50 border-green-300 text-green-900 dark:bg-green-900/30 dark:text-green-200"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                D. {(previewQuestion as any).optionD}
              </div>
            </div>

            {previewQuestion.explanation && (
              <div className="text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-2">
                <span className="font-semibold">Explanation:</span> {previewQuestion.explanation}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-sm font-medium rounded-lg"
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