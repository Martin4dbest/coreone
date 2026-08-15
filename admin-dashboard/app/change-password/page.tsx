"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
} from "lucide-react";

import api from "@/lib/api";

type CurrentUser = {
  id: number;
  email: string;
  school_id: number | null;
  must_change_password?: boolean;
  role?: string | { name?: string };
};

export default function ChangePasswordPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const response = await api.get<CurrentUser>("/auth/me");

        if (!mounted) return;

        setUser(response.data);
      } catch {
        if (!mounted) return;

        localStorage.removeItem("access_token");
        router.replace("/login");
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  function getRoleName() {
    if (!user?.role) return "";

    return typeof user.role === "string"
      ? user.role
      : user.role.name || "";
  }

  function getAfterChangePasswordRoute() {
    const tenantSlug = localStorage.getItem("tenant_slug");
    const role = getRoleName();

    if (role === "TEACHER") {
      return tenantSlug
        ? `/${tenantSlug}/teacher/dashboard`
        : "/teacher/dashboard";
    }

    if (role === "SCHOOL_ADMIN" && user?.school_id) {
      return tenantSlug
        ? `/${tenantSlug}/dashboard`
        : `/dashboard/schools/${user.school_id}`;
    }

    return "/dashboard";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess("Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.replace(getAfterChangePasswordRoute());
      }, 900);
    } catch (err: unknown) {
      const response = (
        err as {
          response?: {
            status?: number;
            data?: {
              detail?: string;
            };
          };
        }
      )?.response;

      if (response?.status === 401) {
        setError("Your current password is incorrect.");
      } else if (response?.data?.detail) {
        setError(response.data.detail);
      } else {
        setError("Unable to change your password. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your account...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-900 px-6 py-6 text-white sm:px-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <KeyRound className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  Change Password
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  Keep your PreSense account secure.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-6 sm:p-8"
          >
            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">{success}</p>
                  <p className="mt-1">
                    Returning you to your dashboard...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Current Password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) =>
                    setCurrentPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Enter your current password"
                  disabled={submitting || !!success}
                />

                <button
                  type="button"
                  onClick={() => setShowCurrent((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={
                    showCurrent
                      ? "Hide current password"
                      : "Show current password"
                  }
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                New Password
              </label>

              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Enter your new password"
                  disabled={submitting || !!success}
                />

                <button
                  type="button"
                  onClick={() => setShowNew((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={
                    showNew
                      ? "Hide new password"
                      : "Show new password"
                  }
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Use at least 8 characters.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Confirm New Password
              </label>

              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Confirm your new password"
                  disabled={submitting || !!success}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={
                    showConfirm
                      ? "Hide password confirmation"
                      : "Show password confirmation"
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !!success}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
