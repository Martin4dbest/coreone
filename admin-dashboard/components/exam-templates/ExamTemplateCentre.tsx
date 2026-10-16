"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

type Template = {
  id: number;
  title: string;
  assessment_type: "EXAM" | "TEST" | "QUIZ";
  description?: string | null;
  class_name?: string | null;
  subject?: string | null;
  file_url: string;
  original_filename: string;
  file_size: number;
  version: number;
  is_active: boolean;
  created_at?: string | null;
};

type Props = {
  schoolId?: string;
  mode: "manage" | "browse";
};

const emptyForm = {
  title: "",
  assessment_type: "EXAM",
  description: "",
  class_name: "",
  subject: "",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10";

function DocumentIcon({ type }: { type: string }) {
  const isExam = type === "EXAM";
  const isTest = type === "TEST";

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
        isExam
          ? "bg-indigo-100 text-indigo-700"
          : isTest
            ? "bg-sky-100 text-sky-700"
            : "bg-violet-100 text-violet-700"
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="h-6 w-6"
      >
        <path
          d="M7 3.75h7l4.25 4.5v12A1.75 1.75 0 0 1 16.5 22h-9A1.75 1.75 0 0 1 5.75 20.25V5.5A1.75 1.75 0 0 1 7.5 3.75Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M14 4v5h4M8.5 13h7M8.5 16.5h7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function AssessmentBadge({ type }: { type: string }) {
  const styles =
    type === "EXAM"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : type === "TEST"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-violet-200 bg-violet-50 text-violet-700";

  const label =
    type === "EXAM" ? "Examination" : type === "TEST" ? "Test" : "Quiz";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}

export default function ExamTemplateCentre({ schoolId, mode }: Props) {
  const managing = mode === "manage";
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showVersions, setShowVersions] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");

  useEffect(() => {
    if (!schoolId) return;

    let cancelled = false;

    api.get(`/branding?school_id=${schoolId}`)
      .then((response) => {
        const color = response.data?.primary_color;
        if (!cancelled && typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color.trim())) {
          setPrimaryColor(color.trim());
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params: Record<string, string | number | boolean> = {};
      if (schoolId) params.school_id = Number(schoolId);
      if (managing && showVersions) params.include_archived = true;

      const response = await api.get("/exam-templates", { params });
      setTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load examination templates. Please refresh and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [schoolId, managing, showVersions]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  async function submitTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!file) {
      setError("Choose a PDF, DOC or DOCX template file.");
      return;
    }

    const data = new FormData();
    data.append("title", form.title.trim());
    data.append("assessment_type", form.assessment_type);
    data.append("description", form.description);
    data.append("class_name", form.class_name);
    data.append("subject", form.subject);
    if (schoolId) data.append("school_id", schoolId);
    data.append("file", file);

    setUploading(true);
    try {
      await api.post("/exam-templates", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm(emptyForm);
      setFile(null);
      const input = document.getElementById(
        "exam-template-file"
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      setNotice(
        "Template uploaded successfully. The previous version is retained."
      );
      await loadTemplates();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Template upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  async function archiveTemplate(id: number) {
    if (
      !window.confirm(
        "Archive this template? Its file and version history will be retained."
      )
    ) {
      return;
    }

    setError("");
    setNotice("");
    try {
      const params = schoolId ? { school_id: Number(schoolId) } : {};
      await api.post(`/exam-templates/${id}/archive`, null, { params });
      setNotice("Template archived.");
      await loadTemplates();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Unable to archive this template."
      );
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div
      style={{ "--tenant-primary": primaryColor } as React.CSSProperties}
      className="tenant-template-primary"
    >
      <style jsx global>{`
        .tenant-template-primary .bg-indigo-600,
        .tenant-template-primary .bg-indigo-500 {
          background-color: var(--tenant-primary) !important;
        }
        .tenant-template-primary .text-indigo-600,
        .tenant-template-primary .text-indigo-700,
        .tenant-template-primary .text-indigo-800 {
          color: var(--tenant-primary) !important;
        }
        .tenant-template-primary .border-indigo-100,
        .tenant-template-primary .border-indigo-200,
        .tenant-template-primary .border-indigo-300 {
          border-color: color-mix(in srgb, var(--tenant-primary) 24%, white) !important;
        }
        .tenant-template-primary .bg-indigo-50,
        .tenant-template-primary .bg-indigo-100 {
          background-color: color-mix(in srgb, var(--tenant-primary) 10%, white) !important;
        }
        .tenant-template-primary .bg-gradient-to-r,
        .tenant-template-primary .bg-gradient-to-br {
          background-image: linear-gradient(120deg, var(--tenant-primary), var(--tenant-primary)) !important;
        }
        .tenant-template-primary .hover\:bg-indigo-700:hover {
          background-color: var(--tenant-primary) !important;
          filter: brightness(0.9);
        }
      `}</style>
      <main className="mx-auto w-full max-w-6xl space-y-8">
      {/* Component heading */}
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            EXAMINATION RESOURCES
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {managing ? "Manage your templates" : "Browse templates"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {managing
              ? "Upload, organise and maintain your school's official examination, test and quiz documents."
              : "Find your school's available examination, test and quiz templates before preparing questions."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/70">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <path
                d="M5 5.75A1.75 1.75 0 0 1 6.75 4h10.5A1.75 1.75 0 0 1 19 5.75v12.5A1.75 1.75 0 0 1 17.25 20H6.75A1.75 1.75 0 0 1 5 18.25V5.75Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M8 8h8M8 12h8M8 16h5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              {managing ? "Template management" : "Resource library"}
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-800">
              {loading
                ? "Loading resources…"
                : `${templates.length} template${templates.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      </header>

      {/* Feedback messages */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
            !
          </span>
          <p className="pt-1">{error}</p>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
            ✓
          </span>
          <p className="pt-1">{notice}</p>
        </div>
      )}

      {/* Upload form */}
      {managing && (
        <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm shadow-indigo-950/[0.04]">
          <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-blue-800 px-5 py-6 text-white sm:px-7">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                >
                  <path
                    d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3.75A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V14.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold sm:text-2xl">
                  Upload official template
                </h3>
                <p className="mt-1 text-sm leading-5 text-indigo-100">
                  Add an examination document to your school resource library.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                PDF documents
              </span>
              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                Word documents
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                Maximum 20 MB
              </span>
            </div>

            <form
              onSubmit={submitTemplate}
              className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2"
            >
              <label className="block text-sm font-semibold text-slate-700">
                Template title <span className="text-rose-500">*</span>
                <input
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="e.g. First Term Examination"
                  className={inputClass}
                />
                <span className="mt-1.5 block text-xs font-normal text-slate-400">
                  Give this template a clear, recognisable name.
                </span>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Assessment type <span className="text-rose-500">*</span>
                <select
                  value={form.assessment_type}
                  onChange={(e) =>
                    setForm({ ...form, assessment_type: e.target.value })
                  }
                  className={inputClass}
                >
                  <option value="EXAM">Examination</option>
                  <option value="TEST">Test</option>
                  <option value="QUIZ">Quiz</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Class <span className="font-normal text-slate-400">(optional)</span>
                <input
                  value={form.class_name}
                  onChange={(e) =>
                    setForm({ ...form, class_name: e.target.value })
                  }
                  placeholder="e.g. JSS 2"
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Subject <span className="font-normal text-slate-400">(optional)</span>
                <input
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  placeholder="e.g. Mathematics"
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                Description{" "}
                <span className="font-normal text-slate-400">(optional)</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Explain when or how teachers should use this template."
                  className={`${inputClass} resize-y`}
                />
              </label>

              <div className="md:col-span-2">
                <label
                  htmlFor="exam-template-file"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Template file <span className="text-rose-500">*</span>
                </label>

                <label
                  htmlFor="exam-template-file"
                  className="group flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-sky-50/50 px-5 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50 sm:py-10"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100 transition group-hover:-translate-y-0.5">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-7 w-7"
                    >
                      <path
                        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3.75A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V14.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>

                  <span className="mt-4 text-sm font-bold text-slate-800">
                    {file ? file.name : "Choose a template document"}
                  </span>
                  <span className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                    {file
                      ? `${formatSize(file.size)} · Click to choose a different file`
                      : "Click here to browse your computer and select a PDF, DOC or DOCX file."}
                  </span>
                  <span className="mt-4 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm transition group-hover:border-indigo-300">
                    {file ? "Change selected file" : "Browse files"}
                  </span>
                </label>

                <input
                  id="exam-template-file"
                  required
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="sr-only"
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  Accepted formats: PDF, DOC and DOCX.
                </p>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {uploading ? (
                    <>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4 animate-spin"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="3"
                          opacity=".25"
                        />
                        <path
                          d="M21 12a9 9 0 0 0-9-9"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      Uploading template…
                    </>
                  ) : (
                    <>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-5 w-5"
                      >
                        <path
                          d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3.75A1.75 1.75 0 0 0 6.75 20h10.5A1.75 1.75 0 0 0 19 18.25V14.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Upload template
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Template library */}
      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                >
                  <path
                    d="M7 3.75h7l4.25 4.5v12A1.75 1.75 0 0 1 16.5 22h-9A1.75 1.75 0 0 1 5.75 20.25V5.5A1.75 1.75 0 0 1 7.5 3.75Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 4v5h4M8.5 13h7M8.5 16.5h7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                {managing && showVersions
                  ? "Template version archive"
                  : "Available templates"}
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {loading
                ? "Loading templates…"
                : `${templates.length} template version${templates.length === 1 ? "" : "s"} found`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {managing && (
              <button
                type="button"
                onClick={() => setShowVersions(!showVersions)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                >
                  <path
                    d="M4 7h16M7 4v6m10-6v6M5 12h14v7H5z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {showVersions ? "Show active only" : "View version archive"}
              </button>
            )}

            <button
              type="button"
              onClick={() => void loadTemplates()}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              >
                <path
                  d="M20 7v5h-5M4 17v-5h5m-4-3a8 8 0 0 1 13-2l2 2M4 15l2 2a8 8 0 0 0 13-2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {loading && templates.length === 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/3 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-6 h-16 rounded-xl bg-slate-50" />
                <div className="mt-5 h-10 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {!loading && templates.length === 0 && (
          <div className="overflow-hidden rounded-3xl border border-dashed border-indigo-200 bg-gradient-to-br from-white via-indigo-50/50 to-sky-50/60 px-5 py-12 text-center sm:py-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-8 w-8"
              >
                <path
                  d="M7 3.75h7l4.25 4.5v12A1.75 1.75 0 0 1 16.5 22h-9A1.75 1.75 0 0 1 5.75 20.25V5.5A1.75 1.75 0 0 1 7.5 3.75Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 4v5h4M8.5 13h7M8.5 16.5h4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h4 className="mt-5 text-lg font-bold text-slate-900">
              No templates found
            </h4>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {managing
                ? "Upload your school's first official template using the form above. Your documents will appear here."
                : "Your school has not published an active template yet. Check back when a template is available."}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {templates.map((template) => (
            <article
              key={template.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/[0.06]"
            >
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-sky-400" />

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <DocumentIcon type={template.assessment_type} />

                  <div className="min-w-0 flex-1">
                    <h4 className="break-words text-base font-bold leading-6 text-slate-900 transition group-hover:text-indigo-800">
                      {template.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Version {template.version}
                      {template.created_at
                        ? ` · ${new Date(template.created_at).toLocaleDateString()}`
                        : ""}
                    </p>
                    <div className="mt-2">
                      <AssessmentBadge type={template.assessment_type} />
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      template.is_active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span
                      className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                        template.is_active ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {template.is_active ? "Active" : "Archived"}
                  </span>
                </div>

                {template.description && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                    {template.description}
                  </p>
                )}

                <div className="my-5 h-px bg-slate-100" />

                <dl className="grid grid-cols-2 gap-4">
                  {template.class_name && (
                    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                      <dt className="text-xs font-medium text-slate-500">
                        Class
                      </dt>
                      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                        {template.class_name}
                      </dd>
                    </div>
                  )}

                  {template.subject && (
                    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                      <dt className="text-xs font-medium text-slate-500">
                        Subject
                      </dt>
                      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                        {template.subject}
                      </dd>
                    </div>
                  )}

                  <div className="col-span-2 min-w-0 rounded-xl border border-slate-100 bg-white p-3">
                    <dt className="text-xs font-medium text-slate-500">
                      Document
                    </dt>
                    <dd className="mt-1 break-all text-sm font-medium text-slate-800">
                      {template.original_filename}
                    </dd>
                    <dd className="mt-1 text-xs text-slate-500">
                      {formatSize(template.file_size)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                  <a
                    href={template.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                    >
                      <path
                        d="M14 4h6v6m-10 4L20 4M18 13v5.25A1.75 1.75 0 0 1 16.25 20h-10A1.75 1.75 0 0 1 4.5 18.25v-10A1.75 1.75 0 0 1 6.25 6.5H12"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Open / download
                  </a>

                  {managing && template.is_active && (
                    <button
                      type="button"
                      onClick={() => void archiveTemplate(template.id)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-500/10"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                      >
                        <path
                          d="M4 7h16M9 7V4.75h6V7m-9 0 .8 12.25A1.75 1.75 0 0 0 8.55 21h6.9a1.75 1.75 0 0 0 1.75-1.75L18 7M10 11v6m4-6v6"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      </main>
    </div>
  );
}
