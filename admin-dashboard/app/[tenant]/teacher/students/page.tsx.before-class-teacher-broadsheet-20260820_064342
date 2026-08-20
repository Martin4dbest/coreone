"use client";

import { useParams } from "next/navigation";
import StudentsPage from "@/app/dashboard/schools/[schoolId]/students/page";

export default function TeacherStudentsPage() {
  const params = useParams();

  return (
    <StudentsPage
      params={
        Promise.resolve({
          schoolId: String(params.tenant),
        })
      }
    />
  );
}
