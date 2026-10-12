"use client";

import { useParams } from "next/navigation";
import ALOCQuestionBank from "@/components/aloc/ALOCQuestionBank";

export default function SchoolALOCQuestionBankPage() {
  const params = useParams<{ schoolId: string }>();

  return (
    <ALOCQuestionBank schoolId={String(params.schoolId || "")} />
  );
}
