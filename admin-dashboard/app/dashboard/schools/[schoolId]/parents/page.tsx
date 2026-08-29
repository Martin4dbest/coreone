"use client";

import { use, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import api from "@/lib/api";

type Parent = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone: string;
};

type Student = {
  id: number;
  user_id: number;
  school_id: number;
  classroom_id?: number | null;
  class_id?: number | null;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
};

type Classroom = {
  id: number;
  school_id: number;
  name: string;
};

type ParentForm = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  student_id: string;
  relationship_type: string;
};

type LinkForm = {
  email: string;
  student_id: string;
  relationship_type: string;
};

const emptyParentForm: ParentForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  password: "",
  student_id: "",
  relationship_type: "Parent/Guardian",
};

const emptyLinkForm: LinkForm = {
  email: "",
  student_id: "",
  relationship_type: "Parent/Guardian",
};

export default function ParentsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);
  const selectedSchoolId = Number(schoolId);

  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [parentForm, setParentForm] =
    useState<ParentForm>(emptyParentForm);

  const [linkForm, setLinkForm] =
    useState<LinkForm>(emptyLinkForm);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        parentsResponse,
        studentsResponse,
        classesResponse,
      ] = await Promise.all([
        api.get<Parent[]>("/parents"),
        api.get<Student[]>("/students/"),
        api.get<Classroom[]>("/classes/"),
      ]);

      const schoolStudents =
        (studentsResponse.data || []).filter(
          (student) =>
            Number(student.school_id) === selectedSchoolId
        );

      const schoolClasses =
        (classesResponse.data || []).filter(
          (classroom) =>
            Number(classroom.school_id) === selectedSchoolId
        );

      setParents(parentsResponse.data || []);
      setStudents(schoolStudents);
      setClasses(schoolClasses);
    } catch (err: any) {
      console.error("Failed to load parent page:", err);

      setError(
        err?.response?.data?.detail ||
          "Failed to load parent records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(selectedSchoolId)) {
      setError("Invalid school.");
      setLoading(false);
      return;
    }

    loadData();
  }, [selectedSchoolId]);

  const filteredParents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return parents;
    }

    return parents.filter((parent) => {
      const name =
        `${parent.first_name} ${parent.last_name}`.toLowerCase();

      const phone =
        (parent.phone || "").toLowerCase();

      return (
        name.includes(query) ||
        phone.includes(query)
      );
    });
  }, [parents, searchQuery]);

  function getClassName(
    classroomId?: number | null
  ) {
    if (!classroomId) {
      return "—";
    }

    return (
      classes.find(
        (item) => item.id === classroomId
      )?.name || "—"
    );
  }

  function updateParentField<K extends keyof ParentForm>(
    key: K,
    value: ParentForm[K]
  ) {
    setParentForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateLinkField<K extends keyof LinkForm>(
    key: K,
    value: LinkForm[K]
  ) {
    setLinkForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function closeAddModal() {
    if (submitting) return;

    setShowAddModal(false);
    setParentForm(emptyParentForm);
  }

  function closeLinkModal() {
    if (submitting) return;

    setShowLinkModal(false);
    setLinkForm(emptyLinkForm);
  }

  async function createParent(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!parentForm.email.trim()) {
      setError("Parent email is required.");
      return;
    }

    if (!parentForm.first_name.trim()) {
      setError("Parent first name is required.");
      return;
    }

    if (!parentForm.last_name.trim()) {
      setError("Parent last name is required.");
      return;
    }

    if (!parentForm.student_id) {
      setError("Select a student to link to this parent.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await api.post("/parents", {
        email: parentForm.email.trim(),
        password:
          parentForm.password.trim() ||
          "Parent@123",
        school_id: selectedSchoolId,
        first_name: parentForm.first_name.trim(),
        last_name: parentForm.last_name.trim(),
        phone: parentForm.phone.trim(),
        student_ids: [
          Number(parentForm.student_id),
        ],
        relationship_type:
          parentForm.relationship_type.trim() ||
          "Parent/Guardian",
      });

      setSuccess(
        "Parent account created and student linked successfully."
      );

      setShowAddModal(false);
      setParentForm(emptyParentForm);

      await loadData();
    } catch (err: any) {
      console.error(
        "Failed to create parent:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to create parent account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function linkExistingParent(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!linkForm.email.trim()) {
      setError("Enter the existing parent's email.");
      return;
    }

    if (!linkForm.student_id) {
      setError("Select the student to link.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await api.post("/parents/link-existing", {
        email: linkForm.email.trim(),
        student_id: Number(linkForm.student_id),
        relationship_type:
          linkForm.relationship_type.trim() ||
          "Parent/Guardian",
      });

      setSuccess(
        "Existing parent linked to the student successfully."
      );

      setShowLinkModal(false);
      setLinkForm(emptyLinkForm);

      await loadData();
    } catch (err: any) {
      console.error(
        "Failed to link existing parent:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          "Failed to link existing parent."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-[28px] border border-rose-100 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">
            <Users size={17} />
            Parent Management
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Parents
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Register parents and connect them to students in this
            school.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowLinkModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <UserPlus size={18} />
            Link Existing Parent
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-rose-600"
          >
            <Plus size={18} />
            Add Parent
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />
          <span>{success}</span>
        </div>
      )}

      {!loading && parents.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-3.5 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search by parent name or phone..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm text-slate-800 outline-hidden transition focus:border-rose-400 focus:bg-white"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-100 bg-white">
          <Loader2
            size={30}
            className="animate-spin text-rose-500"
          />
        </div>
      ) : parents.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-white p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Users size={26} />
          </div>

          <h2 className="mt-4 font-bold text-slate-900">
            No parents registered
          </h2>

          <p className="mt-2 max-w-md text-sm text-slate-500">
            Register the first parent for this school or link
            an existing parent account.
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Link Existing
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-600"
            >
              Add Parent
            </button>
          </div>
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <Search
            size={28}
            className="text-slate-400"
          />

          <h2 className="mt-4 font-bold text-slate-900">
            No matches found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Try another parent name or phone number.
          </p>

          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="mt-4 text-xs font-bold text-rose-500 underline"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Parent
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Phone
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Account ID
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredParents.map((parent) => (
                  <tr
                    key={parent.id}
                    className="transition hover:bg-rose-50/40"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-black text-rose-500">
                          {parent.first_name?.[0] || "P"}
                          {parent.last_name?.[0] || ""}
                        </div>

                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {parent.first_name}{" "}
                            {parent.last_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Parent #{parent.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <Phone
                          size={15}
                          className="text-slate-400"
                        />
                        {parent.phone || "—"}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-slate-600">
                      #{parent.user_id}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setLinkForm((current) => ({
                            ...current,
                          }));
                          setShowLinkModal(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100"
                      >
                        <UserPlus size={14} />
                        Link Child
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ADD PARENT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Add Parent
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Create a parent account and connect the parent
                  to a student in this school.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={createParent}
              className="mt-7 grid gap-4 md:grid-cols-2"
            >
              <input
                required
                value={parentForm.first_name}
                onChange={(event) =>
                  updateParentField(
                    "first_name",
                    event.target.value
                  )
                }
                placeholder="First name"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-hidden focus:border-rose-400"
              />

              <input
                required
                value={parentForm.last_name}
                onChange={(event) =>
                  updateParentField(
                    "last_name",
                    event.target.value
                  )
                }
                placeholder="Last name"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-hidden focus:border-rose-400"
              />

              <input
                type="tel"
                value={parentForm.phone}
                onChange={(event) =>
                  updateParentField(
                    "phone",
                    event.target.value
                  )
                }
                placeholder="Phone number"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-hidden focus:border-rose-400"
              />

              <input
                required
                type="email"
                value={parentForm.email}
                onChange={(event) =>
                  updateParentField(
                    "email",
                    event.target.value
                  )
                }
                placeholder="Parent email address"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-hidden focus:border-rose-400"
              />

              <input
                type="password"
                value={parentForm.password}
                onChange={(event) =>
                  updateParentField(
                    "password",
                    event.target.value
                  )
                }
                placeholder="Password (default: Parent@123)"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-hidden focus:border-rose-400 md:col-span-2"
              />

              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Users
                    size={17}
                    className="text-rose-500"
                  />

                  <h3 className="text-sm font-bold text-slate-900">
                    Link Child
                  </h3>
                </div>

                <select
                  required
                  value={parentForm.student_id}
                  onChange={(event) =>
                    updateParentField(
                      "student_id",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-hidden focus:border-rose-400"
                >
                  <option value="">
                    Select student
                  </option>

                  {students.map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.first_name}{" "}
                      {student.last_name} —{" "}
                      {student.admission_number} —{" "}
                      {getClassName(
                        student.classroom_id ??
                          student.class_id
                      )}
                    </option>
                  ))}
                </select>

                <select
                  value={parentForm.relationship_type}
                  onChange={(event) =>
                    updateParentField(
                      "relationship_type",
                      event.target.value
                    )
                  }
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-hidden focus:border-rose-400"
                >
                  <option>
                    Parent/Guardian
                  </option>
                  <option>Father</option>
                  <option>Mother</option>
                  <option>Guardian</option>
                  <option>Grandfather</option>
                  <option>Grandmother</option>
                  <option>Uncle</option>
                  <option>Aunt</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 md:col-span-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Create Parent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK EXISTING PARENT */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Link Existing Parent
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Use this when the parent already has an account
                  in the system. No duplicate account will be
                  created.
                </p>
              </div>

              <button
                type="button"
                onClick={closeLinkModal}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={linkExistingParent}
              className="mt-7 space-y-4"
            >
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-3.5 text-slate-400"
                />

                <input
                  required
                  type="email"
                  value={linkForm.email}
                  onChange={(event) =>
                    updateLinkField(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="Existing parent email"
                  className="w-full rounded-xl border border-slate-200 px-11 py-3 text-sm outline-hidden focus:border-rose-400"
                />
              </div>

              <select
                required
                value={linkForm.student_id}
                onChange={(event) =>
                  updateLinkField(
                    "student_id",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-hidden focus:border-rose-400"
              >
                <option value="">
                  Select student in this school
                </option>

                {students.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.first_name}{" "}
                    {student.last_name} —{" "}
                    {student.admission_number} —{" "}
                    {getClassName(
                      student.classroom_id ??
                        student.class_id
                    )}
                  </option>
                ))}
              </select>

              <select
                value={linkForm.relationship_type}
                onChange={(event) =>
                  updateLinkField(
                    "relationship_type",
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-hidden focus:border-rose-400"
              >
                <option>
                  Parent/Guardian
                </option>
                <option>Father</option>
                <option>Mother</option>
                <option>Guardian</option>
                <option>Grandfather</option>
                <option>Grandmother</option>
                <option>Uncle</option>
                <option>Aunt</option>
              </select>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
                This links the selected student to the existing
                parent account. The parent's login credentials
                remain unchanged.
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeLinkModal}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  Link Parent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
