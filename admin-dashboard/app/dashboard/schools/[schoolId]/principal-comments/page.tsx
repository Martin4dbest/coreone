"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import {
  Check,
  ChevronDown,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";

type BankRule = {
  id: number;
  school_id: number;
  title: string;
  min_score: number;
  max_score: number;
  comment: string;
  is_active: boolean;
};

type Option = {
  id: number;
  name?: string;
  title?: string;
  class_name?: string;
  term_name?: string;
  session_name?: string;
};

type PreviewStudent = {
  student_id: number;
  student_name: string;
  admission_number?: string | null;
  average: number;
  subjects_count: number;
  matches_range: boolean;
  has_manual_principal_comment: boolean;
  existing_comment?: string | null;
};

type PreviewResponse = {
  bank_id: number;
  min_score: number;
  max_score: number;
  comment: string;
  students: PreviewStudent[];
};

type FormState = {
  title: string;
  min_score: string;
  max_score: string;
  comment: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  title: "",
  min_score: "",
  max_score: "",
  comment: "",
  is_active: true,
};

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];

  if (
    value &&
    typeof value === "object" &&
    "items" in value &&
    Array.isArray((value as { items?: unknown }).items)
  ) {
    return (value as { items: T[] }).items;
  }

  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return (value as { data: T[] }).data;
  }

  return [];
}

function optionLabel(option: Option) {
  return (
    option.name ||
    option.title ||
    option.class_name ||
    option.term_name ||
    option.session_name ||
    `#${option.id}`
  );
}

function formatScore(value: number) {
  return Number(value).toFixed(2).replace(/\.00$/, "");
}

