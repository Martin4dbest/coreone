"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";


export default function LearningHubPage(){

  const params = useParams();
  const searchParams = useSearchParams();

  const schoolId = params.schoolId as string;

  const teacherLearning =
    searchParams.get("teacherLearning") === "1";

const [schoolFeatures, setSchoolFeatures] = useState<any[]>([]);

useEffect(() => {
  let mounted = true;

  async function loadFeatures() {
    try {
      const response = await api.get(`/school-features/${schoolId}`);
      if (mounted) {
        setSchoolFeatures(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load school features:", error);
    }
  }

  loadFeatures();

  return () => {
    mounted = false;
  };
}, [schoolId]);

const featureEnabled = (featureKey: string) =>
  schoolFeatures.some(
    (feature) =>
      feature.feature_key === featureKey &&
      feature.enabled === true
  );


  const modules = [
    {
      title:"Attendance",
      description:"Monitor student attendance and reports",
      link:`/dashboard/schools/${schoolId}/attendance${teacherLearning ? "?teacherLearning=1" : ""}`,
      icon:"📅",
      feature: "attendance",
    },
    {
      title:"CBT",
      description:"Create exams, questions and analyse results",
      link:`/dashboard/schools/${schoolId}/cbt${teacherLearning ? "?teacherLearning=1" : ""}`,
      icon:"📝",
      feature: "cbt",
    },
    {
      title:"Ebooks",
      description:"Manage digital learning materials",
      link:`/dashboard/schools/${schoolId}/ebooks${teacherLearning ? "?teacherLearning=1" : ""}`,
      icon:"📚",
      feature: "ebooks",
    },
    {
      title:"YouTube Learning",
      description:"Manage educational videos",
      link:`/dashboard/schools/${schoolId}/youtube-learning${teacherLearning ? "?teacherLearning=1" : ""}`,
      icon:"▶️",
      feature: "youtube_learning",
    },
    {
      title:"Browser Resources",
      description:"Manage approved learning links",
      link:`/dashboard/schools/${schoolId}/browser${teacherLearning ? "?teacherLearning=1" : ""}`,
      icon:"🌐",
      feature: "browser",
    }
  ];


  return (

    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Learning Hub
        </h1>

        <p className="text-slate-500">
          Attendance, CBT, ebooks, videos and digital resources
        </p>
      </div>


      <div className="grid gap-5 md:grid-cols-3">

        {modules.filter((item) => featureEnabled(item.feature)).map((item)=>(

          <Link
            key={item.title}
            href={item.link}
            className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition"
          >

            <div className="text-4xl mb-4">
              {item.icon}
            </div>

            <h2 className="text-xl font-bold">
              {item.title}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {item.description}
            </p>

          </Link>

        ))}

      </div>

    </div>

  );

}
