"use client";

import { useParams } from "next/navigation";
import ExamBuilderCentre from "@/components/exam-builder/ExamBuilderCentre";

export default function SchoolExamBuilderPage() {
  const params = useParams<{ schoolId: string }>();

  return (
    <ExamBuilderCentre
      mode="builder"
      schoolId={Number(params.schoolId)}
    />
  );
}
