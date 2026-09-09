"use client";

import { use } from "react";

import AICBTGenerator from "@/components/ai-cbt-generator";

export default function AICBTGeneratorPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  return <AICBTGenerator schoolId={schoolId} />;
}
