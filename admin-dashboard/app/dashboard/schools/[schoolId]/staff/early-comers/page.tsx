"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Medal,
  RefreshCw,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

import api from "@/lib/api";

type RangeKey = "today" | "week" | "month" | "term";

type AttendanceItem = {
  id: number;
  staff_id: number;
  school_id: number;
  staff_name: string;
  employee_number: string;
  attendance_date: string;
  status: string;
  check_in_at: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_accuracy: number | null;
  check_in_distance_meters: number | null;
  check_in_location_name: string | null;
};

type Staff = {
  id: number;
  user_id: number;
  employee_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  department: string | null;
  job_title: string | null;
  is_active: boolean;
};

type LeaderboardRow = {
  rank: number;
  staffId: number;
  staffName: string;
  employeeNumber: string;
  department: string;
  days: number;
  averageArrival: number;
  averageEarly: number;
  earliestArrival: number;
  latestArrival: number;
  earlyDays: number;
  score: number;
  consistency: number;
};

const RANGE_LABELS: Record<RangeKey, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  term: "This Term",
};

const RANGE_DESCRIPTIONS: Record<RangeKey, string> = {
  today: "Today's clock-ins",
  week: "Monday to today",
  month: "Current calendar month",
  term: "Recent term activity",
};

function getLagosDateKey(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function parseDateKey(value: string) {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function getRangeStart(range: RangeKey) {
  const now = parseDateKey(getLagosDateKey());
  if (!now) return "";

  if (range === "today") {
    return getLagosDateKey(now);
  }

  if (range === "week") {
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    now.setDate(now.getDate() + mondayOffset);
    return getLagosDateKey(now);
  }

  if (range === "month") {
    now.setDate(1);
    return getLagosDateKey(now);
  }

  // Frontend-only term window.
  // We deliberately avoid changing the backend or inventing a school DB field.
  // This uses the most recent 90 days as the analytical term window.
  now.setDate(now.getDate() - 89);
  return getLagosDateKey(now);
}

function getMinutes(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const formatted = new Intl.DateTimeFormat("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Lagos",
  }).format(date);

  const [hours, minutes] = formatted.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatClock(minutes: number | null) {
  if (minutes === null || !Number.isFinite(minutes)) return "--:--";

  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0",
  )}`;
}

function formatEarly(minutes: number) {
  const rounded = Math.max(0, Math.round(minutes));

  if (rounded === 0) return "On time";

  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;

  if (hours > 0) return `${hours}h ${mins}m early`;
  return `${mins}m early`;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "ST";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getWeekdayLabel(dateKey: string) {
  const date = parseDateKey(dateKey);
  if (!date) return "";

  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
  }).format(date);
}

function getAvatarClass(rank: number) {
  if (rank === 1) {
    return "bg-amber-100 text-amber-700 ring-amber-200";
  }

  if (rank === 2) {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }

  if (rank === 3) {
    return "bg-orange-100 text-orange-700 ring-orange-200";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function getRankBadgeClass(rank: number) {
  if (rank === 1) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (rank === 2) {
    return "bg-slate-50 text-slate-700 border-slate-200";
  }

  if (rank === 3) {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  return "bg-white text-slate-600 border-slate-200";
}

function getScoreClass(score: number) {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 60) return "text-amber-600";
  return "text-slate-600";
}

export default function EarlyComersPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [range, setRange] = useState<RangeKey>("today");
  const [targetTime, setTargetTime] = useState("08:00");
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");

    try {
      const [attendanceResponse, staffResponse] = await Promise.all([
        api.get<AttendanceItem[]>(
          `/staff/attendance/report?school_id=${schoolId}`,
        ),
        api.get<Staff[]>("/staff", {
          params: {
            school_id: Number(schoolId),
          },
        }),
      ]);

      setAttendance(
        Array.isArray(attendanceResponse.data)
          ? attendanceResponse.data
          : [],
      );

      setStaff(Array.isArray(staffResponse.data) ? staffResponse.data : []);
    } catch (err) {
      console.error("Failed to load early-comer analytics:", err);
      setError("Unable to load staff early-comer analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [schoolId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadData(true);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [schoolId]);

  const staffMap = useMemo(() => {
    const map = new Map<number, Staff>();

    for (const item of staff) {
      map.set(item.id, item);
    }

    return map;
  }, [staff]);

  const targetMinutes = useMemo(() => {
    const [hours, minutes] = targetTime.split(":").map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return 480;
    }

    return hours * 60 + minutes;
  }, [targetTime]);

  const rangeStart = useMemo(() => getRangeStart(range), [range]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((item) => {
      if (!item.check_in_at) return false;

      if (item.status && item.status.toLowerCase() === "absent") {
        return false;
      }

      return item.attendance_date >= rangeStart;
    });
  }, [attendance, rangeStart]);

  const leaderboard = useMemo<LeaderboardRow[]>(() => {
    const grouped = new Map<
      number,
      {
        staffName: string;
        employeeNumber: string;
        department: string;
        dates: Set<string>;
        arrivalMinutes: number[];
        earlyDays: number;
      }
    >();

    for (const item of filteredAttendance) {
      const minutes = getMinutes(item.check_in_at);
      if (minutes === null) continue;

      const profile = staffMap.get(item.staff_id);

      const current = grouped.get(item.staff_id) ?? {
        staffName:
          profile
            ? [profile.first_name, profile.middle_name, profile.last_name]
                .filter(Boolean)
                .join(" ")
            : item.staff_name || "Unknown Staff",
        employeeNumber:
          profile?.employee_number || item.employee_number || "—",
        department: profile?.department || "Unassigned",
        dates: new Set<string>(),
        arrivalMinutes: [],
        earlyDays: 0,
      };

      current.dates.add(item.attendance_date);
      current.arrivalMinutes.push(minutes);

      if (minutes < targetMinutes) {
        current.earlyDays += 1;
      }

      grouped.set(item.staff_id, current);
    }

    const raw = Array.from(grouped.entries())
      .map(([staffId, item]) => {
        const total = item.arrivalMinutes.reduce(
          (sum, value) => sum + value,
          0,
        );

        const averageArrival = total / item.arrivalMinutes.length;
        const earliestArrival = Math.min(...item.arrivalMinutes);
        const latestArrival = Math.max(...item.arrivalMinutes);

        const averageEarly = Math.max(
          0,
          targetMinutes - averageArrival,
        );

        const consistency =
          item.arrivalMinutes.length > 0
            ? (item.earlyDays / item.arrivalMinutes.length) * 100
            : 0;

        return {
          staffId,
          staffName: item.staffName,
          employeeNumber: item.employeeNumber,
          department: item.department,
          days: item.dates.size,
          averageArrival,
          averageEarly,
          earliestArrival,
          latestArrival,
          earlyDays: item.earlyDays,
          score: 0,
          consistency,
        };
      })
      .sort((a, b) => {
        if (b.averageEarly !== a.averageEarly) {
          return b.averageEarly - a.averageEarly;
        }

        if (b.consistency !== a.consistency) {
          return b.consistency - a.consistency;
        }

        return a.averageArrival - b.averageArrival;
      });

    return raw.map((row, index) => {
      const speedScore = Math.min(
        100,
        (row.averageEarly / 60) * 100,
      );

      const consistencyScore = row.consistency;

      const score = Math.round(
        Math.min(
          100,
          speedScore * 0.55 + consistencyScore * 0.45,
        ),
      );

      return {
        ...row,
        rank: index + 1,
        score,
      };
    });
  }, [filteredAttendance, staffMap, targetMinutes]);

  const topThree = leaderboard.slice(0, 3);

  const averageArrival = useMemo(() => {
    const values = filteredAttendance
      .map((item) => getMinutes(item.check_in_at))
      .filter((value): value is number => value !== null);

    if (!values.length) return null;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [filteredAttendance]);

  const averageEarly = useMemo(() => {
    if (averageArrival === null) return 0;
    return Math.max(0, targetMinutes - averageArrival);
  }, [averageArrival, targetMinutes]);

  const earlyClockIns = useMemo(
    () =>
      filteredAttendance.filter((item) => {
        const minutes = getMinutes(item.check_in_at);
        return minutes !== null && minutes < targetMinutes;
      }).length,
    [filteredAttendance, targetMinutes],
  );

  const uniqueStaff = leaderboard.length;

  const earlyRate =
    filteredAttendance.length > 0
      ? Math.round((earlyClockIns / filteredAttendance.length) * 100)
      : 0;

  const trendData = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        count: number;
        early: number;
      }
    >();

    for (const item of filteredAttendance) {
      const existing = map.get(item.attendance_date) ?? {
        date: item.attendance_date,
        count: 0,
        early: 0,
      };

      existing.count += 1;

      const minutes = getMinutes(item.check_in_at);
      if (minutes !== null && minutes < targetMinutes) {
        existing.early += 1;
      }

      map.set(item.attendance_date, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [filteredAttendance, targetMinutes]);

  const maxTrendCount = Math.max(
    1,
    ...trendData.map((item) => item.count),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-6 sm:px-7 lg:px-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Live Staff Analytics
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Early-Comer Leaderboard
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Real-time visibility into staff arrival consistency,
                  punctuality and early check-in performance.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Target arrival
                  </span>

                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-300" />
                    <input
                      type="time"
                      value={targetTime}
                      onChange={(event) =>
                        setTargetTime(event.target.value)
                      }
                      className="bg-transparent text-sm font-bold text-white outline-none [color-scheme:dark]"
                    />
                  </div>
                </label>

                <button
                  type="button"
                  onClick={() => void loadData()}
                  disabled={refreshing}
                  className="inline-flex h-[58px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white px-4 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRange(key)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      range === key
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {RANGE_LABELS[key]}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <CalendarDays className="h-4 w-4" />
                {RANGE_DESCRIPTIONS[range]}
                <span className="text-slate-300">•</span>
                Target: {formatClock(targetMinutes)}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mx-4 mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:mx-7">
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-7 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Ranked Staff
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {uniqueStaff}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">
                Staff with recorded clock-ins
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Early Clock-ins
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {earlyClockIns}
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">
                {earlyRate}% of recorded arrivals
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Avg. Early Arrival
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {formatEarly(averageEarly)}
                  </p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                  <Clock3 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">
                Across all recorded staff
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Clock-in Records
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {filteredAttendance.length}
                  </p>
                </div>
                <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">
                {RANGE_LABELS[range]} activity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 px-4 pb-5 sm:px-7 xl:grid-cols-[1.4fr_0.9fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <h2 className="text-lg font-black text-slate-900">
                      Top Early Comers
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Leading staff based on early arrival and consistency.
                  </p>
                </div>

                <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">
                  {RANGE_LABELS[range]}
                </span>
              </div>

              {loading ? (
                <div className="flex min-h-[260px] items-center justify-center">
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Loading analytics...
                  </div>
                </div>
              ) : topThree.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl bg-slate-50 text-center">
                  <Award className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-bold text-slate-700">
                    No clock-in data yet
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Staff clock-ins will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {topThree.map((row) => (
                    <div
                      key={row.staffId}
                      className={`relative overflow-hidden rounded-2xl border p-4 ${
                        row.rank === 1
                          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
                          : row.rank === 2
                            ? "border-slate-200 bg-gradient-to-br from-slate-50 to-white"
                            : "border-orange-200 bg-gradient-to-br from-orange-50 to-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-black ring-4 ${getAvatarClass(
                            row.rank,
                          )}`}
                        >
                          {getInitials(row.staffName)}
                        </div>

                        <div
                          className={`rounded-lg border px-2.5 py-1 text-xs font-black ${getRankBadgeClass(
                            row.rank,
                          )}`}
                        >
                          #{row.rank}
                        </div>
                      </div>

                      <p className="mt-4 truncate text-base font-black text-slate-900">
                        {row.staffName}
                      </p>

                      <p className="mt-1 truncate text-xs font-medium text-slate-500">
                        {row.department}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/80 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Avg Arrival
                          </p>
                          <p className="mt-1 text-lg font-black text-slate-900">
                            {formatClock(row.averageArrival)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/80 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Score
                          </p>
                          <p
                            className={`mt-1 text-lg font-black ${getScoreClass(
                              row.score,
                            )}`}
                          >
                            {row.score}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500">
                          {row.earlyDays} early day
                          {row.earlyDays === 1 ? "" : "s"}
                        </span>
                        <span className="font-bold text-emerald-600">
                          {formatEarly(row.averageEarly)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <h2 className="text-lg font-black text-slate-900">
                    Arrival Activity
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Recent clock-in volume for the selected period.
                </p>
              </div>

              {trendData.length === 0 ? (
                <div className="flex h-[230px] items-center justify-center rounded-2xl bg-slate-50 text-sm font-medium text-slate-500">
                  No activity available.
                </div>
              ) : (
                <div className="space-y-4">
                  {trendData.map((item) => (
                    <div key={item.date}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">
                          {getWeekdayLabel(item.date)}
                          <span className="ml-1 font-medium text-slate-400">
                            {item.date}
                          </span>
                        </span>

                        <span className="font-black text-slate-700">
                          {item.early}/{item.count} early
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900 transition-all"
                          style={{
                            width: `${Math.max(
                              4,
                              (item.count / maxTrendCount) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="mx-4 mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:mx-7">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Full Leaderboard
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ranked by average early arrival, then consistency.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                <Target className="h-4 w-4" />
                Target {formatClock(targetMinutes)}
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-10 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-bold text-slate-700">
                  No staff ranking available
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Staff attendance records will populate this leaderboard.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-left">
                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Rank
                        </th>
                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Staff
                        </th>
                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Department
                        </th>
                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Avg. Arrival
                        </th>
                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Avg. Early
                        </th>
                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Days Early
                        </th>
                        <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Consistency
                        </th>
                        <th className="px-5 py-3 text-right text-[11px] font-black uppercase tracking-wider text-slate-400">
                          Score
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {leaderboard.map((row) => (
                        <tr
                          key={row.staffId}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex min-w-9 items-center justify-center rounded-lg border px-2 py-1.5 text-xs font-black ${getRankBadgeClass(
                                row.rank,
                              )}`}
                            >
                              #{row.rank}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ring-2 ${getAvatarClass(
                                  row.rank,
                                )}`}
                              >
                                {getInitials(row.staffName)}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-900">
                                  {row.staffName}
                                </p>
                                <p className="truncate text-xs font-medium text-slate-400">
                                  {row.employeeNumber}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                            {row.department}
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-black text-slate-900">
                              {formatClock(row.averageArrival)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700">
                              {formatEarly(row.averageEarly)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-black text-slate-800">
                              {row.earlyDays}
                            </span>
                            <span className="ml-1 text-xs font-medium text-slate-400">
                              / {row.days}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      row.consistency,
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-600">
                                {Math.round(row.consistency)}%
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span
                              className={`text-lg font-black ${getScoreClass(
                                row.score,
                              )}`}
                            >
                              {row.score}
                            </span>
                            <span className="ml-1 text-xs font-semibold text-slate-400">
                              /100
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 md:hidden">
                  {leaderboard.map((row) => (
                    <div key={row.staffId} className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-xs font-black ${getRankBadgeClass(
                            row.rank,
                          )}`}
                        >
                          #{row.rank}
                        </div>

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ring-2 ${getAvatarClass(
                            row.rank,
                          )}`}
                        >
                          {getInitials(row.staffName)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-900">
                                {row.staffName}
                              </p>
                              <p className="mt-0.5 truncate text-xs font-medium text-slate-400">
                                {row.department}
                              </p>
                            </div>

                            <div className="text-right">
                              <p
                                className={`text-lg font-black ${getScoreClass(
                                  row.score,
                                )}`}
                              >
                                {row.score}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Score
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-xl bg-slate-50 p-2.5">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                Avg
                              </p>
                              <p className="mt-1 text-sm font-black text-slate-800">
                                {formatClock(row.averageArrival)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-emerald-50 p-2.5">
                              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
                                Early
                              </p>
                              <p className="mt-1 text-sm font-black text-emerald-700">
                                {formatEarly(row.averageEarly)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-2.5">
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                Days
                              </p>
                              <p className="mt-1 text-sm font-black text-slate-800">
                                {row.earlyDays}/{row.days}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Consistency
                              </span>
                              <span className="text-xs font-black text-slate-600">
                                {Math.round(row.consistency)}%
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    row.consistency,
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <div className="px-4 pb-7 sm:px-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              <span className="font-bold text-slate-700">
                Analytics note:
              </span>{" "}
              Score is calculated from two existing attendance signals:
              average minutes before the selected target arrival time and
              the percentage of recorded days arriving before that target.
              No attendance records are modified by this page.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
