"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  Award,
  Clock3,
  Medal,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";

import api from "@/lib/api";

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

type LeaderboardRow = {
  staffId: number;
  staffName: string;
  employeeNumber: string;
  days: number;
  averageMinutes: number;
  earliestMinutes: number;
  latestMinutes: number;
};

function getMinutes(value: string | null) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatted = new Intl.DateTimeFormat("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Lagos",
  }).format(date);

  const [hours, minutes] = formatted.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatMinutes(minutes: number) {
  const normalized = Math.round(minutes);
  const hours = Math.floor(normalized / 60) % 24;
  const mins = normalized % 60;

  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function rankRows(records: AttendanceItem[]) {
  const grouped = new Map<
    number,
    {
      staffName: string;
      employeeNumber: string;
      times: number[];
    }
  >();

  for (const record of records) {
    const minutes = getMinutes(record.check_in_at);

    if (minutes === null) continue;

    const existing = grouped.get(record.staff_id);

    if (existing) {
      existing.times.push(minutes);

      if (!existing.staffName && record.staff_name) {
        existing.staffName = record.staff_name;
      }

      if (!existing.employeeNumber && record.employee_number) {
        existing.employeeNumber = record.employee_number;
      }
    } else {
      grouped.set(record.staff_id, {
        staffName: record.staff_name || "Unknown Staff",
        employeeNumber: record.employee_number || "—",
        times: [minutes],
      });
    }
  }

  const rows: LeaderboardRow[] = [];

  for (const [staffId, value] of grouped.entries()) {
    if (!value.times.length) continue;

    const total = value.times.reduce(
      (sum, minutes) => sum + minutes,
      0,
    );

    rows.push({
      staffId,
      staffName: value.staffName,
      employeeNumber: value.employeeNumber,
      days: value.times.length,
      averageMinutes: total / value.times.length,
      earliestMinutes: Math.min(...value.times),
      latestMinutes: Math.max(...value.times),
    });
  }

  return rows.sort((a, b) => {
    if (a.averageMinutes !== b.averageMinutes) {
      return a.averageMinutes - b.averageMinutes;
    }

    return b.days - a.days;
  });
}

function getRankStyle(rank: number) {
  if (rank === 1) {
    return {
      wrapper:
        "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
      badge: "bg-amber-100 text-amber-700",
      icon: "text-amber-500",
    };
  }

  if (rank === 2) {
    return {
      wrapper:
        "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
      badge: "bg-slate-100 text-slate-700",
      icon: "text-slate-500",
    };
  }

  if (rank === 3) {
    return {
      wrapper:
        "border-orange-200 bg-gradient-to-br from-orange-50 to-white",
      badge: "bg-orange-100 text-orange-700",
      icon: "text-orange-500",
    };
  }

  return {
    wrapper: "border-slate-200 bg-white",
    badge: "bg-slate-100 text-slate-600",
    icon: "text-slate-400",
  };
}

export default function EarlyComersPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadLeaderboard = async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get<AttendanceItem[]>(
        `/staff/attendance/report?school_id=${schoolId}`,
      );

      setRecords(response.data || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (!background) {
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load the early-comer leaderboard.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();

    const interval = setInterval(() => {
      loadLeaderboard(true);
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const leaderboard = useMemo(
    () => rankRows(records),
    [records],
  );

  const topThree = leaderboard.slice(0, 3);

  const totalStaff = leaderboard.length;

  const totalClockIns = leaderboard.reduce(
    (sum, row) => sum + row.days,
    0,
  );

  const latestAttendanceDate = useMemo(() => {
    const dates = records
      .map((record) => record.attendance_date)
      .filter(Boolean)
      .sort();

    return dates.length ? dates[dates.length - 1] : null;
  }, [records]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-600">
              <Trophy className="h-4 w-4" />
              Staff Performance
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Early-Comer Leaderboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Staff ranked by their average clock-in time.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadLeaderboard(true)}
            disabled={refreshing}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {/* Live indicator */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            LIVE
          </span>

          <span>
            Updates automatically every 5 seconds.
          </span>

          {latestAttendanceDate && (
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
              Latest attendance:{" "}
              <strong className="text-slate-700">
                {formatDate(latestAttendanceDate)}
              </strong>
            </span>
          )}

          {lastUpdated && (
            <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
              Updated{" "}
              {lastUpdated.toLocaleTimeString("en-NG", {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>

            <p className="text-sm font-medium text-slate-500">
              Ranked Staff
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {totalStaff}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>

            <p className="text-sm font-medium text-slate-500">
              Clock-in Records
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {totalClockIns}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Clock3 className="h-5 w-5 text-emerald-600" />
            </div>

            <p className="text-sm font-medium text-slate-500">
              Current Leader
            </p>

            <p className="mt-1 truncate text-xl font-bold text-slate-900">
              {leaderboard[0]?.staffName || "—"}
            </p>

            {leaderboard[0] && (
              <p className="mt-1 text-sm text-emerald-600">
                Avg. {formatMinutes(leaderboard[0].averageMinutes)}
              </p>
            )}
          </div>
        </div>

        {/* Top 3 */}
        {!loading && topThree.length > 0 && (
          <section className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Top Early Comers
              </h2>
              <p className="text-sm text-slate-500">
                The staff members currently leading the leaderboard.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {topThree.map((person, index) => {
                const rank = index + 1;
                const style = getRankStyle(rank);

                return (
                  <div
                    key={person.staffId}
                    className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${style.wrapper}`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${style.badge}`}
                      >
                        {rank === 1 ? (
                          <Trophy className={`h-6 w-6 ${style.icon}`} />
                        ) : rank === 2 ? (
                          <Medal className={`h-6 w-6 ${style.icon}`} />
                        ) : (
                          <Award className={`h-6 w-6 ${style.icon}`} />
                        )}
                      </div>

                      <span className="text-2xl font-black text-slate-200">
                        #{rank}
                      </span>
                    </div>

                    <div className="mt-5">
                      <p className="truncate text-lg font-bold text-slate-900">
                        {person.staffName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {person.employeeNumber}
                      </p>
                    </div>

                    <div className="mt-5 flex items-end justify-between border-t border-slate-200/70 pt-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Average arrival
                        </p>

                        <p className="mt-1 text-2xl font-black text-slate-900">
                          {formatMinutes(person.averageMinutes)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-500">
                          Days
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-800">
                          {person.days}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Full leaderboard */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Full Leaderboard
              </h2>

              <p className="text-sm text-slate-500">
                Earlier average clock-in times appear higher.
              </p>
            </div>

            <div className="text-sm font-medium text-slate-500">
              {leaderboard.length} staff ranked
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <div className="text-center">
                <RefreshCw className="mx-auto h-7 w-7 animate-spin text-slate-400" />
                <p className="mt-3 text-sm text-slate-500">
                  Loading leaderboard...
                </p>
              </div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex min-h-[280px] items-center justify-center px-6 text-center">
              <div>
                <Trophy className="mx-auto h-10 w-10 text-slate-300" />

                <h3 className="mt-4 text-lg font-bold text-slate-700">
                  No clock-in records yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Staff will appear here automatically after they
                  clock in.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-4">Rank</th>
                      <th className="px-5 py-4">Staff</th>
                      <th className="px-5 py-4">Average Arrival</th>
                      <th className="px-5 py-4">Days</th>
                      <th className="px-5 py-4">Earliest</th>
                      <th className="px-5 py-4">Latest</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((person, index) => {
                      const rank = index + 1;
                      const isTopThree = rank <= 3;

                      return (
                        <tr
                          key={person.staffId}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                                isTopThree
                                  ? getRankStyle(rank).badge
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {rank}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">
                              {person.staffName}
                            </div>

                            <div className="mt-0.5 text-xs text-slate-500">
                              {person.employeeNumber}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                              {formatMinutes(
                                person.averageMinutes,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                            {person.days}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatMinutes(person.earliestMinutes)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatMinutes(person.latestMinutes)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="divide-y divide-slate-100 md:hidden">
                {leaderboard.map((person, index) => {
                  const rank = index + 1;

                  return (
                    <div
                      key={person.staffId}
                      className="flex items-center gap-3 p-4"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                          rank <= 3
                            ? getRankStyle(rank).badge
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {rank}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900">
                          {person.staffName}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {person.employeeNumber} · {person.days} days
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-emerald-700">
                          {formatMinutes(person.averageMinutes)}
                        </p>

                        <p className="text-[11px] text-slate-400">
                          average
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
