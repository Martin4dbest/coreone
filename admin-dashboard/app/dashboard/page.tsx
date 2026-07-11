"use client";

import { useEffect, useState } from "react";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  CalendarDays,
  UserPlus,
  BookOpen,
  School,
  Loader2,
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

const events = [
  "Parents Teachers Meeting",
  "First Term Examination",
  "Staff Development Training",
];

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const response = await api.get<DashboardData>("/dashboard");

        if (active) {
          setDashboard(response.data);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);

        if (active) {
          setError("Unable to load dashboard statistics.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const stats = [
    {
      title: "Schools",
      value: dashboard?.total_schools ?? 0,
      text: "Registered institutions",
      icon: School,
      color: "bg-rose-50 text-rose-600",
    },
    {
      title: "Students",
      value: dashboard?.total_students ?? 0,
      text: "Registered learners",
      icon: GraduationCap,
      color: "bg-pink-50 text-pink-600",
    },
    {
      title: "Teachers",
      value: dashboard?.total_teachers ?? 0,
      text: "Teaching staff",
      icon: Users,
      color: "bg-fuchsia-50 text-fuchsia-600",
    },
    {
      title: "Staff",
      value: dashboard?.total_staff ?? 0,
      text: "Administrative personnel",
      icon: ClipboardCheck,
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="space-y-7">
      <section
        className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-rose-100
        bg-gradient-to-br
        from-rose-50
        via-white
        to-pink-50
        p-10
        shadow-sm
        "
      >
        <div
          className="
          absolute
          -right-20
          -top-24
          h-72
          w-72
          rounded-full
          bg-rose-100/70
          blur-3xl
          "
        />

        <div className="relative z-10">
          <p className="text-sm font-semibold text-rose-500">
            Welcome back, Super Admin
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            PreSense Command Center
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
            Manage schools, students, teachers and academic operations from one
            intelligent platform.
          </p>

          <div className="mt-7 flex gap-3">
            <button
              className="
              rounded-xl
              bg-rose-500
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-rose-600
              "
            >
              Add School
            </button>

            <button
              className="
              rounded-xl
              border
              border-rose-200
              bg-white
              px-5
              py-2.5
              text-sm
              font-semibold
              text-slate-700
              transition
              hover:bg-rose-50
              "
            >
              Generate Report
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
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
              hover:border-rose-100
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
                ${item.color}
                `}
              >
                <Icon size={23} />
              </div>

              <p className="mt-5 text-sm text-slate-500">
                {item.title}
              </p>

              <div className="mt-1">
                {loading ? (
                  <Loader2
                    size={28}
                    className="animate-spin text-rose-400"
                  />
                ) : (
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {item.value.toLocaleString()}
                  </h2>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {item.text}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div
          className="
          rounded-2xl
          border
          border-slate-100
          bg-white
          p-7
          shadow-sm
          lg:col-span-2
          "
        >
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
              <TrendingUp
                size={20}
                className="text-rose-500"
              />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Academic Performance
              </h2>

              <p className="text-xs text-slate-400">
                Current academic overview
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              ["Mathematics", "84%"],
              ["Science", "76%"],
              ["English", "91%"],
            ].map((item) => (
              <div key={item[0]}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {item[0]}
                  </span>

                  <span className="font-semibold text-rose-500">
                    {item[1]}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-rose-50">
                  <div
                    className="
                    h-2
                    rounded-full
                    bg-gradient-to-r
                    from-rose-400
                    to-pink-400
                    "
                    style={{
                      width: item[1],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="
          rounded-2xl
          border
          border-slate-100
          bg-white
          p-7
          shadow-sm
          "
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50">
              <CalendarDays
                size={20}
                className="text-rose-500"
              />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Upcoming Events
              </h2>

              <p className="text-xs text-slate-400">
                School calendar
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event}
                className="
                rounded-xl
                border
                border-rose-100
                bg-rose-50/50
                p-4
                text-sm
                font-medium
                text-slate-700
                "
              >
                {event}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          ["New Student", "Register new learners", UserPlus],
          ["Manage Classes", "Update classrooms", School],
          ["Library", "Manage resources", BookOpen],
        ].map(([title, text, Icon]) => {
          const IconComponent = Icon as typeof School;

          return (
            <div
              key={title as string}
              className="
              rounded-2xl
              border
              border-slate-100
              bg-white
              p-6
              shadow-sm
              transition
              hover:border-rose-200
              hover:shadow-md
              "
            >
              <IconComponent
                size={22}
                className="text-rose-500"
              />

              <h3 className="mt-4 font-bold text-slate-900">
                {title as string}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {text as string}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
