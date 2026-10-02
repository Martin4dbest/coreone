"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ChevronDown,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import api from "@/lib/api";

type Option = {
  id: number;
  name: string;
  is_active?: boolean;
};

type TimetableEntry = {
  id: number;
  school_id: number;
  academic_session_id: number;
  term_id: number;
  classroom_id: number;
  subject_id: number;
  teacher_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;

  academic_session_name?: string | null;
  term_name?: string | null;
  classroom_name?: string | null;
  subject_name?: string | null;
  teacher_name?: string | null;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function unwrapArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return (value as { data: T[] }).data;
  }

  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { items?: unknown }).items)
  ) {
    return (value as { items: T[] }).items;
  }

  return [];
}

function formatTime(value: string) {
  if (!value) return "";

  const parts = value.split(":");
  const hour = Number(parts[0]);
  const minute = parts[1] ?? "00";

  if (Number.isNaN(hour)) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

function extractError(error: unknown) {
  const err = error as {
    response?: {
      data?: {
        detail?: string | { msg?: string }[];
        message?: string;
      };
    };
    message?: string;
  };

  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(", ");
  }

  return (
    err?.response?.data?.message ||
    err?.message ||
    "Unable to complete this request."
  );
}

export default function TimetablePage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);
  const numericSchoolId = Number(schoolId);

  const [sessions, setSessions] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [teachers, setTeachers] = useState<Option[]>([]);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    academic_session_id: "",
    term_id: "",
    classroom_id: "",
    subject_id: "",
    teacher_id: "",
    day_of_week: "Monday",
    start_time: "",
    end_time: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadBaseData() {
    try {
      setLoading(true);
      setError("");

      const [
        sessionsResponse,
        classesResponse,
        subjectsResponse,
        teachersResponse,
      ] = await Promise.all([
        api.get("/academic-sessions", {
          params: { school_id: numericSchoolId },
        }),
        api.get("/classes", {
          params: { school_id: numericSchoolId },
        }),
        api.get("/subjects", {
          params: { school_id: numericSchoolId },
        }),
        api.get("/teachers", {
          params: { school_id: numericSchoolId },
        }),
      ]);

      const sessionData = unwrapArray<Option>(sessionsResponse.data);
      const classData = unwrapArray<Option>(classesResponse.data);
      const subjectData = unwrapArray<Option>(subjectsResponse.data);
      const teacherData = unwrapArray<Option>(teachersResponse.data);

      setSessions(
        sessionData.filter(
          (item) =>
            !item.is_active ||
            item.is_active === true
        )
      );

      setClasses(
        classData.filter(
          (item) =>
            !item.is_active ||
            item.is_active === true
        )
      );

      setSubjects(
        subjectData.filter(
          (item) =>
            !item.is_active ||
            item.is_active === true
        )
      );

      setTeachers(
        teacherData.filter(
          (item) =>
            !item.is_active ||
            item.is_active === true
        )
      );

      const currentSession =
        sessionData.find(
          (session) =>
            Boolean(
              (session as Option & { is_current?: boolean }).is_current
            )
        ) || sessionData[0];

      if (currentSession) {
        const sessionId = String(currentSession.id);
        setSelectedSession((current) => current || sessionId);

        setForm((current) => ({
          ...current,
          academic_session_id:
            current.academic_session_id || sessionId,
        }));
      }
    } catch (err) {
      console.error("Failed to load timetable setup:", err);
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadTerms(sessionId: string) {
    if (!sessionId) {
      setTerms([]);
      return;
    }

    try {
      const response = await api.get("/terms", {
        params: {
          school_id: numericSchoolId,
          academic_session_id: Number(sessionId),
        },
      });

      const data = unwrapArray<Option>(response.data);
      setTerms(data);

      const currentTerm =
        data.find(
          (term) =>
            Boolean(
              (term as Option & { is_current?: boolean }).is_current
            )
        ) || data[0];

      if (currentTerm) {
        const termId = String(currentTerm.id);

        setSelectedTerm((current) => current || termId);

        setForm((current) => ({
          ...current,
          term_id: current.term_id || termId,
        }));
      }
    } catch (err) {
      console.error("Failed to load terms:", err);
      setTerms([]);
    }
  }

  async function loadEntries() {
    try {
      const response = await api.get("/timetable", {
        params: {
          school_id: numericSchoolId,
          ...(selectedSession
            ? { academic_session_id: Number(selectedSession) }
            : {}),
          ...(selectedTerm
            ? { term_id: Number(selectedTerm) }
            : {}),
          ...(selectedClass
            ? { classroom_id: Number(selectedClass) }
            : {}),
          ...(selectedDay
            ? { day_of_week: selectedDay }
            : {}),
        },
      });

      setEntries(unwrapArray<TimetableEntry>(response.data));
    } catch (err) {
      console.error("Failed to load timetable:", err);
      setError(extractError(err));
      setEntries([]);
    }
  }

  useEffect(() => {
    loadBaseData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedSession) {
      loadTerms(selectedSession);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (!loading) {
      loadEntries();
    }
  }, [
    selectedSession,
    selectedTerm,
    selectedClass,
    selectedDay,
    loading,
  ]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, TimetableEntry[]>();

    for (const day of DAYS) {
      groups.set(day.toUpperCase(), []);
    }

    for (const entry of entries) {
      const normalizedDay =
        entry.day_of_week?.toUpperCase().trim() || "";

      if (!groups.has(normalizedDay)) {
        groups.set(normalizedDay, []);
      }

      groups.get(normalizedDay)!.push(entry);
    }

    for (const [day, items] of groups) {
      items.sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );
      groups.set(day, items);
    }

    return Array.from(groups.entries())
      .filter(([, items]) => items.length > 0)
      .map(([day, items]) => [
        day.charAt(0) + day.slice(1).toLowerCase(),
        items,
      ] as [string, TimetableEntry[]]);
  }, [entries]);

  function openCreateForm() {
    setEditingId(null);

    setForm({
      academic_session_id:
        selectedSession ||
        (sessions[0] ? String(sessions[0].id) : ""),
      term_id:
        selectedTerm ||
        (terms[0] ? String(terms[0].id) : ""),
      classroom_id:
        selectedClass ||
        (classes[0] ? String(classes[0].id) : ""),
      subject_id:
        subjects[0] ? String(subjects[0].id) : "",
      teacher_id:
        teachers[0] ? String(teachers[0].id) : "",
      day_of_week: selectedDay || "Monday",
      start_time: "",
      end_time: "",
    });

    setError("");
    setFormOpen(true);
  }

  function openEditForm(entry: TimetableEntry) {
    setEditingId(entry.id);

    setForm({
      academic_session_id: String(entry.academic_session_id),
      term_id: String(entry.term_id),
      classroom_id: String(entry.classroom_id),
      subject_id: String(entry.subject_id),
      teacher_id: String(entry.teacher_id),
      day_of_week: entry.day_of_week,
      start_time: entry.start_time.slice(0, 5),
      end_time: entry.end_time.slice(0, 5),
    });

    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (submitting) return;

    setFormOpen(false);
    setEditingId(null);
  }

  async function submitForm(event: FormEvent) {
    event.preventDefault();

    if (
      !form.academic_session_id ||
      !form.term_id ||
      !form.classroom_id ||
      !form.subject_id ||
      !form.teacher_id ||
      !form.day_of_week ||
      !form.start_time ||
      !form.end_time
    ) {
      setError("Please complete all timetable fields.");
      return;
    }

    if (form.end_time <= form.start_time) {
      setError("End time must be after start time.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        school_id: numericSchoolId,
        academic_session_id: Number(form.academic_session_id),
        term_id: Number(form.term_id),
        classroom_id: Number(form.classroom_id),
        subject_id: Number(form.subject_id),
        teacher_id: Number(form.teacher_id),
        day_of_week: form.day_of_week,
        start_time: form.start_time,
        end_time: form.end_time,
      };

      if (editingId) {
        await api.patch(`/timetable/${editingId}`, payload);
      } else {
        await api.post("/timetable", payload);
      }

      setFormOpen(false);
      setEditingId(null);

      await loadEntries();
    } catch (err) {
      console.error("Failed to save timetable entry:", err);
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeEntry(id: number) {
    const confirmed = window.confirm(
      "Remove this timetable entry?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/timetable/${id}`);

      setEntries((current) =>
        current.filter((entry) => entry.id !== id)
      );
    } catch (err) {
      console.error("Failed to remove timetable entry:", err);
      setError(extractError(err));
    }
  }

  const selectedClassName =
    classes.find(
      (item) => String(item.id) === String(selectedClass)
    )?.name || "";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#C58A00]">
              <CalendarClock size={17} />
              School Timetable
            </div>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Timetable Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage weekly class schedules for this school.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C58A00] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#A96F00] lg:w-auto"
          >
            <Plus size={17} />
            Add Timetable Entry
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={selectedSession}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedSession(value);
              setSelectedTerm("");
              setForm((current) => ({
                ...current,
                academic_session_id: value,
                term_id: "",
              }));
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
          >
            <option value="">All Sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTerm}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedTerm(value);
              setForm((current) => ({
                ...current,
                term_id: value,
              }));
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
          >
            <option value="">All Terms</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedClass(value);
              setForm((current) => ({
                ...current,
                classroom_id: value,
              }));
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
          >
            <option value="">All Classes</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDay}
            onChange={(event) => setSelectedDay(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
          >
            <option value="">All Days</option>
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading timetable...
        </div>
      ) : groupedEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Clock3 className="mx-auto text-slate-400" size={30} />

          <h3 className="mt-3 font-semibold text-slate-900">
            No timetable entries
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Add the first timetable entry for this school.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#C58A00] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={16} />
            Add Entry
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedEntries.map(([day, dayEntries]) => (
            <section
              key={day}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-1 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">
                    {day}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {selectedClassName || "School timetable"}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  {dayEntries.length}{" "}
                  {dayEntries.length === 1
                    ? "entry"
                    : "entries"}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {dayEntries.map((entry) => {
                  const className =
                    entry.classroom_name ||
                    classes.find(
                      (item) => item.id === entry.classroom_id
                    )?.name ||
                    `Class #${entry.classroom_id}`;

                  const subjectName =
                    entry.subject_name ||
                    subjects.find(
                      (item) => item.id === entry.subject_id
                    )?.name ||
                    `Subject #${entry.subject_id}`;

                  const teacherName =
                    entry.teacher_name ||
                    teachers.find(
                      (item) => item.id === entry.teacher_id
                    )?.name ||
                    `Teacher #${entry.teacher_id}`;

                  return (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="w-fit rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
                          {formatTime(entry.start_time)}
                          {" - "}
                          {formatTime(entry.end_time)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {subjectName}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {className} · {teacherName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(entry)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeEntry(entry.id)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId
                    ? "Edit Timetable Entry"
                    : "Add Timetable Entry"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Set the class, subject, teacher and period.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={submitForm}
              className="space-y-5 p-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Academic Session
                  </label>

                  <select
                    value={form.academic_session_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        academic_session_id:
                          event.target.value,
                        term_id: "",
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
                    required
                  >
                    <option value="">
                      Select session
                    </option>

                    {sessions.map((session) => (
                      <option
                        key={session.id}
                        value={session.id}
                      >
                        {session.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Term
                  </label>

                  <select
                    value={form.term_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        term_id: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
                    required
                  >
                    <option value="">
                      Select term
                    </option>

                    {terms.map((term) => (
                      <option
                        key={term.id}
                        value={term.id}
                      >
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Class
                  </label>

                  <select
                    value={form.classroom_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        classroom_id:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
                    required
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Subject
                  </label>

                  <select
                    value={form.subject_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subject_id:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
                    required
                  >
                    <option value="">
                      Select subject
                    </option>

                    {subjects.map((subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="relative">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Teacher
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setTeacherDropdownOpen((open) => !open)
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm text-black outline-none transition hover:border-slate-300 focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/10"
                    >
                      <span className="truncate">
                        {form.teacher_id
                          ? teachers.find(
                              (teacher) =>
                                String(teacher.id) ===
                                String(form.teacher_id)
                            )?.name || "Select teacher"
                          : "Select teacher"}
                      </span>

                      <ChevronDown
                        size={17}
                        className={`ml-2 shrink-0 text-slate-500 transition-transform ${
                          teacherDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {teacherDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full z-[60] mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                        {teachers.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-slate-500">
                            No teachers available
                          </div>
                        ) : (
                          teachers.map((teacher) => {
                            const selected =
                              String(form.teacher_id) ===
                              String(teacher.id);

                            return (
                              <button
                                key={teacher.id}
                                type="button"
                                onClick={() => {
                                  setForm((current) => ({
                                    ...current,
                                    teacher_id: String(teacher.id),
                                  }));
                                  setTeacherDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                                  selected
                                    ? "bg-[#C58A00]/10 font-bold text-black"
                                    : "text-black hover:bg-slate-50"
                                }`}
                              >
                                <span className="truncate text-black">
                                  {teacher.name}
                                </span>

                                {selected && (
                                  <span className="ml-2 shrink-0 text-xs font-bold text-[#C58A00]">
                                    ✓
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Day
                  </label>

                  <select
                    value={form.day_of_week}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        day_of_week:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
                    required
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Start Time
                  </label>

                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        start_time:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    End Time
                  </label>

                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        end_time:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-black outline-none focus:border-[#C58A00]"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#C58A00] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Saving..."
                    : editingId
                      ? "Update Entry"
                      : "Create Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}