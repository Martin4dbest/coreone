import api from "@/services/api";

export type TimetableEntry = {
  id: number;
  school_id: number;
  academic_session_id: number;
  academic_session_name: string;
  term_id: number;
  term_name: string;
  classroom_id: number;
  classroom_name: string;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export async function getStudentTimetable() {
  const response = await api.get<TimetableEntry[]>(
    "/timetable/student/me"
  );
  return response.data;
}

export async function getTeacherTimetable() {
  const response = await api.get<TimetableEntry[]>(
    "/timetable/teacher/me"
  );
  return response.data;
}

export async function getParentTimetable(
  studentId?: number
) {
  const response = await api.get<TimetableEntry[]>(
    "/timetable/parent",
    {
      params: studentId
        ? { student_id: studentId }
        : undefined,
    }
  );
  return response.data;
}
