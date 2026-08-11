"use client";

import { useParams } from "next/navigation";
import AttendancePage from "@/app/dashboard/schools/[schoolId]/attendance/page";

export default function TeacherAttendancePage() {
  const params = useParams();

  return (
    <AttendancePage
      params={Promise.resolve({
        schoolId: String(params.tenant),
      })}
    />
  );
}
