"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  HelpCircle,
  BarChart3,
  Settings,
  ArrowRight,
  Sparkles,
  BookOpen,
  Layers,
} from "lucide-react";

export default function CBTPage() {
  const params = useParams();
  const schoolId = params?.schoolId as string;

  const navigationCards = [
    {
      title: "Exams Management",
      description:
        "Draft, schedule, publish, and manage all CBT assessments across departments and classes.",
      href: `/dashboard/schools/${schoolId}/cbt/exams`,
      icon: FileText,
      badge: "Core",
      color: "from-indigo-500 to-indigo-600",
      lightBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      title: "Question Bank",
      description:
        "Build and organize multi-choice, theory, and true/false questions tagged by subject and topic.",
      href: `/dashboard/schools/${schoolId}/cbt/questions`,
      icon: HelpCircle,
      badge: "Repository",
      color: "from-blue-500 to-cyan-600",
      lightBg: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      title: "Results & Analytics",
      description:
        "Track student performance, score distributions, pass rates, and export assessment reports.",
      href: `/dashboard/schools/${schoolId}/cbt/results`,
      icon: BarChart3,
      badge: "Insights",
      color: "from-emerald-500 to-teal-600",
      lightBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      title: "CBT Portal Settings",
      description:
        "Configure default test durations, pass thresholds, anti-cheating proctoring controls, and instructions.",
      href: `/dashboard/schools/${schoolId}/cbt/settings`,
      icon: Settings,
      badge: "Config",
      color: "from-slate-700 to-slate-800",
      lightBg: "bg-slate-100 text-slate-700 border-slate-200",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={13} />
              Computer Based Testing
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              CBT Control Center
            </h1>
            <p className="text-slate-300 text-sm max-w-xl font-normal leading-relaxed">
              Streamline online examinations, question banks, candidate monitoring, and automated grading in one central dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Modules</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">Online Exams</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Bank Capacity</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">Multi-Subject</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Evaluation</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">Instant Grading</h3>
          </div>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Core Navigation</h2>
          <span className="text-xs text-slate-500">Select a section to manage</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {navigationCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                href={card.href}
                className="group relative bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-3 rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-md shadow-slate-200 transition-transform group-hover:scale-105`}
                    >
                      <Icon size={22} />
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-full border ${card.lightBg}`}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                  <span>Manage {card.title}</span>
                  <ArrowRight
                    size={14}
                    className="ml-1.5 transition-transform duration-200 group-hover:translate-x-1"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}