"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Leave = {
  id: number;
  staff_id: number;
  school_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  admin_remarks: string | null;
};

type Staff = {
  id: number;
  first_name: string;
  last_name: string;
  employee_number: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api/v1";

export default function StaffLeavePage() {
  const params = useParams();
  const schoolId = params.schoolId as string;

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(
    null
  );
  const [reviewStatus, setReviewStatus] = useState("APPROVED");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const getToken = () => {
    if (typeof window === "undefined") return null;

    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token")
    );
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const token = getToken();

      const headers: HeadersInit = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const [leaveResponse, staffResponse] = await Promise.all([
        fetch(`${API_URL}/staff/leave`, { headers }),
        fetch(`${API_URL}/staff`, { headers }),
      ]);

      if (!leaveResponse.ok) {
        throw new Error("Failed to load leave requests.");
      }

      const leaveData: Leave[] = await leaveResponse.json();

      const staffData: Staff[] = staffResponse.ok
        ? await staffResponse.json()
        : [];

      setLeaves(
        leaveData.filter(
          (leave) =>
            String(leave.school_id) === String(schoolId)
        )
      );

      setStaff(staffData);
    } catch (error) {
      console.error(error);
      alert("Unable to load staff leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const getStaffName = (staffId: number) => {
    const member = staff.find((item) => item.id === staffId);

    if (!member) {
      return `Staff #${staffId}`;
    }

    return (
      `${member.first_name} ${member.last_name}`.trim() ||
      member.employee_number ||
      `Staff #${staffId}`
    );
  };

  const openReview = (leave: Leave) => {
    setSelectedLeave(leave);
    setReviewStatus(
      leave.status.toUpperCase() === "REJECTED"
        ? "REJECTED"
        : leave.status.toUpperCase() === "APPROVED"
          ? "APPROVED"
          : "APPROVED"
    );
    setAdminRemarks(leave.admin_remarks || "");
  };

  const submitReview = async () => {
    if (!selectedLeave) return;

    try {
      setSaving(true);

      const token = getToken();

      const response = await fetch(
        `${API_URL}/staff/leave/${selectedLeave.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          body: JSON.stringify({
            status: reviewStatus,
            admin_remarks: adminRemarks.trim() || null,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to update leave request."
        );
      }

      setSelectedLeave(null);
      setAdminRemarks("");

      await loadData();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to update leave request."
      );
    } finally {
      setSaving(false);
    }
  };

  const statusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-700";

      case "REJECTED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const pendingCount = leaves.filter(
    (leave) => leave.status.toUpperCase() === "PENDING"
  ).length;

  const approvedCount = leaves.filter(
    (leave) => leave.status.toUpperCase() === "APPROVED"
  ).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Staff Leave
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review and manage staff leave requests.
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href={`/dashboard/schools/${schoolId}/staff`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Staff
            </a>

            <a
              href={`/dashboard/schools/${schoolId}/staff/attendance`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Attendance
            </a>

            <button
              onClick={loadData}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Total Requests
          </p>

          <p className="mt-2 text-2xl font-bold">
            {leaves.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Pending
          </p>

          <p className="mt-2 text-2xl font-bold text-yellow-600">
            {pendingCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">
            Approved
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {approvedCount}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading leave requests...
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No staff leave requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Staff
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Leave Type
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Start Date
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    End Date
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Reason
                  </th>

                  <th className="px-5 py-4 text-left text-sm font-semibold">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {leaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-medium">
                      {getStaffName(leave.staff_id)}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {leave.leave_type}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {leave.start_date}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {leave.end_date}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                      {leave.reason || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          leave.status
                        )}`}
                      >
                        {leave.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openReview(leave)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Review Leave Request
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {getStaffName(selectedLeave.staff_id)}
                </p>
              </div>

              <button
                onClick={() => setSelectedLeave(null)}
                className="text-2xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <div className="mb-5 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
              <p>
                <strong>Leave Type:</strong>{" "}
                {selectedLeave.leave_type}
              </p>

              <p>
                <strong>Start:</strong>{" "}
                {selectedLeave.start_date}
              </p>

              <p>
                <strong>End:</strong>{" "}
                {selectedLeave.end_date}
              </p>

              <p>
                <strong>Reason:</strong>{" "}
                {selectedLeave.reason || "—"}
              </p>
            </div>

            <label className="mb-2 block text-sm font-medium">
              Decision
            </label>

            <select
              value={reviewStatus}
              onChange={(event) =>
                setReviewStatus(event.target.value)
              }
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
              <option value="PENDING">Keep Pending</option>
            </select>

            <label className="mb-2 block text-sm font-medium">
              Admin Remarks
            </label>

            <textarea
              value={adminRemarks}
              onChange={(event) =>
                setAdminRemarks(event.target.value)
              }
              rows={4}
              placeholder="Add remarks..."
              className="mb-5 w-full rounded-lg border border-slate-300 px-3 py-2"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedLeave(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                onClick={submitReview}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
