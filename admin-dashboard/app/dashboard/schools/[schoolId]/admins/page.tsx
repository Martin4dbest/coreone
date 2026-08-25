"use client";

import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Power,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import api from "@/lib/api";

type User = {
  id: number;
  school_id: number;
  role_id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_primary_school_admin?: boolean;
};

type Role = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
};

export default function SchoolAdminsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = use(params);

  const [schoolName, setSchoolName] = useState("");

  const router = useRouter();

  const [admins, setAdmins] = useState<User[]>([]);
  const [accountants, setAccountants] = useState<User[]>([]);
  const [schoolAdminRole, setSchoolAdminRole] =
    useState<Role | null>(null);
  const [accountantRole, setAccountantRole] =
    useState<Role | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [accountantEmail, setAccountantEmail] = useState("");
  const [accountantPassword, setAccountantPassword] = useState("");
  const [accountantSaving, setAccountantSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUserIsPrimary, setCurrentUserIsPrimary] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");

  async function loadAdmins() {
    try {
      setLoading(true);
      setError("");

      const [usersResponse, rolesResponse] = await Promise.all([
        api.get<User[]>("/users"),
        api.get<Role[]>("/roles"),
      ]);

      const role = rolesResponse.data.find(
        (item) => item.name === "SCHOOL_ADMIN"
      );

      const accountant = rolesResponse.data.find(
        (item) => item.name === "ACCOUNTANT"
      );

      if (!role) {
        setSchoolAdminRole(null);
        setAdmins([]);
        setAccountants([]);
        setError("SCHOOL_ADMIN role was not found.");
        return;
      }

      setSchoolAdminRole(role);
      setAccountantRole(accountant || null);

      const schoolAdmins = usersResponse.data
        .filter(
          (user) =>
            user.school_id === Number(schoolId) &&
            user.role_id === role.id
        )
        .sort((a, b) => a.email.localeCompare(b.email));

      setAdmins(schoolAdmins);

      const schoolAccountants = accountant
        ? usersResponse.data
            .filter(
              (user) =>
                user.school_id === Number(schoolId) &&
                user.role_id === accountant.id
            )
            .sort((a, b) => a.email.localeCompare(b.email))
        : [];

      setAccountants(schoolAccountants);
    } catch (error) {
      console.error("Failed to load school admins:", error);
      setError("Unable to load school administrators.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function authorizeAndLoad() {
      try {
        const schoolResponse = await api.get(`/schools/${schoolId}`);
        setSchoolName(schoolResponse.data?.name || "");


        const userResponse = await api.get("/auth/me");

        const currentRole =
          userResponse.data?.role?.name;

        setCurrentUserRole(currentRole || "");

        setCurrentUserIsPrimary(
          Boolean(
            userResponse.data?.is_primary_school_admin
          )
        );

        if (
          currentRole !== "SUPER_ADMIN" &&
          currentRole !== "SCHOOL_ADMIN"
        ) {
          router.replace(
            `/dashboard/schools/${schoolId}`
          );
          return;
        }

        await loadAdmins();
      } catch (error) {
        console.error(
          "Failed to authorize School Admin management:",
          error
        );

        router.replace("/dashboard");
      }
    }

    authorizeAndLoad();
  }, [schoolId, router]);

  async function createAdmin(event: FormEvent) {
    event.preventDefault();

    if (
      currentUserRole !== "SUPER_ADMIN" &&
      !currentUserIsPrimary
    ) {
      setError(
        "Only the Primary School Admin can register another administrator."
      );
      return;
    }

    if (!schoolAdminRole) {
      setError("SCHOOL_ADMIN role is unavailable.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.post<User>("/users", {
        email: email.trim(),
        password,
        role_id: schoolAdminRole.id,
        school_id: Number(schoolId),
      });

      setAdmins((current) =>
        [...current, response.data].sort((a, b) =>
          a.email.localeCompare(b.email)
        )
      );

      setEmail("");
      setPassword("");
      setSuccess("School Admin created successfully.");
    } catch (error) {
      console.error("Failed to create school admin:", error);
      setError(
        "Unable to create School Admin. The email may already exist."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createAccountant(event: FormEvent) {
    event.preventDefault();

    if (
      currentUserRole !== "SUPER_ADMIN" &&
      !currentUserIsPrimary
    ) {
      setError(
        "Only the Primary School Admin can register a School Bookkeeper."
      );
      return;
    }

    if (!accountantRole) {
      setError("ACCOUNTANT role is unavailable.");
      return;
    }

    try {
      setAccountantSaving(true);
      setError("");
      setSuccess("");

      const response = await api.post<User>("/users", {
        email: accountantEmail.trim(),
        password: accountantPassword,
        role_id: accountantRole.id,
        school_id: Number(schoolId),
      });

      setAccountants((current) =>
        [...current, response.data].sort((a, b) =>
          a.email.localeCompare(b.email)
        )
      );

      setAccountantEmail("");
      setAccountantPassword("");
      setSuccess("School Bookkeeper / Accountant created successfully.");
    } catch (error) {
      console.error("Failed to create accountant:", error);
      setError(
        "Unable to create School Bookkeeper / Accountant. The email may already exist."
      );
    } finally {
      setAccountantSaving(false);
    }
  }

  async function toggleAccountantStatus(accountant: User) {
    try {
      setActionId(accountant.id);
      setError("");
      setSuccess("");

      const response = await api.patch<User>(
        `/users/${accountant.id}/status`,
        {
          is_active: !accountant.is_active,
        }
      );

      setAccountants((current) =>
        current.map((item) =>
          item.id === accountant.id ? response.data : item
        )
      );

      setSuccess(
        response.data.is_active
          ? "School Bookkeeper activated successfully."
          : "School Bookkeeper deactivated successfully."
      );
    } catch (error) {
      console.error("Failed to update accountant status:", error);
      setError("Unable to update School Bookkeeper status.");
    } finally {
      setActionId(null);
    }
  }

  async function toggleAdminStatus(admin: User) {
    try {
      setActionId(admin.id);
      setError("");
      setSuccess("");

      const response = await api.patch<User>(
        `/users/${admin.id}/status`,
        {
          is_active: !admin.is_active,
        }
      );

      setAdmins((current) =>
        current.map((item) =>
          item.id === admin.id ? response.data : item
        )
      );

      setSuccess(
        response.data.is_active
          ? "School Admin activated successfully."
          : "School Admin deactivated successfully."
      );
    } catch (error) {
      console.error("Failed to update admin status:", error);
      setError("Unable to update School Admin status.");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/schools/${schoolId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-rose-500"
      >
        <ArrowLeft size={17} />
        Back to School Workspace
      </Link>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur">
              <ShieldCheck size={27} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                School Administration
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                School Admins
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Create and manage administrator accounts assigned
                specifically to this school workspace.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Users size={19} />
              </div>

              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {admins.length}
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Total School Admins
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {
                    admins.filter((admin) => admin.is_active)
                      .length
                  }
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Active School Admins
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="grid gap-8 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={createAdmin}
          autoComplete="off"
          className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <UserPlus size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Add School Admin
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Create an administrator for this school.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                name="school-admin-email"
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@school.com"
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Temporary Password
              </label>

              <input
                type="password"
                name="school-admin-temporary-password"
                autoComplete="new-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter temporary password"
                required
                minLength={6}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !schoolAdminRole}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Creating Admin...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create School Admin
                </>
              )}
            </button>
          </div>
        </form>

        <form
          onSubmit={createAccountant}
          autoComplete="off"
          className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserPlus size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Add School Bookkeeper
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Create an Accountant who can manage School Books.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                name="accountant-email"
                autoComplete="off"
                value={accountantEmail}
                onChange={(event) =>
                  setAccountantEmail(event.target.value)
                }
                placeholder="accounts@school.com"
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Temporary Password
              </label>

              <input
                type="password"
                name="accountant-temporary-password"
                autoComplete="new-password"
                value={accountantPassword}
                onChange={(event) =>
                  setAccountantPassword(event.target.value)
                }
                placeholder="Enter temporary password"
                required
                minLength={6}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <button
              type="submit"
              disabled={accountantSaving || !accountantRole}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {accountantSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Bookkeeper...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create School Bookkeeper
                </>
              )}
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Current School Admins
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Administrator accounts assigned to this school.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              Loading School Admins...
            </div>
          ) : admins.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ShieldCheck size={24} />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No School Admins yet
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Create the first administrator account for this
                school using the form.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Mail size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">
                        {admin.email}
                      </p>

                      <p className="mt-1 text-xs font-medium text-indigo-600">
                        {admin.is_primary_school_admin
                          ? `Super Admin for ${schoolName || "this school"}`
                          : `Admin for ${schoolName || "this school"}`}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {admin.is_verified
                          ? "Verified account"
                          : "Not yet verified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        admin.is_active
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {admin.is_active ? "Active" : "Inactive"}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleAdminStatus(admin)}
                      disabled={actionId === admin.id}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        admin.is_active
                          ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={
                        admin.is_active
                          ? "Deactivate School Admin"
                          : "Activate School Admin"
                      }
                    >
                      {actionId === admin.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Power size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-900">
                School Bookkeepers / Accountants
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Accountant accounts assigned to this school.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              {accountants.length} Accountants
            </span>
          </div>

          {accountants.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={21} />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No School Bookkeepers yet
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Create one using the form above.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {accountants.map((accountant) => (
                <div
                  key={accountant.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Mail size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">
                        {accountant.email}
                      </p>
                      <p className="mt-1 text-xs text-emerald-600">
                        School Bookkeeper / Accountant
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        accountant.is_active
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {accountant.is_active ? "Active" : "Inactive"}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleAccountantStatus(accountant)}
                      disabled={actionId === accountant.id}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      title={
                        accountant.is_active
                          ? "Deactivate accountant"
                          : "Activate accountant"
                      }
                    >
                      {actionId === accountant.id ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <Power size={17} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
