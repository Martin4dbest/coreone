"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Users, X } from "lucide-react";
import api from "@/lib/api";

type Teacher = {
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

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    employee_number: "",
    email: "",
    password: "",
  });

  const loadTeachers = useCallback(async () => {
    try {
      setError("");

      const response = await api.get<Teacher[]>("/teachers", {
        params: { school_id: Number(schoolId) },
      });

      setTeachers(response.data);
    } catch (error) {
      console.error("Failed to load teachers:", error);
      setError("Unable to load teachers.");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  function updateForm(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function createTeacher(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setFormError("");

      await api.post("/teachers", {
        school_id: Number(schoolId),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        employee_number: form.employee_number.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      setForm({
        first_name: "",
        last_name: "",
        employee_number: "",
        email: "",
        password: "",
      });

      setShowForm(false);
      setLoading(true);
      await loadTeachers();
    } catch (error: any) {
      console.error("Failed to create teacher:", error);

      setFormError(
        error.response?.data?.detail ||
          "Unable to create teacher."
      );
    } finally {
      setSubmitting(false);
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

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Users size={24} />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Teachers
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage teaching staff and teacher records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((current) => !current);
            setFormError("");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancel" : "Add Teacher"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={createTeacher}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Add New Teacher
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a teacher account for this school.
            </p>
          </div>

          {formError && (
            <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {formError}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                First Name
              </span>
              <input
                required
                name="first_name"
                value={form.first_name}
                onChange={updateForm}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Last Name
              </span>
              <input
                required
                name="last_name"
                value={form.last_name}
                onChange={updateForm}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Employee Number
              </span>
              <input
                required
                name="employee_number"
                value={form.employee_number}
                onChange={updateForm}
                placeholder="e.g. TCH-001"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Email Address
              </span>
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={updateForm}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Temporary Password
              </span>
              <input
                required
                type="password"
                name="password"
                value={form.password}
                onChange={updateForm}
                minLength={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && (
                <Loader2 size={17} className="animate-spin" />
              )}
              {submitting ? "Creating..." : "Create Teacher"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="font-bold text-slate-900">
              Teacher Directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {teachers.length} teacher
              {teachers.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2
              size={24}
              className="animate-spin text-rose-500"
            />
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-red-500">
            {error}
          </div>
        ) : teachers.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No teachers have been added to this school yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4">Teacher</th>
                  <th className="px-6 py-4">
                    Employee Number
                  </th>
                </tr>
              </thead>

              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {teacher.first_name} {teacher.last_name}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {teacher.employee_number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
