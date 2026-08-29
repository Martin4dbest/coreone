import api from "@/services/api";

export interface ParentSchoolBranding {
  logo_url?: string | null;
  app_icon_url?: string | null;
  splash_image_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  motto?: string | null;
  login_title?: string | null;
  login_message?: string | null;
}

export interface ParentSchool {
  id: number;
  name: string;
  school_code: string;

  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;

  logo?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;

  branding?: ParentSchoolBranding | null;
}

export interface ParentStudent {
  id: number;
  admission_number: string;

  first_name: string;
  last_name: string;
  middle_name?: string | null;

  gender: string;
  date_of_birth?: string | null;
  passport?: string | null;

  classroom_id?: number | null;

  relationship_type: string;

  school: ParentSchool;
}

export interface ParentMe {
  id: number;
  user_id: number;

  first_name: string;
  last_name: string;
  phone: string;

  students: ParentStudent[];
}

export async function getParentMe(): Promise<ParentMe> {
  const response = await api.get<ParentMe>("/parents/me");
  return response.data;
}

export async function getParentStudents(): Promise<
  ParentStudent[]
> {
  const response = await api.get<ParentStudent[]>(
    "/parents/me/students"
  );

  return response.data;
}

export async function getParentStudent(
  studentId: number
): Promise<ParentStudent> {
  const response =
    await api.get<ParentStudent>(
      `/parents/me/students/${studentId}`
    );

  return response.data;
}

export interface ParentAttendanceRecord {
  attendance_date: string;
  status: string;
  remarks?: string | null;
}

export interface ParentAttendance {
  student_id: number;

  attendance_percentage: number;

  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;

  records: ParentAttendanceRecord[];
}

export async function getParentStudentAttendance(
  studentId: number
): Promise<ParentAttendance> {
  const response =
    await api.get<ParentAttendance>(
      `/parents/me/students/${studentId}/attendance`
    );

  return response.data;
}

export interface ParentResultSubject {
  id: number;
  result_id: number;
  name: string;

  ca: number;
  exam: number;
  total: number;

  grade: string | null;
  remark: string | null;

  teacher_comment?: string | null;
  principal_comment?: string | null;

  is_published: boolean;
}

export interface ParentResultsReport {
  session: string | null;
  term: string | null;

  student: {
    name: string;
    admission_number: string;
    passport?: string | null;
    class?: string | null;
  };

  school: {
    id: number;
    name: string;
    logo?: string | null;
    motto?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
    accent_color?: string | null;
  };

  subjects: ParentResultSubject[];

  total: number;
  average: number;
  position: number | null;
  attendance: number;

  remark: string;

  viewer_is_class_teacher: boolean;

  comments: {
    teacher?: string | null;
    class_teacher?: string | null;
    principal?: string | null;
  };
}

export async function getParentStudentResults(
  studentId: number
): Promise<ParentResultsReport> {
  const response =
    await api.get<ParentResultsReport>(
      `/parents/me/students/${studentId}/results`
    );

  return response.data;
}
