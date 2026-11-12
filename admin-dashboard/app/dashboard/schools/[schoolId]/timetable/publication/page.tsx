"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import TimetablePublicationPanel from "../TimetablePublicationPanel";

type Option = {
  id: number;
  name?: string;
  is_current?: boolean;
};

function getRows<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const result = data as {
      items?: T[];
      data?: T[];
      results?: T[];
    };

    if (Array.isArray(result.items)) return result.items;
    if (Array.isArray(result.data)) return result.data;
    if (Array.isArray(result.results)) return result.results;
  }

  return [];
}

export default function TimetablePublicationPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);
  const numericSchoolId = Number(schoolId);

  const [sessions, setSessions] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBaseData() {
      setLoading(true);
      setError("");

      try {
        const [sessionResponse, classResponse] = await Promise.all([
          api.get("/academic-sessions", {
            params: { school_id: numericSchoolId },
          }),
          api.get("/classes", {
            params: { school_id: numericSchoolId },
          }),
        ]);

        if (!active) return;

        const sessionRows = getRows<Option>(sessionResponse.data);
        setSessions(sessionRows);
        setClasses(getRows<Option>(classResponse.data));

        const currentSession =
          sessionRows.find((item) => item.is_current) ?? sessionRows[0];

        setSelectedSession(currentSession ? String(currentSession.id) : "");
      } catch {
        if (active) {
          setError("Unable to load this school's academic sessions and classes.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (Number.isFinite(numericSchoolId) && numericSchoolId > 0) {
      void loadBaseData();
    } else {
      setError("Invalid school ID.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [numericSchoolId]);

  useEffect(() => {
    let active = true;

    async function loadTerms() {
      setTerms([]);
      setSelectedTerm("");

      if (!selectedSession) return;

      try {
        const response = await api.get("/terms", {
          params: {
            school_id: numericSchoolId,
            academic_session_id: Number(selectedSession),
          },
        });

        if (!active) return;

        const termRows = getRows<Option>(response.data);
        setTerms(termRows);

        if (termRows.length > 0) {
          setSelectedTerm(String(termRows[0].id));
        }
      } catch {
        if (active) {
          setError("Unable to load terms for the selected academic session.");
        }
      }
    }

    void loadTerms();

    return () => {
      active = false;
    };
  }, [numericSchoolId, selectedSession]);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/dashboard/schools/${schoolId}/timetable`}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Back to timetable
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Timetable publication
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage timetable visibility for students, teachers and parents.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">
          Loading school timetable information...
        </p>
      ) : (
        <>
          <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Academic session
              <select
                value={selectedSession}
                onChange={(event) => setSelectedSession(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3"
              >
                <option value="">Select academic session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name || `Session ${session.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Term
              <select
                value={selectedTerm}
                onChange={(event) => setSelectedTerm(event.target.value)}
                disabled={!selectedSession || terms.length === 0}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3 disabled:bg-slate-100"
              >
                <option value="">Select term</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name || `Term ${term.id}`}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {!selectedSession || !selectedTerm ? (
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              Select an academic session and term before managing publication.
            </p>
          ) : (
            <TimetablePublicationPanel
              schoolId={numericSchoolId}
              sessionId={Number(selectedSession)}
              termId={Number(selectedTerm)}
              classes={classes}
            />
          )}
        </>
      )}
    </main>
  );
}
