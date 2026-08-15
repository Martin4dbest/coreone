"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  LogIn,
  Search,
  ShieldCheck,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

import api from "@/lib/api";

type AuditLog = {
  id: number;
  school_id: number;
  user_id: number;
  action: string;
  entity: string;
  entity_id?: number | null;
  description?: string | null;
  created_at?: string;
};

function extractValue(
  description: string,
  label: string,
): string {
  const regex = new RegExp(
    `${label}:\\s*(.*?)(?=\\s+—\\s+|$)`,
    "i",
  );

  const match = description.match(regex);

  return match?.[1]?.trim() || "—";
}

function getName(description: string): string {
  const match = description.match(
    /^(.*?)\s+logged in\s+—/i,
  );

  return match?.[1]?.trim() || "—";
}

function getSchool(description: string): string {
  return extractValue(description, "School");
}

function getRole(description: string): string {
  return extractValue(description, "Role");
}

function formatDate(value?: string): string {
  if (!value) return "—";

  /*
   * AuditLog.created_at is stored by the backend as UTC
   * without timezone information (datetime.utcnow()).
   *
   * Explicitly mark timezone-less timestamps as UTC before
   * converting them to the school's/local Lagos timezone.
   */
  const normalizedValue =
    /(?:Z|[+-]\\d{2}:?\\d{2})$/i.test(value)
      ? value
      : `${value}Z`;

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export default function LoginActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearConfirmation, setClearConfirmation] = useState("");
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState("");

  async function loadLogs() {
    try {
      setError("");
      setLoading(true);

      const response = await api.get<AuditLog[]>("/audit-logs");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setLogs(
        data.filter(
          (log) =>
            String(log.action).toLowerCase() === "login",
        ),
      );
    } catch (err) {
      console.error(
        "Failed to load login activity:",
        err,
      );

      setError(
        "Unable to load login activity.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function clearActivityLogs() {
    if (clearConfirmation !== "Delete Activity logs") {
      return;
    }

    try {
      setClearing(true);
      setClearError("");

      await api.delete("/audit-logs");

      setLogs([]);
      setShowClearModal(false);
      setClearConfirmation("");
    } catch (err) {
      console.error(
        "Failed to clear login activity:",
        err,
      );

      setClearError(
        "Unable to clear activity logs. Please try again.",
      );
    } finally {
      setClearing(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  // Automatically check for new login activity.
  // The request is explicitly cache-busted so newly-created
  // login records are fetched without a browser refresh.
  useEffect(() => {
    let active = true;

    const refreshLoginActivity = async () => {
      if (!active) return;

      try {
        await loadLogs();
      } catch (error) {
        console.error(
          "Automatic Login Activity refresh failed:",
          error,
        );
      }
    };

    // Check immediately when the page becomes active.
    refreshLoginActivity();

    // Then keep checking every 2 seconds.
    const interval = window.setInterval(() => {
      refreshLoginActivity();
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);


  const filteredLogs = logs.filter((log) => {
    const description = log.description || "";

    const searchable = [
      getName(description),
      getSchool(description),
      getRole(description),
      description,
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(
      search.trim().toLowerCase(),
    );
  });

  return (
    <section className="space-y-6">

      <div
        className="
          rounded-[28px]
          border
          border-rose-100
          bg-gradient-to-br
          from-rose-50
          via-white
          to-pink-50
          p-7
          shadow-sm
        "
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-rose-100
                text-rose-600
              "
            >
              <LogIn size={28} />
            </div>

            <div>
              <p className="text-sm font-semibold text-rose-600">
                🛡️ Super Admin
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Login Activity
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor successful user logins across PreSense schools.
              </p>
            </div>
          </div>



        </div>
      </div>

      {showClearModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-slate-950/50
            px-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !clearing
            ) {
              setShowClearModal(false);
              setClearConfirmation("");
              setClearError("");
            }
          }}
        >
          <div
            className="
              w-full
              max-w-md
              overflow-hidden
              rounded-[28px]
              border
              border-rose-100
              bg-white
              shadow-2xl
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-activity-title"
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                px-6
                py-5
              "
            >
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-rose-100
                    text-rose-600
                  "
                >
                  <Trash2 size={20} />
                </div>

                <div>
                  <h2
                    id="clear-activity-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    Clear Activity Logs
                  </h2>

                  <p className="text-xs text-slate-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={clearing}
                onClick={() => {
                  setShowClearModal(false);
                  setClearConfirmation("");
                  setClearError("");
                }}
                className="
                  rounded-xl
                  p-2
                  text-slate-400
                  transition
                  hover:bg-slate-100
                  hover:text-slate-700
                  disabled:opacity-50
                "
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-6">

              <div
                className="
                  rounded-2xl
                  border
                  border-rose-100
                  bg-rose-50
                  p-4
                "
              >
                <p className="text-sm font-semibold text-rose-800">
                  Do you want to clear activity logs?
                </p>

                <p className="mt-1 text-sm leading-6 text-rose-700">
                  This will permanently remove the login
                  activity records shown on this page.
                  Other audit activity will remain untouched.
                </p>
              </div>

              <div>
                <label
                  htmlFor="clear-activity-confirmation"
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                  "
                >
                  Type{" "}
                  <span className="font-bold text-rose-600">
                    Delete Activity logs
                  </span>{" "}
                  to confirm
                </label>

                <input
                  id="clear-activity-confirmation"
                  type="text"
                  value={clearConfirmation}
                  onChange={(event) => {
                    setClearConfirmation(event.target.value);
                    setClearError("");
                  }}
                  disabled={clearing}
                  autoFocus
                  placeholder="Delete Activity logs"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-rose-400
                    focus:ring-4
                    focus:ring-rose-100
                    disabled:bg-slate-50
                  "
                />
              </div>

              {clearError && (
                <div
                  className="
                    rounded-xl
                    border
                    border-rose-200
                    bg-rose-50
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-rose-700
                  "
                >
                  {clearError}
                </div>
              )}

              <div
                className="
                  flex
                  flex-col-reverse
                  gap-3
                  sm:flex-row
                  sm:justify-end
                "
              >
                <button
                  type="button"
                  disabled={clearing}
                  onClick={() => {
                    setShowClearModal(false);
                    setClearConfirmation("");
                    setClearError("");
                  }}
                  className="
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    clearing ||
                    clearConfirmation !== "Delete Activity logs"
                  }
                  onClick={clearActivityLogs}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-rose-600
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-rose-700
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {clearing ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Clear Activity Logs
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setClearError("");
              setClearConfirmation("");
              setShowClearModal(true);
            }}
            aria-label="Clear Activity Logs"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-rose-200
              bg-rose-50
              px-4
              py-3
              text-sm
              font-semibold
              text-rose-600
              shadow-sm
              transition
              hover:bg-rose-100
            "
          >
            <Trash2 size={17} />
            Clear Activity
          </button>
        </div>

<div className="grid gap-5 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-600" size={22} />
            <div>
              <p className="text-xs text-slate-400">
                Total Logins
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {logs.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" size={22} />
            <div>
              <p className="text-xs text-slate-400">
                Displaying
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {filteredLogs.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <LogIn className="text-purple-600" size={22} />
            <div>
              <p className="text-xs text-slate-400">
                Activity Type
              </p>
              <p className="text-lg font-bold text-slate-900">
                Successful Login
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="font-bold text-slate-900">
              Recent Login Activity
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Name, school and role for successful logins.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search
              size={17}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search name, school or role..."
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                py-2.5
                pl-10
                pr-4
                text-sm
                outline-none
                transition
                focus:border-rose-300
                focus:bg-white
              "
            />
          </div>

        </div>

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Loader2
              size={30}
              className="animate-spin text-rose-500"
            />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadLogs()}
              className="
                mt-4
                rounded-xl
                bg-rose-600
                px-4
                py-2
                text-sm
                font-semibold
                text-white
                hover:bg-rose-700
              "
            >
              Try Again
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <LogIn
              size={36}
              className="mx-auto text-slate-300"
            />

            <p className="mt-4 font-semibold text-slate-700">
              No login activity found.
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Successful logins will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Name
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    School
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Login
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Time
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredLogs.map((log) => {

                  const description =
                    log.description || "";

                  const name =
                    getName(description);

                  const school =
                    getSchool(description);

                  const role =
                    getRole(description);

                  return (
                    <tr
                      key={log.id}
                      className="
                        border-b
                        border-slate-50
                        transition
                        hover:bg-rose-50/30
                      "
                    >

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {name}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {school}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className="
                            inline-flex
                            rounded-full
                            bg-purple-50
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-purple-700
                          "
                        >
                          {role}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-full
                            bg-emerald-50
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            text-emerald-700
                          "
                        >
                          <LogIn size={13} />
                          Successful
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(log.created_at)}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </section>
  );
}
