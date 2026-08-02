import api from "./api";


export async function getStudentCBTExams() {

  const response = await api.get(
    "/cbt/student/exams"
  );

  return response.data;

}


export async function startCBTAttempt(
  examId: number
) {

  const response = await api.post(
    "/cbt/attempts",
    {
      exam_id: examId
    }
  );

  return response.data;

}
