"use client";

import { use, useEffect, useState } from "react";
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
  Trash2,
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

  async function loadStudent() {
    try {
      const response = await api.get(
        `/students/${studentId}`
      );

      setStudent(response.data);
    } catch (error) {
      console.error(
        "Failed to load student",
        error
      );
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
      await api.delete(
        `/students/${studentId}`
      );

      router.push(
        `/dashboard/schools/${schoolId}/students`
      );
    } catch (error) {
      console.error(
        "Failed deleting student",
        error
      );
    }
  }

  useEffect(() => {
    loadStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);


  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2
          className="animate-spin"
          size={32}
        />
      </div>
    );
  }


  if (!student) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow">
        <h2 className="text-xl font-bold">
          Student not found
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          We could not retrieve this student.
        </p>

        <Link
          href={`/dashboard/schools/${schoolId}/students`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600"
        >
          <ArrowLeft size={16}/>
          Back to Students
        </Link>
      </div>
    );
  }


  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <Link
          href={`/dashboard/schools/${schoolId}/students`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"
        >
          <ArrowLeft size={18}/>
          Back
        </Link>


        <button
          onClick={deleteStudent}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Trash2 size={16}/>
          Delete Student
        </button>

      </div>


      <div className="rounded-2xl bg-white p-6 shadow">

        <div className="flex items-center gap-5">

          {student.passport ? (
            <Image
              src={student.passport}
              alt="passport"
              width={90}
              height={90}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-slate-200"/>
          )}


          <div>
            <h1 className="text-3xl font-bold">
              {student.first_name} {student.last_name}
            </h1>

            <p className="text-sm text-slate-500">
              Admission No: {student.admission_number}
            </p>
          </div>

        </div>

      </div>


      <div className="grid gap-5 md:grid-cols-2">

        <InfoCard
          icon={<Mail size={20}/>}
          title="Email"
          value={
            student.user?.email ??
            "Not Available"
          }
        />


        <InfoCard
          icon={<ShieldCheck size={20}/>}
          title="Gender"
          value={student.gender ?? "Not Available"}
        />


        <InfoCard
          icon={<CalendarDays size={20}/>}
          title="Date of Birth"
          value={
            student.date_of_birth ??
            "Not Available"
          }
        />


        <InfoCard
          icon={<School size={20}/>}
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
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold uppercase text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-base font-bold text-slate-800">
        {value}
      </p>

    </div>
  );
}