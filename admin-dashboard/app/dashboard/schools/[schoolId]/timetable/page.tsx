"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import api from "@/lib/api";

type Option = {
  id: number;
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  user?: {
    name?: string;
  };
  is_active?: boolean;
  is_current?: boolean;
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

type TimeSlot = {
  start: string;
  end: string;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SUBJECT_STYLES = [
  {
    card: "border-blue-200 bg-blue-50",
    accent: "bg-blue-500",
    title: "text-blue-900",
    className: "bg-blue-100 text-blue-800",
    teacher: "text-blue-700",
    icon: "text-blue-500",
  },
  {
    card: "border-violet-200 bg-violet-50",
    accent: "bg-violet-500",
    title: "text-violet-900",
    className: "bg-violet-100 text-violet-800",
    teacher: "text-violet-700",
    icon: "text-violet-500",
  },
  {
    card: "border-emerald-200 bg-emerald-50",
    accent: "bg-emerald-500",
    title: "text-emerald-900",
    className: "bg-emerald-100 text-emerald-800",
    teacher: "text-emerald-700",
    icon: "text-emerald-500",
  },
  {
    card: "border-amber-200 bg-amber-50",
    accent: "bg-amber-500",
    title: "text-amber-900",
    className: "bg-amber-100 text-amber-800",
    teacher: "text-amber-700",
    icon: "text-amber-500",
  },
  {
    card: "border-rose-200 bg-rose-50",
    accent: "bg-rose-500",
    title: "text-rose-900",
    className: "bg-rose-100 text-rose-800",
    teacher: "text-rose-700",
    icon: "text-rose-500",
  },
  {
    card: "border-cyan-200 bg-cyan-50",
    accent: "bg-cyan-500",
    title: "text-cyan-900",
    className: "bg-cyan-100 text-cyan-800",
    teacher: "text-cyan-700",
    icon: "text-cyan-500",
  },
  {
    card: "border-fuchsia-200 bg-fuchsia-50",
    accent: "bg-fuchsia-500",
    title: "text-fuchsia-900",
    className: "bg-fuchsia-100 text-fuchsia-800",
    teacher: "text-fuchsia-700",
    icon: "text-fuchsia-500",
  },
  {
    card: "border-indigo-200 bg-indigo-50",
    accent: "bg-indigo-500",
    title: "text-indigo-900",
    className: "bg-indigo-100 text-indigo-800",
    teacher: "text-indigo-700",
    icon: "text-indigo-500",
  },
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

function getTeacherName(teacher: Option | undefined) {
  if (!teacher) return "";

  return (
    teacher.name ||
    teacher.full_name ||
    [teacher.first_name, teacher.last_name]
      .filter(Boolean)
      .join(" ") ||
    teacher.user?.name ||
    `Teacher #${teacher.id}`
  );
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

function normalizeTime(value: string) {
  if (!value) return "";

  return value.slice(0, 5);
}

function normalizeDay(value: string) {
  return value?.trim().toLowerCase() || "";
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

function getSubjectStyle(subjectId: number, subjectName: string) {
  const seed =
    `${subjectId}-${subjectName}`
      .split("")
      .reduce((total, char) => total + char.charCodeAt(0), 0);

  return SUBJECT_STYLES[seed % SUBJECT_STYLES.length];
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
          params: {
            school_id: numericSchoolId,
          },
        }),
        api.get("/classes", {
          params: {
            school_id: numericSchoolId,
          },
        }),
        api.get("/subjects", {
          params: {
            school_id: numericSchoolId,
          },
        }),
        api.get("/teachers", {
          params: {
            school_id: numericSchoolId,
          },
        }),
      ]);

      const sessionData = unwrapArray<Option>(sessionsResponse.data);
      const classData = unwrapArray<Option>(classesResponse.data);
      const subjectData = unwrapArray<Option>(subjectsResponse.data);
      const teacherData = unwrapArray<Option>(teachersResponse.data);

      setSessions(sessionData);
      setClasses(classData);
      setSubjects(subjectData);
      setTeachers(teacherData);

      const currentSession =
        sessionData.find((session) => session.is_current) ||
        sessionData[0];

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
        data.find((term) => term.is_current) || data[0];

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
            ? {
                academic_session_id: Number(selectedSession),
              }
            : {}),
          ...(selectedTerm
            ? {
                term_id: Number(selectedTerm),
              }
            : {}),
          ...(selectedClass
            ? {
                classroom_id: Number(selectedClass),
              }
            : {}),
          ...(selectedDay
            ? {
                day_of_week: selectedDay,
              }
            : {}),
        },
      });

      setEntries(
        unwrapArray<TimetableEntry>(response.data)
      );
    } catch (err) {
      console.error("Failed to load timetable:", err);
      setError(extractError(err));
      setEntries([]);
    }
  }

  useEffect(() => {
    void loadBaseData();
  }, [schoolId]);

  useEffect(() => {
    if (selectedSession) {
      void loadTerms(selectedSession);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (!loading) {
      void loadEntries();
    }
  }, [
    selectedSession,
    selectedTerm,
    selectedClass,
    selectedDay,
    loading,
  ]);

  const classNameMap = useMemo(() => {
    return new Map(
      classes.map((item) => [String(item.id), item.name || `Class #${item.id}`])
    );
  }, [classes]);

  const subjectNameMap = useMemo(() => {
    return new Map(
      subjects.map((item) => [
        String(item.id),
        item.name || `Subject #${item.id}`,
      ])
    );
  }, [subjects]);

  const teacherNameMap = useMemo(() => {
    return new Map(
      teachers.map((item) => [
        String(item.id),
        getTeacherName(item),
      ])
    );
  }, [teachers]);

  const overviewDays = useMemo(() => {
    if (selectedDay) {
      return [selectedDay];
    }

    return DAYS;
  }, [selectedDay]);

  const timeSlots = useMemo<TimeSlot[]>(() => {
    const unique = new Map<string, TimeSlot>();

    for (const entry of entries) {
      const start = normalizeTime(entry.start_time);
      const end = normalizeTime(entry.end_time);

      if (!start || !end) continue;

      const key = `${start}-${end}`;

      if (!unique.has(key)) {
        unique.set(key, {
          start,
          end,
        });
      }
    }

    return Array.from(unique.values()).sort((a, b) =>
      a.start.localeCompare(b.start)
    );
  }, [entries]);

  const overviewEntries = useMemo(() => {
    const map = new Map<string, TimetableEntry[]>();

    for (const entry of entries) {
      const day = normalizeDay(entry.day_of_week);
      const start = normalizeTime(entry.start_time);
      const end = normalizeTime(entry.end_time);

      const key = `${day}|${start}|${end}`;

      const current = map.get(key) || [];
      current.push(entry);
      map.set(key, current);
    }

    for (const list of map.values()) {
      list.sort((a, b) => {
        const classA =
          classNameMap.get(String(a.classroom_id)) ||
          a.classroom_name ||
          "";

        const classB =
          classNameMap.get(String(b.classroom_id)) ||
          b.classroom_name ||
          "";

        return classA.localeCompare(classB);
      });
    }

    return map;
  }, [entries, classNameMap]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, TimetableEntry[]>();

    for (const day of DAYS) {
      groups.set(day.toLowerCase(), []);
    }

    for (const entry of entries) {
      const normalizedDay = normalizeDay(entry.day_of_week);

      if (!groups.has(normalizedDay)) {
        groups.set(normalizedDay, []);
      }

      groups.get(normalizedDay)!.push(entry);
    }

    for (const [day, items] of groups) {
      items.sort((a, b) =>
        normalizeTime(a.start_time).localeCompare(
          normalizeTime(b.start_time)
        )
      );

      groups.set(day, items);
    }

    return Array.from(groups.entries())
      .filter(([, items]) => items.length > 0)
      .map(
        ([day, items]) =>
          [
            day.charAt(0).toUpperCase() +
              day.slice(1).toLowerCase(),
            items,
          ] as [string, TimetableEntry[]]
      );
  }, [entries]);

  function getEntrySubject(entry: TimetableEntry) {
    return (
      entry.subject_name ||
      subjectNameMap.get(String(entry.subject_id)) ||
      `Subject #${entry.subject_id}`
    );
  }

  function getEntryClass(entry: TimetableEntry) {
    return (
      entry.classroom_name ||
      classNameMap.get(String(entry.classroom_id)) ||
      `Class #${entry.classroom_id}`
    );
  }

  function getEntryTeacher(entry: TimetableEntry) {
    return (
      entry.teacher_name ||
      teacherNameMap.get(String(entry.teacher_id)) ||
      `Teacher #${entry.teacher_id}`
    );
  }

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
      start_time: normalizeTime(entry.start_time),
      end_time: normalizeTime(entry.end_time),
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
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-[#C58A00]" />

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#C58A00]">
                <CalendarClock size={17} />
                School Timetable
              </div>

              <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Timetable Management
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                View the complete school timetable and manage
                classes, subjects and teachers.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C58A00] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#A96F00] sm:w-auto"
            >
              <Plus size={18} />
              Add Timetable Entry
            </button>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <p className="text-sm font-bold text-slate-900">
            Timetable Filters
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Filter the weekly timetable by session, term, class or day.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Academic Session
            </span>

            <div className="relative">
              <select
                value={selectedSession}
                onChange={(event) =>
                  setSelectedSession(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
              >
                <option value="">All Sessions</option>

                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name || `Session #${session.id}`}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Term
            </span>

            <div className="relative">
              <select
                value={selectedTerm}
                onChange={(event) =>
                  setSelectedTerm(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
              >
                <option value="">All Terms</option>

                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name || `Term #${term.id}`}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Class
            </span>

            <div className="relative">
              <select
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
              >
                <option value="">All Classes</option>

                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name || `Class #${item.id}`}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
              Day
            </span>

            <div className="relative">
              <select
                value={selectedDay}
                onChange={(event) =>
                  setSelectedDay(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
              >
                <option value="">All Days</option>

                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </label>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#C58A00]" />
          <p className="text-sm font-semibold text-slate-700">
            Loading timetable...
          </p>
        </section>
      ) : entries.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <CalendarClock className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No timetable entries found
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            There are no timetable entries matching the current
            filters.
          </p>

          <button
            type="button"
            onClick={openCreateForm}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#C58A00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#A96F00]"
          >
            <Plus size={16} />
            Add First Entry
          </button>
        </section>
      ) : (
        <>
          {/* SCHOOL-WIDE WEEKLY OVERVIEW */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-[#FFF9E8] via-white to-white px-4 py-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C58A00] text-white shadow-sm">
                      <CalendarClock size={18} />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        School-wide Timetable
                      </h2>

                      <p className="text-xs text-slate-500">
                        Weekly overview of all scheduled classes,
                        subjects and teachers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E8D59A] bg-[#FFF9E8] px-3 py-1.5 text-xs font-bold text-[#9A6900]">
                  <CheckCircle2 size={14} />
                  {entries.length}{" "}
                  {entries.length === 1
                    ? "scheduled entry"
                    : "scheduled entries"}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 w-[130px] border-b border-r border-slate-200 bg-slate-900 px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-white">
                      Time
                    </th>

                    {overviewDays.map((day) => {
                      const dayHasEntries = entries.some(
                        (entry) =>
                          normalizeDay(entry.day_of_week) ===
                          normalizeDay(day)
                      );

                      return (
                        <th
                          key={day}
                          className="border-b border-r border-slate-200 bg-slate-800 px-3 py-4 text-left last:border-r-0"
                        >
                          <div className="text-sm font-bold text-white">
                            {day}
                          </div>

                          <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-300">
                            {dayHasEntries
                              ? "Scheduled"
                              : "No classes"}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {timeSlots.map((slot, slotIndex) => (
                    <tr key={`${slot.start}-${slot.end}`}>
                      <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-4 align-top">
                        <div className="flex items-start gap-2">
                          <Clock3
                            size={15}
                            className="mt-0.5 shrink-0 text-[#C58A00]"
                          />

                          <div>
                            <p className="whitespace-nowrap text-sm font-bold text-slate-800">
                              {formatTime(slot.start)}
                            </p>

                            <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-slate-400">
                              {formatTime(slot.end)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {overviewDays.map((day) => {
                        const key = `${normalizeDay(day)}|${slot.start}|${slot.end}`;

                        const cellEntries =
                          overviewEntries.get(key) || [];

                        return (
                          <td
                            key={`${day}-${slot.start}-${slot.end}`}
                            className={`min-w-[185px] border-b border-r border-slate-200 p-2.5 align-top last:border-r-0 ${
                              slotIndex % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50/40"
                            }`}
                          >
                            {cellEntries.length === 0 ? (
                              <div className="flex min-h-[112px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70">
                                <span className="text-xs font-medium text-slate-300">
                                  —
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {cellEntries.map((entry) => {
                                  const subject = getEntrySubject(entry);
                                  const className =
                                    getEntryClass(entry);
                                  const teacher =
                                    getEntryTeacher(entry);

                                  const style = getSubjectStyle(
                                    entry.subject_id,
                                    subject
                                  );

                                  return (
                                    <button
                                      key={entry.id}
                                      type="button"
                                      onClick={() =>
                                        openEditForm(entry)
                                      }
                                      className={`group relative block w-full overflow-hidden rounded-xl border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style.card}`}
                                    >
                                      <div
                                        className={`absolute inset-y-0 left-0 w-1 ${style.accent}`}
                                      />

                                      <div className="p-3 pl-4">
                                        <div className="flex items-start justify-between gap-2">
                                          <p
                                            className={`text-sm font-extrabold leading-5 ${style.title}`}
                                          >
                                            {subject}
                                          </p>

                                          <Pencil
                                            size={13}
                                            className={`mt-0.5 shrink-0 opacity-0 transition group-hover:opacity-100 ${style.icon}`}
                                          />
                                        </div>

                                        <div className="mt-2">
                                          <span
                                            className={`inline-flex max-w-full rounded-full px-2 py-1 text-[10px] font-bold ${style.className}`}
                                          >
                                            {className}
                                          </span>
                                        </div>

                                        <div
                                          className={`mt-2 flex items-start gap-1.5 text-[11px] font-semibold ${style.teacher}`}
                                        >
                                          <UserRound
                                            size={13}
                                            className="mt-0.5 shrink-0"
                                          />

                                          <span className="leading-4">
                                            {teacher}
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:px-6">
              <span className="font-semibold text-slate-700">
                Tip:
              </span>{" "}
              Click any coloured subject card to edit that timetable
              entry.
            </div>
          </section>

          {/* MANAGEMENT LIST */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Timetable Entries
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Manage individual timetable entries.
                </p>
              </div>

              {selectedClassName && (
                <span className="w-fit rounded-full bg-[#FFF9E8] px-3 py-1.5 text-xs font-bold text-[#9A6900]">
                  {selectedClassName}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {groupedEntries.map(([day, items]) => (
                <div
                  key={day}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#C58A00]" />

                      <h3 className="text-sm font-bold text-slate-900">
                        {day}
                      </h3>
                    </div>

                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                      {items.length}{" "}
                      {items.length === 1
                        ? "entry"
                        : "entries"}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {items.map((entry) => {
                      const subject =
                        getEntrySubject(entry);
                      const className =
                        getEntryClass(entry);
                      const teacher =
                        getEntryTeacher(entry);

                      const style = getSubjectStyle(
                        entry.subject_id,
                        subject
                      );

                      return (
                        <div
                          key={entry.id}
                          className="flex flex-col gap-4 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex w-[112px] shrink-0 items-center gap-2 text-sm font-bold text-slate-700">
                              <Clock3
                                size={16}
                                className="text-[#C58A00]"
                              />

                              <div>
                                <div>
                                  {formatTime(
                                    entry.start_time
                                  )}
                                </div>

                                <div className="text-[11px] font-medium text-slate-400">
                                  {formatTime(
                                    entry.end_time
                                  )}
                                </div>
                              </div>
                            </div>

                            <div
                              className={`min-w-0 rounded-xl border px-3.5 py-2.5 ${style.card}`}
                            >
                              <div
                                className={`text-sm font-extrabold ${style.title}`}
                              >
                                {subject}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.className}`}
                                >
                                  {className}
                                </span>

                                <span
                                  className={`text-xs font-semibold ${style.teacher}`}
                                >
                                  {teacher}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(entry)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[#C58A00] hover:text-[#A96F00]"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void removeEntry(entry.id)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* CREATE / EDIT MODAL */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C58A00]">
                  Timetable
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {editingId
                    ? "Edit Timetable Entry"
                    : "Add Timetable Entry"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={submitting}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={submitForm}
              className="overflow-y-auto p-5 sm:p-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Academic Session
                  </span>

                  <select
                    value={form.academic_session_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        academic_session_id:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
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
                        {session.name ||
                          `Session #${session.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Term
                  </span>

                  <select
                    value={form.term_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        term_id: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
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
                        {term.name ||
                          `Term #${term.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Class
                  </span>

                  <select
                    value={form.classroom_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        classroom_id:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
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
                        {item.name ||
                          `Class #${item.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Subject
                  </span>

                  <select
                    value={form.subject_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subject_id:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
                    required
                  >
                    <option value="">
                      Select subject
                    </option>

                    {subjects.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name ||
                          `Subject #${item.id}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Teacher
                  </span>

                  <select
                    value={form.teacher_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        teacher_id:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
                    required
                  >
                    <option value="">
                      Select teacher
                    </option>

                    {teachers.map((teacher) => (
                      <option
                        key={teacher.id}
                        value={teacher.id}
                      >
                        {getTeacherName(teacher)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Day
                  </span>

                  <select
                    value={form.day_of_week}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        day_of_week:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
                    required
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Start Time
                    </span>

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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                      End Time
                    </span>

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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#C58A00] focus:ring-2 focus:ring-[#C58A00]/15"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C58A00] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A96F00] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}

                  {editingId
                    ? "Save Changes"
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