export default function PrincipalCommentsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);
  const schoolIdNumber = Number(schoolId);

  const [banks, setBanks] = useState<BankRule[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [sessions, setSessions] = useState<Option[]>([]);

  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingBankId, setEditingBankId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [applying, setApplying] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBankAndOptions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [banksRes, classesRes, termsRes, sessionsRes] = await Promise.all([
        api.get("/principal-comments/bank", {
          params: { school_id: schoolIdNumber },
        }),
        api.get("/classes", {
          params: { school_id: schoolIdNumber },
        }),
        api.get("/terms", {
          params: { school_id: schoolIdNumber },
        }),
        api.get("/academic-sessions", {
          params: { school_id: schoolIdNumber },
        }),
      ]);

      const loadedBanks = asArray<BankRule>(banksRes.data);
      const loadedClasses = asArray<Option>(classesRes.data);
      const loadedTerms = asArray<Option>(termsRes.data);
      const loadedSessions = asArray<Option>(sessionsRes.data);

      setBanks(loadedBanks);
      setClasses(loadedClasses);
      setTerms(loadedTerms);
      setSessions(loadedSessions);

      setSelectedBankId((current) => {
        if (current && loadedBanks.some((bank) => bank.id === current)) {
          return current;
        }

        return loadedBanks.find((bank) => bank.is_active)?.id ?? loadedBanks[0]?.id ?? null;
      });

      if (!selectedClassId && loadedClasses.length) {
        setSelectedClassId(String(loadedClasses[0].id));
      }

      if (!selectedTermId && loadedTerms.length) {
        setSelectedTermId(String(loadedTerms[0].id));
      }

      if (!selectedSessionId && loadedSessions.length) {
        setSelectedSessionId(String(loadedSessions[0].id));
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to load Principal Comment Bank.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    schoolIdNumber,
    selectedClassId,
    selectedTermId,
    selectedSessionId,
  ]);

  useEffect(() => {
    if (!Number.isFinite(schoolIdNumber)) {
      setError("Invalid school ID.");
      setLoading(false);
      return;
    }

    void loadBankAndOptions();
  }, [schoolIdNumber, loadBankAndOptions]);

  const selectedBank = useMemo(
    () => banks.find((bank) => bank.id === selectedBankId) ?? null,
    [banks, selectedBankId],
  );

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return previewData?.students ?? [];

    return (previewData?.students ?? []).filter((student) =>
      `${student.student_name} ${student.admission_number ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [previewData, search]);

  const matchingStudents = useMemo(
    () =>
      (previewData?.students ?? []).filter(
        (student) =>
          student.matches_range && !student.has_manual_principal_comment,
      ),
    [previewData],
  );

  function beginCreate() {
    setEditingBankId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
    setMessage("");
  }

  function beginEdit(bank: BankRule) {
    setEditingBankId(bank.id);
    setForm({
      title: bank.title,
      min_score: String(bank.min_score),
      max_score: String(bank.max_score),
      comment: bank.comment,
      is_active: bank.is_active,
    });
    setShowForm(true);
    setError("");
    setMessage("");
  }

  function cancelForm() {
    setEditingBankId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function saveBankRule() {
    setError("");
    setMessage("");

    const min = Number(form.min_score);
    const max = Number(form.max_score);

    if (!form.title.trim()) {
      setError("Enter a title for the comment rule.");
      return;
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      setError("Enter valid minimum and maximum scores.");
      return;
    }

    if (min < 0 || min > 100 || max < 0 || max > 100 || min > max) {
      setError("Score range must be between 0 and 100, with minimum not above maximum.");
      return;
    }

    if (!form.comment.trim()) {
      setError("Enter the Principal comment.");
      return;
    }

    setSavingBank(true);

    try {
      const payload = {
        school_id: schoolIdNumber,
        title: form.title.trim(),
        min_score: Number(min.toFixed(2)),
        max_score: Number(max.toFixed(2)),
        comment: form.comment.trim(),
        is_active: form.is_active,
      };

      if (editingBankId) {
        await api.patch(`/principal-comments/bank/${editingBankId}`, payload);
        setMessage("Principal comment rule updated successfully.");
      } else {
        await api.post("/principal-comments/bank", payload);
        setMessage("Principal comment rule created successfully.");
      }

      cancelForm();
      await loadBankAndOptions();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to save the comment rule.",
      );
    } finally {
      setSavingBank(false);
    }
  }

  async function deleteBankRule(bankId: number) {
    if (!window.confirm("Delete this Principal comment rule?")) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/principal-comments/bank/${bankId}`, {
        params: { school_id: schoolIdNumber },
      });

      setMessage("Principal comment rule deleted.");
      setPreviewData(null);
      setSelectedStudentIds([]);

      if (selectedBankId === bankId) {
        setSelectedBankId(null);
      }

      await loadBankAndOptions();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to delete the comment rule.",
      );
    }
  }

  async function previewStudents() {
    if (!selectedBankId || !selectedClassId || !selectedTermId || !selectedSessionId) {
      setError("Select a comment rule, class, term, and academic session first.");
      return;
    }

    setLoadingPreview(true);
    setError("");
    setMessage("");
    setSelectedStudentIds([]);

    try {
      const response = await api.get("/principal-comments/preview", {
        params: {
          school_id: schoolIdNumber,
          class_id: Number(selectedClassId),
          term_id: Number(selectedTermId),
          academic_session_id: Number(selectedSessionId),
          bank_id: selectedBankId,
        },
      });

      setPreviewData(response.data);
    } catch (err: any) {
      setPreviewData(null);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to preview students.",
      );
    } finally {
      setLoadingPreview(false);
    }
  }

  function toggleStudent(studentId: number) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  function selectAllMatching() {
    setSelectedStudentIds(matchingStudents.map((student) => student.student_id));
  }

  function clearSelection() {
    setSelectedStudentIds([]);
  }

  async function applyComments() {
    if (!selectedBankId || !selectedClassId || !selectedTermId || !selectedSessionId) {
      setError("Select a comment rule, class, term, and academic session first.");
      return;
    }

    if (!selectedStudentIds.length) {
      setError("Select at least one eligible student.");
      return;
    }

    setApplying(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/principal-comments/apply", {
        school_id: schoolIdNumber,
        class_id: Number(selectedClassId),
        term_id: Number(selectedTermId),
        academic_session_id: Number(selectedSessionId),
        bank_id: selectedBankId,
        student_ids: selectedStudentIds,
      });

      const data = response.data || {};

      setMessage(
        `Applied: ${data.applied ?? 0}. ` +
          `Protected manual comments: ${data.skipped_manual ?? 0}. ` +
          `Outside range: ${data.skipped_outside_range ?? 0}. ` +
          `No results: ${data.skipped_no_results ?? 0}.`,
      );

      await previewStudents();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to apply Principal comments.",
      );
    } finally {
      setApplying(false);
    }
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                School {schoolId}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Principal Comment Bank
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Create performance-based Principal comments, preview eligible
                students, and apply comments in bulk without replacing an
                existing manual Principal comment.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void loadBankAndOptions()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              <button
                type="button"
                onClick={beginCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                <Plus size={16} />
                Add Comment Rule
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        {showForm && (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingBankId ? "Edit Comment Rule" : "Add Comment Rule"}
                </h2>
                <p className="text-sm text-slate-500">
                  Active performance ranges cannot overlap.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Rule title
                </label>
                <input
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="Outstanding Performance"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Minimum
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={form.min_score}
                    onChange={(event) => setField("min_score", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Maximum
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={form.max_score}
                    onChange={(event) => setField("max_score", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Principal comment
                </label>
                <textarea
                  rows={4}
                  value={form.comment}
                  onChange={(event) => setField("comment", event.target.value)}
                  placeholder="Excellent performance. Keep up the outstanding work..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setField("is_active", event.target.checked)}
                />
                Active rule
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={savingBank}
                onClick={() => void saveBankRule()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {savingBank ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingBankId ? "Update Rule" : "Save Rule"}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Comment Rules
              </h2>
              <p className="text-sm text-slate-500">
                Choose the comment that matches a student's overall average.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {banks.length} rules
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="mr-2 animate-spin" size={20} />
              Loading comment rules...
            </div>
          ) : banks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No comment rules found.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {banks.map((bank) => (
                <div
                  key={bank.id}
                  className={`rounded-2xl border p-4 ${
                    selectedBankId === bank.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBankId(bank.id);
                        setPreviewData(null);
                        setSelectedStudentIds([]);
                      }}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-bold text-slate-900">
                          {bank.title}
                        </h3>
                        {bank.is_active ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                            Inactive
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {formatScore(bank.min_score)} – {formatScore(bank.max_score)}
                      </p>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {bank.comment}
                      </p>
                    </button>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => beginEdit(bank)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void deleteBankRule(bank.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Apply Principal Comments
            </h2>
            <p className="text-sm text-slate-500">
              Select the academic scope and preview the students who match the
              selected performance range.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Comment Rule
              </label>
              <div className="relative">
                <select
                  value={selectedBankId ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedBankId(value ? Number(value) : null);
                    setPreviewData(null);
                    setSelectedStudentIds([]);
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-10 text-sm outline-none focus:border-slate-400"
                >
                  <option value="">Select rule</option>
                  {banks.map((bank) => (
                    <option
                      key={bank.id}
                      value={bank.id}
                      disabled={!bank.is_active}
                    >
                      {bank.title} ({formatScore(bank.min_score)}–{formatScore(bank.max_score)})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(event) => {
                  setSelectedClassId(event.target.value);
                  setPreviewData(null);
                  setSelectedStudentIds([]);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {optionLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Term
              </label>
              <select
                value={selectedTermId}
                onChange={(event) => {
                  setSelectedTermId(event.target.value);
                  setPreviewData(null);
                  setSelectedStudentIds([]);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Select term</option>
                {terms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {optionLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Academic Session
              </label>
              <select
                value={selectedSessionId}
                onChange={(event) => {
                  setSelectedSessionId(event.target.value);
                  setPreviewData(null);
                  setSelectedStudentIds([]);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-slate-400"
              >
                <option value="">Select session</option>
                {sessions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {optionLabel(item)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void previewStudents()}
              disabled={loadingPreview}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {loadingPreview ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              Preview Students
            </button>

            {selectedBank && (
              <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
                Selected range: {formatScore(selectedBank.min_score)} –{" "}
                {formatScore(selectedBank.max_score)}
              </div>
            )}
          </div>
        </div>

        {previewData && (
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Eligible Students
                </h2>
                <p className="text-sm text-slate-500">
                  Students with an existing manual Principal comment are shown
                  but cannot be overwritten.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                  <Users className="mr-1 inline-block" size={15} />
                  {previewData.students.length} students
                </div>

                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                  {matchingStudents.length} eligible
                </div>

                <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
                  {
                    previewData.students.filter(
                      (student) => student.has_manual_principal_comment,
                    ).length
                  }{" "}
                  protected
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student or admission number"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={selectAllMatching}
                disabled={!matchingStudents.length}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Check size={16} />
                Select All Matching
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="max-h-[520px] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 bg-slate-100">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Select</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Admission No.</th>
                      <th className="px-4 py-3">Average</th>
                      <th className="px-4 py-3">Subjects</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => {
                      const eligible =
                        student.matches_range &&
                        !student.has_manual_principal_comment;

                      const selected = selectedStudentIds.includes(
                        student.student_id,
                      );

                      return (
                        <tr
                          key={student.student_id}
                          className={selected ? "bg-slate-50" : "bg-white"}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={!eligible}
                              onChange={() => toggleStudent(student.student_id)}
                            />
                          </td>

                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {student.student_name}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {student.admission_number || "—"}
                          </td>

                          <td className="px-4 py-3 font-bold text-slate-900">
                            {formatScore(student.average)}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {student.subjects_count}
                          </td>

                          <td className="px-4 py-3">
                            {student.has_manual_principal_comment ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                                <UserCheck size={13} />
                                Manual comment protected
                              </span>
                            ) : student.matches_range ? (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                Eligible
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                                Outside range
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {!filteredStudents.length && (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No students match the current search.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600">
                <strong>{selectedStudentIds.length}</strong> student
                {selectedStudentIds.length === 1 ? "" : "s"} selected.
              </div>

              <button
                type="button"
                onClick={() => void applyComments()}
                disabled={applying || selectedStudentIds.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Apply Principal Comments
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
