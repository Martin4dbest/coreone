"use client";

import { useParams, useSearchParams } from "next/navigation";

import LearningHub from "@/components/learning-hub";

export default function LearningHubPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const schoolId = String(params.schoolId || "");
  const teacherLearning =
    searchParams.get("teacherLearning") === "1";

  if (!schoolId) {
    return null;
  }

  return (
    <LearningHub
      schoolId={schoolId}
      teacherLearning={teacherLearning}
    />
  );
}
