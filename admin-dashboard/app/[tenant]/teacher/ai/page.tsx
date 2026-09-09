"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

import api from "@/lib/api";
import AICBTGenerator from "@/components/ai-cbt-generator";

type School = {
  id: number;
};

export default function TeacherAIPage() {
  const params = useParams();
  const tenant = String(params?.tenant || "");

  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        const schoolResponse = await api.get<School>("/schools/me");
        const resolvedSchoolId = Number(schoolResponse.data.id);

        if (!resolvedSchoolId) {
          throw new Error("Unable to determine your school.");
        }

        await api.get(`/ai/access/${resolvedSchoolId}`);

        if (!mounted) {
          return;
        }

        setSchoolId(resolvedSchoolId);
      } catch (err: any) {
        if (!mounted) {
          return;
        }

        setError(
          err?.response?.data?.detail ||
            "AI Studio is available only to Class Teachers when enabled for the school."
        );
      } finally {
        if (mounted) {
          setCheckingAccess(false);
        }
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, []);

  if (checkingAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Checking AI Studio access...
          </p>
        </div>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            AI Studio unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AICBTGenerator
      schoolId={String(schoolId)}
      teacherOnly
      teacherBase={`/${tenant}/teacher/learning/cbt`}
    />
  );
}
