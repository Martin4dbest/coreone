"use client";

import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Settings,
} from "lucide-react";

import api from "@/lib/api";

type Setting = {
  id: number;
  school_id: number;
  key: string;
  value: string | null;
  description: string | null;
  is_active: boolean;
};

export default function SettingsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  async function loadSettings() {
    try {
      setError("");

      const response = await api.get<Setting[]>(
        `/settings?school_id=${schoolId}`
      );

      setSettings(response.data);
    } catch (error) {
      console.error("Failed to load settings:", error);
      setError("Unable to load school settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, [schoolId]);

  async function createSetting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!key.trim()) return;

    try {
      setSaving(true);
      setError("");

      const response = await api.post<Setting>("/settings", {
        school_id: Number(schoolId),
        key: key.trim(),
        value: value.trim() || null,
        description: description.trim() || null,
      });

      setSettings((current) =>
        [...current, response.data].sort((a, b) =>
          a.key.localeCompare(b.key)
        )
      );

      setKey("");
      setValue("");
      setDescription("");
    } catch (error) {
      console.error("Failed to create setting:", error);
      setError("Unable to create setting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/schools/${schoolId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-rose-500"
      >
        <ArrowLeft size={16} />
        Back to School Workspace
      </Link>

      <section className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-8 shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
          <Settings size={26} />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          School Settings
        </h1>

        <p className="mt-3 text-sm text-slate-500">
          Configure settings for this school workspace.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={createSetting}
          className="h-fit rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">
            Add Setting
          </h2>

          <div className="mt-5 space-y-4">
            <input
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="Setting key"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-300"
            />

            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Value"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-300"
            />

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-rose-300"
            />

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Plus size={17} />
              )}
              Add Setting
            </button>
          </div>
        </form>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Current Settings
          </h2>

          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Loading settings...
            </div>
          ) : settings.length === 0 ? (
            <p className="py-10 text-sm text-slate-500">
              No settings have been added for this school.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900">
                      {setting.key}
                    </p>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        setting.is_active
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {setting.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-700">
                    {setting.value || "No value"}
                  </p>

                  {setting.description && (
                    <p className="mt-2 text-xs text-slate-500">
                      {setting.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
