"use client";

import { FormEvent, use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Plus,
  X,
  Power,
  Trash2,
} from "lucide-react";

import api from "@/lib/api";


type Subject = {
  id: number;
  school_id: number;
  department_id: number | null;
  name: string;
  code: string | null;
  is_active: boolean;
};


type Department = {
  id: number;
  name: string;
};


export default function SubjectsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {

  const { schoolId } = use(params);


  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [error, setError] = useState("");



  const loadData = useCallback(async () => {

    try {

      setLoading(true);
      setError("");


      const [
        subjectsResponse,
        departmentsResponse,
      ] = await Promise.all([

        api.get("/subjects", {
          params: {
            school_id: schoolId,
          },
        }),

        api.get("/departments", {
          params: {
            school_id: schoolId,
          },
        }),

      ]);


      setSubjects(subjectsResponse.data);
      setDepartments(departmentsResponse.data);


    } catch (err) {

      console.error(
        "Failed loading subjects:",
        err
      );

      setError(
        "Unable to load subjects."
      );

    } finally {

      setLoading(false);

    }

  }, [schoolId]);



  useEffect(() => {

    loadData();

  }, [loadData]);




  async function handleSubmit(
    event: FormEvent
  ) {

    event.preventDefault();


    try {

      setSaving(true);
      setError("");


      await api.post("/subjects", {

        school_id: Number(schoolId),

        department_id:
          departmentId
          ? Number(departmentId)
          : null,

        name: name.trim(),

        code:
          code.trim()
          || null,

      });



      setName("");
      setCode("");
      setDepartmentId("");

      setShowForm(false);


      await loadData();


    } catch (err) {

      console.error(
        "Failed creating subject:",
        err
      );

      setError(
        "Unable to create subject."
      );

    } finally {

      setSaving(false);

    }

  }




  async function toggleSubject(
  subjectId: number,
  currentStatus: boolean
) {

  try {

    setActionLoading(subjectId);

    await api.patch(`/subjects/${subjectId}`, {
      is_active: !currentStatus,
    });

    await loadData();

  } catch (err) {

    console.error(err);
    setError("Unable to update subject.");

  } finally {

    setActionLoading(null);

  }

}


async function deleteSubject(
  subjectId: number
) {

  if (!confirm("Delete this subject?")) {
    return;
  }

  try {

    setActionLoading(subjectId);

    await api.delete(`/subjects/${subjectId}`);

    await loadData();

  } catch (err) {

    console.error(err);
    setError("Unable to delete subject.");

  } finally {

    setActionLoading(null);

  }

}


function getDepartmentName(
    id: number | null
  ) {

    if (!id) return "General";

    return (
      departments.find(
        department =>
          department.id === id
      )?.name
      || "General"
    );

  }



  return (

    <div className="space-y-6">


      <Link
        href={`/dashboard/schools/${schoolId}/academics`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500"
      >

        <ArrowLeft size={16}/>
        Back to Academics

      </Link>




      <section className="flex flex-col gap-6 rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 md:flex-row md:items-center md:justify-between">


        <div>

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
            <BookOpen size={26}/>
          </div>


          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Subjects
          </h1>


          <p className="mt-3 text-sm text-slate-500">
            Manage school subjects and curriculum.
          </p>

        </div>



        <button
          onClick={() =>
            setShowForm(
              value => !value
            )
          }

          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-rose-500"
        >

          {
            showForm
            ? <X size={18}/>
            : <Plus size={18}/>
          }

          {
            showForm
            ? "Cancel"
            : "Add Subject"
          }

        </button>


      </section>




      {
        showForm && (

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border bg-white p-6 shadow-sm"
          >

            <h2 className="text-lg font-bold">
              Create Subject
            </h2>


            <div className="mt-5 grid gap-5 md:grid-cols-3">


              <input
                required
                value={name}
                onChange={
                  e => setName(e.target.value)
                }
                placeholder="Subject Name"
                className="rounded-xl border px-4 py-3"
              />



              <input
                value={code}
                onChange={
                  e => setCode(e.target.value)
                }
                placeholder="Code (optional)"
                className="rounded-xl border px-4 py-3"
              />



              <select

                value={departmentId}

                onChange={
                  e => setDepartmentId(e.target.value)
                }

                className="rounded-xl border px-4 py-3"

              >

                <option value="">
                  No Department
                </option>


                {
                  departments.map(
                    department => (

                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>

                    )
                  )
                }


              </select>


            </div>



            <button
              disabled={saving}
              className="mt-5 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white"
            >

              {
                saving &&
                <Loader2
                  size={16}
                  className="inline mr-2 animate-spin"
                />
              }

              {
                saving
                ? "Creating..."
                : "Create Subject"
              }

            </button>


          </form>

        )
      }





      {
        error && (

          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>

        )
      }





      <section className="rounded-2xl border bg-white p-6 shadow-sm">


        <h2 className="text-xl font-bold">
          School Subjects
        </h2>



        {
          loading ? (

            <div className="py-10 text-slate-500">
              Loading subjects...
            </div>

          ) : subjects.length === 0 ? (

            <p className="py-10 text-sm text-slate-500">
              No subjects created yet.
            </p>

          ) : (

            <div className="mt-5 space-y-3">

              {
                subjects.map(subject => (

                  <div
                    key={subject.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <p className="font-bold text-slate-900">
                        {subject.name}
                      </p>


                      <p className="text-xs text-slate-400">
                        Code: {subject.code || "N/A"}
                        {" • "}
                        {getDepartmentName(subject.department_id)}
                      </p>

                    </div>



                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        subject.is_active
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                      }`}
                    >

                      {
                        subject.is_active
                        ? "Active"
                        : "Inactive"
                      }

                    </span>


                  <div className="flex items-center gap-2">

                    <button
                      disabled={actionLoading === subject.id}
                      onClick={() =>
                        toggleSubject(
                          subject.id,
                          subject.is_active
                        )
                      }
                      className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold"
                    >
                      {
                        actionLoading === subject.id ? (
                          <Loader2
                            size={14}
                            className="inline mr-1 animate-spin"
                          />
                        ) : (
                          <Power
                            size={14}
                            className="inline mr-1"
                          />
                        )
                      }

                      {
                        actionLoading === subject.id
                        ? "Updating..."
                        : subject.is_active
                        ? "Deactivate"
                        : "Activate"
                      }
                    </button>


                    <button
                      disabled={actionLoading === subject.id}
                      onClick={() =>
                        deleteSubject(subject.id)
                      }
                      className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700"
                    >
                      {
                        actionLoading === subject.id ? (
                          <Loader2
                            size={14}
                            className="inline mr-1 animate-spin"
                          />
                        ) : (
                          <Trash2
                            size={14}
                            className="inline mr-1"
                          />
                        )
                      }

                      {
                        actionLoading === subject.id
                        ? "Deleting..."
                        : "Delete"
                      }
                    </button>

                  </div>

                  </div>

                ))
              }

            </div>

          )
        }


      </section>


    </div>

  );

}