"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
} from "lucide-react";

import api from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!token) {
      setError("Invalid password reset link.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      });

      setMessage(
        response.data.message || "Password reset successfully."
      );

      setNewPassword("");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to reset your password. The link may be invalid or expired."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-slate-50 px-6 py-12">
      <Link
        href="/login"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-rose-600"
      >
        <ArrowLeft size={17} />
        Back to login
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-[28px] border border-rose-100/80 bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-lg">
              <Image
                src="/logo.png"
                alt="PreSense"
                width={80}
                height={80}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Reset your password
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create a new password for your PreSense account.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                New password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  name="presense_new_password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100/70"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Loader2 size={28} className="animate-spin text-rose-600" />
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
