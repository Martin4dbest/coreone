"use client";

import React, { useEffect, useState, use } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  CalendarDays,
  ShieldCheck,
  School,
  Loader2,
} from "lucide-react";

import api from "@/lib/api";

type Student = {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  gender: string;
  date_of_birth: string;
  passport?: string | null;

  classroom?: {
    id: number;
    name: string;
  } | null;

  classroom_name?: string | null;

  user?: {
    email: string;
  } | null;
};



type CurrentUser = {
  role?: {
    name: string;
  } | null;
};

interface ProfileProps {
  params: Promise<{
    schoolId: string;
    studentId: string;
  }>;
}

export default function StudentProfile({ params }: ProfileProps) {
  // Safe unwrapping for Next.js 15 Async Params
  const resolvedParams = use(params);
  const { schoolId, studentId } = resolvedParams;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  async function deleteStudent() {
    if (!window.confirm("Delete this student permanently?")) return;

    try {
      await api.delete(`/students/${studentId}`);

      alert("Student deleted successfully.");

      router.push(`/dashboard/schools/${schoolId}/students`);
    } catch (err) {
      console.error(err);
      alert("Failed to delete student.");
    }
  }

  async function loadStudent() {
    try {
      const response = await api.get(`/students/${studentId}`);
      setStudent(response.data);
    } catch (error) {
      console.error("Failed to load student:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (studentId) {
      loadStudent();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-slate-100 bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-rose-500" />
          <p className="text-sm font-medium text-slate-500">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x1="9.01" y1="9" y2="9"/><line x1="15" x1="15.01" y1="9" y2="9"/></svg>
        </div>
        <h2 className="mt-4 font-bold text-slate-900">Student not found</h2>
        <p className="mt-2 text-sm text-slate-500">We couldn&apos;t retrieve the requested student account details.</p>
        <Link
          href={`/dashboard/schools/${schoolId}/students`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-rose-500 hover:text-rose-600 underline"
        >
          <ArrowLeft size={16} /> Back to Students
        </Link>

      {user?.role?.name === "SUPER_ADMIN" && (
        <button
          onClick={deleteStudent}
          className="ml-4 inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Delete Student
        </button>
      )}
      </div>
    );
  }

  const isMale = student.gender?.toUpperCase() === "MALE";
  const avatarBgColor = isMale 
    ? "bg-blue-50 text-blue-500 border-blue-100" 
    : "bg-pink-50 text-pink-500 border-pink-100";

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/schools/${schoolId}/students`}
        className="inline-flex items-center gap-2 text-sm font-bold text-rose-500 hover:text-rose-600 transition"
      >
        <ArrowLeft size={18} />
        Back to Students
      </Link>

      <section
        className="
          rounded-[28px]
          border
          border-rose-100
          bg-gradient-to-br
          from-rose-50
          via-white
          to-pink-50
          p-8
          shadow-sm
        "
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div
            className={`
              relative
              flex
              h-24
              w-24
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              bg-white
              shadow-sm
              overflow-hidden
              ${student.passport ? "border-slate-100" : avatarBgColor}
            `}
          >
            {student.passport ? (
              <Image
                src={
                  student.passport.startsWith("http")
                    ? student.passport
                    : `http://127.0.0.1:8000${student.passport}`
                }
                alt={`${student.first_name} ${student.last_name}`}
                fill
                className="object-cover"
                unoptimized
              />
            ) : isMale ? (
              <svg 
                viewBox="0 0 24 24" 
                width="48" 
                height="48" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.75" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="9" r="4.5" />
                <path d="M3 20c0-3.5 3-6.5 9-6.5s9 3 9 6.5" />
              </svg>
            ) : (
              <svg 
                viewBox="0 0 24 24" 
                width="48" 
                height="48" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.75" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M6 10c0-4 2.5-6 6-6s6 2 6 6c0 1.5-.5 3-1 4.5M7 14.5c-.5-1.5-1-3-1-4.5" />
                <path d="M8.5 10.5c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5c0 2.5-1.5 3.5-3.5 3.5s-3.5-1-3.5-3.5z" />
                <path d="M4 20c0-3 2.5-5 8-5s8 2 8 5" />
              </svg>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {student.first_name}{" "}
              {student.middle_name ? `${student.middle_name} ` : ""}
              {student.last_name}
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-500">
              Admission No: {student.admission_number}
            </p>
          </div>
        </div>
      </section>

      <section
        className="
          grid
          gap-5
          md:grid-cols-2
        "
      >
        <InfoCard
          icon={<Mail size={20} />}
          title="Email"
          value={student.user?.email ?? "Not Available"}
        />

        <InfoCard
          icon={<ShieldCheck size={20} />}
          title="Gender"
          value={student.gender}
        />

        <InfoCard
          icon={<CalendarDays size={20} />}
          title="Date of Birth"
          value={student.date_of_birth}
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
      </section>
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
    <div
      className="
        rounded-2xl
        border
        border-slate-100
        bg-white
        p-6
        shadow-sm
        transition
        hover:shadow-md
      "
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
        {icon}
      </div>

      <p
        className="
          mt-4
          text-xs
          uppercase
          font-bold
          tracking-wider
          text-slate-400
        "
      >
        {title}
      </p>

      <p
        className="
          mt-1.5
          text-base
          font-bold
          text-slate-800
        "
      >
        {value}
      </p>
    </div>
  );
}