"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";
import ALOCQuestionBank from "@/components/aloc/ALOCQuestionBank";

export default function TeacherALOCQuestionBankPage() {
  const router = useRouter();
  const params = useParams<{ tenant: string }>();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${params.tenant}/teacher/dashboard`);
    }
  }

  const backButton = (
    <button
      type="button"
      onClick={goBack}
      className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label="Return to previous page"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkFeature() {
      try {
        const schoolResponse = await api.get("/schools/me");
        const schoolId = Number(schoolResponse.data?.id);

        if (!schoolId) {
          throw new Error("Unable to determine your school.");
        }

        const featuresResponse = await api.get(
          `/school-features/${schoolId}`
        );

        const feature = Array.isArray(featuresResponse.data)
          ? featuresResponse.data.find(
              (item: { feature_key?: string }) =>
                item.feature_key === "aloc_question_bank"
            )
          : undefined;

        if (active) {
          setEnabled(feature?.enabled === true);
        }
      } catch (err: any) {
        if (active) {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              "Unable to verify ALOC access for your school."
          );
          setEnabled(false);
        }
      }
    }

    void checkFeature();

    return () => {
      active = false;
    };
  }, []);

  if (enabled === null) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        {backButton}
        <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
        <span className="ml-3 text-sm text-slate-600">
          Checking ALOC access...
        </span>
        </div>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="mx-auto mt-8 max-w-5xl px-4 sm:px-6">
        {backButton}
        <div className="max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <AlertCircle className="h-7 w-7 text-amber-600" />
        <h1 className="mt-3 text-lg font-bold text-slate-900">
          ALOC Question Bank unavailable
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          {error ||
            "ALOC Question Bank has not been enabled for your school. Please contact your school administrator."}
        </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {backButton}
      <ALOCQuestionBank />
    </div>
  );
}
