"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

export default function CBTExamViewPage() {
  const { examId } = useParams();

  const [exam, setExam] = useState<any>(null);

  useEffect(() => {
    api.get(`/cbt/exams/${examId}`)
      .then((res) => setExam(res.data))
      .catch(console.error);
  }, [examId]);

  if (!exam) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{exam.title}</h1>

      <div>Subject: {exam.subject?.name ?? exam.subject_id}</div>
      <div>Class: {exam.classroom?.name ?? exam.class_id}</div>
      <div>Duration: {exam.duration_minutes} mins</div>
      <div>Total Questions: {exam.total_questions}</div>
      <div>Total Marks: {exam.total_marks}</div>
      <div>Pass Mark: {exam.pass_mark}</div>
      <div>Status: {exam.is_active ? "Published" : "Draft"}</div>
    </div>
  );
}
