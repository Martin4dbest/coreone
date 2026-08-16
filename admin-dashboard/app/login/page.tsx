"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";

import api from "@/lib/api";

type CurrentUser = {
  id: number;
  email: string;
  school_id: number | null;
  must_change_password?: boolean;
  role: {
    name: string;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

      const token = response.data.access_token;

      if (!token) {
        throw new Error("No access token returned");
      }

      localStorage.setItem("access_token", token);

      const userResponse =
        await api.get<CurrentUser>("/auth/me");

      const user = userResponse.data;

      // Teachers and school admins who must change their password
      // must complete the password change before entering the dashboard.
      if (
        user.must_change_password === true &&
        (user.role?.name === "TEACHER" ||
          user.role?.name === "SCHOOL_ADMIN")
      ) {
        router.replace("/change-password");
        return;
      }

      // ========================================================
      // COREONE MASTER PORTAL
      // SUPER_ADMIN MUST ALWAYS ENTER THE MASTER DASHBOARD.
      // SUPER_ADMIN is NOT tenant-bound for frontend routing.
      // ========================================================
      if (user.role?.name === "SUPER_ADMIN") {
        router.replace("/dashboard");
        return;
      }

      if (
        user.role?.name === "SCHOOL_ADMIN" &&
        user.school_id
      ) {
        router.replace(
          `/dashboard/schools/${user.school_id}`
        );

        return;
      }

      if (user.role?.name === "TEACHER") {
        router.replace("/teacher/dashboard");
        return;
      }

      router.replace("/dashboard");

    } catch (err: any) {
  
  if (process.env.NODE_ENV === "development") {
    console.warn(
      "Login Error Details:",
      err?.response?.data || err
    );
  }

      if (err?.response?.status === 401) {
        setError(
          "Login failed. The email or password you entered is incorrect. Please verify your details and try again."
        );
      } else if (err?.response?.status >= 500) {
        setError(
          "We are unable to complete your login request right now. Please try again later."
        );
      } else {
        setError(
          "Unable to sign in. Please check your connection and try again."
        );
      }

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">

      <Link
        href="/"
        className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-rose-600"
      >
        <ArrowLeft size={17} />
        Back to home
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
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to access your PreSense management platform.
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  name="presense_login_email"
                  autoComplete="off"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100/70"
                />

              </div>
            </div>

            <div>

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">

                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="presense_login_password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-12 text-sm text-slate-900 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100/70"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
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

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
          >
            Forgot password?
          </Link>
        </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                "Sign in to PreSense"
              )}
            </button>

          </form>

        </div>

      </div>

    </main>
  );
}
