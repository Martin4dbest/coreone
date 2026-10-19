"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";

type EligibleStaff = {
  staff_id: number;
  first_name: string;
  last_name: string;
  employee_number?: string | null;
  teacher_id: number;
};

type Appraisal = {
  id: number;
  school_id: number;
  staff_id: number;
  teacher_id: number;
  period_start: string;
  period_end: string;
  category_ratings: Record<string, number>;
  weighted_score: number | null;
  status: string;
  overall_comments?: string | null;
  strengths?: string | null;
  improvement_plan?: string | null;
  development_targets?: string | null;
  created_at: string;
};

const CATEGORIES = [
  { key: "subject_performance", label: "Subject Performance", weight: 30 },
  { key: "cbt_assessment", label: "CBT and Assessment Outcomes", weight: 20 },
  { key: "attendance_punctuality", label: "Attendance and Punctuality", weight: 15 },
  { key: "classroom_professionalism", label: "Classroom Management and Professionalism", weight: 20 },
  { key: "improvement_development", label: "Improvement and Development", weight: 15 },
];

function messageFromError(error: unknown): string {
  const value = error as {
    response?: { data?: { detail?: string } };
    message?: string;
  };
  return value?.response?.data?.detail || value?.message || "The request failed. Please try again.";
}

export default function SchoolStaffAppraisalPage() {
  const params = useParams<{ schoolId: string }>();
  const schoolId = Number(params?.schoolId);

  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [eligibleStaff, setEligibleStaff] = useState<EligibleStaff[]>([]);
  const [staffId, setStaffId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvementPlan, setImprovementPlan] = useState("");
  const [developmentTargets, setDevelopmentTargets] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    if (!Number.isInteger(schoolId) || schoolId < 1) {
      setError("The school ID in this URL is invalid.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [appraisalResponse, staffResponse] = await Promise.all([
        api.get<Appraisal[]>("/staff-appraisal", {
          params: { school_id: schoolId },
        }),
        api.get<EligibleStaff[]>("/staff-appraisal/eligible-staff", {
          params: { school_id: schoolId },
        }),
      ]);

      setAppraisals(Array.isArray(appraisalResponse.data) ? appraisalResponse.data : []);
      setEligibleStaff(Array.isArray(staffResponse.data) ? staffResponse.data : []);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function createAppraisal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!staffId || !periodStart || !periodEnd) {
      setError("Select a staff member and both review dates.");
      return;
    }

    if (periodEnd < periodStart) {
      setError("The review end date cannot be earlier than the start date.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/staff-appraisal", {
        school_id: schoolId,
        staff_id: Number(staffId),
        period_start: periodStart,
        period_end: periodEnd,
        category_ratings: ratings,
        category_evidence: {},
        overall_comments: comments || null,
        strengths: strengths || null,
        improvement_plan: improvementPlan || null,
        development_targets: developmentTargets || null,
      });

      setNotice("Appraisal created successfully.");
      setShowForm(false);
      setStaffId("");
      setPeriodStart("");
      setPeriodEnd("");
      setRatings({});
      setComments("");
      setStrengths("");
      setImprovementPlan("");
      setDevelopmentTargets("");
      await loadData();
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setSaving(false);
    }
  }

  async function approveAppraisal(item: Appraisal) {
    if (!window.confirm("Approve this appraisal? Approved appraisals cannot be edited.")) {
      return;
    }

    setError("");
    setNotice("");
    setBusyId(item.id);

    try {
      await api.post(`/staff-appraisal/${item.id}/approve`, null, {
        params: { school_id: schoolId },
      });
      setNotice(`Appraisal #${item.id} approved.`);
      await loadData();
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function downloadPdf(item: Appraisal) {
    setError("");
    setBusyId(item.id);

    try {
      const response = await api.get(`/staff-appraisal/${item.id}/pdf`, {
        params: { school_id: schoolId },
        responseType: "blob",
      });

      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `staff-appraisal-${item.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      setBusyId(null);
    }
  }

  const staffName = (id: number) => {
    const staff = eligibleStaff.find((person) => person.staff_id === id);
    return staff
      ? `${staff.first_name} ${staff.last_name}`.trim()
      : `Staff ID ${id}`;
  };

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <FileText size={18} />
            Human Resources
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Staff Appraisal
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Create staff reviews, assess performance, track approval status and download appraisal reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
              setShowForm((value) => !value);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <Plus size={17} />
            New appraisal
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={createAppraisal} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create staff appraisal</h2>
            <p className="mt-1 text-sm text-slate-500">
              Only staff linked to a teacher profile are eligible for this appraisal workflow.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Staff member
              <select
                required
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5"
              >
                <option value="">Select staff</option>
                {eligibleStaff.map((staff) => (
                  <option key={staff.staff_id} value={staff.staff_id}>
                    {staff.first_name} {staff.last_name}
                    {staff.employee_number ? ` (${staff.employee_number})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Review period starts
              <input
                required
                type="date"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Review period ends
              <input
                required
                type="date"
                value={periodEnd}
                min={periodStart || undefined}
                onChange={(event) => setPeriodEnd(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
            </label>
          </div>

          <section className="space-y-3">
            <h3 className="font-semibold text-slate-900">Performance ratings</h3>
            <p className="text-sm text-slate-500">Rate each category from 1 (needs improvement) to 5 (excellent). Ratings can also be left blank for a draft.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {CATEGORIES.map((category) => (
                <label key={category.key} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 text-sm">
                  <span className="font-medium text-slate-800">
                    {category.label} <span className="text-slate-400">({category.weight}%)</span>
                  </span>
                  <select
                    value={ratings[category.key] ?? ""}
                    onChange={(event) =>
                      setRatings((current) => {
                        const next = { ...current };
                        if (event.target.value) next[category.key] = Number(event.target.value);
                        else delete next[category.key];
                        return next;
                      })
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                  >
                    <option value="">Not rated yet</option>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <option key={score} value={score}>{score} / 5</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Overall comments
              <textarea value={comments} onChange={(event) => setComments(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Strengths
              <textarea value={strengths} onChange={(event) => setStrengths(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Improvement plan
              <textarea value={improvementPlan} onChange={(event) => setImprovementPlan(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-slate-700">
              Development targets
              <textarea value={developmentTargets} onChange={(event) => setDevelopmentTargets(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
            </label>
          </div>

          {eligibleStaff.length === 0 && !loading && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              No eligible staff were returned. Check that staff accounts are linked to teacher profiles and that the appraisal feature is enabled.
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">
              Cancel
            </button>
            <button type="submit" disabled={saving || eligibleStaff.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Saving..." : "Create appraisal"}
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Appraisal records</h2>
            <p className="mt-1 text-sm text-slate-500">
              {appraisals.length} record{appraisals.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading appraisal records...
          </div>
        ) : appraisals.length === 0 ? (
          <div className="p-10 text-center">
            <FileText size={32} className="mx-auto text-slate-300" />
            <h3 className="mt-3 font-semibold text-slate-800">No appraisals yet</h3>
            <p className="mt-1 text-sm text-slate-500">Create an appraisal to begin tracking staff performance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Staff member</th>
                  <th className="px-5 py-3 font-semibold">Review period</th>
                  <th className="px-5 py-3 font-semibold">Score</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appraisals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{staffName(item.staff_id)}</p>
                      <p className="mt-1 text-xs text-slate-500">Appraisal #{item.id}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {item.period_start} – {item.period_end}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {item.weighted_score == null ? "Not rated" : `${item.weighted_score}%`}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {item.status !== "APPROVED" && (
                          <button
                            type="button"
                            disabled={busyId === item.id || !item.category_ratings || Object.keys(item.category_ratings).length === 0}
                            onClick={() => void approveAppraisal(item)}
                            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {busyId === item.id ? "Working..." : "Approve"}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void downloadPdf(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Download size={14} />
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
