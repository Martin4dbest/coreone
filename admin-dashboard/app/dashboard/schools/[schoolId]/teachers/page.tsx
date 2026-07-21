"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Loader2, 
  Users, 
  Search, 
  ArrowRight, 
  AlertCircle, 
  X, 
  ArrowLeft, 
  RotateCw, 
  BookOpen, 
  UserX 
} from "lucide-react";
import api from "@/lib/api";

// Types
interface Teacher {
  id: number;
  assignments?: {
    id: number;
  }[];
  user_id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
}

interface TeacherPageProps {
  params: Promise<{
    schoolId: string;
  }>;
}

interface ApiError {
  response?: {
    data?: {
      detail?: string | string[] | Record<string, unknown>;
    };
  };
  message?: string;
}

// Helper to normalize backend error response shapes safely
const parseApiError = (err: unknown): string => {
  const apiError = err as ApiError;
  const detail = apiError.response?.data?.detail;

  if (!detail) {
    return apiError.message || "An unexpected network error occurred.";
  }

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.join(", ");
  }

  if (typeof detail === "object" && detail !== null) {
    return Object.entries(detail)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
  }

  return "Failed to complete operation due to a validation error.";
};

export default function TeachersPage({ params }: TeacherPageProps) {
  const { schoolId } = use(params);
  const router = useRouter();

  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    employeeNumber: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // Data Loading
  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Teacher[]>("/teachers", {
        params: {
          school_id: Number(schoolId),
        },
      });
      setTeachers(response.data);
    } catch (err: unknown) {
      setError(parseApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        handleModalClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Event Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalError(null);
    setFormValues({
      employeeNumber: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setModalError(null);

    // Duplicate & Validation Protection
    const { employeeNumber, firstName, lastName, email, password } = formValues;
    if (!employeeNumber.trim() || !firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setModalError("All fields are strictly required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/teachers", {
        school_id: Number(schoolId),
        employee_number: employeeNumber.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      });

      alert("Teacher created successfully.");
      handleModalClose();
      fetchTeachers();
    } catch (err: unknown) {
      setModalError(parseApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to generate employee initials
  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName.charAt(0) || "";
    const l = lastName.charAt(0) || "";
    return `${f}${l}`.toUpperCase();
  };

  // Filter Logic
  const filteredTeachers = teachers.filter((teacher) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    return (
      teacher.first_name.toLowerCase().includes(query) ||
      teacher.last_name.toLowerCase().includes(query) ||
      teacher.employee_number.toLowerCase().includes(query)
    );
  });

  const totalCount = teachers.length;

  const withSubjectsCount = teachers.filter(
    (teacher) =>
      teacher.assignments &&
      teacher.assignments.length > 0
  ).length;

  const withoutSubjectsCount =
    totalCount - withSubjectsCount;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8">
      {/* Back Button Navigation */}
      <div className="mb-4">
        <Link
          href={`/dashboard/schools/${schoolId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transform transition-transform group-hover:-translate-x-0.5" />
          Back to School
        </Link>
      </div>

      {/* Header Container */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Teachers</h1>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              {totalCount} Registered
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Manage teachers in this school.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTeachers}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <Plus className="h-4 w-4" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Teacher Premium Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered</p>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{totalCount}</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">With Subjects</p>
            <BookOpen className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-400">{withSubjectsCount}</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Without Subjects</p>
            <UserX className="h-5 w-5 text-slate-400" />
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-400">{withoutSubjectsCount}</p>
        </div>
      </div>

      {/* Global Filter Bar (Always Visible) */}
      <div className="mb-6 max-w-md">
        <div className="relative rounded-lg shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or employee number..."
            className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Data Section Layout */}
      {error ? (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Staff Data</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={fetchTeachers}
                  className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-200 transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="mt-2 text-sm text-slate-500 font-medium">Loading teacher directories...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500 mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {teachers.length === 0 ? "No teachers have been registered yet." : "No matching results"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            {teachers.length === 0 
              ? 'Click "Add Teacher" to register the first teacher.' 
              : "No teachers matched your current filter parameter criteria."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Employee Number
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Teacher Name
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Profile
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredTeachers.map((teacher) => (
                  <tr 
                    key={teacher.id} 
                    onClick={() => router.push(`/dashboard/schools/${schoolId}/teachers/${teacher.id}`)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-700">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                        {teacher.employee_number}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs tracking-wider">
                          {getInitials(teacher.first_name, teacher.last_name)}
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {teacher.first_name} {teacher.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/dashboard/schools/${schoolId}/teachers/${teacher.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-900 group"
                      >
                        Open Profile
                        <ArrowRight className="h-3.5 w-3.5 transform transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/dashboard/schools/${schoolId}/teachers/${teacher.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Layout Block */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 transform transition-all animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h2 className="text-lg font-bold text-slate-900">Add New Teacher</h2>
              <button
                onClick={handleModalClose}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalError && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-100 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs font-medium text-red-800">{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Employee Number
                </label>
                <input
                  type="text"
                  name="employeeNumber"
                  required
                  value={formValues.employeeNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. EMP-2026-001"
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formValues.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formValues.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formValues.email}
                  onChange={handleInputChange}
                  placeholder="johndoe@school.edu"
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formValues.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Action Operations */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none transition-colors disabled:opacity-50 min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Teacher"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}