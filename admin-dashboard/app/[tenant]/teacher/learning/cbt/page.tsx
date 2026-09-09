"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import api from "@/lib/api";
import CBTPage from "@/app/dashboard/schools/[schoolId]/cbt/page";

type School = {
  id: number;
};

export default function TeacherCBTPage() {
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSchool() {
      try {
        const response = await api.get<School>("/schools/me");
        const id = Number(response.data?.id);

        if (!id) {
          throw new Error("Unable to determine your school.");
        }

        sessionStorage.setItem("teacher_school_id", String(id));

        if (mounted) {
          setSchoolId(id);
        }
      } catch (err: any) {
        if (mounted) {
          setError(
            err?.response?.data?.detail ||
              "Unable to load CBT."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSchool();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-red-600" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Loading CBT...
          </p>
        </div>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            CBT unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <CBTPage
      schoolIdOverride={String(schoolId)}
      teacherBase="/teko/teacher/learning/cbt"
    />
  );
}
