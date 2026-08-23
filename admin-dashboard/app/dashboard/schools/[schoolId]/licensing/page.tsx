"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";

type School = {
  id: number;
  name?: string;
  school_name?: string;
  code?: string;
  school_code?: string;
};

type LicensingSummary = {
  super_admin: number;
  admin: number;
  teacher: number;
  student: number;
  parent: number;
  staff: number;
};

type LicenseRow = {
  key: keyof LicensingSummary;
  label: string;
  count: number;
  price: number;
  icon: string;
  cardClass: string;
  iconClass: string;
};

const DEFAULT_PRICES: Record<keyof LicensingSummary, number> = {
  super_admin: 5000,
  admin: 5000,
  teacher: 2000,
  student: 1000,
  parent: 500,
  staff: 1000,
};

const PRICE_STORAGE_KEY = "coreone_licensing_prices_v1";

const EMPTY_SUMMARY: LicensingSummary = {
  super_admin: 0,
  admin: 0,
  teacher: 0,
  student: 0,
  parent: 0,
  staff: 0,
};

function money(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function safeArray<T = any>(response: any): T[] {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;

  return [];
}

function getResponseData(response: any): any {
  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
}

export default function LicensingPage() {
  const params = useParams<{ schoolId: string }>();
  const schoolId = Number(params?.schoolId);

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(
    Number.isFinite(schoolId) && schoolId > 0 ? schoolId : null
  );

  const [summary, setSummary] =
    useState<LicensingSummary>(EMPTY_SUMMARY);

  const [prices, setPrices] =
    useState<Record<keyof LicensingSummary, number>>(
      DEFAULT_PRICES
    );

  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(
        PRICE_STORAGE_KEY
      );

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
          } as Record<keyof LicensingSummary, number>);
        }
      }
    } catch {
      // Keep defaults.
    }
  }, []);

  useEffect(() => {
    if (!Number.isFinite(schoolId) || schoolId <= 0) {
      setError("Invalid school licensing route.");
      setLoadingSchools(false);
      return;
    }

    setSelectedSchoolId(schoolId);
    setLoadingSchools(false);
  }, [schoolId]);

  useEffect(() => {
    async function verifySchoolAccess() {
      try {
        const response = await api.get("/auth/me");
        const user = response?.data;

        const role =
          typeof user?.role === "string"
            ? user.role
            : user?.role?.name || "";

        if (
          role.toUpperCase() === "SCHOOL_ADMIN" &&
          (
            !user?.is_primary_school_admin ||
            Number(user?.school_id) !== Number(schoolId)
          )
        ) {
          window.location.replace(
            `/dashboard/schools/${user.school_id}`
          );
        }
      } catch (error) {
        console.error("Licensing access verification failed:", error);
      }
    }

    verifySchoolAccess();
  }, [schoolId]);

  useEffect(() => {
    if (!selectedSchoolId) {
      setSummary(EMPTY_SUMMARY);
      return;
    }

    async function loadSummary() {
      setLoadingSummary(true);
      setError("");

      try {
        const response = await api.get(
          `/users/licensing-summary?school_id=${selectedSchoolId}`
        );

        const data = getResponseData(response);

        setSummary({
          super_admin: Number(data?.super_admin) || 0,
          admin: Number(data?.admin) || 0,
          teacher: Number(data?.teacher) || 0,
          student: Number(data?.student) || 0,
          parent: Number(data?.parent) || 0,
          staff: Number(data?.staff) || 0,
        });
      } catch (err: any) {
        console.error(
          "Licensing summary load failed:",
          err
        );

        setSummary(EMPTY_SUMMARY);

        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Unable to load licensing statistics."
        );
      } finally {
        setLoadingSummary(false);
      }
    }

    loadSummary();
  }, [selectedSchoolId]);

  const rows: LicenseRow[] = [
    {
      key: "super_admin",
      label: "Super Admin",
      count: summary.super_admin,
      price: prices.super_admin,
      icon: "SA",
      cardClass: "border-rose-200 bg-rose-50",
      iconClass: "bg-rose-100 text-rose-700",
    },
    {
      key: "admin",
      label: "School Admins",
      count: summary.admin,
      price: prices.admin,
      icon: "A",
      cardClass: "border-purple-200 bg-purple-50",
      iconClass: "bg-purple-100 text-purple-700",
    },
    {
      key: "teacher",
      label: "Teachers",
      count: summary.teacher,
      price: prices.teacher,
      icon: "T",
      cardClass: "border-orange-200 bg-orange-50",
      iconClass: "bg-orange-100 text-orange-700",
    },
    {
      key: "student",
      label: "Students",
      count: summary.student,
      price: prices.student,
      icon: "S",
      cardClass: "border-blue-200 bg-blue-50",
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      key: "parent",
      label: "Parents",
      count: summary.parent,
      price: prices.parent,
      icon: "P",
      cardClass: "border-emerald-200 bg-emerald-50",
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      key: "staff",
      label: "Staff",
      count: summary.staff,
      price: prices.staff,
      icon: "ST",
      cardClass: "border-cyan-200 bg-cyan-50",
      iconClass: "bg-cyan-100 text-cyan-700",
    },
  ];

  const totalUsers = rows.reduce(
    (sum, row) => sum + row.count,
    0
  );

  const grandTotal = rows.reduce(
    (sum, row) => sum + row.count * row.price,
    0
  );

  const selectedSchool = schools.find(
    (school) =>
      Number(school.id) === Number(selectedSchoolId)
  );

  const updatePrice = (
    key: keyof LicensingSummary,
    value: string
  ) => {
    const numericValue = Math.max(
      0,
      Number(value) || 0
    );

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
      setError(
        "Unable to save the licensing prices."
      );
    }
  };

  const schoolName =
    selectedSchool?.name ||
    selectedSchool?.school_name ||
    "Selected School";

  return (
    <div className="min-h-screen bg-slate-50 p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-700">
                Super Admin
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                School Licensing
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Review registered users and calculate the
                tentative licensing amount for each school.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Registered Users
              </div>

              <div className="mt-1 text-3xl font-bold text-slate-900">
                {loadingSummary
                  ? "..."
                  : totalUsers.toLocaleString()}
              </div>

              {selectedSchool && (
                <div className="mt-1 text-xs text-slate-500">
                  {schoolName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SCHOOL SELECTOR */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Select School
          </label>

          <select
            value={selectedSchoolId ?? ""}
            disabled={loadingSchools}
            onChange={() => {}}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 md:max-w-xl"
          >
            <option value="">
              {loadingSchools
                ? "Loading schools..."
                : "Select a school"}
            </option>

            {schools.filter(
            (school) => Number(school.id) === Number(selectedSchoolId)
          ).map((school) => (
              <option
                key={school.id}
                value={school.id}
              >
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
            <div className="mt-3 text-sm text-slate-500">
              Showing licensing users for{" "}
              <span className="font-semibold text-slate-800">
                {schoolName}
              </span>
            </div>
          )}
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* USER CARDS */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {rows.map((row) => (
            <div
              key={row.key}
              className={`rounded-2xl border p-5 shadow-sm ${row.cardClass}`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold ${row.iconClass}`}
              >
                {row.icon}
              </div>

              <div className="mt-4 text-sm font-semibold text-slate-600">
                {row.label}
              </div>

              <div className="mt-1 text-3xl font-bold text-slate-900">
                {loadingSummary
                  ? "..."
                  : row.count.toLocaleString()}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                registered users
              </div>
            </div>
          ))}
        </div>

        {/* LICENSING CALCULATION */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 md:px-6">
            <h2 className="text-xl font-bold text-slate-900">
              Licensing Calculation
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set the price per registered user. The total
              updates automatically.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">
                    User Type
                  </th>

                  <th className="px-5 py-4 text-center">
                    Registered
                  </th>

                  <th className="px-5 py-4">
                    Price / User
                  </th>

                  <th className="px-5 py-4 text-right">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-slate-100"
                  >
                    <td className="px-5 py-5">
                      <div className="font-semibold text-slate-800">
                        {row.label}
                      </div>
                    </td>

                    <td className="px-5 py-5 text-center">
                      <span className="inline-flex min-w-14 items-center justify-center rounded-lg bg-slate-100 px-3 py-2 font-bold text-slate-800">
                        {row.count.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex max-w-[220px] items-center rounded-xl border border-slate-300 bg-white">
                        <span className="px-3 text-sm font-semibold text-slate-400">
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
                          className="w-full bg-transparent px-2 py-3 text-slate-900 outline-none"
                        />
                      </div>
                    </td>

                    <td className="px-5 py-5 text-right text-lg font-bold text-slate-900">
                      {money(
                        row.count * row.price
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-slate-50">
                  <td
                    colSpan={3}
                    className="px-5 py-6 text-right text-lg font-bold text-slate-700"
                  >
                    TOTAL LICENSE AMOUNT
                  </td>

                  <td className="px-5 py-6 text-right text-2xl font-bold text-cyan-700">
                    {money(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700">
                Pricing Configuration
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Prices are controlled by the Super Admin.
              </div>
            </div>

            <button
              type="button"
              onClick={savePrices}
              disabled={savingPrices}
              className="rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingPrices
                ? "Saving..."
                : "Save Prices"}
            </button>
          </div>
        </div>

        {/* TOTAL SUMMARY */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Registered Users
            </div>

            <div className="mt-2 text-3xl font-bold text-slate-900">
              {totalUsers.toLocaleString()}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">
              Selected School
            </div>

            <div className="mt-2 truncate text-lg font-bold text-slate-900">
              {schoolName}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
            <div className="text-sm font-semibold text-cyan-700">
              Tentative School License
            </div>

            <div className="mt-2 text-3xl font-bold text-cyan-900">
              {money(grandTotal)}
            </div>

            <div className="mt-1 text-xs text-cyan-700">
              Based on registered users and current prices
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
