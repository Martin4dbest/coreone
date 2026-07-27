"use client";

import { useParams } from "next/navigation";
import ResultsPage from "@/app/dashboard/schools/[schoolId]/results/page";

export default function TeacherResultsPage() {
  const params = useParams();

  return (
    <ResultsPage
      params={
        Promise.resolve({
          schoolId: String(params.tenant),
        })
      }
    />
  );
}
