"use client";

import { use, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  CalendarDays,
  ShieldCheck,
  School,
  Loader2,
  Trash2,
  UserRound,
} from "lucide-react";

import api from "@/lib/api";

type Student = {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  gender?: string;
  date_of_birth?: string;
  passport?: string | null;
  classroom?: {
    id: number;
    name: string;
  } | null;
  classroom_name?: string | null;
  user?: {
    email?: string;
  } | null;
};

export default function StudentProfile({
  params,
}: {
  params: Promise<{
    schoolId: string;
    studentId: string;
  }>;
}) {
  const { schoolId, studentId } = use(params);

  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Helper function to safely construct image URL
  function getImageUrl(passportPath?: string | null) {
    if (!passportPath) return null;

    // If it's already a full HTTP/HTTPS URL
    if (
      passportPath.startsWith("http://") ||
      passportPath.startsWith("https://")
    ) {
      return passportPath;
    }

    // Ensure leading slash for relative backend paths
    const cleanPath = passportPath.startsWith("/")
      ? passportPath
      : `/${passportPath}`;

    // Get Base Backend API URL
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://coreone.onrender.com";

    return `${baseUrl.replace(/\/$/, "")}${cleanPath}`;
  }

  async function loadStudent() {
    try {
      const response = await api.get(`/students/${studentId}`);
      setStudent(response.data);
    } catch (error) {
      console.error("Failed to load student", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteStudent() {
    const confirmed = window.confirm(
      "Delete this student permanently?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/students/${studentId}`);
      router.push(`/dashboard/schools/${schoolId}/students`);
    } catch (error) {
      console.error("Failed deleting student", error);
    }
  }

  useEffect(() => {
    loadStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-rose-500" size={32} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow">
        <h2 className="text-xl font-bold">Student not found</h2>

        <p className="mt-2 text-sm text-slate-500">
          We could not retrieve this student.
        </p>

        <Link
          href={`/dashboard/schools/${schoolId}/students`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Students
        </Link>
      </div>
    );
  }

  const avatarUrl = getImageUrl(student.passport);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link
          href={`/dashboard/schools/${schoolId}/students`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        <button
          onClick={deleteStudent}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-700 transition"
        >
          <Trash2 size={16} />
          Delete Student
        </button>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-5">
          {/* Safe Avatar / Passport Display */}
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full overflow-hidden bg-rose-50 border-2 border-rose-200 text-rose-500 shadow-sm">
            {avatarUrl && !imageError ? (
              <img
                src={avatarUrl}
                alt={`${student.first_name} passport`}
                className="h-full w-full object-cover rounded-full"
                onError={() => setImageError(true)}
              />
            ) : (
              <UserRound size={40} />
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {student.first_name}{" "}
              {student.middle_name ? `${student.middle_name} ` : ""}
              {student.last_name}
            </h1>

            <p className="mt-1 text-sm font-semibold text-rose-500">
              Admission No: {student.admission_number}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <InfoCard
          icon={<Mail size={20} />}
          title="Email"
          value={student.user?.email ?? "Not Available"}
        />

        <InfoCard
          icon={<ShieldCheck size={20} />}
          title="Gender"
          value={student.gender ?? "Not Available"}
        />

        <InfoCard
          icon={<CalendarDays size={20} />}
          title="Date of Birth"
          value={student.date_of_birth ?? "Not Available"}
        />

        <InfoCard
          icon={<School size={20} />}
          title="Class"
          value={
            student.classroom?.name ??
            student.classroom_name ??
            "Not Assigned"
          }
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-base font-bold text-slate-800">{value}</p>
    </div>
  );
}