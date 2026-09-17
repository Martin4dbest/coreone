"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  Clock3,
  Loader2,
  Save,
  UserRound,
  X,
} from "lucide-react";
import api from "@/lib/api";

type Staff = {
  id: number;
  user_id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
};

type Attendance = {
  id: number;
  staff_id: number;
  school_id: number;
  attendance_date: string;
  status: string;
  remarks: string | null;
};

const STATUS_OPTIONS = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
];

export default function Page({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [loading, setLoading] = useState(true);
  const [savingStaffId, setSavingStaffId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [records, setRecords] = useState<
    Record<number, { status: string; remarks: string }>
  >({});

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [staffResponse, attendanceResponse] = await Promise.all([
        api.get<Staff[]>("/staff"),
        api.get<Attendance[]>("/staff/attendance", {
          params: {
            attendance_date: selectedDate,
          },
        }),
      ]);

      const staffData = staffResponse.data;
      const attendanceData = attendanceResponse.data;

      setStaff(staffData);
      setAttendance(attendanceData);

      const nextRecords: Record<
        number,
        { status: string; remarks: string }
      > = {};

      for (const member of staffData) {
        const record = attendanceData.find(
          (item) => item.staff_id === member.id
        );

        nextRecords[member.id] = {
          status: record?.status?.toUpperCase() || "PRESENT",
          remarks: record?.remarks || "",
        };
      }

      setRecords(nextRecords);
    } catch (error) {
      console.error("Failed to load staff attendance:", error);
      setError("Unable to load staff attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  function updateRecord(
    staffId: number,
    field: "status" | "remarks",
    value: string
  ) {
    setRecords((current) => ({
      ...current,
      [staffId]: {
        ...(current[staffId] || {
          status: "PRESENT",
          remarks: "",
        }),
        [field]: value,
      },
    }));
  }

  async function saveAttendance(member: Staff) {
    const record = records[member.id] || {
      status: "PRESENT",
      remarks: "",
    };

    try {
      setSavingStaffId(member.id);

      const existing = attendance.find(
        (item) => item.staff_id === member.id
      );

      const payload = {
        status: record.status,
        remarks: record.remarks.trim() || null,
      };

      if (existing) {
        await api.patch(
          `/staff/attendance/${existing.id}`,
          payload
        );
      } else {
        await api.post("/staff/attendance", {
          staff_id: member.id,
          attendance_date: selectedDate,
          ...payload,
        });
      }

      await loadData();
    } catch (error) {
      console.error("Failed to save attendance:", error);
      alert("Unable to save attendance.");
    } finally {
      setSavingStaffId(null);
    }
  }

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "PRESENT":
        return "bg-green-100 text-green-700";
      case "ABSENT":
        return "bg-red-100 text-red-700";
      case "LATE":
        return "bg-yellow-100 text-yellow-700";
      case "EXCUSED":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const presentCount = staff.filter(
    (member) =>
      records[member.id]?.status?.toUpperCase() === "PRESENT"
  ).length;

  const absentCount = staff.filter(
    (member) =>
      records[member.id]?.status?.toUpperCase() === "ABSENT"
  ).length;

  const lateCount = staff.filter(
    (member) =>
      records[member.id]?.status?.toUpperCase() === "LATE"
  ).length;

  const excusedCount = staff.filter(
    (member) =>
      records[member.id]?.status?.toUpperCase() === "EXCUSED"
  ).length;

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/schools/${schoolId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500"
      >
        <ArrowLeft size={16} />
        Back to School Workspace
      </Link>

      <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 shadow-sm">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
              <CalendarCheck size={26} />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-slate-900">
              Staff Attendance
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Record and manage attendance for non-teaching personnel.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/schools/${schoolId}/staff`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Staff
            </Link>

            <Link
              href={`/dashboard/schools/${schoolId}/staff/attendance`}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Attendance
            </Link>

            <Link
              href={`/dashboard/schools/${schoolId}/staff/leave`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Leave
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Check className="text-green-600" size={20} />
            <div>
              <p className="text-sm text-slate-500">Present</p>
              <p className="text-2xl font-bold text-slate-900">
                {presentCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <X className="text-red-600" size={20} />
            <div>
              <p className="text-sm text-slate-500">Absent</p>
              <p className="text-2xl font-bold text-slate-900">
                {absentCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock3 className="text-yellow-600" size={20} />
            <div>
              <p className="text-sm text-slate-500">Late</p>
              <p className="text-2xl font-bold text-slate-900">
                {lateCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <UserRound className="text-blue-600" size={20} />
            <div>
              <p className="text-sm text-slate-500">Excused</p>
              <p className="text-2xl font-bold text-slate-900">
                {excusedCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Daily Attendance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a date and record attendance for each staff member.
            </p>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {error && (
          <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-rose-500" size={28} />
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center">
            <UserRound
              size={40}
              className="mx-auto text-slate-300"
            />
            <p className="mt-3 font-semibold text-slate-700">
              No staff members found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Staff
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Employee No.
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Remarks
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {staff.map((member) => {
                  const record = records[member.id] || {
                    status: "PRESENT",
                    remarks: "",
                  };

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-slate-500">
                          {member.email}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {member.employee_number}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() =>
                                updateRecord(
                                  member.id,
                                  "status",
                                  status
                                )
                              }
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                                record.status === status
                                  ? getStatusClass(status)
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={record.remarks}
                          onChange={(event) =>
                            updateRecord(
                              member.id,
                              "remarks",
                              event.target.value
                            )
                          }
                          placeholder="Optional remarks"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-400"
                        />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => saveAttendance(member)}
                          disabled={savingStaffId === member.id}
                          className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingStaffId === member.id ? (
                            <Loader2
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Save size={16} />
                          )}
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
