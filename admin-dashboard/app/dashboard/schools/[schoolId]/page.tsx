"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck2,
  ChevronRight,
  CircleDollarSign,
  GraduationCap,
  HeartHandshake,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  School,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  UserRound,
  Users,
  Wallet,
  MonitorPlay,
  Globe,
  FileQuestion,
  LibraryBig,
  CalendarDays,
  Settings,
  UserCog,
} from "lucide-react";
import api from "@/lib/api";

type AnyRecord = Record<string, any>;

type DashboardData = {
  students: number;
  teachers: number;
  staff: number;
  parents: number;
  classes: number;

  maleStudents: number;
  femaleStudents: number;

  present: number;
  absent: number;
  late: number;

  feesExpected: number;
  feesPaid: number;
  feesOutstanding: number;

  booksIssued: number;
  booksReceived: number;

  cbtExams: number;
  cbtResults: number;
  averageScore: number;

  leavePending: number;
  leaveApproved: number;

  monthlyStudents: number[];
  monthlyAttendance: number[];
  classDistribution: { name: string; value: number }[];
  classGenderDistribution: {
    name: string;
    male: number;
    female: number;
    total: number;
  }[];
  departmentDistribution: { name: string; value: number }[];
};

const emptyData: DashboardData = {
  students: 0,
  teachers: 0,
  staff: 0,
  parents: 0,
  classes: 0,

  maleStudents: 0,
  femaleStudents: 0,

  present: 0,
  absent: 0,
  late: 0,

  feesExpected: 0,
  feesPaid: 0,
  feesOutstanding: 0,

  booksIssued: 0,
  booksReceived: 0,

  cbtExams: 0,
  cbtResults: 0,
  averageScore: 0,

  leavePending: 0,
  leaveApproved: 0,

  monthlyStudents: [0, 0, 0, 0, 0, 0, 0],
  monthlyAttendance: [0, 0, 0, 0, 0, 0, 0],

  classDistribution: [],
  classGenderDistribution: [],
  departmentDistribution: [],
};

function number(value: any): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[₦,\s%]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function firstNumber(
  source: AnyRecord,
  keys: string[],
  fallback = 0,
): number {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return number(source[key]);
    }
  }

  return fallback;
}

function arrayFrom(source: any, keys: string[]): any[] {
  if (Array.isArray(source)) return source;

  if (!source || typeof source !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(source[key])) return source[key];
  }

  return [];
}

function currency(value: number) {
  return `₦${Math.round(value).toLocaleString("en-NG")}`;
}

function percentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function safeLabel(value: any, fallback: string) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function extractDashboard(
  responses: AnyRecord[],
): DashboardData {
  const merged: AnyRecord = {};

  for (const response of responses) {
    if (!response || typeof response !== "object") continue;

    Object.assign(merged, response);

    if (response.data && typeof response.data === "object") {
      Object.assign(merged, response.data);
    }

    if (response.summary && typeof response.summary === "object") {
      Object.assign(merged, response.summary);
    }

    if (response.statistics && typeof response.statistics === "object") {
      Object.assign(merged, response.statistics);
    }

    if (response.analytics && typeof response.analytics === "object") {
      Object.assign(merged, response.analytics);
    }
  }

  const students = firstNumber(
    merged,
    [
      "students",
      "student_count",
      "total_students",
      "students_count",
      "studentCount",
    ],
  );

  const teachers = firstNumber(
    merged,
    [
      "teachers",
      "teacher_count",
      "total_teachers",
      "teachers_count",
      "teacherCount",
    ],
  );

  const staff = firstNumber(
    merged,
    [
      "staff",
      "staff_count",
      "total_staff",
      "staff_count_total",
    ],
  );

  const parents = firstNumber(
    merged,
    [
      "parents",
      "parent_count",
      "total_parents",
      "parents_count",
    ],
  );

  const classes = firstNumber(
    merged,
    [
      "classes",
      "class_count",
      "total_classes",
      "classrooms",
    ],
  );

  const maleStudents = firstNumber(
    merged,
    [
      "male_students",
      "maleStudents",
      "students_male",
      "male_count",
    ],
  );

  const femaleStudents = firstNumber(
    merged,
    [
      "female_students",
      "femaleStudents",
      "students_female",
      "female_count",
    ],
  );

  const present = firstNumber(
    merged,
    [
      "present",
      "present_count",
      "students_present",
      "attendance_present",
    ],
  );

  const absent = firstNumber(
    merged,
    [
      "absent",
      "absent_count",
      "students_absent",
      "attendance_absent",
    ],
  );

  const late = firstNumber(
    merged,
    [
      "late",
      "late_count",
      "students_late",
      "attendance_late",
    ],
  );

  const feesExpected = firstNumber(
    merged,
    [
      "fees_expected",
      "expected_fees",
      "total_expected",
      "total_fee_expected",
      "fee_expected",
    ],
  );

  const feesPaid = firstNumber(
    merged,
    [
      "fees_paid",
      "paid_fees",
      "total_paid",
      "total_fee_paid",
      "fee_paid",
    ],
  );

  const feesOutstanding = firstNumber(
    merged,
    [
      "fees_outstanding",
      "outstanding_fees",
      "total_outstanding",
      "balance",
      "fee_outstanding",
    ],
    Math.max(0, feesExpected - feesPaid),
  );

  const booksIssued = firstNumber(
    merged,
    [
      "books_issued",
      "issued_books",
      "total_books_issued",
    ],
  );



  const cbtExams = firstNumber(
    merged,
    [
      "cbt_exams",
      "total_cbt_exams",
      "exams",
      "exam_count",
    ],
  );

  const cbtResults = firstNumber(
    merged,
    [
      "cbt_results",
      "total_cbt_results",
      "results",
      "result_count",
    ],
  );

  const averageScore = firstNumber(
    merged,
    [
      "average_score",
      "avg_score",
      "averageScore",
      "cbt_average",
    ],
  );

  const leavePending = firstNumber(
    merged,
    [
      "leave_pending",
      "pending_leave",
      "pending_leaves",
    ],
  );

  const leaveApproved = firstNumber(
    merged,
    [
      "leave_approved",
      "approved_leave",
      "approved_leaves",
    ],
  );

  const monthlyStudentsRaw = arrayFrom(
    merged,
    [
      "monthly_students",
      "student_growth",
      "students_growth",
    ],
  );

  const monthlyAttendanceRaw = arrayFrom(
    merged,
    [
      "monthly_attendance",
      "attendance_trend",
      "attendance_growth",
    ],
  );

  const classRaw = arrayFrom(
    merged,
    [
      "class_distribution",
      "students_by_class",
      "class_counts",
    ],
  );

  const departmentRaw = arrayFrom(
    merged,
    [
      "department_distribution",
      "students_by_department",
      "department_counts",
    ],
  );

  return {
    students,
    teachers,
    staff,
    parents,
    classes,

    maleStudents,
    femaleStudents,

    present,
    absent,
    late,

    feesExpected,
    feesPaid,
    feesOutstanding,

    booksIssued,
    booksReceived: 0,

    cbtExams,
    cbtResults,
    averageScore,

    leavePending,
    leaveApproved,

    monthlyStudents:
      monthlyStudentsRaw.length > 0
        ? monthlyStudentsRaw.map((item) =>
            typeof item === "object"
              ? firstNumber(item, ["value", "count", "students", "total"])
              : number(item),
          )
        : emptyData.monthlyStudents,

    monthlyAttendance:
      monthlyAttendanceRaw.length > 0
        ? monthlyAttendanceRaw.map((item) =>
            typeof item === "object"
              ? firstNumber(item, ["value", "count", "percentage", "attendance"])
              : number(item),
          )
        : emptyData.monthlyAttendance,

    classDistribution: classRaw.map((item: any, index: number) => ({
      name: safeLabel(
        item?.name ??
          item?.class_name ??
          item?.classroom_name ??
          item?.label,
        `Class ${index + 1}`,
      ),
      value: number(
        item?.value ??
          item?.count ??
          item?.students ??
          item?.student_count,
      ),
    })),

    classGenderDistribution: [],

    departmentDistribution: departmentRaw.map((item: any, index: number) => ({
      name: safeLabel(
        item?.name ??
          item?.department ??
          item?.label,
        `Department ${index + 1}`,
      ),
      value: number(
        item?.value ??
          item?.count ??
          item?.students ??
          item?.student_count,
      ),
    })),
  };
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  iconClass,
}: {
  title: string;
  value: string | number;
  icon: any;
  description: string;
  trend?: string;
  iconClass: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-50 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>

          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                <ArrowUpRight size={12} />
                {trend}
              </span>
            )}

            <span className="text-xs text-slate-400">
              {description}
            </span>
          </div>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        <Icon size={19} />
      </div>

      <div>
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function BarChart({
  values,
  labels,
  primaryColor,
}: {
  values: number[];
  labels: string[];
  primaryColor: string;
}) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-56 items-end gap-3">
      {values.map((value, index) => {
        const height = Math.max(5, (value / max) * 100);

        return (
          <div
            key={`${labels[index]}-${index}`}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="text-[10px] font-bold text-slate-500">
              {value}
            </div>

            <div className="flex h-40 w-full items-end rounded-t-xl bg-slate-50">
              <div
                className="w-full rounded-t-xl transition-all duration-700"
                style={{
                  height: `${height}%`,
                  background: `linear-gradient(to top, ${primaryColor}, ${primaryColor}99)`,
                }}
              />
            </div>

            <span className="text-[10px] font-semibold text-slate-400">
              {labels[index]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Donut({
  segments,
  total,
}: {
  segments: { value: number; label: string; className: string }[];
  total: number;
}) {
  let cursor = 0;

  const gradient = segments
    .map((segment) => {
      const start = total ? (cursor / total) * 100 : 0;
      cursor += segment.value;
      const end = total ? (cursor / total) * 100 : 0;

      const colour =
        segment.className.includes("rose")
          ? "primaryColor"
          : segment.className.includes("blue")
            ? "#3b82f6"
            : segment.className.includes("amber")
              ? "#f59e0b"
              : "#10b981";

      return `${colour} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="flex items-center gap-7">
      <div
        className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(${gradient || "#e2e8f0 0% 100%"})`,
        }}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
          <span className="text-2xl font-black text-slate-900">
            {total}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${segment.className}`}
            />
            <span className="text-xs font-semibold text-slate-600">
              {segment.label}
            </span>
            <span className="text-xs font-black text-slate-900">
              {segment.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


function extractArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function normalizeGender(value: any): "male" | "female" | null {
  const gender = String(value ?? "").trim().toLowerCase();

  if (gender === "male" || gender === "m") return "male";
  if (gender === "female" || gender === "f") return "female";

  return null;
}

function getSchoolPrimaryColor(school: any): string {
  return (
    school?.school_branding?.primary_color ||
    school?.school_branding?.primaryColor ||
    school?.branding?.primary_color ||
    school?.branding?.primaryColor ||
    school?.primary_color ||
    school?.primaryColor ||
    "primaryColor"
  );
}

export default function School360Dashboard() {
  const params = useParams();
  const schoolId = String(params?.schoolId ?? "");

  const [data, setData] = useState<DashboardData>(emptyData);
  const [school, setSchool] = useState<AnyRecord | null>(null);
  const [primaryColor, setPrimaryColor] = useState("primaryColor");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(showRefresh = false) {
    if (!schoolId) return;

    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const requests = [
        // School-level dashboard. This endpoint resolves the school
        // from the authenticated SCHOOL_ADMIN account.
        api.get(`/dashboard/school-360?school_id=${schoolId}`).catch(() => null),

        api.get(`/schools/${schoolId}`).catch(() => null),

        // Students endpoint is tenant-scoped; it does not accept school_id.
        api.get(`/students`).catch(() => null),

        api.get(`/teachers?school_id=${schoolId}`).catch(() => null),

        api.get(`/staff?school_id=${schoolId}`).catch(() => null),

        api.get(`/parents?school_id=${schoolId}`).catch(() => null),

        api.get(`/classes?school_id=${schoolId}`).catch(() => null),

        // Attendance is tenant-scoped and supports classroom/date filters.
        api.get(`/attendance`).catch(() => null),

        // Fees are exposed through student-fees, not /fees.
        api.get(`/fees/student-fees`).catch(() => null),

        api
          .get(`/cbt/schools/${schoolId}/exams`)
          .catch(() => null),

        api
          .get(`/cbt/schools/${schoolId}/results`)
          .catch(() => null),

        api
          .get(`/cbt/results/dashboard?school_id=${schoolId}`)
          .catch(() => null),

        // School Books
        api
          .get(`/school-books/${schoolId}`)
          .catch(() => null),

        api
          .get(`/school-books/${schoolId}/distribution-records`)
          .catch(() => null),

        // Staff Leave
        api
          .get(`/staff/leave?school_id=${schoolId}`)
          .catch(() => null),

        // Departments
        api
          .get(`/departments?school_id=${schoolId}`)
          .catch(() => null),
      ];

      const results = await Promise.all(requests);

      const successful = results
        .filter(Boolean)
        .map((item: any) => item?.data ?? item)
        .filter(Boolean);

      const schoolResponse = results[1]?.data ?? null;

      if (schoolResponse) {
        setSchool(schoolResponse);

        const branding =
          schoolResponse?.school_branding ??
          schoolResponse?.branding ??
          schoolResponse?.schoolBranding ??
          {};

        const brandPrimary =
          branding?.primary_color ??
          branding?.primaryColor ??
          schoolResponse?.primary_color ??
          schoolResponse?.primaryColor ??
          "primaryColor";

        if (
          typeof brandPrimary === "string" &&
          /^#[0-9a-fA-F]{6}$/.test(brandPrimary.trim())
        ) {
          setPrimaryColor(brandPrimary.trim());
        }
      }

      const peopleResponses = successful.map((item: any) => {
        if (Array.isArray(item)) {
          return {
            list: item,
            count: item.length,
          };
        }

        return item;
      });

      const extracted = extractDashboard(peopleResponses);
      // ============================================================
      // DIRECT SCHOOL 360 DATA NORMALIZATION
      // Do not guess response shapes. Each metric below is tied to
      // the exact endpoint used above.
      // ============================================================

      const unwrap = (index: number): any =>
        results[index]?.data ?? null;

      const toList = (value: any): any[] => {
        if (Array.isArray(value)) return value;

        if (Array.isArray(value?.items)) return value.items;

        if (Array.isArray(value?.data)) return value.data;

        if (Array.isArray(value?.results)) return value.results;

        return [];
      };

      const dashboardResponse = unwrap(0) || {};
      const students360 = toList(unwrap(2));
      const teachers360 = toList(unwrap(3));
      const staff360 = toList(unwrap(4));
      const parents360 = toList(unwrap(5));
      const classes360 = toList(unwrap(6));
      const attendance360 = toList(unwrap(7));
      const fees360 = toList(unwrap(8));
      const cbtExams360 = toList(unwrap(9));
      const cbtResults360 = toList(unwrap(10));
      const cbtDashboard360 = unwrap(11) || {};
      const books360 = toList(unwrap(12));
      const bookDistribution360 = toList(unwrap(13));

      // School Books:
      // publisher receipts are the source of truth for books received.
      let bookReceipts360: any[] = [];

      try {
        const bookReceiptsResponse = await api.get(
          `/school-books/${schoolId}/receipts`
        );

        bookReceipts360 = toList(
          bookReceiptsResponse.data
        );
      } catch {
        bookReceipts360 = [];
      }
      const leave360 = toList(unwrap(14));
      const departments360 = toList(unwrap(15));

      const numericValue = (...values: any[]): number => {
        for (const value of values) {
          if (value === null || value === undefined || value === "") {
            continue;
          }

          const number = Number(value);

          if (Number.isFinite(number)) {
            return number;
          }
        }

        return 0;
      };

      const studentCount =
        students360.length ||
        numericValue(
          dashboardResponse.total_students,
          dashboardResponse.students,
        );

      const teacherCount =
        teachers360.length ||
        numericValue(
          dashboardResponse.total_teachers,
          dashboardResponse.teachers,
        );

      const staffCount =
        staff360.length ||
        numericValue(
          dashboardResponse.total_staff,
          dashboardResponse.staff,
        );

      const parentCount =
        parents360.length ||
        numericValue(
          dashboardResponse.total_parents,
          dashboardResponse.parents,
        );

      const classCount =
        classes360.length ||
        numericValue(
          dashboardResponse.total_classes,
          dashboardResponse.classes,
        );

      // ------------------------------------------------------------
      // GENDER
      // ------------------------------------------------------------

      const maleCount = students360.filter((student: any) => {
        const gender = String(student?.gender || "").trim().toLowerCase();

        return gender === "male" || gender === "m";
      }).length;

      const femaleCount = students360.filter((student: any) => {
        const gender = String(student?.gender || "").trim().toLowerCase();

        return gender === "female" || gender === "f";
      }).length;

      // ------------------------------------------------------------
      // ATTENDANCE
      // ------------------------------------------------------------

      const attendanceStatus = (item: any): string =>
        String(
          item?.status ??
          item?.attendance_status ??
          "",
        )
          .trim()
          .toLowerCase();

      const presentCount = attendance360.filter(
        (item: any) =>
          attendanceStatus(item) === "present" ||
          attendanceStatus(item) === "p",
      ).length;

      const absentCount = attendance360.filter(
        (item: any) =>
          attendanceStatus(item) === "absent" ||
          attendanceStatus(item) === "a",
      ).length;

      const lateCount = attendance360.filter(
        (item: any) =>
          attendanceStatus(item) === "late" ||
          attendanceStatus(item) === "l",
      ).length;

      const attendanceTotal =
        presentCount + absentCount + lateCount;

      const attendanceRate =
        attendanceTotal > 0
          ? Number(
              ((presentCount / attendanceTotal) * 100).toFixed(1),
            )
          : 0;

      // ------------------------------------------------------------
      // ATTENDANCE MONTHLY TREND - JANUARY TO CURRENT MONTH
      // ------------------------------------------------------------

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const reportingMonthCount = currentDate.getMonth() + 1;

      const monthlyAttendance = Array.from(
        { length: reportingMonthCount },
        (_, monthIndex) => {
          const monthRows = attendance360.filter((item: any) => {
            const rawDate =
              item?.attendance_date ??
              item?.attendanceDate ??
              item?.date;

            if (!rawDate) return false;

            const parsed = new Date(rawDate);

            if (Number.isNaN(parsed.getTime())) return false;

            return (
              parsed.getFullYear() === currentYear &&
              parsed.getMonth() === monthIndex
            );
          });

          if (!monthRows.length) return 0;

          const present = monthRows.filter(
            (item: any) =>
              attendanceStatus(item) === "present" ||
              attendanceStatus(item) === "p",
          ).length;

          return Number(
            ((present / monthRows.length) * 100).toFixed(1),
          );
        },
      );

      // ------------------------------------------------------------
      // STUDENT GROWTH - JANUARY TO CURRENT MONTH
      // ------------------------------------------------------------

      const dashboardMonthlyStudents =
        Array.isArray(dashboardResponse.monthly_students)
          ? dashboardResponse.monthly_students.map(
              (value: any) => numericValue(value),
            )
          : [];

      const monthlyStudents =
        dashboardMonthlyStudents.length >= reportingMonthCount
          ? dashboardMonthlyStudents.slice(0, reportingMonthCount)
          : Array.from(
              { length: reportingMonthCount },
              (_, monthIndex) => {
                return students360.filter((student: any) => {
                  const rawDate =
                    student?.created_at ??
                    student?.createdAt ??
                    student?.admission_date ??
                    student?.date_admitted;

                  if (!rawDate) return false;

                  const parsed = new Date(rawDate);

                  if (Number.isNaN(parsed.getTime())) return false;

                  return (
                    parsed.getFullYear() === currentYear &&
                    parsed.getMonth() === monthIndex
                  );
                }).length;
              },
            );

      // ------------------------------------------------------------
      // FEES
      // ------------------------------------------------------------

      const feesExpected = fees360.reduce(
        (sum: number, item: any) =>
          sum +
          numericValue(
            item?.amount_due,
            item?.amountDue,
          ),
        0,
      );

      const feesPaid = fees360.reduce(
        (sum: number, item: any) =>
          sum +
          numericValue(
            item?.amount_paid,
            item?.amountPaid,
          ),
        0,
      );

      const feesOutstanding = Math.max(
        fees360.reduce(
          (sum: number, item: any) =>
            sum +
            numericValue(
              item?.balance,
              item?.outstanding_balance,
              item?.outstandingBalance,
              numericValue(
                item?.amount_due,
                item?.amountDue,
              ) -
                numericValue(
                  item?.amount_paid,
                  item?.amountPaid,
                ),
            ),
          0,
        ),
        0,
      );

      const feeCollectionRate =
        feesExpected > 0
          ? Number(
              ((feesPaid / feesExpected) * 100).toFixed(1),
            )
          : 0;

      // ------------------------------------------------------------
      // CBT
      // ------------------------------------------------------------

      const cbtExams =
        cbtExams360.length ||
        numericValue(
          dashboardResponse.cbt_exams,
          dashboardResponse.total_cbt_exams,
        );

      const cbtResults =
        cbtResults360.length ||
        numericValue(
          cbtDashboard360.total_attempts,
          cbtDashboard360.total_results,
          dashboardResponse.cbt_results,
        );

      let averageScore = numericValue(
        cbtDashboard360.average_score,
        cbtDashboard360.averageScore,
      );

      if (!averageScore && cbtResults360.length) {
        const scores = cbtResults360
          .map((item: any) =>
            numericValue(
              item?.score,
              item?.percentage,
              item?.average_score,
              item?.averageScore,
            ),
          )
          .filter((score: number) => score > 0);

        if (scores.length) {
          averageScore = Number(
            (
              scores.reduce(
                (sum: number, score: number) =>
                  sum + score,
                0,
              ) / scores.length
            ).toFixed(1),
          );
        }
      }

      // ------------------------------------------------------------
      // SCHOOL BOOKS
      // ------------------------------------------------------------

      // Total quantity received from publishers.
      const booksReceived = bookReceipts360.reduce(
        (sum: number, item: any) =>
          sum +
          numericValue(
            item?.quantity_received,
            item?.quantityReceived,
          ),
        0,
      );

      // Total quantity issued out to students.
      const booksIssued = bookDistribution360.reduce(
        (sum: number, item: any) =>
          sum +
          numericValue(
            item?.quantity_issued,
            item?.quantityIssued,
          ),
        0,
      );

      // ------------------------------------------------------------
      // STAFF LEAVE
      // ------------------------------------------------------------

      const leaveStatus = (item: any): string =>
        String(
          item?.status ??
          item?.leave_status ??
          "",
        )
          .trim()
          .toLowerCase();

      const leavePending = leave360.filter(
        (item: any) =>
          leaveStatus(item) === "pending",
      ).length;

      const leaveApproved = leave360.filter(
        (item: any) =>
          leaveStatus(item) === "approved" ||
          leaveStatus(item) === "approve",
      ).length;

      // ------------------------------------------------------------
      // CLASS DISTRIBUTION
      // ------------------------------------------------------------

      const classNameMap = new Map<string, number>();

      for (const classroom of classes360) {
        const name = String(
          classroom?.name ??
          classroom?.title ??
          `Class ${classroom?.id ?? ""}`,
        ).trim();

        if (name) {
          classNameMap.set(name, 0);
        }
      }

      for (const student of students360) {
        let className =
          student?.class_name ??
          student?.className ??
          "";

        if (!className) {
          const classroomId =
            student?.classroom_id ??
            student?.class_id ??
            null;

          const classroom = classes360.find(
            (item: any) =>
              String(item?.id) === String(classroomId),
          );

          className =
            classroom?.name ??
            classroom?.title ??
            "";
        }

        className = String(className).trim();

        if (className) {
          classNameMap.set(
            className,
            (classNameMap.get(className) || 0) + 1,
          );
        }
      }

      const classDistribution = Array.from(
        classNameMap.entries(),
      )
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({
          name,
          value,
        }));

      // ------------------------------------------------------------
      // DEPARTMENT DISTRIBUTION
      // ------------------------------------------------------------

      const departmentNameMap = new Map<string, number>();

      for (const department of departments360) {
        const name = String(
          department?.name ??
          department?.title ??
          `Department ${department?.id ?? ""}`,
        ).trim();

        if (name) {
          departmentNameMap.set(name, 0);
        }
      }

      for (const student of students360) {
        let departmentName =
          student?.department_name ??
          student?.departmentName ??
          student?.department ??
          "";

        if (!departmentName) {
          const departmentId =
            student?.department_id ??
            null;

          const department = departments360.find(
            (item: any) =>
              String(item?.id) ===
              String(departmentId),
          );

          departmentName =
            department?.name ??
            department?.title ??
            "";
        }

        departmentName = String(
          departmentName,
        ).trim();

        if (departmentName) {
          departmentNameMap.set(
            departmentName,
            (departmentNameMap.get(departmentName) || 0) +
              1,
          );
        }
      }

      const departmentDistribution = Array.from(
        departmentNameMap.entries(),
      )
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({
          name,
          value,
        }));

      // ------------------------------------------------------------
      // OVERRIDE THE GENERIC INFERENCE WITH VERIFIED ENDPOINT DATA
      // ------------------------------------------------------------

      // ------------------------------------------------------------
      // STUDENTS BY CLASS + GENDER
      // ------------------------------------------------------------

      const classNameById = new Map<string, string>();

      for (const classroom of classes360) {
        const id =
          classroom?.id ??
          classroom?.classroom_id ??
          classroom?.class_id;

        const name = String(
          classroom?.name ??
          classroom?.title ??
          classroom?.class_name ??
          classroom?.classroom_name ??
          "",
        ).trim();

        if (id !== undefined && id !== null && name) {
          classNameById.set(String(id), name);
        }
      }

      const classGenderMap = new Map<
        string,
        {
          name: string;
          male: number;
          female: number;
          total: number;
        }
      >();

      for (const student of students360) {
        const rawClassId =
          student?.classroom_id ??
          student?.class_id ??
          student?.classroomId ??
          student?.classId;

        const className = String(
          student?.class_name ??
          student?.className ??
          student?.classroom_name ??
          student?.classroomName ??
          student?.classroom?.name ??
          student?.class?.name ??
          (rawClassId !== undefined && rawClassId !== null
            ? classNameById.get(String(rawClassId))
            : undefined) ??
          "Unassigned",
        ).trim();

        const key = className || "Unassigned";

        if (!classGenderMap.has(key)) {
          classGenderMap.set(key, {
            name: key,
            male: 0,
            female: 0,
            total: 0,
          });
        }

        const entry = classGenderMap.get(key)!;

        const gender = String(
          student?.gender ??
          student?.sex ??
          "",
        )
          .trim()
          .toLowerCase();

        if (
          gender === "male" ||
          gender === "m" ||
          gender === "boy"
        ) {
          entry.male += 1;
        } else if (
          gender === "female" ||
          gender === "f" ||
          gender === "girl"
        ) {
          entry.female += 1;
        }

        entry.total += 1;
      }

      const classGenderDistribution = Array.from(
        classGenderMap.values(),
      ).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

      Object.assign(extracted, {
        students: studentCount,
        teachers: teacherCount,
        staff: staffCount,
        parents: parentCount,
        classes: classCount,

        maleStudents: maleCount,
        femaleStudents: femaleCount,

        present: presentCount,
        absent: absentCount,
        late: lateCount,

        feesExpected,
        feesPaid,
        feesOutstanding,

        booksReceived,
        booksIssued,

        cbtExams,
        cbtResults,
        averageScore,

        leavePending,
        leaveApproved,

        monthlyStudents,
        monthlyAttendance,

        classDistribution,
        classGenderDistribution,
        departmentDistribution,

        attendanceRate,
        feeCollectionRate,

        // Preserve useful backend totals when available.
        totalSchools: numericValue(
          dashboardResponse.total_schools,
          dashboardResponse.totalSchools,
          1,
        ),
      });


      const studentList = successful.find(
        (item: any) =>
          Array.isArray(item) &&
          item.some(
            (row: any) =>
              row?.student_id !== undefined ||
              row?.studentId !== undefined ||
              row?.admission_number !== undefined,
          ),
      );

      const teacherList = successful.find(
        (item: any) =>
          Array.isArray(item) &&
          item.some(
            (row: any) =>
              row?.teacher_id !== undefined ||
              row?.teacherId !== undefined,
          ),
      );

      const staffList = successful.find(
        (item: any) =>
          Array.isArray(item) &&
          item.some(
            (row: any) =>
              row?.employee_number !== undefined ||
              row?.job_title !== undefined,
          ),
      );

      const parentList = successful.find(
        (item: any) =>
          Array.isArray(item) &&
          item.some(
            (row: any) =>
              row?.parent_id !== undefined ||
              row?.parentId !== undefined,
          ),
      );

      const classList = successful.find(
        (item: any) =>
          Array.isArray(item) &&
          item.some(
            (row: any) =>
              row?.class_name !== undefined ||
              row?.classroom_name !== undefined ||
              row?.level_id !== undefined,
          ),
      );

      const rawStudentResponse = results[2]?.data ?? [];

      const rawStudents = Array.isArray(rawStudentResponse)
        ? rawStudentResponse
        : arrayFrom(rawStudentResponse, [
            "students",
            "items",
            "data",
            "results",
          ]);

      const derivedMaleStudents = rawStudents.filter((student: AnyRecord) => {
        const gender = String(
          student?.gender ??
            student?.sex ??
            student?.student_gender ??
            "",
        )
          .trim()
          .toLowerCase();

        return (
          gender === "male" ||
          gender === "m" ||
          gender === "boy"
        );
      }).length;

      const derivedFemaleStudents = rawStudents.filter(
        (student: AnyRecord) => {
          const gender = String(
            student?.gender ??
              student?.sex ??
              student?.student_gender ??
              "",
          )
            .trim()
            .toLowerCase();

          return (
            gender === "female" ||
            gender === "f" ||
            gender === "girl"
          );
        },
      ).length;

      const finalData: DashboardData = {
        ...extracted,

        students:
          extracted.students ||
          rawStudents.length ||
          (Array.isArray(studentList) ? studentList.length : 0),

        teachers:
          extracted.teachers ||
          (Array.isArray(teacherList) ? teacherList.length : 0),

        staff:
          extracted.staff ||
          (Array.isArray(staffList) ? staffList.length : 0),

        parents:
          extracted.parents ||
          (Array.isArray(parentList) ? parentList.length : 0),

        classes:
          extracted.classes ||
          (Array.isArray(classList) ? classList.length : 0),

        maleStudents: derivedMaleStudents,
        femaleStudents: derivedFemaleStudents,
      };

      if (
        finalData.students === 0 &&
        finalData.teachers === 0 &&
        finalData.staff === 0 &&
        finalData.parents === 0
      ) {
        setError(
          "Some analytics endpoints did not return dashboard totals. The dashboard is ready and will populate automatically as the school data endpoints return records.",
        );
      }

      setData(finalData);
    } catch (err) {
      console.error("School 360 dashboard error:", err);

      setError(
        "Unable to load some school analytics. Please refresh and try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [schoolId]);

  const totalAttendance =
    data.present + data.absent + data.late;

  const attendanceRate = percentage(
    data.present,
    totalAttendance,
  );

  const feeRate = percentage(
    data.feesPaid,
    data.feesExpected,
  );

  const bookPart = percentage(
    data.booksIssued,
    data.booksReceived,
  );

  const maleFemaleTotal =
    data.maleStudents + data.femaleStudents;

  const malePercentage = percentage(
    data.maleStudents,
    maleFemaleTotal,
  );

  const femalePercentage = percentage(
    data.femaleStudents,
    maleFemaleTotal,
  );

  const monthlyLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ].slice(
    0,
    Math.max(
      data.monthlyStudents.length,
      data.monthlyAttendance.length,
      1,
    ),
  );

  const populationTotal =
    data.students +
    data.teachers +
    data.staff +
    data.parents;

  const healthScore = useMemo(() => {
    const attendancePart = attendanceRate;
    const feePart = feeRate;

    return Math.round(
      attendancePart * 0.45 +
        feePart * 0.35 +
        bookPart * 0.2,
    );
  }, [
    attendanceRate,
    feeRate,
    data.booksIssued,
    data.booksReceived,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
            <Loader2
              size={28}
              className="animate-spin text-rose-500"
            />
          </div>

          <p className="mt-4 text-sm font-bold text-slate-700">
            Loading School 360° Intelligence...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Preparing your school analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f7f8fc] pb-12"
      style={
        {
          "--school-primary": primaryColor,
          "--school-primary-soft": `${primaryColor}18`,
          "--school-primary-border": `${primaryColor}35`,
        } as React.CSSProperties
      }
    >
      {/* HERO */}
      <div
        className="relative overflow-hidden px-5 py-8 text-white md:px-8"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, #111827 72%)`,
        }}
      >
        <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-[1600px]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-rose-300">
                <Sparkles size={15} />
                CoreOne School Intelligence
              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                {school?.name || "School"} 360°
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                A complete operational view of students, teachers,
                staff, parents, academics, attendance, finance and
                digital school activity.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    School Code
                  </p>
                  <p className="mt-1 text-sm font-black text-white">
                    {school?.school_code || "�"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    School URL
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-white">
                    {school?.school_code
                      ? `https://coreone-one.vercel.app/${String(
                          school.school_code,
                        ).toLowerCase()}`
                      : "�"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  School Health
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <span className="text-xl font-black">
                    {healthScore}%
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/15 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] space-y-8 px-5 py-7 md:px-8">
        {/* POPULATION */}
        <section>
          <SectionTitle
            icon={Users}
            title="School Population"
            description="360° view of the people who make up the school community"
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Students"
              value={data.students.toLocaleString()}
              icon={GraduationCap}
              description="enrolled students"
              trend="Live"
              iconClass="bg-rose-50 text-rose-500"
            />

            <StatCard
              title="Teachers"
              value={data.teachers.toLocaleString()}
              icon={UserCheck}
              description="teaching personnel"
              trend="Live"
              iconClass="bg-blue-50 text-blue-500"
            />

            <StatCard
              title="Staff"
              value={data.staff.toLocaleString()}
              icon={BriefcaseBusiness}
              description="non-teaching staff"
              trend="Live"
              iconClass="bg-violet-50 text-violet-500"
            />

            <StatCard
              title="Parents"
              value={data.parents.toLocaleString()}
              icon={HeartHandshake}
              description="registered parents"
              trend="Live"
              iconClass="bg-emerald-50 text-emerald-500"
            />

            <StatCard
              title="Classes"
              value={data.classes.toLocaleString()}
              icon={School}
              description="active classrooms"
              iconClass="bg-orange-50 text-orange-500"
            />
          </div>
        </section>

        {/* GROWTH + GENDER */}
        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={TrendingUp}
              title="Student Growth"
              description="Population movement across the reporting period"
            />

            <BarChart
              values={data.monthlyStudents}
              labels={monthlyLabels}
              primaryColor={primaryColor}
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={UserRound}
              title="Student Gender Distribution"
              description="Current student population composition"
            />

            <Donut
              total={maleFemaleTotal}
              segments={[
                {
                  value: data.maleStudents,
                  label: `Male ${malePercentage}%`,
                  className: "bg-blue-500",
                },
                {
                  value: data.femaleStudents,
                  label: `Female ${femalePercentage}%`,
                  className: "bg-rose-500",
                },
              ]}
            />

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-500">MALE</p>
                <p className="mt-1 text-2xl font-black text-blue-900">
                  {data.maleStudents}
                </p>
              </div>

              <div className="rounded-2xl bg-rose-50 p-4">
                <p className="text-xs font-bold text-rose-500">
                  FEMALE
                </p>
                <p className="mt-1 text-2xl font-black text-rose-900">
                  {data.femaleStudents}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ATTENDANCE */}
        <section>
          <SectionTitle
            icon={CalendarCheck2}
            title="Attendance Intelligence"
            description="Monitor daily presence, absence and punctuality"
          />

          <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Attendance Rate
                  </p>

                  <p className="mt-2 text-4xl font-black text-slate-900">
                    {attendanceRate}%
                  </p>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                  <Target size={28} />
                </div>
              </div>

              <div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${attendanceRate}%`,
                    background: primaryColor,
                  }}
                />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <p className="text-[10px] font-bold text-emerald-600">
                    PRESENT
                  </p>
                  <p className="mt-1 text-xl font-black text-emerald-900">
                    {data.present}
                  </p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-3">
                  <p className="text-[10px] font-bold text-rose-600">
                    ABSENT
                  </p>
                  <p className="mt-1 text-xl font-black text-rose-900">
                    {data.absent}
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-3">
                  <p className="text-[10px] font-bold text-amber-600">
                    LATE
                  </p>
                  <p className="mt-1 text-xl font-black text-amber-900">
                    {data.late}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionTitle
                icon={Activity}
                title="Attendance Trend"
                description="Recent attendance movement"
              />

              <BarChart
                values={data.monthlyAttendance}
                labels={monthlyLabels}
                primaryColor={primaryColor}
              />
            </div>
          </div>
        </section>

        {/* FINANCE */}
        <section>
          <SectionTitle
            icon={Wallet}
            title="Financial Intelligence"
            description="School fee collection and outstanding obligations"
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="flex flex-col justify-between gap-5 md:flex-row">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Fee Collection
                  </p>

                  <p className="mt-2 text-4xl font-black text-slate-900">
                    {feeRate}%
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    of expected fees collected
                  </p>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <CircleDollarSign size={30} />
                </div>
              </div>

              <div className="mt-7 h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${feeRate}%`,
                    background: primaryColor,
                  }}
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400">
                    EXPECTED
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-900">
                    {currency(data.feesExpected)}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-bold text-emerald-600">
                    COLLECTED
                  </p>
                  <p className="mt-1 text-lg font-black text-emerald-900">
                    {currency(data.feesPaid)}
                  </p>
                </div>

                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-xs font-bold text-rose-600">
                    OUTSTANDING
                  </p>
                  <p className="mt-1 text-lg font-black text-rose-900">
                    {currency(data.feesOutstanding)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm">
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <CircleDollarSign size={24} />
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Outstanding Fees
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {currency(data.feesOutstanding)}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs text-slate-400">
                    Collection efficiency
                  </span>

                  <span className="text-sm font-black text-emerald-400">
                    {feeRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACADEMICS */}
        <section>
          <SectionTitle
            icon={GraduationCap}
            title="Academic & CBT Intelligence"
            description="Examinations, digital assessments and academic activity"
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="CBT Exams"
              value={data.cbtExams}
              icon={BookOpen}
              description="created examinations"
              iconClass="bg-violet-50 text-violet-500"
            />

            <StatCard
              title="Results"
              value={data.cbtResults}
              icon={Activity}
              description="recorded results"
              iconClass="bg-blue-50 text-blue-500"
            />

            <StatCard
              title="Average Score"
              value={`${data.averageScore}%`}
              icon={Target}
              description="overall CBT average"
              iconClass="bg-emerald-50 text-emerald-500"
            />

            <StatCard
              title="Classes"
              value={data.classes}
              icon={School}
              description="academic groups"
              iconClass="bg-orange-50 text-orange-500"
            />
          </div>
        </section>

        {/* BOOKS + LEAVE */}
        <section className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={BookOpen}
              title="School Books"
              description="Publisher receipts and student book issues"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-emerald-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                  <BookOpen size={22} />
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Books received
                </p>

                <p className="mt-1 text-3xl font-black text-emerald-950">
                  {data.booksReceived}
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  received from publisher
                </p>
              </div>

              <div className="rounded-3xl bg-indigo-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-indigo-500 shadow-sm">
                  <BookOpen size={22} />
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Books issued
                </p>

                <p className="mt-1 text-3xl font-black text-indigo-950">
                  {data.booksIssued}
                </p>

                <p className="mt-1 text-xs text-indigo-700">
                  issued out to students
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={BriefcaseBusiness}
              title="Staff Leave"
              description="Current staff leave activity"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-amber-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-sm">
                  <CalendarCheck2 size={22} />
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-amber-600">
                  Pending
                </p>

                <p className="mt-1 text-3xl font-black text-amber-950">
                  {data.leavePending}
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  awaiting review
                </p>
              </div>

              <div className="rounded-3xl bg-emerald-50 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                  <UserCheck size={22} />
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Approved
                </p>

                <p className="mt-1 text-3xl font-black text-emerald-950">
                  {data.leaveApproved}
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  approved requests
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CLASS / DEPARTMENT */}
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={School}
              title="Students by Class"
              description="Population distribution across classes"
            />

            {data.classDistribution.length > 0 ? (
              <div className="space-y-4">
                {data.classDistribution
                  .slice(0, 10)
                  .map((item, index) => {
                    const max = Math.max(
                      ...data.classDistribution.map(
                        (row) => row.value,
                      ),
                      1,
                    );

                    return (
                      <div key={`${item.name}-${index}`}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">
                            {item.name}
                          </span>

                          <span className="text-xs font-black text-slate-900">
                            {item.value}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(
                                4,
                                (item.value / max) * 100,
                              )}%`,
                              background: primaryColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-2xl bg-slate-50 text-center">
                <div>
                  <School
                    size={28}
                    className="mx-auto text-slate-300"
                  />
                  <p className="mt-3 text-sm font-bold text-slate-500">
                    Class distribution will appear here
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Once class-level analytics are available
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionTitle
              icon={GraduationCap}
              title="Students by Class — Gender"
              description="Male and female students in each class"
            />

            {data.classGenderDistribution.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <div className="min-w-[680px]">
                  <div className="mb-5 flex items-center justify-center gap-6 text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-sky-500" />
                      Male
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-pink-500" />
                      Female
                    </div>
                  </div>

                  <div className="flex h-80 items-end gap-4 overflow-x-auto border-b border-l border-slate-200 px-4 pt-6">
                    {data.classGenderDistribution.map((item) => (
                      <div
                        key={item.name}
                        className="flex min-w-[84px] flex-1 flex-col items-center justify-end"
                      >
                        <div className="flex h-64 items-end gap-2">
                          <div className="flex h-full flex-col items-center justify-end">
                            <span className="mb-2 text-xs font-black text-slate-700">
                              {item.male}
                            </span>

                            <div
                              className="w-7 rounded-t-lg bg-sky-500 transition-all duration-500"
                              style={{
                                height: `${Math.max(
                                  item.male > 0 ? 8 : 2,
                                  (item.male /
                                    Math.max(
                                      ...data.classGenderDistribution.map(
                                        (row) =>
                                          Math.max(
                                            row.male,
                                            row.female,
                                          ),
                                      ),
                                      1,
                                    )) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>

                          <div className="flex h-full flex-col items-center justify-end">
                            <span className="mb-2 text-xs font-black text-slate-700">
                              {item.female}
                            </span>

                            <div
                              className="w-7 rounded-t-lg bg-pink-500 transition-all duration-500"
                              style={{
                                height: `${Math.max(
                                  item.female > 0 ? 8 : 2,
                                  (item.female /
                                    Math.max(
                                      ...data.classGenderDistribution.map(
                                        (row) =>
                                          Math.max(
                                            row.male,
                                            row.female,
                                          ),
                                      ),
                                      1,
                                    )) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <p className="mt-4 text-center text-xs font-black text-slate-700">
                          {item.name}
                        </p>

                        <p className="mt-1 text-[11px] font-semibold text-slate-400">
                          {item.total} students
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-48 items-center justify-center rounded-2xl bg-slate-50 text-center">
                <div>
                  <GraduationCap
                    size={28}
                    className="mx-auto text-slate-300"
                  />
                  <p className="mt-3 text-sm font-bold text-slate-500">
                    No class student data available
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Male and female student counts will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PEOPLE MIX */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <SectionTitle
            icon={Users}
            title="School Community Mix"
            description="Relative size of the major school populations"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Students",
                value: data.students,
                icon: GraduationCap,
                className: "bg-rose-50 text-rose-500",
              },
              {
                label: "Teachers",
                value: data.teachers,
                icon: UserCheck,
                className: "bg-blue-50 text-blue-500",
              },
              {
                label: "Staff",
                value: data.staff,
                icon: BriefcaseBusiness,
                className: "bg-violet-50 text-violet-500",
              },
              {
                label: "Parents",
                value: data.parents,
                icon: HeartHandshake,
                className: "bg-emerald-50 text-emerald-500",
              },
            ].map((item) => {
              const share = percentage(
                item.value,
                populationTotal,
              );

              return (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.className}`}
                    >
                      <item.icon size={21} />
                    </div>

                    <span className="text-xs font-black text-slate-400">
                      {share}%
                    </span>
                  </div>

                  <p className="mt-5 text-sm font-semibold text-slate-500">
                    {item.label}
                  </p>

                  <p className="mt-1 text-3xl font-black text-slate-900">
                    {item.value.toLocaleString()}
                  </p>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(2, share)}%`,
                        background: primaryColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* EXECUTIVE SUMMARY */}
        <section
          className="overflow-hidden rounded-3xl p-6 text-white shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC, #111827)`,
          }}
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                <Sparkles size={15} />
                Executive Snapshot
              </div>

              <h2 className="mt-2 text-2xl font-black">
                School performance at a glance
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
                CoreOne brings together the major operational
                indicators of the school into one management view,
                helping the School Admin understand population,
                attendance, academics, finance, books and staff
                activity from one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-bold text-white/60">
                  PEOPLE
                </p>
                <p className="mt-1 text-2xl font-black">
                  {populationTotal.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-bold text-white/60">
                  ATTENDANCE
                </p>
                <p className="mt-1 text-2xl font-black">
                  {attendanceRate}%
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-bold text-white/60">
                  FEES
                </p>
                <p className="mt-1 text-2xl font-black">
                  {feeRate}%
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-bold text-white/60">
                  CBT
                </p>
                <p className="mt-1 text-2xl font-black">
                  {data.averageScore}%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK NAV */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Explore School Intelligence
              </h2>
              <p className="text-xs text-slate-400">
                Jump into detailed management areas
              </p>
            </div>

            <MoreHorizontal
              size={20}
              className="text-slate-300"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Registered Users",
                href: `/dashboard/schools/${schoolId}/registered-users`,
                icon: UserCog,
              },
              {
                title: "School Admins",
                href: `/dashboard/schools/${schoolId}/admins`,
                icon: Settings,
              },
              {
                title: "Students",
                href: `/dashboard/schools/${schoolId}/students`,
                icon: GraduationCap,
              },
              {
                title: "Teachers",
                href: `/dashboard/schools/${schoolId}/teachers`,
                icon: UserCheck,
              },
              {
                title: "Staff",
                href: `/dashboard/schools/${schoolId}/staff`,
                icon: BriefcaseBusiness,
              },
              {
                title: "Parents",
                href: `/dashboard/schools/${schoolId}/parents`,
                icon: HeartHandshake,
              },
              {
                title: "Academics",
                href: `/dashboard/schools/${schoolId}/academics`,
                icon: BookOpen,
              },
              {
                title: "Attendance",
                href: `/dashboard/schools/${schoolId}/attendance`,
                icon: CalendarCheck2,
              },
              {
                title: "Results",
                href: `/dashboard/schools/${schoolId}/results`,
                icon: BookOpen,
              },
              {
                title: "Events",
                href: `/dashboard/schools/${schoolId}/events`,
                icon: CalendarDays,
              },
              {
                title: "Learning Centre",
                href: `/dashboard/schools/${schoolId}/learning`,
                icon: LibraryBig,
              },
              {
                title: "CBT",
                href: `/dashboard/schools/${schoolId}/cbt`,
                icon: FileQuestion,
              },
              {
                title: "Ebooks",
                href: `/dashboard/schools/${schoolId}/ebooks`,
                icon: BookOpen,
              },
              {
                title: "Internal Browser",
                href: `/dashboard/schools/${schoolId}/browser`,
                icon: Globe,
              },
              {
                title: "YouTube Learning",
                href: `/dashboard/schools/${schoolId}/youtube-learning`,
                icon: MonitorPlay,
              },
              {
                title: "Fees & Payments",
                href: `/dashboard/schools/${schoolId}/school-fees`,
                icon: Wallet,
              },
              {
                title: "CBT Results",
                href: `/dashboard/schools/${schoolId}/cbt/results`,
                icon: Target,
              },
              {
                title: "School Books",
                href: `/dashboard/schools/${schoolId}/school-books`,
                icon: BookOpen,
              },
            ].map((item, index) => {
              const cardThemes = [
                {
                  card: "border-indigo-100 bg-indigo-50/40 hover:border-indigo-200 hover:bg-indigo-50",
                  icon: "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200 group-hover:text-indigo-700",
                  arrow: "text-indigo-300 group-hover:text-indigo-500",
                },
                {
                  card: "border-purple-100 bg-purple-50/40 hover:border-purple-200 hover:bg-purple-50",
                  icon: "bg-purple-100 text-purple-600 group-hover:bg-purple-200 group-hover:text-purple-700",
                  arrow: "text-purple-300 group-hover:text-purple-500",
                },
                {
                  card: "border-blue-100 bg-blue-50/40 hover:border-blue-200 hover:bg-blue-50",
                  icon: "bg-blue-100 text-blue-600 group-hover:bg-blue-200 group-hover:text-blue-700",
                  arrow: "text-blue-300 group-hover:text-blue-500",
                },
                {
                  card: "border-emerald-100 bg-emerald-50/40 hover:border-emerald-200 hover:bg-emerald-50",
                  icon: "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 group-hover:text-emerald-700",
                  arrow: "text-emerald-300 group-hover:text-emerald-500",
                },
                {
                  card: "border-amber-100 bg-amber-50/40 hover:border-amber-200 hover:bg-amber-50",
                  icon: "bg-amber-100 text-amber-600 group-hover:bg-amber-200 group-hover:text-amber-700",
                  arrow: "text-amber-300 group-hover:text-amber-500",
                },
                {
                  card: "border-rose-100 bg-rose-50/40 hover:border-rose-200 hover:bg-rose-50",
                  icon: "bg-rose-100 text-rose-600 group-hover:bg-rose-200 group-hover:text-rose-700",
                  arrow: "text-rose-300 group-hover:text-rose-500",
                },
                {
                  card: "border-cyan-100 bg-cyan-50/40 hover:border-cyan-200 hover:bg-cyan-50",
                  icon: "bg-cyan-100 text-cyan-600 group-hover:bg-cyan-200 group-hover:text-cyan-700",
                  arrow: "text-cyan-300 group-hover:text-cyan-500",
                },
                {
                  card: "border-teal-100 bg-teal-50/40 hover:border-teal-200 hover:bg-teal-50",
                  icon: "bg-teal-100 text-teal-600 group-hover:bg-teal-200 group-hover:text-teal-700",
                  arrow: "text-teal-300 group-hover:text-teal-500",
                },
                {
                  card: "border-violet-100 bg-violet-50/40 hover:border-violet-200 hover:bg-violet-50",
                  icon: "bg-violet-100 text-violet-600 group-hover:bg-violet-200 group-hover:text-violet-700",
                  arrow: "text-violet-300 group-hover:text-violet-500",
                },
                {
                  card: "border-orange-100 bg-orange-50/40 hover:border-orange-200 hover:bg-orange-50",
                  icon: "bg-orange-100 text-orange-600 group-hover:bg-orange-200 group-hover:text-orange-700",
                  arrow: "text-orange-300 group-hover:text-orange-500",
                },
                {
                  card: "border-sky-100 bg-sky-50/40 hover:border-sky-200 hover:bg-sky-50",
                  icon: "bg-sky-100 text-sky-600 group-hover:bg-sky-200 group-hover:text-sky-700",
                  arrow: "text-sky-300 group-hover:text-sky-500",
                },
                {
                  card: "border-fuchsia-100 bg-fuchsia-50/40 hover:border-fuchsia-200 hover:bg-fuchsia-50",
                  icon: "bg-fuchsia-100 text-fuchsia-600 group-hover:bg-fuchsia-200 group-hover:text-fuchsia-700",
                  arrow: "text-fuchsia-300 group-hover:text-fuchsia-500",
                },
                {
                  card: "border-pink-100 bg-pink-50/40 hover:border-pink-200 hover:bg-pink-50",
                  icon: "bg-pink-100 text-pink-600 group-hover:bg-pink-200 group-hover:text-pink-700",
                  arrow: "text-pink-300 group-hover:text-pink-500",
                },
                {
                  card: "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100",
                  icon: "bg-slate-200 text-slate-600 group-hover:bg-slate-300 group-hover:text-slate-700",
                  arrow: "text-slate-300 group-hover:text-slate-500",
                },
                {
                  card: "border-red-100 bg-red-50/40 hover:border-red-200 hover:bg-red-50",
                  icon: "bg-red-100 text-red-600 group-hover:bg-red-200 group-hover:text-red-700",
                  arrow: "text-red-300 group-hover:text-red-500",
                },
                {
                  card: "border-green-100 bg-green-50/40 hover:border-green-200 hover:bg-green-50",
                  icon: "bg-green-100 text-green-600 group-hover:bg-green-200 group-hover:text-green-700",
                  arrow: "text-green-300 group-hover:text-green-500",
                },
                {
                  card: "border-lime-100 bg-lime-50/40 hover:border-lime-200 hover:bg-lime-50",
                  icon: "bg-lime-100 text-lime-600 group-hover:bg-lime-200 group-hover:text-lime-700",
                  arrow: "text-lime-300 group-hover:text-lime-500",
                },
                {
                  card: "border-yellow-100 bg-yellow-50/40 hover:border-yellow-200 hover:bg-yellow-50",
                  icon: "bg-yellow-100 text-yellow-700 group-hover:bg-yellow-200 group-hover:text-yellow-800",
                  arrow: "text-yellow-300 group-hover:text-yellow-500",
                },
              ];

              const theme = cardThemes[index % cardThemes.length];

              return (
                <a
                  key={item.title}
                  href={item.href}
                  className={`group flex items-center justify-between rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${theme.icon}`}
                    >
                      <item.icon size={19} />
                    </div>

                    <span className="text-sm font-bold text-slate-700">
                      {item.title}
                    </span>
                  </div>

                  <ChevronRight
                    size={17}
                    className={`transition group-hover:translate-x-1 ${theme.arrow}`}
                  />
                </a>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}