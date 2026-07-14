"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ShieldCheck, UserPlus, Loader2 } from "lucide-react";
import api from "@/lib/api";

type SuperAdmin = {
  id: number;
  school_id: number;
  role_id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
};

export default function SuperAdminsPage() {
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSuperAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/super-admins");
      setAdmins(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to load Super Admin accounts."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuperAdmins();
  }, [loadSuperAdmins]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await api.post("/super-admins", {
        email,
        password,
      });

      setEmail("");
      setPassword("");
      setSuccess("Super Admin account created successfully.");

      await loadSuperAdmins();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to create Super Admin account."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(admin: SuperAdmin) {
    try {
      setUpdatingId(admin.id);
      setError("");
      setSuccess("");

      const action = admin.is_active
        ? "deactivate"
        : "activate";

      await api.patch(
        `/super-admins/${admin.id}/${action}`
      );

      setSuccess(
        `Super Admin ${
          admin.is_active ? "deactivated" : "activated"
        } successfully.`
      );

      await loadSuperAdmins();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to update Super Admin status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
            <ShieldCheck size={28} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Super Admins
            </h1>

            <p className="mt-1 text-slate-500">
              Create and manage PreSense Super Administrator accounts.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <UserPlus className="text-rose-500" size={24} />

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Create Super Admin
              </h2>

              <p className="text-sm text-slate-500">
                Add another system administrator.
              </p>
            </div>
          </div>

          <form
        onSubmit={handleCreate}
        autoComplete="off"
        className="space-y-5"
      >
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                name="presense_new_super_admin_email"
                autoComplete="off"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@presense.com"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <input
                type="password"
                name="presense_new_super_admin_password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Super Admin
                </>
              )}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900">
              Super Admin Accounts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {admins.length} account{admins.length === 1 ? "" : "s"} registered
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2
                size={30}
                className="animate-spin text-rose-500"
              />
            </div>
          ) : admins.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500">
              No Super Admin accounts found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-700">
                      {admin.email.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {(() => {
                          const [name, domain] = admin.email.split("@");
                          const visible = name.slice(0, 2);
                          return `${visible}***@${domain}`;
                        })()}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        <span
                          className={`rounded-full px-3 py-1 font-semibold ${
                            admin.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                          Super Admin
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={updatingId === admin.id}
                    onClick={() => handleStatusChange(admin)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                      admin.is_active
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {updatingId === admin.id
                      ? "Updating..."
                      : admin.is_active
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
