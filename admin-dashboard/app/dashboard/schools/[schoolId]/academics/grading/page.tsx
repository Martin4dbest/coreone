"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Plus,
Pencil,
Trash2,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";

type GradingSystem = {
  id: number;
  grade: string;
  minimum_score: number;
  maximum_score: number;
  remark: string;
};

export default function GradingPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [grades, setGrades] = useState<GradingSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
const [editingId, setEditingId] = useState<number | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const [form, setForm] = useState({
    grade: "",
    minimum_score: "",
    maximum_score: "",
    remark: "",
  });

  async function loadGrades() {
    try {
      const response = await api.get(
        `/grading-systems?school_id=${schoolId}`
      );

      setGrades(response.data);
    } catch (error) {
      console.error(
        "Failed to load grading system",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGrades();
  }, [schoolId]);


  async function createGrade() {
    try {
      await api.post("/grading-systems", {
        school_id: Number(schoolId),
        grade: form.grade,
        minimum_score: Number(form.minimum_score),
        maximum_score: Number(form.maximum_score),
        remark: form.remark,
      });

      setShowModal(false);

      setForm({
        grade: "",
        minimum_score: "",
        maximum_score: "",
        remark: "",
      });

      loadGrades();

    } catch (error) {
      console.error(
        "Failed to create grading rule",
        error
      );
    }
  }


  
function openEdit(grade: GradingSystem) {
  setEditingId(grade.id);

  setForm({
    grade: grade.grade,
    minimum_score: String(grade.minimum_score),
    maximum_score: String(grade.maximum_score),
    remark: grade.remark,
  });

  setShowModal(true);
}


async function saveGrade() {
  try {
    const payload = {
      grade: form.grade,
      minimum_score: Number(form.minimum_score),
      maximum_score: Number(form.maximum_score),
      remark: form.remark,
    };


    if (editingId) {
      await api.put(
        `/grading-systems/${editingId}`,
        payload
      );
    } else {
      await api.post(
        "/grading-systems",
        {
          school_id: Number(schoolId),
          ...payload,
        }
      );
    }


    setShowModal(false);
    setEditingId(null);

    setForm({
      grade: "",
      minimum_score: "",
      maximum_score: "",
      remark: "",
    });

    await loadGrades();

  } catch (error) {
    console.error(
      "Failed saving grade",
      error
    );
  }
}


async function deleteGrade(id: number) {
  try {
    await api.delete(
      `/grading-systems/${id}`
    );

    await loadGrades();

  } catch (error) {
    console.error(
      "Failed deleting grade",
      error
    );
  }
}


  async function deleteAllGrades() {
    if (grades.length === 0 || deletingAll) return;

    const confirmed = window.confirm(
      "WARNING: This will permanently delete ALL grading rules for this school. This action cannot be undone. Do you want to continue?"
    );

    if (!confirmed) return;

    try {
      setDeletingAll(true);

      await Promise.all(
        grades.map((grade) =>
          api.delete(`/grading-systems/${grade.id}`)
        )
      );

      setGrades([]);
    } catch (error) {
      console.error("Failed deleting all grades", error);
      await loadGrades();
    } finally {
      setDeletingAll(false);
    }
  }


  async function loadDefaultTemplate() {
    const template = [
      ["A1", 90, 100, "Excellent"],
      ["B2", 80, 89, "Very Good"],
      ["B3", 70, 79, "Good"],
      ["C4", 60, 69, "Credit"],
      ["C5", 50, 59, "Credit"],
      ["C6", 45, 49, "Pass"],
      ["D7", 40, 44, "Pass"],
      ["E8", 30, 39, "Weak"],
      ["F9", 0, 29, "Fail"],
    ];

    try {
      setLoadingTemplate(true);

      await Promise.all(
        template.map((item) =>
          api.post("/grading-systems", {
            school_id: Number(schoolId),
            grade: item[0],
            minimum_score: item[1],
            maximum_score: item[2],
            remark: item[3],
          })
        )
      );

      await loadGrades();
    } catch (error) {
      console.error(
        "Failed loading grading template",
        error
      );
    } finally {
      setLoadingTemplate(false);
    }
  }

  return (
    <div className="space-y-6">

      <Link
        href={`/dashboard/schools/${schoolId}/academics`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500"
      >
        <ArrowLeft size={16} />
        Back to Academics
      </Link>


      <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 shadow-sm">

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
          <GraduationCap size={26}/>
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-rose-500">
          Assessment Configuration
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Grading System
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Configure score ranges, grades and remarks for this school.
        </p>

      </section>


      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <h2 className="text-lg font-bold text-slate-900">
            Grade Rules
          </h2>


          <div className="flex gap-3">

            <button
              onClick={deleteAllGrades}
              disabled={deletingAll || grades.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingAll ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {deletingAll ? "Deleting All..." : "Delete All"}
            </button>

            <button
              onClick={loadDefaultTemplate}
              disabled={loadingTemplate}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingTemplate && (
                <Loader2 size={16} className="animate-spin" />
              )}
              {loadingTemplate ? "Loading Template..." : "Load Template"}
            </button>


            <button
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    grade: "",
                    minimum_score: "",
                    maximum_score: "",
                    remark: "",
                  });
                  setShowModal(true);
                }}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              <Plus size={16}/>
              Add Grade
            </button>

          </div>

        </div>


        <div className="mt-6 overflow-x-auto">

          <table className="w-full text-sm">

            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="pb-3">Grade</th>
                <th className="pb-3">Minimum</th>
                <th className="pb-3">Maximum</th>
                <th className="pb-3">Remark</th>
            <th className="pb-3">Actions</th>
              </tr>
            </thead>


            <tbody>

              {loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-slate-400"
                  >
                    Loading grading system...
                  </td>
                </tr>
              )}


              {!loading && grades.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-slate-400"
                  >
                    No grading rules created yet.
                  </td>
                </tr>
              )}


              {grades.map((grade)=>(
                <tr
                  key={grade.id}
                  className="border-b last:border-0"
                >
                  <td className="py-4 font-bold">
                    {grade.grade}
                  </td>

                  <td>
                    {grade.minimum_score}
                  </td>

                  <td>
                    {grade.maximum_score}
                  </td>

                  <td>
                    {grade.remark}
              </td>

              <td>
                <div className="flex gap-2">

                  <button
                    onClick={() => openEdit(grade)}
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                  >
                    <Pencil size={16}/>
                  </button>

                  <button
                    onClick={() => deleteGrade(grade.id)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16}/>
                  </button>

                </div>
              </td>

                </tr>
              ))}


            </tbody>

          </table>

        </div>

      </section>

      {showModal && (

        <div className="fixed inset-0 flex items-center justify-center bg-black/40">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

            <h2 className="text-xl font-bold text-slate-900">
                {editingId ? "Edit Grade" : "Add Grade"}
            </h2>


            <div className="mt-5 space-y-3">

              {[
                ["grade","Grade"],
                ["minimum_score","Minimum Score"],
                ["maximum_score","Maximum Score"],
                ["remark","Remark"],
              ].map(([key,label]) => (

                <input
                  key={key}
                  placeholder={label}
                  value={form[key as keyof typeof form]}
                  onChange={(e)=>setForm({
                    ...form,
                    [key]: e.target.value
                  })}
                  className="w-full rounded-xl border px-4 py-2"
                />

              ))}

            </div>


            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={()=>setShowModal(false)}
                className="rounded-xl border px-4 py-2"
              >
                Cancel
              </button>


              <button
                  onClick={saveGrade}
                className="rounded-xl bg-rose-500 px-4 py-2 text-white"
              >
                  {editingId ? "Update Grade" : "Save Grade"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
