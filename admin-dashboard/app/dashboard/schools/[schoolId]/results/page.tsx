"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Plus, Trash2, X, Loader2 } from "lucide-react";

type Result = {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  class_name: string;
  subject_name: string;
  term_name: string;
  session_name: string;
  total_score: number;
  grade: string | null;
};

type Option = {
  id: number;
  name: string;
};

type Student = {
  id: number;
  first_name: string;
  last_name: string;
  admission_number: string;
};

export default function ResultsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [sessions, setSessions] = useState<Option[]>([]);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
const [deletingAll, setDeletingAll] = useState(false);

const [bulkOpen, setBulkOpen] = useState(false);
const [bulkStudents, setBulkStudents] = useState<Student[]>([]);
const [bulkScores, setBulkScores] = useState<Record<number, {ca:string; exam:string}>>({});
const [bulkClassId, setBulkClassId] = useState("");
const [bulkSubjectId, setBulkSubjectId] = useState("");
const [bulkTermId, setBulkTermId] = useState("");
const [bulkSessionId, setBulkSessionId] = useState("");
const [bulkLoading, setBulkLoading] = useState(false);
const [bulkSaving, setBulkSaving] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [termId, setTermId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [ca, setCa] = useState("");
  const [exam, setExam] = useState("");


  async function loadData() {
    const [
      resultsRes,
      studentsRes,
      classesRes,
      subjectsRes,
      termsRes,
      sessionsRes,
    ] = await Promise.all([
      api.get("/results"),
      api.get("/students"),
      api.get("/classes"),
      api.get("/subjects", { params: { school_id: schoolId } }),
      api.get("/terms", { params: { school_id: schoolId } }),
      api.get("/academic-sessions", { params: { school_id: schoolId } }),
    ]);

    setResults(resultsRes.data);
    setStudents(studentsRes.data);
    setClasses(classesRes.data);
    setSubjects(subjectsRes.data);
    setTerms(termsRes.data);
    setSessions(sessionsRes.data);
  }

  useEffect(() => {
    loadData();
  }, []);


  async function createResult() {

    setSaving(true);

    try {

      await api.post("/results", {
        school_id: Number(schoolId),
        student_id: Number(studentId),
        class_id: Number(classId),
        subject_id: Number(subjectId),
        term_id: Number(termId),
        academic_session_id: Number(sessionId),
        ca_score: Number(ca),
        exam_score: Number(exam),
      });

      setOpen(false);

      await loadData();

    } catch (error: any) {

      console.error(
        "CREATE RESULT FAILED:",
        error
      );

      const message =
        error?.response?.data?.detail ||
        "Failed to save result";

      alert(message);

    } finally {

      setSaving(false);

    }

  }

  async function deleteResult(id: number) {
    if (!confirm("Delete this result?")) return;

    await api.delete(`/results/${id}`);
    await loadData();
  }

  async function deleteAllResults() {
    if (!confirm("Delete all results permanently?")) return;

    await api.delete("/results");
    await loadData();
  }

  
async function loadBulkStudents() {
  if (!bulkClassId) return;

  const res = await api.get("/students", {
    params: {
      class_id: bulkClassId,
      school_id: schoolId,
    },
  });

  setBulkStudents(res.data);

  const scores: Record<number, { ca: string; exam: string }> = {};

  res.data.forEach((student: Student) => {
    scores[student.id] = {
      ca: "",
      exam: "",
    };
  });

  setBulkScores(scores);
}


function updateBulkScore(
  id: number,
  field: "ca" | "exam",
  value: string
) {
  setBulkScores((prev) => ({
    ...prev,
    [id]: {
      ...prev[id],
      [field]: value,
    },
  }));
}


async function saveBulkResults() {
  setBulkSaving(true);

  try {
    await api.post("/results/bulk-entry", {
      school_id: Number(schoolId),
      class_id: Number(bulkClassId),
      subject_id: Number(bulkSubjectId),
      term_id: Number(bulkTermId),
      academic_session_id: Number(bulkSessionId),

      results: bulkStudents.map((student) => ({
        student_id: student.id,
        ca_score: Number(bulkScores[student.id]?.ca || 0),
        exam_score: Number(bulkScores[student.id]?.exam || 0),
      })),
    });

    await loadData();
    setBulkOpen(false);

  } catch (error) {
    console.error(error);
    alert("Bulk result save failed");
  }

  setBulkSaving(false);
}

return (
    <div className="p-6">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Results
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            <Plus size={18}/>
            Add Result
          </button>

          
      <button
        onClick={() => setBulkOpen(true)}
        disabled={bulkSaving || saving}
        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl disabled:opacity-50"
      >
        Bulk Entry
      </button>

<button
            onClick={deleteAllResults}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl"
          >
            <Trash2 size={18}/>
            Delete All
          </button>
        </div>
      </div>


    
  {bulkOpen && (
    <div className="bg-white border rounded-xl p-5 mb-6 shadow">

      <div className="flex justify-between mb-4">
        <h2 className="font-bold">
          Bulk Result Entry
        </h2>

        <button onClick={() => setBulkOpen(false)}>
          <X />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">

        <select
          className="border p-2 rounded"
          onChange={(e)=>setBulkClassId(e.target.value)}
        >
          <option>Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={loadBulkStudents}
          disabled={bulkLoading}
          className="bg-blue-600 text-white rounded flex items-center justify-center gap-2 px-3"
        >
          {bulkLoading && <Loader2 size={16} className="animate-spin" />}
          {bulkLoading ? "Loading..." : "Load Students"}
        </button>

        <select
          className="border p-2 rounded"
          onChange={(e)=>setBulkSubjectId(e.target.value)}
        >
          <option>Select Subject</option>
          {subjects.map(s=>(
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          onChange={(e)=>setBulkTermId(e.target.value)}
        >
          <option>Select Term</option>
          {terms.map(t=>(
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          onChange={(e)=>setBulkSessionId(e.target.value)}
        >
          <option>Select Session</option>
          {sessions.map(s=>(
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

      </div>


      {bulkStudents.length > 0 && (
        <table className="w-full border">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Student</th>
              <th>CA</th>
              <th>Exam</th>
            </tr>
          </thead>

          <tbody>

          {bulkStudents.map(student=>(
            <tr key={student.id} className="border-t">

              <td className="p-2">
                {student.first_name} {student.last_name}
              </td>

              <td>
                <input
                  className="border p-1 w-20"
                  value={bulkScores[student.id]?.ca || ""}
                  onChange={(e)=>
                    updateBulkScore(
                      student.id,
                      "ca",
                      e.target.value
                    )
                  }
                />
              </td>

              <td>
                <input
                  className="border p-1 w-20"
                  value={bulkScores[student.id]?.exam || ""}
                  onChange={(e)=>
                    updateBulkScore(
                      student.id,
                      "exam",
                      e.target.value
                    )
                  }
                />
              </td>

            </tr>
          ))}

          </tbody>

        </table>
      )}


      <button
        onClick={saveBulkResults}
        disabled={bulkSaving}
        className="mt-5 bg-green-600 text-white px-5 py-2 rounded-xl"
      >
        <span className="flex items-center gap-2">
          {bulkSaving && <Loader2 size={16} className="animate-spin" />}
          <span className="flex items-center gap-2">
  {bulkSaving && <Loader2 className="animate-spin" size={16}/>}
  {bulkSaving ? "Saving..." : "Save Bulk Results"}
</span>
        </span>
      </button>

    </div>
  )}

  {open && (
        <div className="bg-white border rounded-xl p-5 mb-6 shadow">

          <div className="flex justify-between mb-4">
            <h2 className="font-bold">
              Add Result
            </h2>

            <button onClick={()=>setOpen(false)}>
              <X/>
            </button>
          </div>


          <div className="grid grid-cols-2 gap-3">

            <select
              className="border p-2 rounded"
              onChange={(e)=>setStudentId(e.target.value)}
            >
              <option>Select Student</option>
              {students.map(s=>(
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>


            <select
              className="border p-2 rounded"
              onChange={(e)=>setClassId(e.target.value)}
            >
              <option>Select Class</option>
              {classes.map(c=>(
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>


            <select
              className="border p-2 rounded"
              onChange={(e)=>setSubjectId(e.target.value)}
            >
              <option>Select Subject</option>
              {subjects.map(s=>(
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>


            <select
              className="border p-2 rounded"
              onChange={(e)=>setTermId(e.target.value)}
            >
              <option>Select Term</option>
              {terms.map(t=>(
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>


            <select
              className="border p-2 rounded"
              onChange={(e)=>setSessionId(e.target.value)}
            >
              <option>Select Session</option>
              {sessions.map(s=>(
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>


            <input
              className="border p-2 rounded"
              placeholder="CA Score"
              onChange={(e)=>setCa(e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Exam Score"
              onChange={(e)=>setExam(e.target.value)}
            />

          </div>


          <button
            onClick={createResult}
            disabled={saving}
            className="mt-4 bg-green-600 text-white px-5 py-2 rounded-xl"
          >
            <span className="flex items-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          <span className="flex items-center gap-2">
  {saving && <Loader2 className="animate-spin" size={16}/>}
  {saving ? "Saving..." : "Save Result"}
</span>
        </span>
          </button>

        </div>
      )}


      <div className="bg-white rounded-xl border overflow-hidden">

        <table className="w-full">

    
      <thead className="bg-gray-100">
        <tr>
          <th className="p-3 text-left">Student</th>
          <th className="p-3 text-left">Admission No</th>
          <th className="p-3 text-left">Class</th>
          <th className="p-3 text-left">Subject</th>
          <th className="p-3 text-left">Term</th>
          <th className="p-3 text-left">Session</th>
          <th className="p-3 text-left">Total</th>
          <th className="p-3 text-left">Grade</th>
          <th className="p-3 text-left">Action</th>
        </tr>
      </thead>

      <tbody>
        {results.map((r)=>(
          <tr
            key={r.id}
            className="border-t hover:bg-gray-50"
          >
            <td className="p-3">
              {r.student_name}
            </td>

            <td className="p-3">
              {r.admission_number}
            </td>

            <td className="p-3">
              {r.class_name}
            </td>

            <td className="p-3">
              {r.subject_name}
            </td>

            <td className="p-3">
              {r.term_name}
            </td>

            <td className="p-3">
              {r.session_name}
            </td>

            <td className="p-3 font-semibold">
              {r.total_score}
            </td>

            <td className="p-3">
              {r.grade ?? "-"}
            </td>

            <td className="p-3">
              <div className="flex items-center gap-2">

                <Link
                  href={`/dashboard/schools/${schoolId}/students/${r.student_id}/report-card`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Report Card
                </Link>

                <button
                  onClick={()=>deleteResult(r.id)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm"
                >
                  <Trash2 size={15}/>
                  Delete
                </button>

              </div>
            </td>
          </tr>
        ))}

        {results.length === 0 && (
          <tr>
            <td
              colSpan={9}
              className="p-6 text-center text-gray-500"
            >
              No results found
            </td>
          </tr>
        )}

      </tbody>

    </table>

  </div>

</div>
);
}
