export interface StudentInfo {
  id: string;
  first_name: string;
  last_name: string;
  school_name: string;
  class_level: string;
  department: string;
  admission_number: string;
  email: string;
  profile_image?: string | null;
}


export interface AcademicOverviewData {
  attendance_percentage: number;
  latest_grade: string;
  pending_assignments_count: number;
  cbt_average_score: number;
}


export interface TimetableClass {
  id: string;
  time: string;
  subject: string;
  room?: string;
  is_current?: boolean;
}


export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: "Exam" | "Assignment" | "General";
  unread: boolean;
}
