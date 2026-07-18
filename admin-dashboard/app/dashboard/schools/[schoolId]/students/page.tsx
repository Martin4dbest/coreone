"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  Loader2,
  UserRound,
  Plus,
  X,
  Power,
  Trash2,
  ImagePlus,
} from "lucide-react";

import api from "@/lib/api";

type Student = {
  id: number;
  user_id: number;
  school_id: number;
  classroom_id?: number | null;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  gender: string;
  date_of_birth: string;
  passport?: string | null;
  is_active: boolean;
};

type Classroom = {
  id: number;
  school_id: number;
  level_id: number;
  name: string;
};

type StudentForm = {
  classroom_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  gender: string;
  date_of_birth: string;
  email: string;
  password: string;
};

const initialForm: StudentForm = {
  classroom_id: "",
  admission_number: "",
  first_name: "",
  last_name: "",
  middle_name: "",
  gender: "",
  date_of_birth: "",
  email: "",
  password: "",
};

export default function StudentsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);
  const selectedSchoolId = Number(schoolId);

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      try {
        setLoading(true);

        const [studentsResponse, classesResponse] =
          await Promise.all([
            api.get<Student[]>("/students"),
            api.get<Classroom[]>("/classes"),
          ]);

        if (!active) {
          return;
        }

        const schoolStudents =
          studentsResponse.data.filter(
            (student) =>
              student.school_id === selectedSchoolId
          );

        const schoolClasses =
          classesResponse.data.filter(
            (classroom) =>
              classroom.school_id === selectedSchoolId
          );

        setStudents(schoolStudents);
        setClasses(schoolClasses);
        setError("");
      } catch (err) {
        console.error(
          "Failed to load students page:",
          err
        );

        if (active) {
          setError(
            "Unable to load students or classes."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPageData();

    return () => {
      active = false;
    };
  }, [selectedSchoolId]);

  async function deleteStudent(studentId: number) {
    if (!confirm("Delete this student permanently?")) {
      return;
    }

    try {
      setActionLoading(studentId);

      await api.patch(`/students/${studentId}/deactivate`);

      setStudents((current) =>
        current.filter(
          (student) => student.id !== studentId
        )
      );
    } catch (error) {
      console.error("Failed to delete student", error);
      alert("Failed to delete student.");
    } finally {
      setActionLoading(null);
    }
  }

  function updateField(
    field: keyof StudentForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function getClassName(
    classroomId?: number | null
  ) {
    if (!classroomId) {
      return "Not assigned";
    }

    const classroom = classes.find(
      (item) => item.id === classroomId
    );

    return classroom?.name ?? "Unknown class";
  }

  async function createStudent(
    event: React.FormEvent
  ) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const response = await api.post<Student>(
        "/students",
        {
          school_id: selectedSchoolId,
          classroom_id: Number(form.classroom_id),
          admission_number:
            form.admission_number.trim(),
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          middle_name:
            form.middle_name.trim() || null,
          gender: form.gender,
          date_of_birth: form.date_of_birth,
          email: form.email.trim(),
          password: form.password,
          passport: null,
        }
      );

      setStudents((current) => [
        ...current,
        response.data,
      ]);

      setForm(initialForm);
      setShowModal(false);
    } catch (err) {
      console.error(
        "Failed to create student:",
        err
      );

      setError("Unable to create student.");
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadPassport(
    studentId: number,
    file: File
  ) {
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await api.post(
        `/students/${studentId}/passport`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setStudents((current) =>
        current.map((student) =>
          student.id === studentId
            ? {
                ...student,
                passport: res.data.passport,
              }
            : student
        )
      );
    } catch (err) {
      console.error(err);
      alert("Passport upload failed.");
    }
  }

  async function toggleStudent(
    studentId: number,
    active: boolean
  ) {
    try {
      setActionLoading(studentId);
      await api.patch(
        `/students/${studentId}/${active ? "deactivate" : "activate"}`
      );

      setStudents((current) =>
        current.map((student) =>
          student.id === studentId
            ? {
                ...student,
                is_active: !active,
              }
            : student
        )
      );
    } catch (error) {
      console.error(
        "Failed to update student status",
        error
      );
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <section
        className="
          flex
          flex-col
          gap-5
          rounded-3xl
          border
          border-rose-100
          bg-gradient-to-br
          from-rose-50
          via-white
          to-pink-50
          p-8
          md:flex-row
          md:items-center
          md:justify-between
        "
      >
        <div>
          <div
            className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              bg-white
              text-rose-500
              shadow-sm
            "
          >
            <GraduationCap size={24} />
          </div>

          <h1
            className="
              mt-5
              text-3xl
              font-bold
              tracking-tight
              text-slate-900
            "
          >
            Students
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
            "
          >
            Manage registered students for this school.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-rose-500
            px-5
            py-3
            text-sm
            font-bold
            text-white
            shadow-sm
            transition
            hover:bg-rose-600
          "
        >
          <Plus size={18} />
          Add Student
        </button>
      </section>

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-100
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-600
          "
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          className="
            flex
            min-h-64
            items-center
            justify-center
            rounded-2xl
            border
            border-slate-100
            bg-white
          "
        >
          <Loader2
            size={30}
            className="animate-spin text-rose-500"
          />
        </div>
      ) : students.length === 0 ? (
        <div
          className="
            flex
            min-h-64
            flex-col
            items-center
            justify-center
            rounded-2xl
            border
            border-dashed
            border-rose-200
            bg-white
            p-8
            text-center
          "
        >
          <div
            className="
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-2xl
              bg-rose-50
              text-rose-500
            "
          >
            <UserRound size={26} />
          </div>

          <h2
            className="
              mt-4
              font-bold
              text-slate-900
            "
          >
            No students found
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
            "
          >
            Add the first student to this school.
          </p>
        </div>
      ) : (
        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Admission Number
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Student
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Class
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Gender
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Date of Birth
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="
                      transition
                      hover:bg-rose-50/40
                    "
                  >
                    <td
                      className="
                        px-6
                        py-4
                        text-sm
                        font-semibold
                        text-rose-500
                      "
                    >
                      {student.admission_number}
                    </td>

                    <td className="px-6 py-4">
                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >
                        <div
                          className="
                            relative
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            overflow-hidden
                            bg-rose-50
                            text-rose-500
                          "
                        >
                          {student.passport ? (
                            <Image
                              src={
                            student.passport.startsWith("http")
                              ? student.passport
                              : `${(
                                  process.env.NEXT_PUBLIC_API_URL ??
                                  "http://localhost:8000/api/v1"
                                ).replace("/api/v1", "")}${student.passport}`
                          }
                              alt={`${student.first_name} ${student.last_name}`}
                              fill
                              className="object-cover rounded-full"
                              unoptimized
                            />
                          ) : (
                            <UserRound size={18} />
                          )}

                          <label
                            className="
                              absolute
                              -bottom-1
                              -right-1
                              cursor-pointer
                              rounded-full
                              bg-rose-500
                              p-1
                              text-white
                              shadow
                              hover:bg-rose-600
                            "
                          >
                            <ImagePlus size={12} />

                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  uploadPassport(student.id, file);
                                }
                              }}
                            />
                          </label>
                        </div>

                        <div>
                          <p
                            className="
                              text-sm
                              font-bold
                              text-slate-900
                            "
                          >
                            {student.first_name}{" "}
                            {student.middle_name
                              ? `${student.middle_name} `
                              : ""}
                            {student.last_name}
                          </p>

                          <p
                            className="
                              mt-1
                              text-xs
                              text-slate-400
                            "
                          >
                            Student ID: {student.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td
                      className="
                        px-6
                        py-4
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      {getClassName(
                        student.classroom_id
                      )}
                    </td>

                    <td
                      className="
                        px-6
                        py-4
                        text-sm
                        text-slate-600
                      "
                    >
                      {student.gender}
                    </td>

                    <td
                      className="
                        px-6
                        py-4
                        text-sm
                        text-slate-600
                      "
                    >
                      {student.date_of_birth}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() =>
                          toggleStudent(
                            student.id,
                            student.is_active
                          )
                        }
                        disabled={actionLoading === student.id}
                        className={`
                          inline-flex
                          items-center
                          gap-2
                          rounded-lg
                          px-3
                          py-2
                          text-xs
                          font-bold
                          ${
                            student.is_active
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }
                          disabled:opacity-60
                          disabled:cursor-not-allowed
                        `}
                      >
                        {actionLoading === student.id ? (
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Power size={14} />
                        )}

                        {actionLoading === student.id
                          ? "Updating..."
                          : student.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </button>

                      <button
                        onClick={() =>
                          deleteStudent(student.id)
                        }
                        disabled={actionLoading === student.id}
                        className="
                          inline-flex
                          items-center
                          gap-2
                          rounded-lg
                          bg-red-100
                          px-3
                          py-2
                          text-xs
                          font-bold
                          text-red-700
                          hover:bg-red-200
                          disabled:opacity-60
                          disabled:cursor-not-allowed
                        "
                      >
                        {actionLoading === student.id ? (
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={14} />
                        )}

                        {actionLoading === student.id
                          ? "Deactivating..."
                          : "Delete"}
                      </button>

                      <Link
                        href={`/dashboard/schools/${schoolId}/students/${student.id}`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-lg
                          bg-rose-500
                          px-4
                          py-2
                          text-sm
                          font-bold
                          text-white
                          transition
                          hover:bg-rose-600
                        "
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showModal && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/40
            p-4
          "
        >
          <div
            className="
              max-h-[90vh]
              w-full
              max-w-2xl
              overflow-y-auto
              rounded-3xl
              bg-white
              p-8
              shadow-2xl
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <h2
                  className="
                    text-2xl
                    font-bold
                    text-slate-900
                  "
                >
                  Add Student
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    text-slate-500
                  "
                >
                  Create a student account and assign
                  the student to a class.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="
                  rounded-xl
                  border
                  border-slate-200
                  p-2
                  text-slate-500
                  transition
                  hover:bg-slate-50
                "
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={createStudent}
              autoComplete="off"
              className="
                mt-8
                grid
                gap-5
                md:grid-cols-2
              "
            >
              <select
                required
                value={form.classroom_id}
                onChange={(event) =>
                  updateField(
                    "classroom_id",
                    event.target.value
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-rose-400
                  md:col-span-2
                "
              >
                <option value="">
                  Select class
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

              <input
                required
                value={form.admission_number}
                onChange={(event) =>
                  updateField(
                    "admission_number",
                    event.target.value
                  )
                }
                placeholder="Admission number"
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-rose-400
                "
              />

              <input
                required
                value={form.first_name}
                onChange={(event) =>
                  updateField(
                    "first_name",
                    event.target.value
                  )
                }
                placeholder="First name"
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-rose-400
                "
              />

              <input
                required
                value={form.last_name}
                onChange={(event) =>
                  updateField(
                    "last_name",
                    event.target.value
                  )
                }
                placeholder="Last name"
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-rose-400
                "
              />

              <input
                value={form.middle_name}
                onChange={(event) =>
                  updateField(
                    "middle_name",
                    event.target.value
                  )
                }
                placeholder="Middle name"
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-rose-400
                "
              />

              <select
                required
                value={form.gender}
                onChange={(event) =>
                  updateField(
                    "gender",
                    event.target.value
                  )
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-rose-400
                "
              >
                <option value="">
                  Select gender
                </option>
                <option value="MALE">
                  Male
                </option>
                <option value="FEMALE">
                  Female
                </option>
              </select>

              <div className="flex flex-col">
                <label
                  htmlFor="student-date-of-birth"
                  className="mb-1 block text-xs font-semibold text-slate-500"
                >
                  Date of Birth
                </label>

                <input
                  id="student-date-of-birth"
                  required
                  type="date"
                  value={form.date_of_birth}
                  onChange={(event) =>
                    updateField(
                      "date_of_birth",
                      event.target.value
                    )
                  }
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    px-4
                    py-3
                    outline-none
                    transition
                    focus:border-rose-400
                  "
                />
              </div>

              <input
                required
                type="email"
                name="new-student-email"
                autoComplete="off"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                placeholder="Student email"
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-rose-400
                "
              />

              <input
                required
                type="password"
                name="new-student-password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  updateField(
                    "password",
                    event.target.value
                  )
                }
                placeholder="Temporary password"
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-none
                  transition
                  focus:border-rose-400
                "
              />

              <div className="mt-4 flex items-center justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-rose-600 disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}