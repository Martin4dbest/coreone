"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import api from "@/lib/api";

type Teacher = {
  id: number;
  user_id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
};

export default function Page({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTeachers() {
      try {
        const response = await api.get<Teacher[]>("/teachers");

        setTeachers(response.data);
      } catch (error) {
        console.error("Failed to load teachers:", error);
        setError("Unable to load teachers.");
      } finally {
        setLoading(false);
      }
    }

    loadTeachers();
  }, []);

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/schools/${schoolId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500"
      >
        <ArrowLeft size={16} />
        Back to School Workspace
      </Link>

      <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
          <Users size={26} />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Teachers
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Manage teaching staff and teacher records.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Teacher Directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {teachers.length} teacher{teachers.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <Loader2 className="animate-spin text-rose-500" size={28} />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : teachers.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
            No teachers have been added to this school yet.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="px-4 py-3 font-semibold">Teacher</th>
                  <th className="px-4 py-3 font-semibold">Employee Number</th>
                </tr>
              </thead>

              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {teacher.first_name} {teacher.last_name}
                    </td>

                    <td className="px-4 py-4 text-slate-500">
                      {teacher.employee_number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
