"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

type Question = {
  prompt: string;
  type: "MCQ" | "THEORY";
  options: string[];
  answer: string;
  marks: number;
  image_url: string;
};

type Section = { title: string; questions: Question[] };

type Paper = {
  id: number;
  school_id: number;
  title: string;
  subject: string;
  class_name: string;
  instructions?: string | null;
  sections: Section[];
  total_marks: number;
  status: string;
  created_at?: string;
};

type Props = { mode: "builder" | "approval"; schoolId?: number };

function errorText(err: any, fallback: string): string {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((item: any) => typeof item === "string" ? item : item?.msg || JSON.stringify(item)).join("; ");
  if (detail && typeof detail === "object") return detail.msg || JSON.stringify(detail);
  return err?.message || fallback;
}

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const button =
  "rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondary =
  "rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50";

const blankQuestion = (): Question => ({
  prompt: "",
  type: "MCQ",
  options: ["", "", "", ""],
  answer: "",
  marks: 1,
  image_url: "",
});

const blankSection = (): Section => ({
  title: "Section A",
  questions: [blankQuestion()],
});

export default function ExamBuilderCentre({ mode, schoolId: schoolIdProp }: Props) {
  const approvalMode = mode === "approval";
  const [papers, setPapers] = useState<Paper[]>([]);
  const [paperId, setPaperId] = useState<number | null>(null);
  const [schoolId, setSchoolId] = useState(String(schoolIdProp ?? ""));
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [sections, setSections] = useState<Section[]>([blankSection()]);
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);

  const totalMarks = sections.reduce(
    (sum, section) =>
      sum +
      section.questions.reduce(
        (part, question) => part + Math.max(0, Number(question.marks) || 0),
        0,
      ),
    0,
  );

  const loadPapers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, number> = {};
      if (schoolId.trim()) params.school_id = Number(schoolId);

      const response = await api.get(
        approvalMode ? "/approval-centre" : "/exam-builder",
        { params },
      );
      setPapers(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setError(errorText(err, "Unable to load papers. Check your access and try again."));
    } finally {
      setLoading(false);
    }
  }, [approvalMode, schoolId]);

  useEffect(() => {
    void loadPapers();
  }, [loadPapers]);

  function resetForm() {
    setPaperId(null);
    setTitle("");
    setSubject("");
    setClassName("");
    setInstructions("");
    setSections([blankSection()]);
    setPreview(false);
    setNotice("");
    setError("");
  }

  async function openPaper(id: number) {
    setBusy(true);
    setError("");
    try {
      const response = await api.get(`/exam-builder/${id}`);
      const paper = response.data as Paper;
      setPaperId(paper.id);
      setSchoolId(String(paper.school_id ?? ""));
      setTitle(paper.title ?? "");
      setSubject(paper.subject ?? "");
      setClassName(paper.class_name ?? "");
      setInstructions(paper.instructions ?? "");
      setSections(
        Array.isArray(paper.sections) && paper.sections.length
          ? paper.sections
          : [blankSection()],
      );
      setPreview(false);
      setNotice("");
    } catch (err: any) {
      setError(errorText(err, "Unable to open this paper."));
    } finally {
      setBusy(false);
    }
  }

  function updateQuestion(
    sectionIndex: number,
    questionIndex: number,
    changes: Partial<Question>,
  ) {
    setSections((previous) =>
      previous.map((section, si) =>
        si !== sectionIndex
          ? section
          : {
              ...section,
              questions: section.questions.map((question, qi) =>
                qi === questionIndex ? { ...question, ...changes } : question,
              ),
            },
      ),
    );
  }

  async function savePaper(submit = false) {
    if (!title.trim() || !subject.trim() || !className.trim()) {
      setError("Enter the paper title, subject and class before saving.");
      return;
    }
    if (
      sections.some((section) =>
        section.questions.some((question) => !question.prompt.trim()),
      )
    ) {
      setError("Every question needs question text before saving.");
      return;
    }
    if (submit && totalMarks <= 0) {
      setError("Add marks to the questions before submitting for approval.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        subject: subject.trim(),
        class_name: className.trim(),
        instructions: instructions.trim() || null,
        sections,
      };
      if (schoolId.trim()) payload.school_id = Number(schoolId);

      let id = paperId;
      if (id) {
        await api.put(`/exam-builder/${id}`, payload);
      } else {
        const response = await api.post("/exam-builder", payload);
        id = response.data?.id;
        if (id) setPaperId(Number(id));
      }

      if (submit && id) {
        await api.post(`/exam-builder/${id}/submit`);
        setNotice("Paper submitted for approval.");
      } else {
        setNotice("Draft saved successfully.");
      }
      await loadPapers();
    } catch (err: any) {
      setError(errorText(err, "Unable to save the paper."));
    } finally {
      setBusy(false);
    }
  }

  async function decide(paper: Paper, decision: "APPROVED" | "REJECTED") {
    if (decision === "REJECTED" && !feedback[paper.id]?.trim()) {
      setError(`Enter feedback before rejecting "${paper.title}".`);
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.post(`/approval-centre/${paper.id}/decision`, {
        decision,
        feedback: feedback[paper.id]?.trim() || null,
      });
      setNotice(`"${paper.title}" marked ${decision.toLowerCase()}.`);
      await loadPapers();
    } catch (err: any) {
      setError(errorText(err, "Unable to record this decision."));
    } finally {
      setBusy(false);
    }
  }

  if (approvalMode) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <header>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Approval Centre</h1>
          <p className="mt-2 text-slate-500">
            Review submitted exam papers and record approval decisions.
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          <input className={`${input} max-w-xs`} value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            placeholder="School ID (Super Admin)" inputMode="numeric" />
          <button className={secondary} onClick={() => void loadPapers()}>
            Refresh queue
          </button>
        </div>

        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        {loading ? <p className="text-slate-500">Loading approval queue…</p> :
          papers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              No papers are awaiting approval.
            </div>
          ) : papers.map((paper) => (
            <article key={paper.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{paper.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {paper.subject} · {paper.class_name} · {paper.total_marks} marks
                  </p>
                  <p className="mt-1 text-xs text-slate-400">School ID: {paper.school_id}</p>
                </div>
                <button className={secondary} disabled={busy} onClick={() => window.print()}>
                  Print queue
                </button>
              </div>
              <button className={secondary} disabled={busy} onClick={() => void openPaper(paper.id)}>
                Open paper details
              </button>
              <textarea className={input} rows={2}
                value={feedback[paper.id] ?? ""}
                onChange={(e) => setFeedback((old) => ({ ...old, [paper.id]: e.target.value }))}
                placeholder="Reviewer feedback (required for rejection)" />
              <div className="flex flex-wrap gap-3">
                <button className={button} disabled={busy}
                  onClick={() => void decide(paper, "APPROVED")}>Approve paper</button>
                <button className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={busy} onClick={() => void decide(paper, "REJECTED")}>Reject with feedback</button>
              </div>
            </article>
          ))}
        <PaperDetail paperId={paperId} onClose={() => setPaperId(null)} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Exam Paper Builder</h1>
          <p className="mt-2 text-slate-500">Create, preview, save and submit standalone examination papers.</p>
        </div>
        <button className={secondary} onClick={() => window.print()}>Print / Save as PDF</button>
      </header>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Paper title
          <input className={`${input} mt-2`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. First Term Examination" />
        </label>
        <label className="text-sm font-semibold text-slate-700">Subject
          <input className={`${input} mt-2`} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" />
        </label>
        <label className="text-sm font-semibold text-slate-700">Class
          <input className={`${input} mt-2`} value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. JSS 2" />
        </label>
        <label className="text-sm font-semibold text-slate-700">School ID (Super Admin only)
          <input className={`${input} mt-2`} value={schoolId} onChange={(e) => setSchoolId(e.target.value)} inputMode="numeric" placeholder="Leave blank for your school" />
        </label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">Instructions
          <textarea className={`${input} mt-2`} rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Instructions for candidates" />
        </label>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Sections and questions</h2>
        <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700">Total: {totalMarks} marks</span>
      </div>

      {sections.map((section, si) => (
        <section key={si} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-3">
            <input className={`${input} max-w-sm font-semibold`} value={section.title}
              onChange={(e) => setSections((old) => old.map((s, i) => i === si ? { ...s, title: e.target.value } : s))}
              aria-label={`Section ${si + 1} title`} />
            <button className={secondary} onClick={() => setSections((old) => old.map((s, i) => i === si ? { ...s, questions: [...s.questions, blankQuestion()] } : s))}>
              Add question
            </button>
            {sections.length > 1 && <button className="text-sm font-semibold text-red-600" onClick={() => setSections((old) => old.filter((_, i) => i !== si))}>Remove section</button>}
          </div>

          {section.questions.map((question, qi) => (
            <div key={qi} className="space-y-3 rounded-xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-slate-700">Question {qi + 1}</p>
                <div className="flex gap-2">
                  <select className={input} value={question.type}
                    onChange={(e) => updateQuestion(si, qi, { type: e.target.value as Question["type"] })}>
                    <option value="MCQ">Multiple choice</option>
                    <option value="THEORY">Theory</option>
                  </select>
                  <input className={`${input} max-w-24`} type="number" min="0" value={question.marks}
                    aria-label="Question marks" onChange={(e) => updateQuestion(si, qi, { marks: Number(e.target.value) })} />
                </div>
              </div>
              <textarea className={input} rows={3} value={question.prompt}
                onChange={(e) => updateQuestion(si, qi, { prompt: e.target.value })}
                placeholder="Enter the question text" />
              {question.type === "MCQ" && (
                <div className="grid gap-2 md:grid-cols-2">
                  {question.options.map((option, oi) => (
                    <input key={oi} className={input} value={option}
                      onChange={(e) => updateQuestion(si, qi, { options: question.options.map((o, i) => i === oi ? e.target.value : o) })}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                  ))}
                  <input className={`${input} md:col-span-2`} value={question.answer}
                    onChange={(e) => updateQuestion(si, qi, { answer: e.target.value })}
                    placeholder="Correct answer (optional)" />
                </div>
              )}
              <input className={input} value={question.image_url}
                onChange={(e) => updateQuestion(si, qi, { image_url: e.target.value })}
                placeholder="Optional image/diagram URL" />
              {section.questions.length > 1 && (
                <button className="text-sm font-semibold text-red-600"
                  onClick={() => setSections((old) => old.map((s, i) => i === si ? { ...s, questions: s.questions.filter((_, j) => j !== qi) } : s))}>
                  Remove question
                </button>
              )}
            </div>
          ))}
        </section>
      ))}

      <div className="flex flex-wrap gap-3">
        <button className={secondary} onClick={() => setSections((old) => [...old, { title: `Section ${String.fromCharCode(65 + old.length)}`, questions: [blankQuestion()] }])}>
          Add section
        </button>
        <button className={button} disabled={busy} onClick={() => void savePaper(false)}>
          {busy ? "Saving…" : "Save draft"}
        </button>
        <button className={button} disabled={busy} onClick={() => void savePaper(true)}>
          Submit for approval
        </button>
        <button className={secondary} onClick={() => setPreview((old) => !old)}>
          {preview ? "Hide preview" : "Preview paper"}
        </button>
        <button className={secondary} onClick={resetForm}>New paper</button>
      </div>

      {preview && (
        <section className="space-y-4 border border-slate-300 bg-white p-8 text-slate-900">
          <h2 className="text-center text-2xl font-bold">{title || "Examination Paper"}</h2>
          <p className="text-center">{subject} · {className}</p>
          {instructions && <p>{instructions}</p>}
          {sections.map((section, si) => (
            <div key={si} className="space-y-3">
              <h3 className="border-b pb-2 font-bold">{section.title}</h3>
              {section.questions.map((q, qi) => (
                <div key={qi} className="whitespace-pre-wrap">
                  <p>{qi + 1}. {q.prompt} ({q.marks} marks)</p>
                  {q.image_url && <p className="text-sm">{q.image_url}</p>}
                  {q.type === "MCQ" && q.options.map((option, oi) => (
                    <p key={oi} className="ml-5">{String.fromCharCode(65 + oi)}. {option}</p>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <p className="text-right font-bold">Total: {totalMarks} marks</p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Your papers</h2>
        {loading ? <p className="text-slate-500">Loading papers…</p> :
          papers.length === 0 ? <p className="text-sm text-slate-500">No papers found yet.</p> :
          papers.map((paper) => (
            <div key={paper.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <p className="font-semibold text-slate-900">{paper.title}</p>
                <p className="text-sm text-slate-500">{paper.subject} · {paper.class_name} · {paper.total_marks} marks</p>
                <p className="mt-1 text-xs font-semibold text-indigo-600">{paper.status}</p>
              </div>
              <button className={secondary} disabled={busy || !["DRAFT", "REJECTED"].includes(paper.status)}
                onClick={() => void openPaper(paper.id)}>Edit draft</button>
            </div>
          ))}
      </section>
    </main>
  );
}

function PaperDetail({ paperId, onClose }: { paperId: number | null; onClose: () => void }) {
  const [paper, setPaper] = useState<Paper | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!paperId) {
      setPaper(null);
      return;
    }
    let cancelled = false;
    api.get(`/exam-builder/${paperId}`)
      .then((response) => { if (!cancelled) setPaper(response.data); })
      .catch((err: any) => { if (!cancelled) setError(err?.response?.data?.detail || "Paper details are not available to this account."); });
    return () => { cancelled = true; };
  }, [paperId]);

  if (!paperId) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-3xl space-y-4 rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{paper?.title || "Paper details"}</h2>
          <button className={secondary} onClick={onClose}>Close</button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {paper && <>
          <p className="text-sm text-slate-500">{paper.subject} · {paper.class_name} · {paper.total_marks} marks</p>
          <p>{paper.instructions}</p>
          {paper.sections?.map((section, si) => (
            <section key={si} className="space-y-2">
              <h3 className="font-bold">{section.title}</h3>
              {section.questions?.map((question, qi) => (
                <p key={qi} className="whitespace-pre-wrap text-sm">{qi + 1}. {question.prompt} ({question.marks} marks)</p>
              ))}
            </section>
          ))}
        </>}
      </div>
    </div>
  );
}
