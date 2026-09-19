"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  MapPin,
  Mail,
  Phone,
  Loader2,
  Trash2,
  X,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Globe,
  LayoutGrid,
  ListFilter,
} from "lucide-react";

import api from "@/lib/api";
import AddSchoolModal from "@/components/add-school-modal";

type School = {
  id: number;
  name: string;
  school_code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  is_active: boolean;
  is_system?: boolean;
};

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [confirmationName, setConfirmationName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function loadSchools() {
    try {
      const response = await api.get("/schools");
      setSchools(response.data);
    } catch (error) {
      console.error("Failed to load schools:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchools();
  }, []);

  function openDeleteModal(school: School) {
    setSchoolToDelete(school);
    setConfirmationName("");
    setDeleteError("");
  }

  function closeDeleteModal() {
    if (deleting) return;
    setSchoolToDelete(null);
    setConfirmationName("");
    setDeleteError("");
  }

  async function handleDeleteSchool() {
    if (!schoolToDelete || confirmationName !== schoolToDelete.name) return;

    try {
      setDeleting(true);
      setDeleteError("");

      await api.delete(`/schools/${schoolToDelete.id}`);

      setSchools((current) =>
        current.filter((school) => school.id !== schoolToDelete.id)
      );

      setSchoolToDelete(null);
      setConfirmationName("");
    } catch (error: any) {
      console.error("Failed to delete school:", error);
      setDeleteError(
        error.response?.data?.detail || "Unable to delete this school."
      );
    } finally {
      setDeleting(false);
    }
  }

  const isProtectedSystemSchool = (school: School) => {
    return (
      school.school_code?.toUpperCase() === "SYSTEM" ||
      school.name?.toLowerCase() === "presense" ||
      school.is_system === true
    );
  };

  const filteredSchools = schools.filter((school) => {
    const query = search.toLowerCase();
    return (
      school.name.toLowerCase().includes(query) ||
      school.school_code.toLowerCase().includes(query) ||
      school.city.toLowerCase().includes(query) ||
      school.state.toLowerCase().includes(query)
    );
  });

  // Analytical calculations
  const totalSchools = schools.length;
  const activeSchools = schools.filter((s) => s.is_active).length;
  const systemProtectedCount = schools.filter((s) => isProtectedSystemSchool(s)).length;
  const activePercentage = totalSchools > 0 ? Math.round((activeSchools / totalSchools) * 100) : 0;

  return (
    <div className="space-y-5 text-xs">
      {/* Header Section */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold uppercase tracking-[0.15em] text-rose-500">
            Institution Analytics & Control
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
            Schools Directory
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time telemetry and management across all registered campuses.
          </p>
        </div>

        <AddSchoolModal onSchoolCreated={loadSchools} />
      </section>

      {/* Analytical KPI Metrics Grid */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span>Total Institutions</span>
            <Building2 size={16} className="text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{totalSchools}</span>
            <span className="text-[10px] font-medium text-emerald-600 flex items-center">
              <TrendingUp size={10} className="mr-0.5" /> +100% sync
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span>Active Status</span>
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{activeSchools}</span>
            <span className="text-[10px] text-slate-400">({activePercentage}% operational)</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span>System Cores</span>
            <Globe size={16} className="text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{systemProtectedCount}</span>
            <span className="text-[10px] text-slate-400">Protected Nodes</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span>Inactive / Stale</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">
              {totalSchools - activeSchools}
            </span>
            <span className="text-[10px] text-slate-400">Require review</span>
          </div>
        </div>
      </section>

      {/* Toolbar: Search and View Mode Toggles */}
      <section className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, code, city or state..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-3 text-xs outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-50"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
              viewMode === "grid"
                ? "bg-rose-50 text-rose-600 shadow-xs"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <LayoutGrid size={14} /> Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
              viewMode === "table"
                ? "bg-rose-50 text-rose-600 shadow-xs"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <ListFilter size={14} /> Table
          </button>
        </div>
      </section>

      {/* Content Section */}
      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-slate-100 bg-white">
          <div className="text-center">
            <Loader2 size={24} className="mx-auto animate-spin text-rose-500" />
            <p className="mt-2 text-xs text-slate-500">Analyzing telemetry...</p>
          </div>
        </div>
      ) : filteredSchools.length === 0 ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/20 text-center p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm">
            <Building2 size={22} />
          </div>
          <h2 className="mt-3 font-bold text-slate-900">No schools detected</h2>
          <p className="mt-1 text-xs text-slate-500">
            Adjust your search criteria or register a new school instance.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Layout */
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSchools.map((school) => {
            const isProtected = isProtectedSystemSchool(school);

            return (
              <div
                key={school.id}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-rose-100 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                      <Building2 size={20} />
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        school.is_active
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {school.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h2 className="mt-4 text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                    {school.name}
                  </h2>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-500">
                    {school.school_code}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-500 border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{school.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{school.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span>
                        {school.city}, {school.state}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-5 grid gap-2 ${
                    isProtected ? "grid-cols-1" : "grid-cols-[1fr_auto]"
                  }`}
                >
                  <Link
                    href={`/dashboard/schools/${school.id}`}
                    className="flex items-center justify-center rounded-lg border border-rose-100 bg-rose-50/50 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                  >
                    View Metrics
                  </Link>

                  {!isProtected && (
                    <button
                      type="button"
                      onClick={() => openDeleteModal(school)}
                      className="flex items-center justify-center rounded-lg border border-red-100 px-3 text-red-500 transition hover:bg-red-50"
                      title="Delete school"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ) : (
        /* Table Layout View */
        <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Institution</th>
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchools.map((school) => {
                  const isProtected = isProtectedSystemSchool(school);
                  return (
                    <tr key={school.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {school.name}
                      </td>
                      <td className="py-3 px-4 font-semibold text-rose-500 uppercase">
                        {school.school_code}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="truncate max-w-[180px]">{school.email}</div>
                        <div className="text-[10px] text-slate-400">{school.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {school.city}, {school.state}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            school.is_active
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {school.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/schools/${school.id}`}
                            className="rounded-lg border border-rose-100 bg-rose-50/50 px-2.5 py-1.5 font-semibold text-rose-600 hover:bg-rose-100 transition"
                          >
                            View
                          </Link>
                          {!isProtected && (
                            <button
                              type="button"
                              onClick={() => openDeleteModal(school)}
                              className="rounded-lg border border-red-100 p-1.5 text-red-500 hover:bg-red-50 transition"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Delete Confirmation Modal */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <AlertTriangle size={20} />
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <h2 className="mt-4 text-sm font-bold text-slate-900">
              Permanently Delete School
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              You are about to permanently delete{" "}
              <span className="font-bold text-slate-900">
                {schoolToDelete.name}
              </span>
              . All corresponding ecosystem metrics and related records will be wiped out.
            </p>

            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-[11px] text-red-700">
              This action is final and irreversible.
            </div>

            <label className="mt-4 block text-[11px] font-semibold text-slate-700">
              Type <span className="font-bold text-slate-900">{schoolToDelete.name}</span> to confirm
            </label>

            <input
              type="text"
              value={confirmationName}
              onChange={(event) => setConfirmationName(event.target.value)}
              disabled={deleting}
              className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-50"
            />

            {deleteError && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-[11px] text-red-600">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg border border-slate-200 px-4 py-2 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteSchool}
                disabled={deleting || confirmationName !== schoolToDelete.name}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {deleting ? "Purging..." : "Confirm Purge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}