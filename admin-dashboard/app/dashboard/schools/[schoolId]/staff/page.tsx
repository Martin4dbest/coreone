"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  UserRound,
  Plus,
  X,
  UserPlus,
} from "lucide-react";
import api from "@/lib/api";

type Staff = {
  id: number;
  user_id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
};

export default function Page({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    employee_number: "",
    email: "",
    password: "",
  });

  async function loadStaff() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<Staff[]>("/staff");
      setStaff(response.data);
    } catch (error) {
      console.error("Failed to load staff:", error);
      setError("Unable to load staff.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm({
      first_name: "",
      last_name: "",
      employee_number: "",
      email: "",
      password: "",
    });
    setFormError("");
  }

  async function handleCreateStaff(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");

    if (
      !form.first_name.trim() ||
      !form.last_name.trim() ||
      !form.employee_number.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setFormError("Please fill in all fields.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/staff", {
        school_id: Number(schoolId),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        employee_number: form.employee_number.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      resetForm();
      setShowAddForm(false);

      await loadStaff();
    } catch (error: any) {
      console.error("Failed to create staff:", error);

      const message =
        error?.response?.data?.detail ||
        "Unable to create staff account.";

      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

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
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
              <UserRound size={26} />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-slate-900">
              Staff
            </h1>

            <p className="mt-3 text-sm text-slate-500">
              Manage administrative and non-teaching personnel.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setShowAddForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-600"
          >
            <Plus size={18} />
            Add Staff
          </button>
        </div>
      </section>

      {showAddForm && (
        <section className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-rose-500" />
                <h2 className="text-xl font-bold text-slate-900">
                  Add Staff Member
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Create the staff profile and login account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddForm(false);
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleCreateStaff}
            className="mt-6 space-y-5"
          >
            {formError && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) =>
                    updateField("first_name", e.target.value)
                  }
                  placeholder="e.g. John"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) =>
                    updateField("last_name", e.target.value)
                  }
                  placeholder="e.g. Doe"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Employee Number
                </label>
                <input
                  type="text"
                  value={form.employee_number}
                  onChange={(e) =>
                    updateField(
                      "employee_number",
                      e.target.value
                    )
                  }
                  placeholder="e.g. STF001"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Staff Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField("email", e.target.value)
                  }
                  placeholder="staff@school.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Login Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    updateField("password", e.target.value)
                  }
                  placeholder="Create a temporary password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
                <p className="mt-2 text-xs text-slate-400">
                  The staff member will use this password with
                  their school code to log in.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}
                {saving ? "Creating..." : "Create Staff"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Staff Directory
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {staff.length} staff member
            {staff.length === 1 ? "" : "s"} found
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2
              className="animate-spin text-rose-500"
              size={28}
            />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : staff.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
            No staff members have been added to this school yet.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-4 py-3 font-semibold">
                    Staff Member
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Employee Number
                  </th>
                </tr>
              </thead>

              <tbody>
                {staff.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {member.first_name} {member.last_name}
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {member.employee_number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
