"use client";

import { useEffect, useState } from "react";
import {
  School,
  GraduationCap,
  Users,
  UserRound,
  UserPlus,
  BookOpen,
  Activity,
  Loader2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import api from "@/lib/api";


type DashboardData = {
  total_schools: number;
  total_students: number;
  total_teachers: number;
  total_parents: number;
  total_staff: number;
  total_classes: number;
  total_visitors: number;
};



export default function DashboardPage() {

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {

    let mounted = true;


    async function loadDashboard() {

      try {

        const response =
          await api.get<DashboardData>("/dashboard");


        if (mounted) {
          setDashboard(response.data);
        }


      } catch (error) {

        console.error(
          "Dashboard loading failed:",
          error
        );


      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    }


    loadDashboard();


    return () => {
      mounted = false;
    };


  }, []);




  const cards = [

    {
      title: "Schools",
      value: dashboard?.total_schools ?? 0,
      description: "Registered institutions",
      icon: School,
      style: "bg-emerald-50 text-emerald-600",
    },


    {
      title: "Students",
      value: dashboard?.total_students ?? 0,
      description: "Active learners",
      icon: GraduationCap,
      style: "bg-purple-50 text-purple-600",
    },


    {
      title: "Teachers",
      value: dashboard?.total_teachers ?? 0,
      description: "Teaching workforce",
      icon: Users,
      style: "bg-blue-50 text-blue-600",
    },


    {
      title: "Staff",
      value: dashboard?.total_staff ?? 0,
      description: "School personnel",
      icon: UserRound,
      style: "bg-orange-50 text-orange-600",
    },


    {
      title: "Classes",
      value: dashboard?.total_classes ?? 0,
      description: "Learning groups",
      icon: BookOpen,
      style: "bg-pink-50 text-pink-600",
    },


    {
      title: "Parents",
      value: dashboard?.total_parents ?? 0,
      description: "Registered parents",
      icon: UsersRound,
      style: "bg-cyan-50 text-cyan-600",
    },


    {
      title: "Visitors",
      value: dashboard?.total_visitors ?? 0,
      description: "Recorded visits",
      icon: Activity,
      style: "bg-yellow-50 text-yellow-600",
    },

  ];




  return (

    <section className="space-y-8">


      {/* Welcome Header */}

      <div
        className="
        rounded-[32px]
        border
        border-rose-100
        bg-gradient-to-br
        from-rose-50
        via-white
        to-pink-50
        p-8
        shadow-sm
        "
      >


        <div
          className="
          flex
          flex-col
          gap-5
          md:flex-row
          md:items-center
          md:justify-between
          "
        >


          <div>

            <p
              className="
              text-sm
              font-semibold
              text-rose-600
              "
            >
              🛡️ PreSense Administration
            </p>


            <h1
              className="
              mt-3
              text-3xl
              font-bold
              tracking-tight
              text-slate-900
              md:text-4xl
              "
            >
              Command Center
            </h1>


            <p
              className="
              mt-3
              max-w-2xl
              text-sm
              leading-6
              text-slate-500
              "
            >
              Manage schools, students, teachers,
              staff and academic operations from
              one intelligent platform.
            </p>


          </div>



          <div
            className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            bg-white
            px-5
            py-4
            shadow-sm
            "
          >

            <ShieldCheck
              size={30}
              className="text-rose-500"
            />


            <div>

              <p className="text-xs text-slate-400">
                Access Level
              </p>


              <p className="font-bold text-slate-800">
                Super Admin
              </p>

            </div>


          </div>


        </div>


      </div>





      {/* Statistics Cards */}


      <div
        className="
        grid
        gap-5
        sm:grid-cols-2
        xl:grid-cols-4
        "
      >

        {
          cards.map((item)=>{

            const Icon = item.icon;


            return (

              <div
                key={item.title}
                className="
                rounded-2xl
                border
                border-slate-100
                bg-white
                p-6
                shadow-sm
                transition
                duration-300
                hover:-translate-y-1
                hover:shadow-lg
                "
              >


                <div
                  className={`
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  ${item.style}
                  `}
                >

                  <Icon size={24}/>

                </div>



                <p
                  className="
                  mt-5
                  text-sm
                  text-slate-500
                  "
                >
                  {item.title}
                </p>




                {
                  loading ?


                  <Loader2
                    size={26}
                    className="
                    mt-3
                    animate-spin
                    text-rose-500
                    "
                  />


                  :


                  <h2
                    className="
                    mt-1
                    text-3xl
                    font-bold
                    text-slate-900
                    "
                  >
                    {item.value.toLocaleString()}
                  </h2>

                }



                <p
                  className="
                  mt-2
                  text-xs
                  text-slate-400
                  "
                >
                  {item.description}
                </p>


              </div>

            )

          })
        }


      </div>






      {/* Management Actions */}


      <div
        className="
        grid
        gap-5
        md:grid-cols-3
        "
      >


        <div
          className="
          rounded-2xl
          border
          bg-white
          p-6
          shadow-sm
          "
        >

          <School
            size={25}
            className="text-emerald-600"
          />

          <h3
            className="
            mt-4
            font-bold
            text-slate-900
            "
          >
            🏫 Manage Schools
          </h3>


          <p className="mt-2 text-sm text-slate-500">
            Create, update and manage institutions.
          </p>

        </div>




        <div
          className="
          rounded-2xl
          border
          bg-white
          p-6
          shadow-sm
          "
        >

          <UserPlus
            size={25}
            className="text-purple-600"
          />


          <h3
            className="
            mt-4
            font-bold
            text-slate-900
            "
          >
            👥 Administrators
          </h3>


          <p className="mt-2 text-sm text-slate-500">
            Manage school administrators and access.
          </p>


        </div>





        <div
          className="
          rounded-2xl
          border
          bg-white
          p-6
          shadow-sm
          "
        >

          <Activity
            size={25}
            className="text-blue-600"
          />


          <h3
            className="
            mt-4
            font-bold
            text-slate-900
            "
          >
            📊 System Overview
          </h3>


          <p className="mt-2 text-sm text-slate-500">
            Monitor platform activities.
          </p>


        </div>


      </div>



    </section>

  );

}
