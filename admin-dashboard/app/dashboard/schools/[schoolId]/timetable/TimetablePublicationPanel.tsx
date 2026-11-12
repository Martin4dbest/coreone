"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Printer, Send, XCircle } from "lucide-react";
import api from "@/lib/api";

type Classroom = {
  id: number;
  name?: string;
};

type Publication = {
  id: number;
  school_id: number;
  academic_session_id: number;
  term_id: number;
  publish_all_classes: boolean;
  classroom_ids: number[];
  published_at: string | null;
  published_by: number | null;
};

type Props = {
  schoolId: number;
  sessionId: number | "";
  termId: number | "";
  classes: Classroom[];
};

export default function TimetablePublicationPanel({
  schoolId,
  sessionId,
  termId,
  classes,
}: Props) {
  const [publication, setPublication] = useState<Publication | null>(null);
  const [publishAll, setPublishAll] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadPublication = useCallback(async () => {
    if (!schoolId || !sessionId || !termId) {
      setPublication(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.get<Publication>("/timetable/publication", {
        params: {
          school_id: schoolId,
          session_id: sessionId,
          term_id: termId,
        },
      });

      setPublication(response.data);
      setPublishAll(response.data.publish_all_classes);
      setSelectedClasses(response.data.classroom_ids ?? []);
    } catch (err: unknown) {
      const status =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      if (status === 404) {
        setPublication(null);
        setPublishAll(true);
        setSelectedClasses([]);
      } else {
        setError("Unable to load publication status.");
      }
    } finally {
      setLoading(false);
    }
  }, [schoolId, sessionId, termId]);

  useEffect(() => {
    void loadPublication();
  }, [loadPublication]);

  function toggleClass(id: number) {
    setSelectedClasses((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function publish() {
    if (!schoolId || !sessionId || !termId) {
      setError("Select an academic session and term first.");
      return;
    }

    if (!publishAll && selectedClasses.length === 0) {
      setError("Select at least one class.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api.post("/timetable/publication", {
        school_id: schoolId,
        academic_session_id: Number(sessionId),
        term_id: Number(termId),
        publish_all_classes: publishAll,
        classroom_ids: publishAll ? [] : selectedClasses,
      });

      setMessage("Timetable published successfully.");
      await loadPublication();
    } catch (err: unknown) {
      const detail =
        typeof err === "object" && err !== null && "response" in err
          ? (
              err as {
                response?: { data?: { detail?: string } };
              }
            ).response?.data?.detail
          : undefined;

      setError(detail || "Unable to publish the timetable.");
    } finally {
      setSaving(false);
    }
  }

  async function withdraw() {
    if (!publication || !sessionId || !termId) return;

    if (
      !window.confirm(
        "Withdraw this publication? Students, teachers and parents will no longer see this timetable.",
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api.post(
        `/timetable/publication/${Number(sessionId)}/${Number(termId)}/withdraw`,
        null,
        { params: { school_id: schoolId } },
      );

      setMessage("Publication withdrawn successfully.");
      await loadPublication();
    } catch {
      setError("Unable to withdraw publication.");
    } finally {
      setSaving(false);
    }
  }

  const isPublished = Boolean(publication?.published_at);

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Send className="h-5 w-5 text-indigo-600" />
            Timetable publication
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Publish the selected session and term to students, teachers and
            parents.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isPublished
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isPublished ? "Published" : "Not published"}
        </span>
      </div>

      {!sessionId || !termId ? (
        <p className="mt-4 text-sm text-amber-700">
          Select an academic session and term to manage publication.
        </p>
      ) : (
        <>
          {isPublished && publication?.published_at && (
            <p className="mt-3 text-sm text-slate-600">
              Published:{" "}
              {new Date(publication.published_at).toLocaleString("en-NG", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Africa/Lagos",
              })}
            </p>
          )}

          <div className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="publication-scope"
                checked={publishAll}
                onChange={() => setPublishAll(true)}
              />
              Publish all classes
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="publication-scope"
                checked={!publishAll}
                onChange={() => setPublishAll(false)}
              />
              Publish selected classes only
            </label>

            {!publishAll && (
              <div className="grid gap-2 border-t pt-3 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((classroom) => (
                  <label
                    key={classroom.id}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(classroom.id)}
                      onChange={() => toggleClass(classroom.id)}
                    />
                    {classroom.name || `Class ${classroom.id}`}
                  </label>
                ))}
                {classes.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No classes available.
                  </p>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={publish}
              disabled={saving || loading}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : isPublished
                  ? "Republish timetable"
                  : "Publish timetable"}
            </button>

            {isPublished && (
              <button
                type="button"
                onClick={withdraw}
                disabled={saving || loading}
                className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Withdraw
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

            <button
              type="button"
              onClick={() => void loadPublication()}
              disabled={loading || saving}
              className="rounded-lg border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
