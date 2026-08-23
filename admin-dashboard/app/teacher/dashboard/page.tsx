"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Users,
  GraduationCap,
  School,
  Loader2,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  UserCheck,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Building2
} from "lucide-react";

import api from "@/lib/api";

// --- Types ---
type TeacherClass = {
  classroom_id: number;
  classroom_name: string;
  subject_id: number;
  subject_name: string;
  student_count: number;
};

type TeacherDashboard = {
  teacher_id: number;
  teacher_name: string;
  total_classes: number;
  total_subjects: number;
  classes: TeacherClass[];
};

type SchoolBranding = {
  id: number;
  name: string;
  logo_url?: string;
  motto?: string;
  primary_color?: string;
  secondary_color?: string;
};

// Helper to convert Hex colors to RGBA for smooth opacity overlays
const hexToRgba = (hex?: string, alpha: number = 1): string => {
  if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    return `rgba(79, 70, 229, ${alpha})`; // Fallback Indigo-600
  }
  let c = hex.substring(1).split("");
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  const num = parseInt(c.join(""), 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
};

export default function TeacherDashboardPage() {
const params = useParams();
const tenant = params.tenant as string;
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [school, setSchool] = useState<SchoolBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWorkspace() {
      try {
        setLoading(true);
        setError("");

        // Parallel fetch for teacher dashboard and school profile
        const [dashboardRes, schoolRes] = await Promise.allSettled([
          api.get<TeacherDashboard>("/teachers/dashboard"),
          api.get<SchoolBranding>("/schools/me")
        ]);

        if (dashboardRes.status === "fulfilled") {
          setData(dashboardRes.value.data);
        } else {
          throw dashboardRes.reason;
        }

        if (schoolRes.status === "fulfilled") {
          setSchool(schoolRes.value.data);
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
          "Unable to load teacher dashboard workspace."
        );
      } finally {
        setLoading(false);
      }
    }

    loadWorkspace();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "T";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-indigo-600" />
        <p className="mt-2 text-sm font-medium text-slate-500">Loading your teaching workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // School Colors & Metadata
  const primaryColor = school?.primary_color || "#4f46e5";
  const secondaryColor = school?.secondary_color || "#1e1b4b";
  const schoolName = school?.name || "School Portal Workspace";
  const totalStudentsTaught = data.classes.reduce((sum, item) => sum + item.student_count, 0);

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* 1. School Header Banner (Logo & Branded Name) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center gap-4">
          {school?.logo_url ? (
            <div 
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl border p-1 bg-white shadow-xs overflow-hidden shrink-0"
              style={{ borderColor: hexToRgba(primaryColor, 0.25) }}
            >
              <img
                src={school.logo_url}
                alt={schoolName}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div 
              className="flex h-14 w-14 items-center justify-center rounded-2xl font-bold text-white shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Building2 className="h-7 w-7" />
            </div>
          )}
          
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
              {schoolName}
            </h2>
            {school?.motto ? (
              <p className="text-xs font-medium italic text-slate-500 mt-0.5">
                "{school.motto}"
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Academic Staff Portal</p>
            )}
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Active Academic Session</span>
        </div>
      </div>

      {/* 2. Hero Greeting Banner */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white shadow-md transition-all"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xl font-bold tracking-wider text-white shadow-inner shrink-0">
              {getInitials(data.teacher_name)}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 mb-1 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Teacher Workspace
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {data.teacher_name}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                You have <span className="font-semibold text-white">{data.total_classes} class allocations</span> assigned for this term.
              </p>
            </div>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute left-1/2 -top-12 h-32 w-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
      </div>

      {/* 3. Stat Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Classrooms</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{data.total_classes}</p>
          </div>
          <div 
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}
          >
            <School className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subjects Taught</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{data.total_subjects}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Workload</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{data.classes.length}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Students</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{totalStudentsTaught}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 4. Quick Actions Hub */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Tools & Management</h2>
        
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Link
            href={`/${tenant}/teacher/results`}
            className="group flex flex-col items-center justify-center rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-all text-center"
          >
            <div 
              className="flex h-12 w-12 items-center justify-center rounded-xl group-hover:scale-110 transition-transform"
              style={{ backgroundColor: hexToRgba(primaryColor, 0.1), color: primaryColor }}
            >
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <span className="mt-3 text-sm font-bold text-slate-800">Record Results</span>
            <span className="text-xs text-slate-400 mt-0.5">Continuous Assessment</span>
          </Link>

          <Link
            href={`/${tenant}/teacher/attendance`}
            className="group flex flex-col items-center justify-center rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <UserCheck className="h-6 w-6" />
            </div>
            <span className="mt-3 text-sm font-bold text-slate-800">Mark Attendance</span>
            <span className="text-xs text-slate-400 mt-0.5">Daily Register</span>
          </Link>

          <Link
            href={`/${tenant}/teacher/students`}
            className="group flex flex-col items-center justify-center rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <span className="mt-3 text-sm font-bold text-slate-800">My Students</span>
            <span className="text-xs text-slate-400 mt-0.5">Class Directories</span>
          </Link>

          <Link
            href={`/${tenant}/teacher/dashboard`}
            className="group flex flex-col items-center justify-center rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Calendar className="h-6 w-6" />
            </div>
            <span className="mt-3 text-sm font-bold text-slate-800">Timetable</span>
            <span className="text-xs text-slate-400 mt-0.5">Schedule & Periods</span>
          </Link>
        </div>
      </div>

      {/* 4B. Learning & Teaching Tools */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Learning & Teaching Tools
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Access your teaching, assessment and learning resources from here.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">

          <Link
            href={`/${tenant}/teacher/attendance`}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
              <UserCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              Attendance
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Mark attendance
            </p>
          </Link>

          <Link
            href={`/${tenant}/teacher/learning/cbt`}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              CBT
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Manage examinations
            </p>
          </Link>

          <Link
            href={`/${tenant}/teacher/learning/ebooks`}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-110">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              Ebooks
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Digital materials
            </p>
          </Link>

          <Link
            href={`/${tenant}/teacher/learning/youtube`}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition-all hover:border-red-300 hover:shadow-md"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-transform group-hover:scale-110">
              <span className="text-xl font-bold">▶</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              YouTube Learning
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Educational videos
            </p>
          </Link>

          <Link
            href={`/${tenant}/teacher/learning/browser`}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm transition-all hover:border-cyan-300 hover:shadow-md"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 transition-transform group-hover:scale-110">
              <span className="text-xl">🌐</span>
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">
              Browser Resources
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Teaching resources
            </p>
          </Link>

        </div>
      </div>

      {/* 5. Assigned Classes & Subjects Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Assigned Classes & Subjects</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-full">
            {data.classes.length} Total Assignments
          </span>
        </div>

        {data.classes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
            <BookOpen className="mx-auto h-8 w-8 mb-2 text-slate-300" />
            <p className="text-sm font-medium">No teaching assignments allocated yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data.classes.map((item) => (
              <Link
                key={`${item.classroom_id}-${item.subject_id}`}
                href={`/${tenant}/teacher/results?class_id=${item.classroom_id}&subject_id=${item.subject_id}`}
                className="group flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span 
                      className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold"
                      style={{ 
                        backgroundColor: hexToRgba(primaryColor, 0.1), 
                        color: primaryColor 
                      }}
                    >
                      {item.classroom_name}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <Users size={14} className="text-slate-400" />
                      {item.student_count} Students
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 transition-colors">
                      {item.subject_name}
                    </h3>
                  </div>
                </div>

                <div 
                  className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-semibold"
                  style={{ color: primaryColor }}
                >
                  <span>Manage Class Assessment</span>
                  <ChevronRight size={14} className="transform transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}