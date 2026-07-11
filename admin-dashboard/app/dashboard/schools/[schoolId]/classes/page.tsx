"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  Plus,
  Power,
  X,
} from "lucide-react";

import api from "@/lib/api";

type Level = {
  id: number;
  school_id: number;
  name: string;
  is_active: boolean;
};

type Classroom = {
  id: number;
  school_id: number;
  level_id: number;
  name: string;
  is_active: boolean;
};

export default function ClassesPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);
  const numericSchoolId = Number(schoolId);

  const [levels, setLevels] = useState<Level[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);

  const [levelName, setLevelName] = useState("");
  const [className, setClassName] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadAcademicStructure() {
    try {
      setLoading(true);
      setError("");

      const [levelsResponse, classesResponse] = await Promise.all([
        api.get<Level[]>("/levels"),
        api.get<Classroom[]>("/classes"),
      ]);

      // SUPER_ADMIN APIs can return data from every school.
      // The active workspace must show only the selected school.
      setLevels(
        levelsResponse.data.filter(
          (level) => level.school_id === numericSchoolId
        )
      );

      setClasses(
        classesResponse.data.filter(
          (classroom) => classroom.school_id === numericSchoolId
        )
      );
    } catch (err) {
      console.error("Failed to load academic structure:", err);
      setError("Unable to load levels and classes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAcademicStructure();
  }, [numericSchoolId]);

  const levelNames = useMemo(() => {
    return new Map(
      levels.map((level) => [
        level.id,
        level.name,
      ])
    );
  }, [levels]);

  async function createLevel(event: FormEvent) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post<Level>(
        "/levels",
        {
          school_id: numericSchoolId,
          name: levelName.trim(),
        }
      );

      setLevels((current) => [
        ...current,
        response.data,
      ]);

      setLevelName("");
      setShowLevelModal(false);
    } catch (err) {
      console.error("Failed to create level:", err);
      setError("Unable to create level.");
    } finally {
      setSubmitting(false);
    }
  }

  async function createClass(event: FormEvent) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post<Classroom>(
        "/classes",
        {
          school_id: numericSchoolId,
          level_id: Number(selectedLevelId),
          name: className.trim(),
        }
      );

      setClasses((current) => [
        ...current,
        response.data,
      ]);

      setClassName("");
      setSelectedLevelId("");
      setShowClassModal(false);
    } catch (err) {
      console.error("Failed to create class:", err);
      setError("Unable to create class.");
    } finally {
      setSubmitting(false);
    }
  }

  
async function toggleClass(
  id: number,
  active: boolean
) {
  try {
    const action = active
      ? "deactivate"
      : "activate";

    const response = await api.patch(
      `/classes/${id}/${action}`
    );

    setClasses((current) =>
      current.map((item) =>
        item.id === id
          ? response.data
          : item
      )
    );

  } catch (error) {
    console.error(
      "Failed updating class status",
      error
    );
  }
}

return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-rose-500">
            <GraduationCap size={18} />
            Academic Structure
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Classes
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage the levels and classes belonging to this school.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowLevelModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-5 py-3 text-sm font-bold text-rose-500 transition hover:bg-rose-50"
          >
            <Plus size={18} />
            Add Level
          </button>

          <button
            type="button"
            onClick={() => setShowClassModal(true)}
            disabled={levels.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Add Class
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total Levels
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {levels.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Total Classes
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {classes.length}
          </p>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-100 bg-white">
          <Loader2
            size={30}
            className="animate-spin text-rose-500"
          />
        </div>
      ) : classes.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-white p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <BookOpen size={26} />
          </div>

          <h2 className="mt-4 font-bold text-slate-900">
            No classes created
          </h2>

          <p className="mt-2 max-w-md text-sm text-slate-500">
            Create this school's levels first, then add the classes used by the school.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Class
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Level
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Class ID
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {classes.map((classroom) => (
                  <tr
                    key={classroom.id}
                    className="transition hover:bg-rose-50/40"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {classroom.name}

<button
  onClick={() =>
    toggleClass(
      classroom.id,
      classroom.is_active
    )
  }
  className={
    classroom.is_active
      ? "ml-3 text-xs text-red-600"
      : "ml-3 text-xs text-green-600"
  }
>
  {classroom.is_active ? "Deactivate" : "Activate"}
</button>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {levelNames.get(classroom.level_id) ?? "Unknown level"}
                    </td>

                    <td className="px-6 py-4 text-right text-sm font-semibold text-rose-500">
                      {classroom.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showLevelModal && (
        <Modal
          title="Add Level"
          description="Create a level specifically for this school."
          onClose={() => setShowLevelModal(false)}
        >
          <form
            onSubmit={createLevel}
            className="space-y-5"
          >
            <input
              required
              value={levelName}
              onChange={(event) =>
                setLevelName(event.target.value)
              }
              placeholder="Example: JSS 1"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-400"
            />

            <FormActions
              submitting={submitting}
              onCancel={() => setShowLevelModal(false)}
              label="Create Level"
            />
          </form>
        </Modal>
      )}

      {showClassModal && (
        <Modal
          title="Add Class"
          description="Create a class under one of this school's levels."
          onClose={() => setShowClassModal(false)}
        >
          <form
            onSubmit={createClass}
            className="space-y-5"
          >
            <select
              required
              value={selectedLevelId}
              onChange={(event) =>
                setSelectedLevelId(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-rose-400"
            >
              <option value="">
                Select level
              </option>

              {levels.map((level) => (
                <option
                  key={level.id}
                  value={level.id}
                >
                  {level.name}
                </option>
              ))}
            </select>

            <input
              required
              value={className}
              onChange={(event) =>
                setClassName(event.target.value)
              }
              placeholder="Example: JSS 1 A"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-400"
            />

            <FormActions
              submitting={submitting}
              onCancel={() => setShowClassModal(false)}
              label="Create Class"
            />
          </form>
        </Modal>
      )}
    </div>
  );
}


function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-8">
          {children}
        </div>
      </div>
    </div>
  );
}


function FormActions({
  submitting,
  onCancel,
  label,
}: {
  submitting: boolean;
  onCancel: () => void;
  label: string;
}) {
  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {submitting && (
          <Loader2
            size={17}
            className="animate-spin"
          />
        )}

        {label}
      </button>
    </div>
  );
}
