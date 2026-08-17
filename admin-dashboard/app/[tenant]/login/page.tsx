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
import { useTenant } from "@/context/TenantContext";

type CurrentUser = {
  id: number;
  email: string;
  school_id: number | null;
    must_change_password?: boolean;
role: {
    name: string;
  };
};

type ApiErrorResponse = {
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
};

export default function TenantLoginPage() {
  const router = useRouter();
  const { tenant } = useTenant();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  if (!tenant) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenant) return;

    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post<{ access_token: string }>(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Tenant": tenant.code,
          },
        }
      );

      const token = response.data.access_token;

      if (!token) {
        throw new Error("No access token returned");
      }

      localStorage.setItem("access_token", token);
  localStorage.setItem("tenant_slug", tenant.slug);

      const userResponse = await api.get<CurrentUser>(
        "/auth/me",
        {
          headers: {
            "X-Tenant": tenant.code,
          },
        }
      );

      const user = userResponse.data;

  if (user.role?.name === "SUPER_ADMIN") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("tenant_slug");

    setError(
      "Super Administrators must sign in through the main platform login."
    );

    return;
  }

  if (
    user.school_id &&
    tenant.id &&
    Number(user.school_id) !== Number(tenant.id)
  ) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("tenant_slug");

    setError(
      "You cannot sign in through another school's portal."
    );

    return;
  }

  if (user.role?.name === "SUPER_ADMIN") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("tenant_slug");

    setError(
      "Super Administrators must sign in through the main platform login."
    );

    return;
  }
      // Teachers and school admins marked for a required
      // password change must not enter the dashboard.
      if (
        user.must_change_password === true &&
        (user.role?.name === "TEACHER" ||
          user.role?.name === "SCHOOL_ADMIN")
      ) {
        router.replace("/change-password");
        return;
      }



      if (user.role?.name === "TEACHER") {
        router.replace(`/${tenant.slug}/teacher/dashboard`);
        return;
      }

      if (user.role?.name === "SCHOOL_ADMIN") {
        router.replace(`/${tenant.slug}/dashboard`);
        return;
      }

      router.replace(`/${tenant.slug}/dashboard`);

    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;

      if (apiErr?.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError(
          apiErr?.response?.data?.detail ??
          "Unable to sign in."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <Link
          href={`/${tenant.slug}`}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
          src={tenant.logo_url || "/logo.png"}
          alt={tenant.name}
          width={80}
          height={80}
          className="rounded-xl"
          unoptimized
        />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            {tenant.name}
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Sign in to your school portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-3.5 text-slate-400"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-slate-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-3 top-3.5 text-slate-400"
              />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 outline-none focus:border-slate-900"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-slate-400"
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
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-3 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && (
              <Loader2
                size={18}
                className="animate-spin"
              />
            )}

            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}