"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Filter,
  GraduationCap,
  History,
  Info,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  X,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import api from "@/lib/api";

type Student = {
  id: number;
  school_id: number;
  classroom_id: number | null;
  class_name: string | null;
  current_academic_session_id: number | null;
  session_name: string | null;
  admission_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string;
  date_of_birth: string | null;
  lifecycle_status: string;
};

type Classroom = { id: number; name: string; level_id: number };
type Session = { id: number; name: string; is_current: boolean };
type HistoryEntry = {
  id: number;
  action: string;
  previous_classroom_id: number | null;
  new_classroom_id: number | null;
  previous_session_id: number | null;
  new_session_id: number | null;
  previous_status: string | null;
  new_status: string | null;
  performed_by: number;
  notes: string | null;
  created_at: string | null;
};

const statuses = ["ACTIVE", "ARCHIVED", "GRADUATED", "TRANSFERRED", "WITHDRAWN"];

const statusConfig: Record<string, { badge: string; dot: string }> = {
  ACTIVE: {
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-300/50 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  ARCHIVED: {
    badge: "bg-slate-500/10 text-slate-700 border-slate-300/50 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
    dot: "bg-slate-400",
  },
  GRADUATED: {
    badge: "bg-indigo-500/10 text-indigo-700 border-indigo-300/50 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30",
    dot: "bg-indigo-500",
  },
  TRANSFERRED: {
    badge: "bg-amber-500/10 text-amber-700 border-amber-300/50 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dot: "bg-amber-500",
  },
  WITHDRAWN: {
    badge: "bg-rose-500/10 text-rose-700 border-rose-300/50 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30",
    dot: "bg-rose-500",
  },
};

export default function AdmissionsPage() {
  const params = useParams<{ schoolId: string }>();
  const schoolId = String(params.schoolId ?? "");

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [classId, setClassId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<{
    student_count: number;
    destination_class: string;
    destination_session: string;
    students: Array<{
      id: number;
      name: string;
      admission_number: string;
      previous_class: string | null;
      previous_session: string | null;
    }>;
  } | null>(null);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const base = `/admissions-lifecycle/schools/${schoolId}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [studentResponse, optionResponse] = await Promise.all([
        api.get<Student[]>(`${base}/students`, {
          params: { include_archived: includeArchived },
        }),
        api.get<{ classes: Classroom[]; sessions: Session[] }>(
          `${base}/options`,
        ),
      ]);
      setStudents(studentResponse.data);
      setClasses(optionResponse.data.classes);
      setSessions(optionResponse.data.sessions);
      setSelected([]);
      setPreview(null);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "Unable to load lifecycle data. Check your access and feature licence.");
      setStudents([]);
      setClasses([]);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [base, includeArchived]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = students.filter((student) => {
    const term = search.toLowerCase().trim();
    const name = `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.toLowerCase();
    return !term || name.includes(term) ||
      student.admission_number.toLowerCase().includes(term) ||
      String(student.id).includes(term);
  });

  const activeStudents = filtered.filter((s) => s.lifecycle_status === "ACTIVE");
  const isAllSelected = activeStudents.length > 0 && activeStudents.every((s) => selected.includes(s.id));

  function toggleStudent(id: number) {
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
    setPreview(null);
  }

  function toggleAll() {
    if (isAllSelected) {
      setSelected([]);
    } else {
      setSelected(activeStudents.map((s) => s.id));
    }
    setPreview(null);
  }

  async function previewPromotion() {
    if (!selected.length || !classId || !sessionId) {
      setError("Select at least one student, a destination class, and a session.");
      return;
    }
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await api.post(`${base}/promotions/preview`, {
        student_ids: selected,
        target_classroom_id: Number(classId),
        target_session_id: Number(sessionId),
        notes: notes || null,
      });
      setPreview(response.data);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "Promotion preview failed.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmPromotion() {
    if (!preview || !window.confirm(
      `Confirm promotion of ${preview.student_count} student(s) to ${preview.destination_class}, session ${preview.destination_session}?`,
    )) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post(`${base}/promotions/confirm`, {
        student_ids: selected,
        target_classroom_id: Number(classId),
        target_session_id: Number(sessionId),
        notes: notes || null,
      });
      setNotice(response.data.message || "Promotion completed successfully.");
      setPreview(null);
      setSelected([]);
      setNotes("");
      await loadData();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "Promotion could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(student: Student, newStatus: string) {
    if (newStatus === student.lifecycle_status) return;
    const confirmed = window.confirm(
      `${newStatus === "ACTIVE" ? "Restore" : "Change status of"} ${student.first_name} ${student.last_name} to ${newStatus}? This action will be recorded in history.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await api.patch(
        `${base}/students/${student.id}/status`,
        { new_status: newStatus, notes: notes || null },
      );
      setNotice(response.data.message || "Student status updated.");
      await loadData();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "Student status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function showHistory(student: Student) {
    setHistoryStudent(student);
    setHistory([]);
    setHistoryLoading(true);
    setError("");
    try {
      const response = await api.get<HistoryEntry[]>(
        `${base}/students/${student.id}/history`,
      );
      setHistory(response.data);
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || "Unable to load student history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900/5 dark:bg-slate-950 p-4 space-y-6 sm:p-6 lg:p-8 text-slate-800 dark:text-slate-100 antialiased">
      {/* Top Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Academic Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Admissions & Student Lifecycle
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage bulk class promotions, student status transitions, and audit activity logs.
          </p>
        </div>
        <button
          onClick={() => void loadData()}
          disabled={loading || busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </header>

      {/* Notifications */}
      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 backdrop-blur-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 backdrop-blur-xs">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1 font-medium">{notice}</div>
          <button onClick={() => setNotice("")} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary KPI Widgets */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 shadow-2xs backdrop-blur-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Loaded</span>
          <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{students.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 shadow-2xs backdrop-blur-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active Students</span>
          <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
            {students.filter((s) => s.lifecycle_status === "ACTIVE").length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 shadow-2xs backdrop-blur-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Selected</span>
          <p className="text-2xl font-black mt-1 text-indigo-600 dark:text-indigo-400">{selected.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 shadow-2xs backdrop-blur-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Classes</span>
          <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{classes.length}</p>
        </div>
      </div>

      {/* Promotion Panel */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">Bulk Promotion Control</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select students in the register, configure destination options, and preview before confirming.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Destination Class</label>
            <select
              aria-label="Destination class"
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setPreview(null); }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
            >
              <option value="">Choose target class...</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Destination Session</label>
            <select
              aria-label="Destination session"
              value={sessionId}
              onChange={(e) => { setSessionId(e.target.value); setPreview(null); }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
            >
              <option value="">Choose academic session...</option>
              {sessions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}{item.is_current ? " (Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Audit Notes (Optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. End of term promotion"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            disabled={busy || selected.length === 0}
            onClick={() => void previewPromotion()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-5 py-2.5 text-sm font-semibold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Preview Promotion {selected.length ? `(${selected.length})` : ""}
          </button>

          {preview && (
            <button
              disabled={busy}
              onClick={() => void confirmPromotion()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-sm font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm & Apply Promotion
            </button>
          )}
        </div>

        {/* Promotion Preview Details */}
        {preview && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/50 dark:bg-indigo-950/20 p-4 text-sm space-y-3">
            <div className="flex flex-wrap items-center gap-2 font-bold text-indigo-950 dark:text-indigo-200">
              <span>Promotion Preview:</span>
              <span className="bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200 px-2.5 py-0.5 rounded-full text-xs">
                {preview.student_count} student(s)
              </span>
              <ArrowRight className="h-4 w-4 text-indigo-500" />
              <span>{preview.destination_class} ({preview.destination_session})</span>
            </div>
            <ul className="max-h-48 overflow-y-auto divide-y divide-indigo-100 dark:divide-indigo-900/30 text-xs">
              {preview.students.map((item) => (
                <li key={item.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</span>{" "}
                    <span className="text-slate-400">({item.admission_number})</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    From: {item.previous_class || "Unassigned"} / {item.previous_session || "None"}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Main Student Register */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {/* Register Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-slate-50/40 dark:bg-slate-900/50">
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Student Register
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing {filtered.length} of {students.length} record(s)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or ID..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 py-2 pl-9 pr-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              Include Archived
            </label>
          </div>
        </div>

        {/* Selected Counter Toolbar */}
        {selected.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/40 px-5 py-2.5 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
            <span>{selected.length} student(s) selected</span>
            <button
              onClick={() => setSelected([])}
              className="hover:underline text-indigo-600 dark:text-indigo-400 font-bold"
            >
              Deselect All
            </button>
          </div>
        )}

        {/* Content Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Fetching student records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No matching student records found</p>
            <p className="text-xs text-slate-400 mt-1">Try refining your search keyword</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-800/40 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all visible active students"
                        checked={isAllSelected}
                        onChange={toggleAll}
                        className="rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                    </th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Admission No.</th>
                    <th className="p-4">Class & Session</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filtered.map((student) => {
                    const isActive = student.lifecycle_status === "ACTIVE";
                    const isSelected = selected.includes(student.id);
                    const statusTheme = statusConfig[student.lifecycle_status] || statusConfig.ARCHIVED;

                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? "bg-indigo-50/50 dark:bg-indigo-950/30" : ""
                        }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            aria-label={`Select ${student.first_name} ${student.last_name}`}
                            disabled={!isActive}
                            checked={isSelected}
                            onChange={() => toggleStudent(student.id)}
                            className="rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-30"
                          />
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {student.first_name} {student.middle_name || ""} {student.last_name}
                          </div>
                          <div className="text-xs text-slate-400">System ID: #{student.id}</div>
                        </td>
                        <td className="p-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {student.admission_number}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{student.class_name || "Unassigned"}</div>
                          <div className="text-xs text-slate-400">{student.session_name || "No session"}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusTheme.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusTheme.dot}`} />
                            {student.lifecycle_status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <select
                              aria-label={`Change status for ${student.first_name} ${student.last_name}`}
                              value={student.lifecycle_status}
                              disabled={busy}
                              onChange={(e) => void changeStatus(student, e.target.value)}
                              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                            >
                              {statuses.map((item) => (
                                <option key={item} value={item}>{item}</option>
                              ))}
                            </select>
                            <button
                              title="View lifecycle history"
                              onClick={() => void showHistory(student)}
                              className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
                            >
                              <History className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((student) => {
                const isActive = student.lifecycle_status === "ACTIVE";
                const isSelected = selected.includes(student.id);
                const statusTheme = statusConfig[student.lifecycle_status] || statusConfig.ARCHIVED;

                return (
                  <div key={student.id} className={`p-4 space-y-3 ${isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/30" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${student.first_name} ${student.last_name}`}
                          disabled={!isActive}
                          checked={isSelected}
                          onChange={() => toggleStudent(student.id)}
                          className="mt-1 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-30"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {student.first_name} {student.middle_name || ""} {student.last_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            Adm: <span className="font-mono font-semibold">{student.admission_number}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusTheme.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusTheme.dot}`} />
                        {student.lifecycle_status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 pl-7 space-y-0.5">
                      <div><span className="font-semibold text-slate-700 dark:text-slate-300">Class:</span> {student.class_name || "Unassigned"}</div>
                      <div><span className="font-semibold text-slate-700 dark:text-slate-300">Session:</span> {student.session_name || "No session"}</div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 pl-7">
                      <select
                        aria-label={`Change status for ${student.first_name} ${student.last_name}`}
                        value={student.lifecycle_status}
                        disabled={busy}
                        onChange={(e) => void changeStatus(student, e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold"
                      >
                        {statuses.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => void showHistory(student)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        <History className="h-3.5 w-3.5" /> History <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* History Slide-Over Drawer */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col border-l border-slate-200 dark:border-slate-800">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Audit History Log</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {historyStudent.first_name} {historyStudent.last_name} ({historyStudent.admission_number})
                </p>
              </div>
              <button
                onClick={() => { setHistoryStudent(null); setHistory([]); }}
                className="p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Timeline List */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                  <span className="text-xs font-semibold">Loading history timeline...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No activity entries found</p>
                </div>
              ) : (
                <ol className="relative border-l-2 border-indigo-100 dark:border-slate-800 ml-3 space-y-6">
                  {history.map((item) => (
                    <li key={item.id} className="ml-6">
                      <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />
                      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-2 text-xs shadow-2xs">
                        <div className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide text-[11px]">
                          {item.action.replaceAll("_", " ")}
                        </div>

                        <div className="text-slate-600 dark:text-slate-300 space-y-1">
                          <div><span className="font-semibold text-slate-800 dark:text-slate-200">Status:</span> {item.previous_status || "—"} → {item.new_status || "—"}</div>
                          <div><span className="font-semibold text-slate-800 dark:text-slate-200">Class ID:</span> {item.previous_classroom_id ?? "—"} → {item.new_classroom_id ?? "—"}</div>
                          <div><span className="font-semibold text-slate-800 dark:text-slate-200">Session ID:</span> {item.previous_session_id ?? "—"} → {item.new_session_id ?? "—"}</div>
                        </div>

                        {item.notes && (
                          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 italic text-slate-700 dark:text-slate-300">
                            "{item.notes}"
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 pt-2 flex justify-between items-center">
                          <span>User ID: #{item.performed_by}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => { setHistoryStudent(null); setHistory([]); }}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retention Footer Note */}
      <footer className="flex items-center gap-2 text-xs text-slate-400 pt-2">
        <Archive className="h-4 w-4 shrink-0" /> Archived student records are preserved for audit purposes and lifecycle actions do not purge data.
      </footer>
    </main>
  );
}