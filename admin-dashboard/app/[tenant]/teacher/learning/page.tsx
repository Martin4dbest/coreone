"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import api from "@/lib/api";
import LearningHub from "@/components/learning-hub";

export default function TeacherLearningPage() {
  const params = useParams();
  const tenant = String(params.tenant || "");

  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadSchool() {
      try {
        const cachedSchoolId = sessionStorage.getItem(
          "teacher_workspace_school_id"
        );

        if (cachedSchoolId) {
          const cachedId = Number(cachedSchoolId);

          if (cachedId > 0) {
            if (mounted) {
              setSchoolId(cachedId);
              setLoading(false);
            }

            return;
          }
        }

        const response = await api.get("/schools/me");
        const id = Number(response.data?.id);

        if (!id) {
          throw new Error("Unable to determine your school.");
        }

        sessionStorage.setItem(
          "teacher_workspace_school_id",
          String(id)
        );

        if (mounted) {
          setSchoolId(id);
        }
      } catch (err: any) {
        if (mounted) {
          setError(
            err?.response?.data?.detail ||
              "Unable to load your Learning Centre."
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-600" />
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Loading Learning Centre...
          </p>
        </div>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Learning Centre unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <LearningHub
      schoolId={String(schoolId)}
      teacherLearning
      tenant={tenant}
    />
  );
}
