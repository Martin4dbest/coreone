"use client";

import { useParams } from "next/navigation";
import ExamBuilderCentre from "@/components/exam-builder/ExamBuilderCentre";

export default function SchoolApprovalCentrePage() {
  const params = useParams();
  const rawSchoolId = params?.schoolId;
  const schoolId = Number(
    Array.isArray(rawSchoolId) ? rawSchoolId[0] : rawSchoolId
  );

  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    return <p>Unable to identify this school. Please reload the page.</p>;
  }

  return <ExamBuilderCentre mode="approval" schoolId={schoolId} />;
}
