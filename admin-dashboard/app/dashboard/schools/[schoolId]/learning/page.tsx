"use client";

import Link from "next/link";
import { useParams } from "next/navigation";


export default function LearningHubPage(){

  const params = useParams();

  const schoolId = params.schoolId as string;


  const modules = [
    {
      title:"Attendance",
      description:"Monitor student attendance and reports",
      link:`/dashboard/schools/${schoolId}/attendance`,
      icon:"📅"
    },
    {
      title:"CBT",
      description:"Create exams, questions and analyse results",
      link:`/dashboard/schools/${schoolId}/cbt`,
      icon:"📝"
    },
    {
      title:"Ebooks",
      description:"Manage digital learning materials",
      link:`/dashboard/schools/${schoolId}/ebooks`,
      icon:"📚"
    },
    {
      title:"YouTube Learning",
      description:"Manage educational videos",
      link:`/dashboard/schools/${schoolId}/youtube-learning`,
      icon:"▶️"
    },
    {
      title:"Browser Resources",
      description:"Manage approved learning links",
      link:`/dashboard/schools/${schoolId}/browser`,
      icon:"🌐"
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

        {modules.map((item)=>(

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
