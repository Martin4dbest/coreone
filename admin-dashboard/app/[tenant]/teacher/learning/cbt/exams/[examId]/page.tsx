"use client";

import { useParams } from "next/navigation";
import CBTExamViewPage from "@/app/dashboard/schools/[schoolId]/cbt/exams/[examId]/page";

export default function TeacherCBTExamViewPage() {
  const params = useParams();

  const tenant = String(params?.tenant || "");
  const examId = String(params?.examId || "");

  const schoolId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("teacher_school_id")
      : null;

  return (
    <CBTExamViewPage
      schoolIdOverride={schoolId || undefined}
      examIdOverride={examId}
      teacherBase={`/${tenant}/teacher/learning/cbt`}
      teacherBackHref={`/${tenant}/teacher/learning/cbt/exams`}
    />
  );
}
