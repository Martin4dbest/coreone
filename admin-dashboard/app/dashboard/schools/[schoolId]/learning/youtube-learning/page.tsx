"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function YoutubeLearningRedirectPage() {
  const params = useParams();
  const schoolId = String(params.schoolId);

  useEffect(() => {
    if (schoolId) {
      window.location.replace(
        `/dashboard/schools/${schoolId}/youtube-learning`
      );
    }
  }, [schoolId]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-slate-500">
        Opening YouTube Learning...
      </p>
    </div>
  );
}
