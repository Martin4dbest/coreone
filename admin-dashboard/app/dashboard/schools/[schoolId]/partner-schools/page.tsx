"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  Handshake,
  Loader2,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

import api from "@/lib/api";

type PartnerSchool = {
  id: number;
  school_id: number;
  name: string;
  is_active: boolean;
};

type Student = {
  id: number;
  school_id: number;
  classroom_id?: number | null;
  class_id?: number | null;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  gender?: string;
  is_active: boolean;
};

type Classroom = {
  id: number;
  name: string;
};

export default function PartnerSchoolsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const selectedSchoolId = Number(schoolId);

  const [partnerSchools, setPartnerSchools] = useState<PartnerSchool[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedPartner, setSelectedPartner] =
    useState<PartnerSchool | null>(null);

  const [associatedIds, setAssociatedIds] = useState<number[]>([]);

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState("");

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      const [
        partnerResponse,
        studentsResponse,
        classesResponse,
      ] = await Promise.all([
        api.get<PartnerSchool[]>(
          `/partner-schools/${selectedSchoolId}`
        ),
        api.get<Student[]>("/students/"),
        api.get<Classroom[]>("/classes/"),
      ]);

      setPartnerSchools(partnerResponse.data);

      setStudents(
        studentsResponse.data.filter(
          (student) =>
            student.school_id === selectedSchoolId
        )
      );

      setClasses(
        classesResponse.data.filter(
          (item: any) =>
            item.school_id === selectedSchoolId
        )
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Unable to load Partner Schools."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAssociations(
    partnerSchoolId: number
  ) {
    try {
      setLoadingStudents(true);

      const response = await api.get(
        `/partner-schools/${selectedSchoolId}/${partnerSchoolId}/students`
      );

      setAssociatedIds(
        response.data.map(
          (item: { student_id: number }) =>
            item.student_id
        )
      );
    } catch (err) {
      console.error(err);
      setAssociatedIds([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, [selectedSchoolId]);

  async function createPartnerSchool() {
    const cleanName = name.trim();

    if (!cleanName) return;

    try {
      setSaving(true);
      setError("");

      const response =
        await api.post<PartnerSchool>(
          `/partner-schools/${selectedSchoolId}`,
          {
            name: cleanName,
          }
        );

      setPartnerSchools((current) => [
        ...current,
        response.data,
      ]);

      setName("");
      setSelectedPartner(response.data);
      await loadAssociations(response.data.id);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to create Partner School."
      );
    } finally {
      setSaving(false);
    }
  }

  async function associateStudents() {
    if (!selectedPartner || selectedIds.length === 0) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.put(
        `/partner-schools/${selectedSchoolId}/${selectedPartner.id}/students`,
        {
          student_ids: selectedIds,
        }
      );

      await loadAssociations(selectedPartner.id);

      setSelectedIds([]);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to associate students."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const classId =
        student.class_id ??
        student.classroom_id;

      if (
        classFilter &&
        String(classId) !== classFilter
      ) {
        return false;
      }

      if (!query) return true;

      const fullName =
        `${student.first_name} ${
          student.middle_name || ""
        } ${student.last_name}`.toLowerCase();

      return (
        fullName.includes(query) ||
        student.admission_number
          .toLowerCase()
          .includes(query)
      );
    });
  }, [
    students,
    search,
    classFilter,
  ]);

  function toggleStudent(studentId: number) {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  }

  function selectAllVisible() {
    const visibleIds = filteredStudents
      .map((student) => student.id)
      .filter(
        (id) => !associatedIds.includes(id)
      );

    setSelectedIds(visibleIds);
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2
          size={30}
          className="animate-spin text-rose-500"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50 p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-500">
              <Handshake size={17} />
              Partner Schools
            </div>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Partner School Associations
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Create partner schools and associate
              students without changing their normal
              school ownership.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-400">
              Partner Schools
            </p>
            <p className="mt-1 text-2xl font-bold text-rose-500">
              {partnerSchools.length}
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Enter partner school name"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-rose-400"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                createPartnerSchool();
              }
            }}
          />

          <button
            type="button"
            onClick={createPartnerSchool}
            disabled={
              saving || !name.trim()
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-50"
          >
            {saving ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Plus size={17} />
            )}
            Add Partner School
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {partnerSchools.map((partner) => (
          <button
            key={partner.id}
            type="button"
            onClick={() => {
              setSelectedPartner(partner);
              setSelectedIds([]);
              loadAssociations(partner.id);
            }}
            className={`rounded-2xl border p-5 text-left transition ${
              selectedPartner?.id === partner.id
                ? "border-rose-400 bg-rose-50"
                : "border-slate-200 bg-white hover:border-rose-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <Handshake size={21} />
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                  partner.is_active
                    ? "bg-green-100 text-green-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {partner.is_active
                  ? "ACTIVE"
                  : "INACTIVE"}
              </span>
            </div>

            <h2 className="mt-4 font-bold text-slate-900">
              {partner.name}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Click to manage student associations
            </p>
          </button>
        ))}
      </section>

      {selectedPartner && (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-rose-500">
                  Associate Students
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {selectedPartner.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPartner(null);
                  setSelectedIds([]);
                }}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search student name or admission number"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-rose-400"
                />
              </div>

              <select
                value={classFilter}
                onChange={(event) =>
                  setClassFilter(event.target.value)
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-400"
              >
                <option value="">
                  All Classes
                </option>

                {classes.map((classroom) => (
                  <option
                    key={classroom.id}
                    value={classroom.id}
                  >
                    {classroom.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={selectAllVisible}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Select Visible
              </button>
            </div>
          </div>

          <div className="max-h-[500px] overflow-auto">
            {loadingStudents ? (
              <div className="flex justify-center p-10">
                <Loader2
                  className="animate-spin text-rose-500"
                  size={28}
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const associated =
                    associatedIds.includes(
                      student.id
                    );

                  const selected =
                    selectedIds.includes(
                      student.id
                    );

                  return (
                    <label
                      key={student.id}
                      className={`flex cursor-pointer items-center gap-4 px-6 py-4 transition ${
                        associated
                          ? "bg-green-50/50"
                          : selected
                            ? "bg-rose-50"
                            : "hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={
                          associated || selected
                        }
                        disabled={associated}
                        onChange={() =>
                          toggleStudent(
                            student.id
                          )
                        }
                        className="h-5 w-5 accent-rose-500"
                      />

                      <div className="flex-1">
                        <p className="font-bold text-slate-900">
                          {student.first_name}{" "}
                          {student.middle_name
                            ? `${student.middle_name} `
                            : ""}
                          {student.last_name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {student.admission_number}
                        </p>
                      </div>

                      {associated && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-bold text-green-600">
                          ASSOCIATED
                        </span>
                      )}
                    </label>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <div className="p-10 text-center text-sm text-slate-400">
                    No students found.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 p-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users size={17} />
              <span>
                {selectedIds.length} student
                {selectedIds.length === 1
                  ? ""
                  : "s"} selected
              </span>
            </div>

            <button
              type="button"
              onClick={associateStudents}
              disabled={
                saving ||
                selectedIds.length === 0
              }
              className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-50"
            >
              {saving
                ? "Associating..."
                : "Associate Selected Students"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
