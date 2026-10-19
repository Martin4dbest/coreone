"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

const CATEGORIES = [
  { key: "subject_performance", label: "Subject Performance", weight: 30 },
  { key: "cbt_assessment", label: "CBT & Assessment Outcomes", weight: 20 },
  { key: "attendance_punctuality", label: "Attendance & Punctuality", weight: 15 },
  { key: "classroom_professionalism", label: "Classroom Management & Professionalism", weight: 20 },
  { key: "improvement_development", label: "Improvement & Development", weight: 15 },
];

type Appraisal = {
  id: number;
  school_id: number;
  staff_id: number;
  teacher_id: number;
  period_start: string;
  period_end: string;
  category_ratings: Record<string, number>;
  category_evidence: Record<string, string>;
  overall_comments?: string | null;
  strengths?: string | null;
  improvement_plan?: string | null;
  development_targets?: string | null;
  weighted_score?: number | null;
  status: string;
};

type EligibleStaff = {
  staff_id: number;
  first_name: string;
  last_name: string;
  employee_number?: string | null;
  teacher_id: number;
};

const emptyForm = {
  staff_id: "",
  period_start: "",
  period_end: "",
  category_ratings: {} as Record<string, number>,
  category_evidence: {} as Record<string, string>,
  overall_comments: "",
  strengths: "",
  improvement_plan: "",
  development_targets: "",
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as {
      response?: { data?: { detail?: unknown } };
    }).response;

    if (typeof response?.data?.detail === "string") {
      return response.data.detail;
    }
  }

  return fallback;
}

