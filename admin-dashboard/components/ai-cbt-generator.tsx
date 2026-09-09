"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  BrainCircuit,
  Check,
  Clipboard,
  Loader2,
  RotateCcw,
  Sparkles,
  WandSparkles,
  Plus,
  CheckCircle2,
} from "lucide-react";

import api from "@/lib/api";

type Question = {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

type AIResponse = {
  subject: string;
  topic: string;
  class_name: string;
  questions: Question[];
};

type TeacherAssignment = {
  classroom_id: number;
  classroom_name: string;
  subject_id: number;
  subject_name: string;
  student_count: number;
};

type TeacherDashboardResponse = {
  classes: TeacherAssignment[];
};

export default function AICBTGenerator({
  schoolId,
  teacherOnly = false,
  teacherBase = "",
}: {
  schoolId: string;
  teacherOnly?: boolean;
  teacherBase?: string;
}) {

  const [subject, setSubject] = useState("");
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [className, setClassName] = useState("");
  const [classId, setClassId] = useState<number | null>(null);
  const [topic, setTopic] = useState("");

  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(
    teacherOnly
  );
  const [numberOfQuestions, setNumberOfQuestions] = useState("10");
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | "mixed"
  >("mixed");

  const [result, setResult] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);
  const [createdExamId, setCreatedExamId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!teacherOnly) {
      return;
    }

    let mounted = true;

    async function loadTeacherAssignments() {
      try {
        const response = await api.get<TeacherDashboardResponse>(
          "/teachers/dashboard"
        );

        const rows = Array.isArray(response.data?.classes)
          ? response.data.classes
          : [];

        if (mounted) {
          setAssignments(rows);
        }
      } catch (error) {
        console.error(
          "Failed to load teacher assignments for AI Studio:",
          error
        );

        if (mounted) {
          setAssignments([]);
        }
      } finally {
        if (mounted) {
          setAssignmentsLoading(false);
        }
      }
    }

    loadTeacherAssignments();

    return () => {
      mounted = false;
    };
  }, [teacherOnly]);

  const assignedSubjects = Array.from(
    new Map(
      assignments.map((item) => [
        item.subject_id,
        {
          id: item.subject_id,
          name: item.subject_name,
        },
      ])
    ).values()
  );

  const assignedClasses = assignments
    .filter((item) =>
      subjectId ? item.subject_id === subjectId : true
    )
    .map((item) => ({
      id: item.classroom_id,
      name: item.classroom_name,
    }))
    .filter(
      (item, index, array) =>
        array.findIndex((x) => x.id === item.id) === index
    );

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();

    setError("");
    setResult(null);
    setCopied(false);

    if (teacherOnly) {
      if (!subjectId || !classId || !topic.trim()) {
        setError(
          "Please select your assigned subject and class and enter a topic."
        );
        return;
      }
    } else if (!subject.trim() || !className.trim() || !topic.trim()) {
      setError(
        "Please enter the subject, class and topic before generating questions."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<AIResponse>("/ai/cbt/generate", {
        school_id: Number(schoolId),
        subject: subject.trim(),
        class_name: className.trim(),
        topic: topic.trim(),
        number_of_questions: Number(numberOfQuestions),
        difficulty,
      });

      setResult(response.data);
    } catch (err: any) {
      console.error("AI CBT generation failed:", err);

      const detail = err?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to generate questions. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetGenerator() {
    setResult(null);
    setError("");
    setCopied(false);
    setCreatedExamId(null);
  }

  function normalizeName(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  async function createCBTExam() {
    if (!result || result.questions.length === 0) {
      return;
    }

    setError("");
    setCreatedExamId(null);
    setCreatingExam(true);

    try {
      const [subjectsRes, classesRes] = await Promise.all([
        api.get(`/subjects?school_id=${schoolId}`),
        api.get("/classes"),
      ]);

      const rawSubjects = Array.isArray(subjectsRes.data)
        ? subjectsRes.data
        : subjectsRes.data?.data?.data ||
          subjectsRes.data?.data ||
          subjectsRes.data?.subjects ||
          subjectsRes.data?.results ||
          [];

      const rawClasses = Array.isArray(classesRes.data)
        ? classesRes.data
        : classesRes.data?.data?.data ||
          classesRes.data?.data ||
          classesRes.data?.classes ||
          classesRes.data?.classrooms ||
          classesRes.data?.results ||
          [];

      const normalizedSubject = normalizeName(subject);

      const matchedSubject = rawSubjects.find(
        (item: any) =>
          normalizeName(
            item?.name ||
              item?.title ||
              item?.subject_name ||
              item?.label ||
              ""
          ) === normalizedSubject
      );

      if (!matchedSubject?.id) {
        throw new Error(
          `Subject "${subject}" was not found in this school. Please use the exact school subject name.`
        );
      }

      const normalizedClass = normalizeName(className);

      const matchedClass = rawClasses.find(
        (item: any) =>
          normalizeName(
            item?.name ||
              item?.class_name ||
              item?.className ||
              item?.title ||
              item?.label ||
              ""
          ) === normalizedClass
      );

      if (!matchedClass?.id) {
        throw new Error(
          `Class "${className}" was not found in this school. Please use the exact class name.`
        );
      }

      const numberOfQuestions = result.questions.length;
      const totalMarks = numberOfQuestions;
      const passMark = Math.ceil(totalMarks * 0.5);

      const examResponse = await api.post("/cbt/exams", {
        school_id: Number(schoolId),
        title: `${result.subject} - ${result.topic} CBT`,
        description:
          `AI-generated CBT for ${result.class_name} on ${result.topic}.`,
        subject_id: Number(matchedSubject.id),
        class_id: Number(matchedClass.id),
        duration_minutes: 60,
        total_marks: totalMarks,
        pass_mark: passMark,
        randomize_questions: true,
        randomize_options: true,
        allow_resume: true,
        show_result_immediately: false,
        negative_marking: false,
        negative_mark: 0,
      });

      const examId = Number(
        examResponse.data?.id ||
          examResponse.data?.data?.id
      );

      if (!examId) {
        throw new Error(
          "The CBT exam was created but no exam ID was returned."
        );
      }

      for (const generatedQuestion of result.questions) {
        const options = generatedQuestion.options || [];

        if (options.length < 4) {
          throw new Error(
            "One of the AI questions does not contain four answer options."
          );
        }

        const correct = (
          generatedQuestion.correct_answer || ""
        )
          .trim()
          .charAt(0)
          .toUpperCase();

        await api.post("/cbt/questions", {
          exam_id: examId,
          question: generatedQuestion.question,
          option_a: options[0],
          option_b: options[1],
          option_c: options[2],
          option_d: options[3],
          correct_answer: correct,
          explanation: generatedQuestion.explanation || "",
          marks: 1,
        });
      }

      setCreatedExamId(examId);
    } catch (err: any) {
      console.error(
        "Failed to create CBT from AI questions:",
        err
      );

      const detail = err?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : err?.message ||
            "Unable to create the CBT exam."
      );
    } finally {
      setCreatingExam(false);
    }
  }

  async function copyQuestions() {
    if (!result) {
      return;
    }

    const text = result.questions
      .map((question, index) => {
        const options = question.options.join("\n");

        return `${index + 1}. ${question.question}

${options}

Correct Answer: ${question.correct_answer}

Explanation: ${question.explanation}`;
      })
      .join("\n\n------------------------------\n\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Unable to copy the generated questions.");
    }
  }

  return (
    <div className="space-y-7">
      {/* HEADER */}
      <section className="overflow-hidden rounded-[28px] border border-rose-100 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 px-7 py-8 text-white md:px-10">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-24 h-52 w-52 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] backdrop-blur">
                <Sparkles size={14} />
                CoreOne AI Studio
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                AI CBT Question Generator
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/85 md:text-base">
                Generate high-quality multiple-choice questions for your
                school assessments in seconds. Review everything before adding
                anything to your CBT system.
              </p>
            </div>

            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/10 md:flex">
              <BrainCircuit size={48} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-rose-50/50 p-5 md:grid-cols-3 md:p-6">
          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-500">
              Fast
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              Generate a full question set in seconds.
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-500">
              Flexible
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              Choose topic, difficulty and question count.
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-500">
              Safe
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              Nothing is added to CBT automatically.
            </p>
          </div>
        </div>
      </section>

      {/* GENERATOR FORM */}
      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <WandSparkles size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Build questions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Tell CoreOne what you want to teach.
              </p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="subject"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Subject
              </label>

              {teacherOnly ? (
                <select
                  id="subject"
                  value={subjectId ?? ""}
                  disabled={assignmentsLoading}
                  onChange={(event) => {
                    const id = Number(event.target.value);
                    const selected = assignedSubjects.find(
                      (item) => item.id === id
                    );

                    setSubjectId(id || null);
                    setSubject(selected?.name || "");

                    setClassId(null);
                    setClassName("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:bg-slate-50"
                >
                  <option value="">
                    {assignmentsLoading
                      ? "Loading assigned subjects..."
                      : "Select subject"}
                  </option>

                  {assignedSubjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="e.g. Mathematics"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              )}
            </div>

            <div>
              <label
                htmlFor="className"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Class
              </label>

              {teacherOnly ? (
                <select
                  id="className"
                  value={classId ?? ""}
                  disabled={assignmentsLoading || !subjectId}
                  onChange={(event) => {
                    const id = Number(event.target.value);
                    const selected = assignedClasses.find(
                      (item) => item.id === id
                    );

                    setClassId(id || null);
                    setClassName(selected?.name || "");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:bg-slate-50"
                >
                  <option value="">
                    {!subjectId
                      ? "Select subject first"
                      : assignmentsLoading
                      ? "Loading assigned classes..."
                      : "Select class"}
                  </option>

                  {assignedClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="className"
                  value={className}
                  onChange={(event) => setClassName(event.target.value)}
                  placeholder="e.g. JSS 2"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
              )}
            </div>

            <div>
              <label
                htmlFor="topic"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Topic
              </label>

              <input
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. Linear Equations"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="numberOfQuestions"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Questions
                </label>

                <select
                  id="numberOfQuestions"
                  value={numberOfQuestions}
                  onChange={(event) =>
                    setNumberOfQuestions(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                  <option value="30">30</option>
                  <option value="40">40</option>
                  <option value="50">50</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="difficulty"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Difficulty
                </label>

                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(
                      event.target.value as
                        | "easy"
                        | "medium"
                        | "hard"
                        | "mixed"
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium leading-5 text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating questions...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Questions
                </>
              )}
            </button>
          </form>
        </div>

        {/* RESULTS */}
        <div className="min-w-0 rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
          {!result && !loading && (
            <div className="flex min-h-[500px] items-center justify-center px-6 text-center">
              <div className="max-w-md">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
                  <BrainCircuit size={38} />
                </div>

                <h2 className="mt-6 text-2xl font-black text-slate-900">
                  Your AI question set will appear here
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Enter the subject, class and topic on the left, then let
                  CoreOne create a ready-to-review CBT question set.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex min-h-[500px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
                  <Loader2 size={38} className="animate-spin" />
                </div>

                <h2 className="mt-6 text-xl font-bold text-slate-900">
                  CoreOne AI is thinking...
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Creating {numberOfQuestions} questions for {topic || "your topic"}.
                </p>
              </div>
            </div>
          )}

          {result && !loading && (
            <div>
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">
                      {result.subject}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {result.class_name}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {result.topic}
                    </span>
                  </div>

                  <h2 className="mt-3 text-2xl font-black text-slate-900">
                    Generated Question Set
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {result.questions.length} questions generated. Review
                    before using them in an assessment.
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={createCBTExam}
                    disabled={creatingExam || !!createdExamId}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingExam ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Creating CBT...
                      </>
                    ) : createdExamId ? (
                      <>
                        <CheckCircle2 size={17} />
                        CBT Created
                      </>
                    ) : (
                      <>
                        <Plus size={17} />
                        Create CBT Exam
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={copyQuestions}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    {copied ? (
                      <>
                        <Check size={17} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Clipboard size={17} />
                        Copy
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetGenerator}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
                  >
                    <RotateCcw size={17} />
                    New Set
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {result.questions.map((question, index) => (
                  <article
                    key={`${question.question}-${index}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-sm font-black text-white">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold leading-7 text-slate-900">
                          {question.question}
                        </h3>

                        <div className="mt-4 grid gap-2">
                          {question.options.map((option) => {
                            const letter =
                              option.trim().charAt(0).toUpperCase();

                            const isCorrect =
                              letter ===
                              question.correct_answer
                                .trim()
                                .charAt(0)
                                .toUpperCase();

                            return (
                              <div
                                key={option}
                                className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                                  isCorrect
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-slate-200 bg-white text-slate-700"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <span>{option}</span>

                                  {isCorrect && (
                                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-700">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                            Explanation
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {createdExamId && (
                <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-800">
                      CBT exam created successfully.
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">
                      Your AI questions have been saved as a normal CBT
                      exam in Draft mode for teacher review.
                    </p>
                  </div>

                  <a
                    href={`/teko/teacher/learning/cbt/exams/${createdExamId}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Open CBT
                  </a>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                <strong>Review before publishing:</strong> AI-generated
                questions should be checked by a qualified teacher before they
                are used in a live assessment.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SCHOOL ID NOTE - HELPS KEEP THE PAGE TENANT-AWARE */}
      <p className="text-center text-xs text-slate-400">
        CoreOne AI Studio • School #{schoolId}
      </p>
    </div>
  );
}
