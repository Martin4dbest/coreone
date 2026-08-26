"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

export default function TeacherLearningEntryPage() {
  const params = useParams();
  const tenant = String(params.tenant || "");

  useEffect(() => {
    let cancelled = false;

    async function openExistingLearningCentre() {
      try {
        const response = await api.get(
          `/schools/by-slug/${encodeURIComponent(tenant)}`
        );

        const schoolId = response.data?.id;

        if (!schoolId || cancelled) {
          return;
        }

        window.location.replace(
          `/dashboard/schools/${schoolId}/learning?teacherLearning=1`
        );
      } catch (error) {
        console.error(
          "Failed to open existing Learning Centre:",
          error
        );
      }
    }

    if (tenant) {
      openExistingLearningCentre();
    }

    return () => {
      cancelled = true;
    };
  }, [tenant]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <div className="text-4xl">Learning</div>

        <h1 className="mt-4 text-xl font-bold">
          Opening Learning Centre...
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Please wait...
        </p>
      </div>
    </div>
  );
}
