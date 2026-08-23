"use client";

import { useEffect, useState, use, useRef } from "react";
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
  FileSpreadsheet,
  Upload,
  Search,
  SlidersHorizontal,
  Activity,
} from "lucide-react";

import api from "@/lib/api";

type PartnerSchoolSummary = {
  id: number;
  name: string;
};

type Student = {
  id: number;
  user_id: number;
  school_id: number;
  partner_schools?: PartnerSchoolSummary[];
  classroom_id?: number | null;
  class_id?: number | null;
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [importError, setImportError] = useState("");
  const [form, setForm] = useState(initialForm);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      try {
        setLoading(true);

        const [studentsResponse, classesResponse] =
          await Promise.all([
            api.get<Student[]>("/students/"),
            api.get<Classroom[]>("/classes/"),
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

  // Compute filtered array in real-time
  const filteredStudents = students.filter((student) => {
    const studentClassId = student.class_id ?? student.classroom_id;
    if (selectedClassFilter && String(studentClassId) !== selectedClassFilter) {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const fullName = `${student.first_name} ${student.middle_name || ""} ${student.last_name}`.toLowerCase();
      const admissionNum = (student.admission_number || "").toLowerCase();
      
      return fullName.includes(query) || admissionNum.includes(query);
    }

    return true;
  });

  // Direct database absolute exclusion block
  async function deleteStudent(studentId: number) {
    const userConfirmed = window.confirm(
      "⚠️ PERMANENT DATABASE DELETION\n\nAre you completely sure you want to delete this student from the database? This cannot be undone."
    );
    
    if (!userConfirmed) return;

    try {
      setActionLoading(studentId);

      // Requests absolute record elimination from database via standard dynamic path parameters
      await api.delete(`/students/${studentId}`);

      // Instantly wipe the student from active dashboard layout state arrays
      setStudents((currentStudents) =>
        currentStudents.filter((student) => student.id !== studentId)
      );

      alert("Student record completely deleted from database.");
    } catch (error: any) {
      console.error("Failed to delete student from database:", error);
      alert(
        error.response?.data?.detail || 
        "Failed to delete student. Ensure your backend handles dynamic cascading requirements properly."
      );
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

      const admissionNumber =
        form.admission_number.trim() ||
        `STD${Date.now().toString().slice(-6)}`;

      const email =
        form.email.trim() || `${admissionNumber.toLowerCase()}@student.presense.com`;

      const response = await api.post<Student>(
        "/students/",
        {
          school_id: selectedSchoolId,
          classroom_id: Number(form.classroom_id),
          admission_number: admissionNumber,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          middle_name: form.middle_name.trim() || null,
          gender: form.gender || "Male",
          date_of_birth: form.date_of_birth || "2010-01-01",
          email: email,
          password: form.password || "Student@123",
          passport: null,
        }
      );

      const createdStudent = (response.data as any)?.data || response.data;

      setStudents((current) => [
        ...current,
        createdStudent,
      ]);

      setForm(initialForm);
      setShowModal(false);
    } catch (err: any) {
      console.error(
        "Failed to create student:",
        err
      );

      const detail = err?.response?.data?.detail;
      let errorMsg = "Unable to create student.";
      
      if (Array.isArray(detail)) {
        errorMsg = detail.map((e) => `${e.loc ? e.loc[e.loc.length - 1] : "Field"}: ${e.msg}`).join("\n");
      } else if (typeof detail === "string") {
        errorMsg = detail;
      }

      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("school_id", String(selectedSchoolId));

      const response = await api.post<Student[]>("/students/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setStudents((current) => [...current, ...response.data]);
      } else {
        const freshStudents = await api.get<Student[]>("/students/");
        setStudents(freshStudents.data.filter((s) => s.school_id === selectedSchoolId));
      }

      setShowImportModal(false);
      alert("Students successfully imported!");
    } catch (err) {
      console.error("Bulk file import failed:", err);
      setImportError("Failed to parse file or upload records. Check structure guidelines.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
              shadow-xs
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

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-5
              py-3
              text-sm
              font-bold
              text-slate-700
              shadow-xs
              transition
              hover:bg-slate-50
            "
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            Import Students
          </button>

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
              shadow-xs
              transition
              hover:bg-rose-600
            "
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>
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
            whitespace-pre-line
          "
        >
          {error}
        </div>
      )}

      {/* Search and Filter Panel */}
      {!loading && students.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="relative w-full sm:max-w-md">
            <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or admission number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-sm text-slate-800 focus:border-rose-400 focus:bg-white transition"
            />
          </div>

          <div className="relative w-full sm:w-64 flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-slate-400 hidden sm:block" />
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-sm text-slate-700 focus:border-rose-400 focus:bg-white transition appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
            >
              <option value="">All Classes</option>
              {classes.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
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
      ) : filteredStudents.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Search size={26} />
          </div>
          <h2 className="mt-4 font-bold text-slate-900">No matches found</h2>
          <p className="mt-2 text-sm text-slate-500">
            We couldn't find any student matching your query. Try resetting filters.
          </p>
          <button 
            onClick={() => { setSearchQuery(""); setSelectedClassFilter(""); }} 
            className="mt-4 text-xs font-bold text-rose-500 hover:text-rose-600 underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-xs
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
                      Partner School
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
                {filteredStudents.map((student) => (
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
                        {/* Profile Picture Display Section */}
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
                                  : `https://coreone.onrender.com${student.passport}`
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
                              shadow-xs
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
                        student.class_id ?? student.classroom_id
                      )}
                    </td>

                      <td
                        className="
                          px-6
                          py-4
                          text-sm
                          font-semibold
                          text-slate-600
                        "
                      >
                        {student.partner_schools?.length
                          ? student.partner_schools
                              .map((school) => school.name)
                              .join(", ")
                          : "—"}
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
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                      <Link
                        href={`/dashboard/schools/${schoolId}/students/${student.id}/activity`}
                        className="
                          inline-flex
                          items-center
                          justify-center
                          gap-2
                          rounded-lg
                          bg-indigo-100
                          px-3
                          py-2
                          text-xs
                          font-bold
                          text-indigo-700
                          transition
                          hover:bg-indigo-200
                        "
                      >
                        <Activity size={14} />
                        Activity
                      </Link>

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

      {/* Manual Add Student Modal */}
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
                  Create a student account and assign the student to a class.
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
                  outline-hidden
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
                value={form.admission_number}
                onChange={(event) =>
                  updateField(
                    "admission_number",
                    event.target.value
                  )
                }
                placeholder="Admission number (Auto-generated if blank)"
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-hidden
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
                  outline-hidden
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
                  outline-hidden
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
                  outline-hidden
                  transition
                  focus:border-rose-400
                "
              />

              <select
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
                  outline-hidden
                  transition
                  focus:border-rose-400
                "
              >
                <option value="">
                  Select gender (Defaults to Male)
                </option>
                <option value="Male">
                  Male
                </option>
                <option value="Female">
                  Female
                </option>
              </select>

              <div className="flex flex-col">
                <input
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
                    outline-hidden
                    transition
                    focus:border-rose-400
                  "
                />
              </div>

              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                placeholder="Account Email (Mandatory) *"
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-hidden
                  transition
                  focus:border-rose-400
                "
              required
                            aria-required="true"
                            />

              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  updateField(
                    "password",
                    event.target.value
                  )
                }
                placeholder="Account Password (Defaults to Student@123)"
                className="
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  outline-hidden
                  transition
                  focus:border-rose-400
                "
              />

              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-rose-600 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
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
              w-full
              max-w-md
              rounded-3xl
              bg-white
              p-8
              shadow-2xl
            "
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Import Students
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Upload an Excel (.xlsx) or CSV file containing multiple students.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            {importError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {importError}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-700 block mb-1">Required Columns Setup:</span>
                <p>• <code className="bg-white px-1 border rounded">class_id</code> (Target Class ID value)</p>
                <p>• <code className="bg-white px-1 border rounded">admission_number</code></p>
                <p>• <code className="bg-white px-1 border rounded">first_name</code>, <code className="bg-white px-1 border rounded">last_name</code></p>
                <p>• <code className="bg-white px-1 border rounded">middle_name</code> (Optional)</p>
                <p>• <code className="bg-white px-1 border rounded">gender</code> (Male / Female)</p>
                <p>• <code className="bg-white px-1 border rounded">date_of_birth</code> (YYYY-MM-DD)</p>
                <p>• <code className="bg-white px-1 border rounded">email</code>, <code className="bg-white px-1 border rounded">password</code></p>
              </div>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:bg-rose-50/20 hover:border-rose-300 transition group">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 group-hover:bg-rose-50 group-hover:text-rose-500 transition shadow-xs">
                  {importing ? (
                    <Loader2 size={22} className="animate-spin text-rose-500" />
                  ) : (
                    <Upload size={22} />
                  )}
                </div>
                <span className="mt-4 font-bold text-sm text-slate-700">
                  {importing ? "Processing data..." : "Click to browse files"}
                </span>
                <span className="mt-1 text-xs text-slate-400">
                  Supports .csv, .xls, .xlsx
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  hidden
                  disabled={importing}
                  onChange={handleImportFile}
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => setShowImportModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