export default function StaffAppraisalPage() {
  const [role, setRole] = useState("");
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [eligibleStaff, setEligibleStaff] = useState<EligibleStaff[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const reviewer = ["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"].includes(role);

  const requestParams = schoolId ? { school_id: schoolId } : undefined;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const meResponse = await api.get("/auth/me");
      const me = meResponse.data?.user ?? meResponse.data;
      const currentRole = String(
        me?.role?.name ?? me?.role ?? me?.role_name ?? ""
      ).toUpperCase();

      const currentSchoolId = Number(
        me?.school_id ??
        (typeof window !== "undefined"
          ? localStorage.getItem("school_id") ||
            localStorage.getItem("current_school_id")
          : 0)
      );

      setRole(currentRole);
      setSchoolId(currentSchoolId > 0 ? currentSchoolId : null);

      if (["SUPER_ADMIN", "SCHOOL_ADMIN", "PRINCIPAL"].includes(currentRole)) {
        const paramsForRequests =
          currentRole === "SUPER_ADMIN"
            ? (currentSchoolId > 0 ? { school_id: currentSchoolId } : undefined)
            : undefined;

        if (currentRole === "SUPER_ADMIN" && !currentSchoolId) {
          setAppraisals([]);
          setEligibleStaff([]);
          setError("Super Admin: select a school context before managing appraisals.");
          return;
        }

        const [appraisalResponse, staffResponse] = await Promise.all([
          api.get("/staff-appraisal", { params: paramsForRequests }),
          api.get("/staff-appraisal/eligible-staff", { params: paramsForRequests }),
        ]);

        setAppraisals(Array.isArray(appraisalResponse.data) ? appraisalResponse.data : []);
        setEligibleStaff(Array.isArray(staffResponse.data) ? staffResponse.data : []);
      } else if (["TEACHER", "STAFF"].includes(currentRole)) {
        const response = await api.get("/staff-appraisal/me");
        setAppraisals(Array.isArray(response.data) ? response.data : []);
        setEligibleStaff([]);
      } else {
        setError("Your account is not authorized to access Staff Appraisal.");
      }
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err,
        "Could not load Staff Appraisal. Check that the feature is enabled for this school and the backend is deployed.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function updateForm<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K]
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function startEdit(item: Appraisal) {
    setEditingId(item.id);
    setForm({
      staff_id: String(item.staff_id),
      period_start: item.period_start,
      period_end: item.period_end,
      category_ratings: { ...item.category_ratings },
      category_evidence: { ...item.category_evidence },
      overall_comments: item.overall_comments ?? "",
      strengths: item.strengths ?? "",
      improvement_plan: item.improvement_plan ?? "",
      development_targets: item.development_targets ?? "",
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, category_ratings: {}, category_evidence: {} });
  }

  async function saveAppraisal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        ...(schoolId ? { school_id: schoolId } : {}),
        ...(!editingId ? { staff_id: Number(form.staff_id) } : {}),
        period_start: form.period_start,
        period_end: form.period_end,
        category_ratings: form.category_ratings,
        category_evidence: form.category_evidence,
        overall_comments: form.overall_comments,
        strengths: form.strengths,
        improvement_plan: form.improvement_plan,
        development_targets: form.development_targets,
      };

      if (editingId) {
        await api.patch(`/staff-appraisal/${editingId}`, payload, {
          params: requestParams,
        });
        setNotice("Appraisal updated.");
      } else {
        await api.post("/staff-appraisal", payload);
        setNotice("Appraisal created as a draft.");
      }

      resetForm();
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to save this appraisal."));
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

    try {
      await api.post(`/staff-appraisal/${item.id}/approve`, null, {
        params: requestParams,
      });
      setNotice("Appraisal approved.");
      await loadData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to approve this appraisal."));
    }
  }

  async function downloadPdf(item: Appraisal) {
    setError("");

    try {
      const response = await api.get(`/staff-appraisal/${item.id}/pdf`, {
        params: requestParams,
        responseType: "blob",
      });

      const url = URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `staff-appraisal-${item.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "PDF download failed."));
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 pb-12 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Teacher Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Staff Appraisal
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Review professional performance using available evidence. Missing
            evidence is recorded as unavailable, not as a zero score.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-600">
          Loading appraisals…
        </div>
      ) : (
        <>
          {reviewer && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? "Edit appraisal draft" : "Create an appraisal"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Only staff already linked to a teacher profile are listed.
              </p>

              <form onSubmit={saveAppraisal} className="mt-5 space-y-5">
                {!editingId && (
                  <div>
                    <label htmlFor="staff_id" className="mb-1 block text-sm font-medium text-slate-700">
                      Linked staff member
                    </label>
                    <select
                      id="staff_id"
                      required
                      value={form.staff_id}
                      onChange={(event) => updateForm("staff_id", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm"
                    >
                      <option value="">Select a staff member</option>
                      {eligibleStaff.map((staff) => (
                        <option key={staff.staff_id} value={staff.staff_id}>
                          {staff.first_name} {staff.last_name}
                          {staff.employee_number ? ` (${staff.employee_number})` : ""}
                        </option>
                      ))}
                    </select>
                    {eligibleStaff.length === 0 && (
                      <p className="mt-1 text-xs text-amber-700">
                        No linked staff profiles were returned.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="period_start" className="mb-1 block text-sm font-medium text-slate-700">
                      Review period start
                    </label>
                    <input
                      id="period_start"
                      type="date"
                      required
                      value={form.period_start}
                      onChange={(event) => updateForm("period_start", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="period_end" className="mb-1 block text-sm font-medium text-slate-700">
                      Review period end
                    </label>
                    <input
                      id="period_end"
                      type="date"
                      required
                      min={form.period_start || undefined}
                      value={form.period_end}
                      onChange={(event) => updateForm("period_end", event.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {CATEGORIES.map((category) => (
                    <div key={category.key} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-slate-900">{category.label}</h3>
                          <p className="text-xs text-slate-500">Weight: {category.weight}%</p>
                        </div>
                        <div className="w-36">
                          <label htmlFor={`rating-${category.key}`} className="mb-1 block text-xs text-slate-600">
                            Rating (1–5)
                          </label>
                          <select
                            id={`rating-${category.key}`}
                            value={form.category_ratings[category.key] ?? ""}
                            onChange={(event) => {
                              const next = { ...form.category_ratings };
                              if (event.target.value) next[category.key] = Number(event.target.value);
                              else delete next[category.key];
                              updateForm("category_ratings", next);
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
                          >
                            <option value="">Unavailable</option>
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <option key={rating} value={rating}>{rating} / 5</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <label htmlFor={`evidence-${category.key}`} className="mb-1 mt-3 block text-xs font-medium text-slate-600">
                        Evidence / notes
                      </label>
                      <textarea
                        id={`evidence-${category.key}`}
                        rows={2}
                        value={form.category_evidence[category.key] ?? ""}
                        onChange={(event) =>
                          updateForm("category_evidence", {
                            ...form.category_evidence,
                            [category.key]: event.target.value,
                          })
                        }
                        placeholder="Record relevant evidence, or leave blank if unavailable."
                        className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                      />
                    </div>
                  ))}
                </div>

                {[
                  ["overall_comments", "Overall comments"],
                  ["strengths", "Strengths"],
                  ["improvement_plan", "Improvement plan"],
                  ["development_targets", "Development targets"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label htmlFor={key} className="mb-1 block text-sm font-medium text-slate-700">
                      {label}
                    </label>
                    <textarea
                      id={key}
                      rows={2}
                      value={String(form[key as keyof typeof form] ?? "")}
                      onChange={(event) =>
                        updateForm(key as keyof typeof emptyForm, event.target.value as never)
                      }
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                    />
                  </div>
                ))}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving || (!editingId && eligibleStaff.length === 0)}
                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving…" : editingId ? "Save changes" : "Create draft"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium"
                    >
                      Cancel editing
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {reviewer ? "School appraisals" : "My appraisals"}
              </h2>
              <p className="text-sm text-slate-500">
                {appraisals.length} record{appraisals.length === 1 ? "" : "s"}
              </p>
            </div>

            {appraisals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                No appraisals are available yet.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {appraisals.map((item) => {
                  const staff = eligibleStaff.find((person) => person.staff_id === item.staff_id);
                  const completedRatings = Object.keys(item.category_ratings ?? {}).length;

                  return (
                    <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {staff
                              ? `${staff.first_name} ${staff.last_name}`
                              : reviewer
                                ? `Staff #${item.staff_id}`
                                : "Your appraisal"}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {item.period_start} – {item.period_end}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Weighted score</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {item.weighted_score == null ? "Unavailable" : `${item.weighted_score}%`}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Categories rated</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {completedRatings} / {CATEGORIES.length}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {CATEGORIES.map((category) => (
                          <div key={category.key} className="flex justify-between gap-4 text-sm">
                            <span className="text-slate-600">{category.label}</span>
                            <span className="font-medium text-slate-900">
                              {item.category_ratings?.[category.key] == null
                                ? "Unavailable"
                                : `${item.category_ratings[category.key]} / 5`}
                            </span>
                          </div>
                        ))}
                      </div>

                      {item.overall_comments && (
                        <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
                          {item.overall_comments}
                        </p>
                      )}

                      <div className="mt-5 flex flex-wrap gap-2">
                        {reviewer && item.status !== "APPROVED" && (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                            >
                              Edit draft
                            </button>
                            <button
                              type="button"
                              onClick={() => void approveAppraisal(item)}
                              className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800"
                            >
                              Approve
                            </button>
                          </>
                        )}
                        {item.status === "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => void downloadPdf(item)}
                            className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                          >
                            Download approved PDF
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
