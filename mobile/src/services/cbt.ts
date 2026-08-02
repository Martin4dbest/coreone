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

// =======================================
// SAVE ANSWER
// =======================================

export async function saveCBTAnswer(
  attemptId:number,
  questionId:number,
  selectedAnswer:string,
){

  const response = await api.post(
    `/cbt/attempts/${attemptId}/answers`,
    {
      question_id:questionId,
      selected_answer:selectedAnswer,
      flagged:false,
    }
  );

  return response.data;

}



// =======================================
// SUBMIT EXAM
// =======================================

export async function submitCBTAttempt(
  attemptId:number,
){

  const response = await api.post(
    `/cbt/attempts/${attemptId}/submit`
  );

  return response.data;

}

