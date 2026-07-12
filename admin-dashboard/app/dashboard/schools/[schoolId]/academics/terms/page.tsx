"use client";

import { FormEvent, use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import api from "@/lib/api";


type AcademicSession = {
  id: number;
  name: string;
  is_current: boolean;
};


type Term = {
  id: number;
  school_id: number;
  academic_session_id: number;
  name: string;
  is_current: boolean;
};


export default function TermsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {

  const { schoolId } = use(params);


  const [terms, setTerms] = useState<Term[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [changingTermId, setChangingTermId] =
    useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [sessionId, setSessionId] = useState("");

  const [error, setError] = useState("");



  const loadData = useCallback(async () => {

    try {

      setLoading(true);
      setError("");

      const [
        termsResponse,
        sessionsResponse,
      ] = await Promise.all([
        api.get("/terms", {
          params: {
            school_id: schoolId,
          },
        }),

        api.get("/academic-sessions", {
          params: {
            school_id: schoolId,
          },
        }),
      ]);


      setTerms(termsResponse.data);
      setSessions(sessionsResponse.data);


    } catch (err) {

      console.error(
        "Failed loading terms:",
        err
      );

      setError(
        "Unable to load terms."
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


      await api.post("/terms", {

        school_id: Number(schoolId),

        academic_session_id:
          Number(sessionId),

        name: name.trim(),

        is_current: false,

      });


      setName("");
      setSessionId("");
      setShowForm(false);


      await loadData();


    } catch (err) {

      console.error(
        "Failed creating term:",
        err
      );

      setError(
        "Unable to create term."
      );

    } finally {

      setSaving(false);

    }

  }



  async function handleMakeCurrent(
    termId: number
  ) {

    try {

      setChangingTermId(termId);

      await api.patch(
        `/terms/${termId}/make-current`
      );


      await loadData();


    } catch (err) {

      console.error(
        "Failed making term current:",
        err
      );

      setError(
        "Unable to update current term."
      );

    } finally {

      setChangingTermId(null);

    }

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
            <Clock3 size={26}/>
          </div>


          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Academic Terms
          </h1>


          <p className="mt-3 text-sm text-slate-500">
            Manage terms within academic sessions.
          </p>

        </div>



        <button
          type="button"
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
            : "Add Term"
          }

        </button>


      </section>




      {showForm && (

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-white p-6 shadow-sm"
        >

          <h2 className="text-lg font-bold">
            Create Term
          </h2>


          <div className="mt-5 grid gap-5 md:grid-cols-2">


            <input
              required
              value={name}
              onChange={
                e => setName(e.target.value)
              }
              placeholder="e.g. First Term"
              className="rounded-xl border px-4 py-3"
            />



            <select

              required

              value={sessionId}

              onChange={
                e => setSessionId(e.target.value)
              }

              className="rounded-xl border px-4 py-3"

            >

              <option value="">
                Select Academic Session
              </option>


              {
                sessions.map(session => (

                  <option
                    key={session.id}
                    value={session.id}
                  >
                    {session.name}
                  </option>

                ))
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
                className="inline animate-spin mr-2"
              />
            }

            {
              saving
              ? "Creating..."
              : "Create Term"
            }

          </button>


        </form>

      )}




      {error && (

        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>

      )}




      <section className="rounded-2xl border bg-white p-6 shadow-sm">


        <h2 className="text-xl font-bold">
          School Terms
        </h2>



        {
          loading ? (

            <div className="py-10 text-slate-500">
              Loading terms...
            </div>

          ) : terms.length === 0 ? (

            <p className="py-10 text-sm text-slate-500">
              No terms created yet.
            </p>

          ) : (

            <div className="mt-5 space-y-3">


              {
                terms.map(term => (

                  <div
                    key={term.id}
                    className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <p className="font-bold">
                        {term.name}
                      </p>


                      <p className="text-xs text-slate-400">
                        Term ID: {term.id}
                      </p>

                    </div>



                    <div className="flex items-center gap-3">


                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          term.is_current
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                        }`}
                      >

                        {
                          term.is_current
                          ? "Current"
                          : "Not Current"
                        }

                      </span>



                      {
                        !term.is_current && (

                          <button

                            onClick={() =>
                              handleMakeCurrent(term.id)
                            }

                            disabled={
                              changingTermId === term.id
                            }

                            className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50"

                          >

                            {
                              changingTermId === term.id
                              ? "Updating..."
                              : "Make Current"
                            }

                          </button>

                        )
                      }


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
