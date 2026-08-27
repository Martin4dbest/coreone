"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Download,
  FileText,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useParams } from "next/navigation";

import api from "@/lib/api";
import { useTenant } from "@/context/TenantContext";

interface DistributionRecord {
  id: number;
  distribution_id: number;
  record_type?: "student" | "class";
  student_id?: number | null;
  student_name: string;
  admission_number?: string | null;
  book_id: number;
  book_name: string;
  classroom_id?: number | null;
  class_name: string;
  quantity_issued: number;
  student_count?: number | null;
  date_received: string;
  issued_by?: number | null;
  issued_by_name: string;
  notes?: string | null;
}

const FALLBACK_PRIMARY = "#2563eb";
const FALLBACK_SECONDARY = "#0f172a";

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SchoolBookDistributionRecordsPage() {
  const params = useParams();
  const schoolId = Number(params.schoolId);

  const { tenant } = useTenant();

  const primary =
    tenant?.primary_color || FALLBACK_PRIMARY;

  const secondary =
    tenant?.secondary_color || FALLBACK_SECONDARY;

  const [records, setRecords] = useState<
    DistributionRecord[]
  >([]);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecords() {
    if (!schoolId) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/school-books/${schoolId}/distribution-records`
      );

      setRecords(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      console.error(
        "Failed to load book distribution records:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load book distribution records."
      );

      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [schoolId]);

  const classOptions = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((record) => record.class_name)
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [records]);

  const accountOptions = useMemo(() => {
    return Array.from(
      new Set(
        records
          .map((record) => record.issued_by_name)
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [records]);

  const filteredRecords = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !term ||
        [
          record.student_name,
          record.admission_number,
          record.book_name,
          record.class_name,
          record.issued_by_name,
          record.record_type === "class"
            ? "historical class record"
            : "student record",
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(term)
          );

      const matchesClass =
        !classFilter ||
        record.class_name === classFilter;

      const matchesAccount =
        !accountFilter ||
        record.issued_by_name === accountFilter;

      const matchesDate =
        !dateFilter ||
        String(record.date_received).slice(
          0,
          10
        ) === dateFilter;

      return (
        matchesSearch &&
        matchesClass &&
        matchesAccount &&
        matchesDate
      );
    });
  }, [
    records,
    search,
    classFilter,
    accountFilter,
    dateFilter,
  ]);

  const totalBooks = filteredRecords.reduce(
    (sum, record) =>
      sum + Number(record.quantity_issued || 0),
    0
  );

  const uniqueStudents = new Set(
    filteredRecords
      .filter(
        (record) =>
          record.record_type === "student" &&
          record.student_id != null
      )
      .map(
        (record) => record.student_id
      )
  ).size;

  const classLevelRecords = filteredRecords.filter(
    (record) => record.record_type === "class"
  ).length;

  function exportCsv() {
    const headers = [
      "Student",
      "Admission Number",
      "Book",
      "Class",
      "Quantity",
      "Date Received",
      "Issued By",
    ];

    const rows = filteredRecords.map(
      (record) => [
        record.student_name,
        record.admission_number || "",
        record.book_name,
        record.class_name,
        String(record.quantity_issued),
        formatDateTime(record.date_received),
        record.issued_by_name,
      ]
    );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const safe = String(value ?? "")
              .replace(/"/g, '""');

            return `"${safe}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF", csv],
      { type: "text/csv;charset=utf-8;" }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "school-book-distribution-records.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    // Give the browser time to start consuming the Blob
    // before releasing the object URL.
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  return (
    <div
      className="min-h-screen bg-[#f6f8fc] px-4 py-6 text-slate-900 sm:px-6 lg:px-8"
      style={
        {
          "--tenant-primary": primary,
          "--tenant-secondary": secondary,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-[1500px] space-y-6">

        <Link
          href={`/dashboard/schools/${schoolId}/school-books`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[var(--tenant-primary)]"
        >
          <ArrowLeft size={17} />
          Back to School Books
        </Link>

        <header
          className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-2xl sm:p-8"
          style={{
            background:
              `linear-gradient(135deg, ${primary}, ${secondary})`,
          }}
        >
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <FileText size={25} />
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                Book Distribution Records
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
                Complete history of physical school books
                distributed to students, including the
                student, class, date received and account
                that issued the book.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadRecords}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={exportCsv}
                disabled={
                  filteredRecords.length === 0
                }
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: primary }}
              >
                <Download size={17} />
                Export CSV
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className="rounded-xl p-3"
                style={{
                  backgroundColor: `${primary}15`,
                  color: primary,
                }}
              >
                <BookOpen size={20} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Books Distributed
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {totalBooks}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-50 p-3 text-sky-600">
                <Users size={20} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Students Served
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {uniqueStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CalendarDays size={20} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Records
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {filteredRecords.length}
                </p>

                {classLevelRecords > 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    {classLevelRecords} historical class-level record
                    {classLevelRecords === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Distribution History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Every student allocation is preserved
                  for school accountability.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative lg:w-72">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search student, book..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--tenant-primary)] focus:ring-4 focus:ring-[var(--tenant-primary)]/10"
                  />
                </div>

                <select
                  value={classFilter}
                  onChange={(event) =>
                    setClassFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary)]"
                >
                  <option value="">
                    All Classes
                  </option>

                  {classOptions.map((value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  ))}
                </select>

                <select
                  value={accountFilter}
                  onChange={(event) =>
                    setAccountFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary)]"
                >
                  <option value="">
                    All Issuing Accounts
                  </option>

                  {accountOptions.map((value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) =>
                    setDateFilter(
                      event.target.value
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary)]"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <RefreshCw
                  className="mx-auto animate-spin text-slate-400"
                  size={30}
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading distribution records...
                </p>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <div
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: `${primary}12`,
                  color: primary,
                }}
              >
                <BookOpen size={30} />
              </div>

              <h3 className="mt-4 text-base font-bold text-slate-900">
                No distribution records found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                No student book distributions match
                the current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">
                      Student
                    </th>

                    <th className="px-5 py-4">
                      Book
                    </th>

                    <th className="px-5 py-4">
                      Class
                    </th>

                    <th className="px-5 py-4">
                      Quantity
                    </th>

                    <th className="px-5 py-4">
                      Date Received
                    </th>

                    <th className="px-5 py-4">
                      Issued By
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <div>
                          {record.record_type === "class" ? (
                            <>
                              <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                                Historical Class Record
                              </span>

                              <p className="mt-2 font-semibold text-slate-800">
                                Student details not captured
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {record.student_count || 0} student
                                {(record.student_count || 0) === 1
                                  ? ""
                                  : "s"} recorded
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-slate-900">
                                {record.student_name}
                              </p>

                              {record.admission_number && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {record.admission_number}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="rounded-xl p-2"
                            style={{
                              backgroundColor:
                                `${primary}12`,
                              color: primary,
                            }}
                          >
                            <BookOpen
                              size={17}
                            />
                          </div>

                          <span className="font-semibold text-slate-800">
                            {record.book_name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-600">
                        {record.class_name}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="inline-flex rounded-full px-3 py-1 text-xs font-bold"
                          style={{
                            backgroundColor:
                              `${primary}12`,
                            color: primary,
                          }}
                        >
                          {record.quantity_issued}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CalendarDays
                            size={15}
                            className="text-slate-400"
                          />

                          <span>
                            {formatDate(
                              record.date_received
                            )}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDateTime(
                            record.date_received
                          )}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {record.issued_by_name}
                        </p>

                        {record.issued_by && (
                          <p className="mt-1 text-xs text-slate-400">
                            Account #{record.issued_by}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
