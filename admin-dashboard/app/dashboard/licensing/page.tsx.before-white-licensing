"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

type School = {
  id: number;
  name?: string;
  school_name?: string;
  code?: string;
  school_code?: string;
};

type User = {
  id: number;
  school_id?: number | null;
  role?: string | null;
  role_name?: string | null;
  roles?: Array<{ name?: string }>;
};

type PersonRecord = {
  id: number;
  school_id?: number | null;
  user_id?: number | null;
  role?: string | null;
};

type LicenseRow = {
  key: string;
  label: string;
  count: number;
  price: number;
};

const DEFAULT_PRICES: Record<string, number> = {
  super_admin: 5000,
  admin: 5000,
  teacher: 2000,
  student: 1000,
  parent: 500,
  staff: 1000,
};

const PRICE_STORAGE_KEY = "coreone_licensing_prices_v1";

function money(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeRole(user: User): string {
  const raw =
    user.role ||
    user.role_name ||
    user.roles?.[0]?.name ||
    "";

  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function getSchoolId(item: any): number | null {
  const value =
    item?.school_id ??
    item?.schoolId ??
    item?.school?.id ??
    null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function safeArray<T = any>(response: any): T[] {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;

  return [];
}

function extractId(item: any): number | null {
  const id = Number(item?.id ?? item?.user_id ?? item?.userId);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export default function LicensingPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<PersonRecord[]>([]);
  const [teachers, setTeachers] = useState<PersonRecord[]>([]);
  const [parents, setParents] = useState<PersonRecord[]>([]);
  const [staff, setStaff] = useState<PersonRecord[]>([]);

  const [prices, setPrices] =
    useState<Record<string, number>>(DEFAULT_PRICES);

  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PRICE_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (parsed && typeof parsed === "object") {
          setPrices({
            ...DEFAULT_PRICES,
            ...Object.fromEntries(
              Object.entries(parsed).map(([key, value]) => [
                key,
                Number(value) || 0,
              ])
            ),
          });
        }
      }
    } catch {
      // Keep defaults if local storage contains invalid data.
    }
  }, []);

  useEffect(() => {
    const loadSchools = async () => {
      setLoadingSchools(true);
      setError("");

      try {
        const response = await api.get("/schools");
        const list = safeArray<School>(response);

        setSchools(list);

        if (list.length > 0) {
          setSelectedSchoolId(Number(list[0].id));
        }
      } catch (err: any) {
        console.error("Licensing schools load failed:", err);
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load schools."
        );
      } finally {
        setLoadingSchools(false);
      }
    };

    loadSchools();
  }, []);

  useEffect(() => {
    if (!selectedSchoolId) return;

    const loadSchoolUsers = async () => {
      setLoadingUsers(true);
      setError("");

      try {
        /*
         * We deliberately load the different registered-user sources.
         * This prevents the licensing page from depending only on /users,
         * because students, teachers, parents and staff can also exist
         * in their own modules.
         */

        const requests = await Promise.allSettled([
          api.get("/users"),
          api.get("/students/"),
          api.get("/teachers"),
          api.get("/parents"),
          api.get("/staff"),
        ]);

        const getResult = <T,>(index: number): T[] => {
          const result = requests[index];

          if (result.status !== "fulfilled") {
            return [];
          }

          return safeArray<T>(result.value);
        };

        setUsers(getResult<User>(0));
        setStudents(getResult<PersonRecord>(1));
        setTeachers(getResult<PersonRecord>(2));
        setParents(getResult<PersonRecord>(3));
        setStaff(getResult<PersonRecord>(4));
      } catch (err: any) {
        console.error("Licensing users load failed:", err);

        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load school users."
        );
      } finally {
        setLoadingUsers(false);
      }
    };

    loadSchoolUsers();
  }, [selectedSchoolId]);

  const counts = useMemo(() => {
    const schoolId = Number(selectedSchoolId);

    const schoolUsers = users.filter(
      (user) => getSchoolId(user) === schoolId
    );

    const superAdminCount = schoolUsers.filter((user) => {
      const role = normalizeRole(user);

      return (
        role === "SUPER_ADMIN" ||
        role === "SUPERADMIN" ||
        role === "SUPER_ADMINISTRATOR"
      );
    }).length;

    const adminCount = schoolUsers.filter((user) => {
      const role = normalizeRole(user);

      return (
        role === "SCHOOL_ADMIN" ||
        role === "ADMIN" ||
        role === "ADMINISTRATOR"
      );
    }).length;

    const countRecords = (records: PersonRecord[]) =>
      records.filter((item) => getSchoolId(item) === schoolId).length;

    /*
     * If /users already contains the role, use it.
     * Otherwise use the dedicated module count.
     */
    const userTeacherCount = schoolUsers.filter((user) => {
      const role = normalizeRole(user);
      return role === "TEACHER" || role === "TEACHERS";
    }).length;

    const userStudentCount = schoolUsers.filter((user) => {
      const role = normalizeRole(user);
      return role === "STUDENT" || role === "STUDENTS";
    }).length;

    const userParentCount = schoolUsers.filter((user) => {
      const role = normalizeRole(user);
      return role === "PARENT" || role === "PARENTS";
    }).length;

    const userStaffCount = schoolUsers.filter((user) => {
      const role = normalizeRole(user);
      return role === "STAFF" || role === "STAFF_MEMBER";
    }).length;

    return {
      super_admin: superAdminCount,
      admin: adminCount,
      teacher:
        userTeacherCount > 0
          ? userTeacherCount
          : countRecords(teachers),
      student:
        userStudentCount > 0
          ? userStudentCount
          : countRecords(students),
      parent:
        userParentCount > 0
          ? userParentCount
          : countRecords(parents),
      staff:
        userStaffCount > 0
          ? userStaffCount
          : countRecords(staff),
    };
  }, [selectedSchoolId, users, students, teachers, parents, staff]);

  const rows: LicenseRow[] = [
    {
      key: "super_admin",
      label: "Super Admin",
      count: counts.super_admin,
      price: prices.super_admin,
    },
    {
      key: "admin",
      label: "Admins",
      count: counts.admin,
      price: prices.admin,
    },
    {
      key: "teacher",
      label: "Teachers",
      count: counts.teacher,
      price: prices.teacher,
    },
    {
      key: "student",
      label: "Students",
      count: counts.student,
      price: prices.student,
    },
    {
      key: "parent",
      label: "Parents",
      count: counts.parent,
      price: prices.parent,
    },
    {
      key: "staff",
      label: "Staff",
      count: counts.staff,
      price: prices.staff,
    },
  ];

  const totalUsers = rows.reduce((sum, row) => sum + row.count, 0);

  const grandTotal = rows.reduce(
    (sum, row) => sum + row.count * row.price,
    0
  );

  const selectedSchool = schools.find(
    (school) => Number(school.id) === Number(selectedSchoolId)
  );

  const updatePrice = (key: string, value: string) => {
    const numericValue = Math.max(0, Number(value) || 0);

    setPrices((current) => ({
      ...current,
      [key]: numericValue,
    }));
  };

  const savePrices = () => {
    setSavingPrices(true);

    try {
      window.localStorage.setItem(
        PRICE_STORAGE_KEY,
        JSON.stringify(prices)
      );

      window.setTimeout(() => {
        setSavingPrices(false);
      }, 300);
    } catch {
      setSavingPrices(false);
      setError("Unable to save the licensing prices.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                School Licensing
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                View registered users for a school and calculate its
                tentative licensing amount.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-zinc-900 px-5 py-4">
              <div className="text-xs uppercase tracking-wider text-gray-500">
                Total Users
              </div>

              <div className="mt-1 text-3xl font-bold">
                {loadingUsers ? "..." : totalUsers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* SCHOOL SELECTOR */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-zinc-950 p-5">
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Select School
          </label>

          <select
            value={selectedSchoolId ?? ""}
            onChange={(event) =>
              setSelectedSchoolId(
                event.target.value
                  ? Number(event.target.value)
                  : null
              )
            }
            disabled={loadingSchools}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-white/30 md:max-w-xl"
          >
            <option value="">
              {loadingSchools
                ? "Loading schools..."
                : "Select a school"}
            </option>

            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name ||
                  school.school_name ||
                  `School #${school.id}`}
                {school.code || school.school_code
                  ? ` (${school.code || school.school_code})`
                  : ""}
              </option>
            ))}
          </select>

          {selectedSchool && (
            <div className="mt-3 text-sm text-gray-500">
              Licensing calculation for{" "}
              <span className="font-medium text-gray-300">
                {selectedSchool.name ||
                  selectedSchool.school_name ||
                  `School #${selectedSchool.id}`}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {rows.map((row) => (
            <div
              key={row.key}
              className="rounded-2xl border border-white/10 bg-zinc-950 p-4"
            >
              <div className="text-xs text-gray-500">
                {row.label}
              </div>

              <div className="mt-2 text-2xl font-bold">
                {loadingUsers ? "..." : row.count.toLocaleString()}
              </div>

              <div className="mt-1 text-xs text-gray-600">
                registered
              </div>
            </div>
          ))}
        </div>

        {/* LICENSING TABLE */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
          <div className="border-b border-white/10 px-5 py-5">
            <h2 className="text-xl font-semibold">
              Licensing Calculation
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Change the price per registered user. The total updates
              automatically.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-900/60 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-4">User Type</th>
                  <th className="px-5 py-4 text-center">
                    Registered
                  </th>
                  <th className="px-5 py-4">Price / User</th>
                  <th className="px-5 py-4 text-right">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-white/5"
                  >
                    <td className="px-5 py-5">
                      <div className="font-medium">
                        {row.label}
                      </div>
                    </td>

                    <td className="px-5 py-5 text-center">
                      <span className="inline-flex min-w-12 items-center justify-center rounded-lg bg-white/5 px-3 py-2 font-semibold">
                        {row.count.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex max-w-[220px] items-center rounded-xl border border-white/10 bg-black">
                        <span className="px-3 text-sm text-gray-500">
                          ₦
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={row.price}
                          onChange={(event) =>
                            updatePrice(
                              row.key,
                              event.target.value
                            )
                          }
                          className="w-full bg-transparent px-2 py-3 text-white outline-none"
                        />
                      </div>
                    </td>

                    <td className="px-5 py-5 text-right text-lg font-semibold">
                      {money(row.count * row.price)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-white/[0.03]">
                  <td
                    colSpan={3}
                    className="px-5 py-6 text-right text-lg font-semibold"
                  >
                    TOTAL LICENSE AMOUNT
                  </td>

                  <td className="px-5 py-6 text-right text-2xl font-bold">
                    {money(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SAVE */}
          <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-gray-500">
              Prices are controlled by the Super Admin.
            </div>

            <button
              type="button"
              onClick={savePrices}
              disabled={savingPrices}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPrices ? "Saving..." : "Save Prices"}
            </button>
          </div>
        </div>

        {/* GRAND TOTAL */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
            <div className="text-sm text-gray-500">
              Registered Users
            </div>

            <div className="mt-2 text-3xl font-bold">
              {totalUsers.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
            <div className="text-sm text-gray-500">
              Price Configuration
            </div>

            <div className="mt-2 text-lg font-semibold">
              Editable by Super Admin
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white p-6 text-black">
            <div className="text-sm text-gray-600">
              Tentative School License
            </div>

            <div className="mt-2 text-3xl font-bold">
              {money(grandTotal)}
            </div>

            <div className="mt-1 text-xs text-gray-500">
              Based on current registered users and prices
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
