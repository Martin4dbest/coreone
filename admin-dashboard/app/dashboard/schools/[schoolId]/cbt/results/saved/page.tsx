"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";

interface SavedResult {
  attempt_id: number;
  student_name: string;
  exam_title: string;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  submitted_at: string;
  saved_at?: string;
}

export default function SavedResultsPage() {
  const params = useParams();
  const router = useRouter();
  const schoolId = params?.schoolId as string;

  const [loading, setLoading] = useState(true);
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);

  useEffect(() => {
    if (schoolId) {
      loadSavedResults();
    }
  }, [schoolId]);

  async function loadSavedResults() {
    try {
      // 1. First, check if backend has an endpoint for saved results
      const res = await api.get(`/cbt/schools/${schoolId}/results/saved`);
      setSavedResults(res.data);
    } catch {
      // 2. Fallback to LocalStorage if backend endpoint isn't ready yet
      const localData = localStorage.getItem(`saved_cbt_results_${schoolId}`);
      if (localData) {
        setSavedResults(JSON.parse(localData));
      }
    } finally {
      setLoading(false);
    }
  }

  // Remove a single item from saved list
  function removeSavedResult(attemptId: number) {
    const updated = savedResults.filter((r) => r.attempt_id !== attemptId);
    setSavedResults(updated);
    localStorage.setItem(`saved_cbt_results_${schoolId}`, JSON.stringify(updated));
  }

  // PDF Export for saved item
  function exportPDF(row: SavedResult) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [30, 41, 59];
    const accentColor: [number, number, number] = [37, 99, 235];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 28, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("SAVED CBT RESULT STATEMENT", 14, 18);

    const tableOptions: UserOptions = {
      startY: 40,
      head: [["Assessment Field", "Details"]],
      body: [
        ["Student Name", row.student_name],
        ["Exam Title", row.exam_title],
        ["Score Obtained", `${row.score} / ${row.total_marks}`],
        ["Percentage Score", `${row.percentage.toFixed(1)}%`],
        ["Final Status", row.passed ? "PASSED" : "FAILED"],
        [
          "Submission Time",
          row.submitted_at
            ? new Date(row.submitted_at).toLocaleString()
            : "N/A",
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: accentColor, textColor: [255, 255, 255] },
    };

    autoTable(doc, tableOptions);
    doc.save(`${row.student_name.toLowerCase().replace(/\s+/g, "_")}_saved_result.pdf`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm font-medium text-gray-500 animate-pulse">
          Loading Saved Results...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen text-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-gray-200"
            title="Go to previous page"
          >
            ← Back
          </button>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Saved Student Results
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Archived and bookmarked CBT exam performances
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push(`/dashboard/schools/${schoolId}/cbt/results`)}
          className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors border border-gray-200"
        >
          Main Results Page
        </button>
      </div>

      {/* Saved Results Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-800">
            Archived Statements
          </h2>
          <span className="text-xs text-gray-500 font-medium">
            Total Saved: {savedResults.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Exam</th>
                <th className="p-3 text-center">Score</th>
                <th className="p-3 text-center">Percentage</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {savedResults.map((row) => (
                <tr key={row.attempt_id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-3 font-medium text-gray-900">{row.student_name}</td>
                  <td className="p-3 text-gray-600">{row.exam_title}</td>
                  <td className="p-3 text-center font-medium text-gray-700">
                    {row.score} / {row.total_marks}
                  </td>
                  <td className="p-3 text-center text-gray-700">
                    {row.percentage.toFixed(1)}%
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                        row.passed
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {row.passed ? "PASS" : "FAIL"}
                    </span>
                  </td>
                  <td className="p-3 text-center space-x-2">
                    <button
                      onClick={() => exportPDF(row)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs px-2.5 py-1 rounded transition-colors"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => removeSavedResult(row.attempt_id)}
                      className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 text-xs px-2 py-1 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {savedResults.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No saved results found yet. Go back to main results to bookmark items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}