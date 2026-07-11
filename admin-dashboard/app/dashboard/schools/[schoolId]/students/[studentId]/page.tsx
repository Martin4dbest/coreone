"use client";

import { useEffect, useState, use } from "react";
import {
  ArrowLeft,
  UserRound,
  Mail,
  CalendarDays,
  ShieldCheck,
  School,
} from "lucide-react";

import Link from "next/link";
import api from "@/lib/api";


type Student = {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  gender: string;
  date_of_birth: string;
};


export default function StudentProfile({
  params,
}: {
  params: Promise<{
    schoolId: string;
    studentId: string;
  }>;
}) {


  const { schoolId, studentId } = use(params);


  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);



  async function loadStudent(){

    try{

      const response = await api.get(
        `/students/${studentId}`
      );

      setStudent(response.data);


    }catch(error){

      console.error(
        "Failed to load student:",
        error
      );

    }finally{

      setLoading(false);

    }

  }



  useEffect(()=>{

    loadStudent();

  },[]);



  if(loading){

    return (
      <div className="p-10 text-slate-500">
        Loading student profile...
      </div>
    );

  }



  if(!student){

    return (
      <div className="p-10">
        Student not found
      </div>
    );

  }



  return (

    <div className="space-y-6">


      <Link
        href={`/dashboard/schools/${schoolId}/students`}
        className="
          flex
          items-center
          gap-2
          text-sm
          font-semibold
          text-rose-500
        "
      >

        <ArrowLeft size={18}/>

        Back to Students

      </Link>



      <section
        className="
          rounded-[28px]
          border
          border-rose-100
          bg-gradient-to-br
          from-rose-50
          via-white
          to-pink-50
          p-8
        "
      >

        <div className="flex items-center gap-5">


          <div
            className="
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-3xl
              bg-white
              text-rose-500
              shadow-sm
            "
          >

            <UserRound size={40}/>

          </div>


          <div>

            <h1 className="text-3xl font-bold text-slate-900">

              {student.first_name} {student.last_name}

            </h1>


            <p className="mt-2 text-sm text-slate-500">

              Admission No:
              {" "}
              {student.admission_number}

            </p>

          </div>


        </div>


      </section>




      <section
        className="
          grid
          gap-5
          md:grid-cols-2
        "
      >


        <InfoCard
          icon={<Mail/>}
          title="Admission Number"
          value={student.admission_number}
        />


        <InfoCard
          icon={<ShieldCheck/>}
          title="Gender"
          value={student.gender}
        />


        <InfoCard
          icon={<CalendarDays/>}
          title="Date of Birth"
          value={student.date_of_birth}
        />


        <InfoCard
          icon={<School/>}
          title="School"
          value={`School ID ${schoolId}`}
        />


      </section>



    </div>

  );


}



function InfoCard({
icon,
title,
value,
}:{
icon:React.ReactNode;
title:string;
value:string;
}){


return (

<div
className="
rounded-2xl
border
bg-white
p-6
shadow-sm
"
>


<div className="text-rose-500">

{icon}

</div>


<p className="
mt-4
text-xs
uppercase
font-bold
tracking-wide
text-slate-400
">

{title}

</p>


<p className="
mt-2
font-semibold
text-slate-900
">

{value}

</p>


</div>

);


}
