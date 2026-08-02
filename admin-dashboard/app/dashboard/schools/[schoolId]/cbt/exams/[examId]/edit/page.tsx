"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  ArrowLeft,
  Edit3,
  Clock,
  Award,
  CheckCircle,
  Loader2,
  Save,
  AlertCircle,
  FileText,
} from "lucide-react";

interface ExamFormState {
  title: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  pass_mark: number;
  [key: string]: any;
}

export default function EditCBTExamPage() {
  const { examId, schoolId } = useParams();
  const router = useRouter();

  const [form, setForm] = useState<ExamFormState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    
    setLoading(true);
    api
      .get(`/cbt/exams/${examId}`)
      .then((res) => {
        const data = res.data?.data || res.data;
        setForm({
          title: data.title ?? "",
          description: data.description ?? "",
          duration_minutes: data.duration_minutes ?? data.durationMinutes ?? 60,
          total_marks: data.total_marks ?? data.totalMarks ?? 100,
          pass_mark: data.pass_mark ?? data.passingScore ?? 50,
          ...data,
        });
      })
      .catch((err) => {
        console.error("Failed to fetch exam:", err);
        setError("Failed to load exam details. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [examId]);

  const handleBack = () => {
    if (schoolId) {
      router.push(`/dashboard/schools/${schoolId}/cbt/exams`);
    } else {
      router.back();
    }
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.put(`/cbt/exams/${examId}`, form);
      setSuccessMessage("Exam details updated successfully!");
      setTimeout(() => {
        handleBack();
      }, 1000);
    } catch (err: any) {
      console.error("Failed to update exam:", err);
      const msg =
        err?.response?.data?.message ||
        "An error occurred while saving the changes.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const inputStyles =
    "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm";
  const labelStyles =
    "block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5";

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50/60 p-6">
        <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-200/80">
          <Loader2 size={22} className="animate-spin text-indigo-600" />
          <span className="text-sm font-medium text-slate-600">
            Fetching exam configuration...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header Section */}
        <div className="flex flex-col gap-4">
          <div>
            <button
              onClick={handleBack}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-slate-100/80 border border-slate-200/80 rounded-xl transition shadow-sm w-fit"
            >
              <ArrowLeft size={16} />
              <span>Back to Exams</span>
            </button>
          </div>

          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-100">
              <Edit3 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Edit Assessment Details
              </h1>
              <p className="text-sm text-slate-500">
                Update exam structure, timing limits, and passing criteria.
              </p>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2.5">
            <CheckCircle size={18} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Container */}
        {form && (
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-6"
          >
            {/* General Info */}
            <div className="space-y-5">
              <div>
                <label className={labelStyles}>
                  Exam Title <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className={inputStyles}
                    placeholder="e.g. Second Term Mathematics Examination"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={labelStyles}>Description & Guidelines</label>
                <textarea
                  rows={3}
                  className={inputStyles}
                  placeholder="Provide instructions for candidate students..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Score & Timing Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className={labelStyles}>
                  Duration (Minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    className={inputStyles}
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration_minutes: Number(e.target.value),
                      })
                    }
                  />
                  <Clock
                    size={15}
                    className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className={labelStyles}>Total Marks</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    className={inputStyles}
                    value={form.total_marks}
                    onChange={(e) =>
                      setForm({ ...form, total_marks: Number(e.target.value) })
                    }
                  />
                  <Award
                    size={15}
                    className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>

              <div>
                <label className={labelStyles}>Passing Score</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    required
                    className={inputStyles}
                    value={form.pass_mark}
                    onChange={(e) =>
                      setForm({ ...form, pass_mark: Number(e.target.value) })
                    }
                  />
                  <CheckCircle
                    size={15}
                    className="absolute right-3.5 top-3.5 text-slate-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}