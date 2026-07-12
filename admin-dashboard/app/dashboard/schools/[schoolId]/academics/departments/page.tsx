"use client";

import { FormEvent, use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import api from "@/lib/api";

type Department = {
  id: number;
  school_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
};

export default function DepartmentsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/departments", {
        params: {
          school_id: schoolId,
        },
      });

      setDepartments(response.data);
    } catch (err) {
      console.error("Failed loading departments:", err);
      setError("Unable to load departments.");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.post("/departments", {
        school_id: Number(schoolId),
        name: name.trim(),
        description: description.trim() || null,
      });

      setName("");
      setDescription("");
      setShowForm(false);

      await loadDepartments();
    } catch (err) {
      console.error("Failed creating department:", err);
      setError("Unable to create department.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">

      <Link
        href={`/dashboard/schools/${schoolId}/academics`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500"
      >
        <ArrowLeft size={16} />
        Back to Academics
      </Link>


      <section className="flex flex-col gap-6 rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 md:flex-row md:items-center md:justify-between">

        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
            <Building2 size={26} />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Departments
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Manage academic departments for this school.
          </p>
        </div>


        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-rose-500"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancel" : "Add Department"}
        </button>

      </section>


      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-white p-6 shadow-sm"
        >

          <h2 className="text-lg font-bold text-slate-900">
            Create Department
          </h2>


          <div className="mt-5 grid gap-5 md:grid-cols-2">

            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Department name"
              className="rounded-xl border px-4 py-3"
            />

            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="rounded-xl border px-4 py-3"
            />

          </div>


          <button
            disabled={saving}
            className="mt-5 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving && (
              <Loader2
                size={16}
                className="mr-2 inline animate-spin"
              />
            )}

            {saving ? "Creating..." : "Create Department"}

          </button>

        </form>
      )}


      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}


      <section className="rounded-2xl border bg-white p-6 shadow-sm">

        <h2 className="text-xl font-bold text-slate-900">
          School Departments
        </h2>


        {loading ? (

          <div className="py-10 text-slate-500">
            Loading departments...
          </div>

        ) : departments.length === 0 ? (

          <p className="py-10 text-sm text-slate-500">
            No departments created yet.
          </p>

        ) : (

          <div className="mt-5 space-y-3">

            {departments.map((department) => (

              <div
                key={department.id}
                className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >

                <div>

                  <p className="font-bold text-slate-900">
                    {department.name}
                  </p>

                  <p className="text-xs text-slate-400">
                    {department.description || "No description"}
                  </p>

                </div>


                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    department.is_active
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {department.is_active ? "Active" : "Inactive"}
                </span>

              </div>

            ))}

          </div>

        )}

      </section>


    </div>
  );
}
