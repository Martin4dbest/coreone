"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bus,
  Edit3,
  Plus,
  Search,
  Users,
  Archive,
  X,
  RefreshCw,
  Route,
} from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useTenant } from "@/context/TenantContext";

interface SchoolBus {
  id: number;
  school_id: number;
  name: string;
  registration_number: string;
  driver_name?: string | null;
  driver_phone?: string | null;
  capacity: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

const FALLBACK_PRIMARY = "#2563eb";
const FALLBACK_SECONDARY = "#0f172a";

export default function SchoolBusPage() {
  const params = useParams();
  const schoolId = Number(params.schoolId);
  const { tenant } = useTenant();

  const primary = tenant?.primary_color || FALLBACK_PRIMARY;
  const secondary = tenant?.secondary_color || FALLBACK_SECONDARY;

  const [buses, setBuses] = useState<SchoolBus[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolBus | null>(null);

  const [form, setForm] = useState({
    name: "",
    registration_number: "",
    driver_name: "",
    driver_phone: "",
    capacity: "1",
  });

  const loadBuses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/school-bus/${schoolId}`
      );

      setBuses(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to load school buses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadBuses();
  }, [schoolId]);

  const filteredBuses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return buses.filter((bus) => {
      if (!showArchived && !bus.is_active) return false;
      if (showArchived && bus.is_active) return false;

      if (!term) return true;

      return [
        bus.name,
        bus.registration_number,
        bus.driver_name,
        bus.driver_phone,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        );
    });
  }, [buses, search, showArchived]);

  const activeBuses = buses.filter(
    (bus) => bus.is_active
  );

  const totalCapacity = activeBuses.reduce(
    (sum, bus) => sum + Number(bus.capacity || 0),
    0
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      registration_number: "",
      driver_name: "",
      driver_phone: "",
      capacity: "1",
    });
    setModalOpen(true);
  };

  const openEdit = (bus: SchoolBus) => {
    setEditing(bus);
    setForm({
      name: bus.name || "",
      registration_number:
        bus.registration_number || "",
      driver_name: bus.driver_name || "",
      driver_phone: bus.driver_phone || "",
      capacity: String(bus.capacity ?? 1),
    });
    setModalOpen(true);
  };

  const saveBus = async (event: FormEvent) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.registration_number.trim()
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        registration_number:
          form.registration_number.trim(),
        driver_name:
          form.driver_name.trim() || null,
        driver_phone:
          form.driver_phone.trim() || null,
        capacity: Math.max(
          1,
          Number(form.capacity) || 1
        ),
      };

      if (editing) {
        await api.patch(
          `/school-bus/${schoolId}/${editing.id}`,
          payload
        );
      } else {
        await api.post(
          `/school-bus/${schoolId}`,
          payload
        );
      }

      setModalOpen(false);
      await loadBuses();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to save this bus."
      );
    } finally {
      setSaving(false);
    }
  };

  const archiveBus = async (bus: SchoolBus) => {
    if (
      !window.confirm(
        `Archive "${bus.name}"?`
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/school-bus/${schoolId}/${bus.id}`
      );
      await loadBuses();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to archive this bus."
      );
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8"
      style={
        {
          "--tenant-primary": primary,
          "--tenant-secondary": secondary,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div
          className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          }}
        >
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Bus size={25} />
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                School Bus
              </h1>

              <p className="mt-2 max-w-xl text-sm text-white/80">
                Manage school buses, drivers,
                registration details and passenger capacity.
              </p>
            </div>

            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold shadow-lg transition hover:scale-[1.02]"
              style={{ color: primary }}
            >
              <Plus size={18} />
              Add Bus
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Bus size={20} />}
            label="Active Buses"
            value={activeBuses.length}
            primary={primary}
          />

          <StatCard
            icon={<Users size={20} />}
            label="Total Capacity"
            value={totalCapacity}
            primary={primary}
          />

          <StatCard
            icon={<Archive size={20} />}
            label="Archived"
            value={buses.filter((bus) => !bus.is_active).length}
            primary={primary}
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search buses, registration, driver..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/10"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowArchived(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  !showArchived
                    ? "text-white shadow"
                    : "bg-slate-100 text-slate-600"
                }`}
                style={
                  !showArchived
                    ? { backgroundColor: primary }
                    : undefined
                }
              >
                Active
              </button>

              <button
                onClick={() => setShowArchived(true)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  showArchived
                    ? "text-white shadow"
                    : "bg-slate-100 text-slate-600"
                }`}
                style={
                  showArchived
                    ? { backgroundColor: primary }
                    : undefined
                }
              >
                Archived
              </button>

              <button
                onClick={loadBuses}
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
                title="Refresh"
              >
                <RefreshCw size={17} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <RefreshCw
                className="animate-spin"
                size={25}
                style={{ color: primary }}
              />
            </div>
          ) : filteredBuses.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${primary}12`,
                  color: primary,
                }}
              >
                <Route size={28} />
              </div>

              <h3 className="font-semibold text-slate-800">
                {showArchived
                  ? "No archived buses"
                  : "No buses found"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try changing your search."
                  : "Add the school's first bus to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Bus</th>
                    <th className="px-5 py-4">Registration</th>
                    <th className="px-5 py-4">Driver</th>
                    <th className="px-5 py-4">Phone</th>
                    <th className="px-5 py-4">Capacity</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBuses.map((bus) => (
                    <tr
                      key={bus.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `${primary}12`,
                              color: primary,
                            }}
                          >
                            <Bus size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {bus.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              School transport
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold tracking-wide text-slate-700">
                          {bus.registration_number}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {bus.driver_name || "Not assigned"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {bus.driver_phone || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Users size={16} style={{ color: primary }} />
                          <span
                            className="font-bold"
                            style={{ color: primary }}
                          >
                            {bus.capacity}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(bus)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>

                          {!showArchived && (
                            <button
                              onClick={() => archiveBus(bus)}
                              className="rounded-lg border border-red-100 p-2 text-red-500 hover:bg-red-50"
                              title="Archive"
                            >
                              <Archive size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div
              className="flex items-center justify-between px-6 py-5 text-white"
              style={{
                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
              }}
            >
              <div>
                <h2 className="text-xl font-bold">
                  {editing ? "Edit School Bus" : "Add School Bus"}
                </h2>
                <p className="mt-1 text-sm text-white/75">
                  Maintain the school transportation fleet.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={saveBus}
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Bus Name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    setForm({ ...form, name: value })
                  }
                />

                <Field
                  label="Registration Number"
                  required
                  value={form.registration_number}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      registration_number: value,
                    })
                  }
                />

                <Field
                  label="Driver Name"
                  value={form.driver_name}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      driver_name: value,
                    })
                  }
                />

                <Field
                  label="Driver Phone"
                  value={form.driver_phone}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      driver_phone: value,
                    })
                  }
                />

                <Field
                  label="Passenger Capacity"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      capacity: value,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
                  style={{ backgroundColor: primary }}
                >
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Save Changes"
                    : "Add Bus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  primary: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: `${primary}12`,
            color: primary,
          }}
        >
          {icon}
        </div>

        <span
          className="text-2xl font-bold"
          style={{ color: primary }}
        >
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        required={required}
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/10"
      />
    </div>
  );
}
