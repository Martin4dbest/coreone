"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  ArrowLeft,
  Edit,
  HelpCircle,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  BookOpen,
  GraduationCap,
  FileCheck,
  ShieldAlert,
  Sliders,
  ChevronRight,
} from "lucide-react";

export default function CBTExamViewPage() {
  const { schoolId, examId } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States for fallback name resolution
  const [subjectName, setSubjectName] = useState<string>("");
  const [className, setClassName] = useState<string>("");

  useEffect(() => {
    if (!examId) return;

    api
      .get(`/cbt/exams/${examId}`)
      .then(async (res) => {
        const data = res.data?.data || res.data;
        setExam(data);

        // 1. Resolve Subject Name
        const sub =
          data.subject?.name ??
          data.subject_name ??
          data.subjectName ??
          (typeof data.subject === "string" ? data.subject : null);

        if (sub) {
          setSubjectName(sub);
        } else if (data.subject_id || data.subjectId) {
          const sId = data.subject_id || data.subjectId;
          try {
            const subRes = await api.get(`/subjects/${sId}`);
            setSubjectName(
              subRes.data?.name ||
                subRes.data?.data?.name ||
                subRes.data?.title ||
                `Subject #${sId}`
            );
          } catch {
            setSubjectName(`Subject #${sId}`);
          }
        }

        // 2. Resolve Class Name (Fixed to try multiple endpoint patterns & fields)
        const cls =
          data.classroom?.name ??
          data.class?.name ??
          data.class_name ??
          data.className ??
          data.target_class ??
          (typeof data.classroom === "string"
            ? data.classroom
            : typeof data.class === "string"
            ? data.class
            : null);

        if (cls) {
          setClassName(cls);
        } else if (data.class_id || data.classId || data.classroom_id) {
          const cId = data.class_id || data.classId || data.classroom_id;

          // Attempt fetching class details from common endpoints
          try {
            const clsRes =
              (await api.get(`/classes/${cId}`).catch(() => null)) ||
              (await api.get(`/classrooms/${cId}`).catch(() => null)) ||
              (schoolId
                ? await api
                    .get(`/schools/${schoolId}/classes/${cId}`)
                    .catch(() => null)
                : null);

            if (clsRes && clsRes.data) {
              const resData = clsRes.data?.data || clsRes.data;
              const fetchedClassName =
                resData.name ||
                resData.class_name ||
                resData.className ||
                resData.title ||
                resData.label;

              if (fetchedClassName) {
                setClassName(fetchedClassName);
              } else {
                setClassName(`Class #${cId}`);
              }
            } else {
              setClassName(`Class #${cId}`);
            }
          } catch {
            setClassName(`Class #${cId}`);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch exam:", err);
      })
      .finally(() => setLoading(false));
  }, [examId, schoolId]);

  const handleBack = () => {
    if (schoolId) {
      router.push(`/dashboard/schools/${schoolId}/cbt/exams`);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 text-slate-800 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm animate-pulse">
            <div className="h-4 w-16 bg-slate-200 rounded" />
            <span>/</span>
            <div className="h-4 w-16 bg-slate-200 rounded" />
          </div>
          <div className="p-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="h-8 w-1/3 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-2xl border border-slate-200/80 p-5 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50/60">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Assessment Not Found
          </h2>
          <p className="text-sm text-slate-500">
            The exam record you are attempting to view might have been moved,
            deleted, or does not exist.
          </p>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
          >
            <ArrowLeft size={16} />
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  const isPublished =
    exam.is_active === true ||
    exam.is_published === true ||
    exam.status?.toLowerCase() === "published";

  const cards = [
    {
      title: "Subject",
      value: subjectName || "N/A",
      icon: BookOpen,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      title: "Target Class",
      value: className || "N/A",
      icon: GraduationCap,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      title: "Duration",
      value: `${
        exam.duration_minutes ?? exam.durationMinutes ?? exam.duration ?? 0
      } Mins`,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      title: "Questions",
      value:
        exam.total_questions ??
        exam.questionsCount ??
        exam.questions_count ??
        (Array.isArray(exam.questions) ? exam.questions.length : 0),
      icon: HelpCircle,
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
    {
      title: "Total Marks",
      value: exam.total_marks ?? exam.totalMarks ?? 0,
      icon: Award,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      title: "Pass Mark",
      value: exam.pass_mark ?? exam.passingScore ?? exam.passMark ?? 0,
      icon: FileCheck,
      color: "text-teal-600 bg-teal-50 border-teal-100",
    },
    {
      title: "Portal Status",
      value: isPublished ? "Published" : "Draft",
      isBadge: true,
      icon: CheckCircle2,
      color: isPublished
        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : "text-amber-700 bg-amber-50 border-amber-200",
    },
  ];

  const settingsConfig = [
    {
      label: "Randomize Questions",
      enabled: Boolean(exam.randomize_questions ?? exam.shuffle_questions),
      desc: "Questions appear in shuffled order per student",
    },
    {
      label: "Randomize Options",
      enabled: Boolean(exam.randomize_options ?? exam.shuffle_options),
      desc: "Multiple choice options are shuffled for each item",
    },
    {
      label: "Allow Resume",
      enabled: Boolean(exam.allow_resume ?? true),
      desc: "Candidates can resume test in case of network disruptions",
    },
    {
      label: "Immediate Results",
      enabled: Boolean(exam.show_result_immediately ?? exam.immediate_results),
      desc: "Display total score immediately upon test submission",
    },
    {
      label: "Negative Marking",
      enabled: Boolean(exam.negative_marking),
      desc: `Deduct points for incorrect attempts (${exam.negative_mark ?? 0} pts)`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Link
            href={`/dashboard/schools/${schoolId}/cbt`}
            className="hover:text-indigo-600 transition"
          >
            CBT Hub
          </Link>
          <ChevronRight size={12} className="text-slate-400" />
          <Link
            href={`/dashboard/schools/${schoolId}/cbt/exams`}
            className="hover:text-indigo-600 transition"
          >
            Exams
          </Link>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-slate-900 font-bold">View Exam</span>
        </div>

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                type="button"
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition border border-slate-200/80"
                title="Back to Exams"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {exam.title || "Untitled Assessment"}
              </h1>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl pl-11">
              {exam.description ||
                "No specific instructions provided for this exam."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
            <Link
              href={`/dashboard/schools/${schoolId}/cbt/exams/${
                exam.id || examId
              }/edit`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition shadow-sm"
            >
              <Edit size={16} />
              <span>Edit Details</span>
            </Link>

            <Link
              href={`/dashboard/schools/${schoolId}/cbt/questions?examId=${
                exam.id || examId
              }`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-sm"
            >
              <HelpCircle size={16} />
              <span>Manage Questions</span>
            </Link>

          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className={`p-2 rounded-xl border ${card.color}`}>
                    <Icon size={16} />
                  </div>
                </div>

                <div>
                  {card.isBadge ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${card.color}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isPublished
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-amber-500"
                        }`}
                      />
                      {card.value}
                    </span>
                  ) : (
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {card.value}
                    </h2>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Configuration Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Sliders size={18} />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Proctoring & Exam Configuration
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-400">
              Rules & Control Policy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {settingsConfig.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50/80 border border-slate-200/60"
              >
                <div className="mt-0.5 shrink-0">
                  {item.enabled ? (
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  ) : (
                    <XCircle size={20} className="text-slate-300" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.label}
                    </p>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        item.enabled
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {item.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}