"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
} from "lucide-react";

import api from "@/lib/api";

type ImportError = {
  row: number;
  error: string;
};

type PreviewRow = {
  row: number;
  academic_session: string;
  term: string;
  class: string;
  subject: string;
  teacher: string;
  day: string;
  start_time: string;
  end_time: string;
};

type PreviewResult = {
  valid_rows: number;
  invalid_rows: number;
  can_import: boolean;
  rows: PreviewRow[];
  errors: ImportError[];
  message: string;
};

type ImportResult = {
  message?: string;
  imported_count?: number;
};

function getError(error: unknown) {
  const err = error as {
    response?: {
      data?: {
        detail?: string | {
          message?: string;
          errors?: ImportError[];
        };
      };
    };
    message?: string;
  };

  const detail = err.response?.data?.detail;

  if (typeof detail === "string") {
    return { message: detail, errors: [] as ImportError[] };
  }

  if (detail && typeof detail === "object") {
    return {
      message: detail.message || "The spreadsheet contains errors.",
      errors: detail.errors || [],
    };
  }

  return {
    message: err.message || "Unable to process the spreadsheet.",
    errors: [],
  };
}

export default function TimetableImportPanel({
  schoolId,
  onImported,
}: {
  schoolId: number;
  onImported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [rowErrors, setRowErrors] = useState<ImportError[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function clearPreview() {
    setPreview(null);
    setRowErrors([]);
    setError("");
    setResult(null);
  }

  async function downloadTemplate() {
    try {
      setDownloading(true);
      setError("");

      const response = await api.get("/timetable/import-template", {
        responseType: "blob",
      });

      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "timetable-import-template.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getError(err).message);
    } finally {
      setDownloading(false);
    }
  }

  function createFormData() {
    const formData = new FormData();
    if (file) formData.append("file", file);
    return formData;
  }

  function validateFile() {
    if (!file) {
      setError("Please select an Excel or CSV file.");
      return false;
    }

    const extension = file.name.toLowerCase().split(".").pop();

    if (!["xlsx", "csv"].includes(extension || "")) {
      setError("Only .xlsx and .csv files are supported.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The maximum upload size is 5 MB.");
      return false;
    }

    return true;
  }

  async function previewFile() {
    if (!validateFile()) return;

    try {
      setBusy(true);
      clearPreview();

      const response = await api.post<PreviewResult>(
        `/timetable/import/preview?school_id=${schoolId}`,
        createFormData(),
      );

      setPreview(response.data);
      setRowErrors(response.data.errors || []);
    } catch (err) {
      const parsed = getError(err);
      setError(parsed.message);
      setRowErrors(parsed.errors);
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!file || !preview?.can_import) return;

    const confirmed = window.confirm(
      `Import ${preview.valid_rows} timetable entries? This will save all entries together.`
    );

    if (!confirmed) return;

    try {
      setBusy(true);
      setError("");
      setRowErrors([]);

      const response = await api.post<ImportResult>(
        `/timetable/import?school_id=${schoolId}`,
        createFormData(),
      );

      setResult(response.data);
      setPreview(null);
      setFile(null);
      onImported();
    } catch (err) {
      const parsed = getError(err);
      setError(parsed.message);
      setRowErrors(parsed.errors);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
      <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <FileSpreadsheet size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Import Timetable from Spreadsheet
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add multiple classes, subjects and teacher periods at once.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={downloadTemplate}
            disabled={downloading || busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            Download Excel Template
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            Required spreadsheet columns
          </p>
          <p className="mt-1 text-xs leading-6 text-slate-500">
            Academic Session · Term · Class · Subject · Teacher · Day · Start Time · End Time
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Use the exact names registered in this school. Excel (.xlsx) and CSV
            are supported. Maximum 1,000 entries and 5 MB per upload.
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30">
          <Upload size={27} className="text-indigo-500" />
          <span className="mt-3 text-sm font-bold text-slate-800">
            {file ? file.name : "Choose timetable spreadsheet"}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            Click to select an .xlsx or .csv file
          </span>
          <input
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            disabled={busy}
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              clearPreview();
            }}
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Nothing is saved until you confirm a successful preview.
          </p>
          <button
            type="button"
            onClick={previewFile}
            disabled={!file || busy || downloading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Eye size={17} />
            )}
            {busy ? "Validating spreadsheet..." : "Preview and Validate"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2 text-sm font-semibold text-red-700">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          </div>
        )}

        {rowErrors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="mb-3 text-sm font-bold text-red-800">
              Rows requiring correction
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {rowErrors.map((item) => (
                <p
                  key={`${item.row}-${item.error}`}
                  className="text-xs text-red-700"
                >
                  <strong>Row {item.row}:</strong> {item.error}
                </p>
              ))}
            </div>
            <p className="mt-3 border-t border-red-200 pt-3 text-xs font-semibold text-red-700">
              No timetable entries have been saved.
            </p>
          </div>
        )}

        {preview && (
          <div className="space-y-4 rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">
                  Spreadsheet Preview
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Review the entries before confirming the import.
                </p>
              </div>
              <div className="flex gap-2 text-xs font-bold">
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                  {preview.valid_rows} valid
                </span>
                <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">
                  {preview.invalid_rows} invalid
                </span>
              </div>
            </div>

            <p className={`text-sm font-semibold ${
              preview.can_import ? "text-emerald-700" : "text-red-700"
            }`}>
              {preview.message}
            </p>

            {preview.rows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-[900px] w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      {[
                        "Row", "Session", "Term", "Class", "Subject",
                        "Teacher", "Day", "Start", "End",
                      ].map((heading) => (
                        <th key={heading} className="px-3 py-3 font-bold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.rows.map((row) => (
                      <tr key={row.row}>
                        <td className="px-3 py-3 font-semibold">{row.row}</td>
                        <td className="px-3 py-3">{row.academic_session}</td>
                        <td className="px-3 py-3">{row.term}</td>
                        <td className="px-3 py-3">{row.class}</td>
                        <td className="px-3 py-3">{row.subject}</td>
                        <td className="px-3 py-3">{row.teacher}</td>
                        <td className="px-3 py-3">{row.day}</td>
                        <td className="px-3 py-3">{row.start_time}</td>
                        <td className="px-3 py-3">{row.end_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setRowErrors([]);
                }}
                disabled={busy}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel Preview
              </button>
              <button
                type="button"
                onClick={confirmImport}
                disabled={!preview.can_import || busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                Confirm and Import {preview.valid_rows} Entries
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 size={20} className="mt-0.5 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-800">
                {result.message || "Timetable imported successfully."}
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                {result.imported_count || 0} timetable entries imported.
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                The timetable has not been published. Use the publication panel when ready.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
