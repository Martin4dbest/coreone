"use client";

import { FormEvent, use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import api from "@/lib/api";

type AcademicSession = {
  id: number;
  school_id: number;
  name: string;
  is_current: boolean;
};

export default function AcademicSessionsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingSessionId, setChangingSessionId] = useState<number | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/academic-sessions", {
        params: { school_id: schoolId },
      });

      setSessions(response.data);
    } catch (err) {
      console.error("Failed to load academic sessions:", err);
      setError("Unable to load academic sessions.");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.post("/academic-sessions", {
        school_id: Number(schoolId),
        name: name.trim(),
        is_current: isCurrent,
      });

      setName("");
      setIsCurrent(false);
      setShowForm(false);

      await loadSessions();
    } catch (err) {
      console.error("Failed to create academic session:", err);
      setError("Unable to create academic session.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMakeCurrent(sessionId: number) {
    try {
      setChangingSessionId(sessionId);
      setError("");

      await api.patch(
        `/academic-sessions/${sessionId}/make-current`
      );

      await loadSessions();
    } catch (err) {
      console.error(
        "Failed to make academic session current:",
        err
      );
      setError("Unable to make academic session current.");
    } finally {
      setChangingSessionId(null);
    }
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/schools/${schoolId}/academics`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-rose-500"
      >
        <ArrowLeft size={17} />
        Back to Academics
      </Link>

      <section className="flex flex-col gap-6 rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
            <CalendarDays size={26} />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            Academic Sessions
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            Manage academic years for this school.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((value) => !value)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-500"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancel" : "Add Session"}
        </button>
      </section>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">
            Create Academic Session
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Session Name
              </label>

              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. 2026/2027"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400"
              />
            </div>

            <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(event) =>
                  setIsCurrent(event.target.checked)
                }
              />
              Set as current session
            </label>
          </div>

          <button
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving && (
              <Loader2 size={17} className="animate-spin" />
            )}
            {saving ? "Creating..." : "Create Session"}
          </button>
        </form>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          School Sessions
        </h2>

        {loading ? (
          <div className="flex items-center gap-3 py-10 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-10 text-sm text-slate-500">
            No academic sessions have been created yet.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {session.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Session ID: {session.id}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      session.is_current
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {session.is_current
                      ? "Current"
                      : "Not Current"}
                  </span>

                  {!session.is_current && (
                    <button
                      type="button"
                      disabled={
                        changingSessionId === session.id
                      }
                      onClick={() =>
                        handleMakeCurrent(session.id)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-500 transition hover:bg-rose-50 disabled:opacity-60"
                    >
                      {changingSessionId === session.id && (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      )}

                      {changingSessionId === session.id
                        ? "Updating..."
                        : "Make Current"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
