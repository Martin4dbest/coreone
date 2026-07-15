"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Settings } from "lucide-react";

import api from "@/lib/api";

type Setting = {
  id: number;
  school_id: number;
  key: string;
  value: string | null;
  description: string | null;
  is_active: boolean;
};

type School = {
  id: number;
  name: string;
  school_code: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [settingsResponse, schoolsResponse] = await Promise.all([
        api.get<Setting[]>("/settings"),
        api.get<School[]>("/schools"),
      ]);

      setSettings(settingsResponse.data);
      setSchools(schoolsResponse.data);
    } catch (err: any) {
      console.error("Failed to load settings:", err);

      setError(
        err.response?.data?.detail ||
          "Failed to load system settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function getSchoolName(schoolId: number) {
    const school = schools.find(
      (item) => item.id === schoolId
    );

    return school?.name || `School ${schoolId}`;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Settings size={27} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Settings
            </h1>

            <p className="mt-1 text-slate-500">
              View settings configured across PreSense school workspaces.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">
            School Settings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {settings.length} setting{settings.length === 1 ? "" : "s"} found
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2
              size={30}
              className="animate-spin text-rose-500"
            />
          </div>
        ) : settings.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">
            No school settings have been configured yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="px-6 py-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-bold text-slate-900">
                      {setting.key}
                    </p>

                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                      {getSchoolName(setting.school_id)}
                    </span>

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

                  <p className="mt-3 break-words text-sm text-slate-700">
                    {setting.value || "No value"}
                  </p>

                  {setting.description && (
                    <p className="mt-2 text-sm text-slate-500">
                      {setting.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
