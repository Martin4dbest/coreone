"use client";

import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/api";

type BrowserLink = {
  id: number;
  school_id: number;
  title: string;
  url: string;
  description: string | null;
  category: string | null;
  created_by: number;
  is_active: boolean;
};

type FormState = {
  title: string;
  url: string;
  description: string;
  category: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  url: "",
  description: "",
  category: "",
};

const CATEGORIES = [
  "Learning",
  "Research",
  "Reference",
  "Educational",
  "Other",
];

export default function BrowserResourcesPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const [schoolId, setSchoolId] = useState<number | null>(null);

  const [links, setLinks] = useState<BrowserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    params.then((value) => {
      setSchoolId(Number(value.schoolId));
    });
  }, [params]);

  const loadLinks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/browser-links");

      const requestedSchoolId = schoolId;

      const data: BrowserLink[] = Array.isArray(response.data)
        ? response.data
        : [];

      setLinks(
        requestedSchoolId
          ? data.filter((item) => item.school_id === requestedSchoolId)
          : data
      );
    } catch (err: any) {
      console.error("Failed to load browser resources:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load browser resources."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId !== null) {
      loadLinks();
    }
  }, [schoolId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Enter a resource title.");
      return;
    }

    if (!form.url.trim()) {
      setError("Enter the destination for this resource.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId !== null) {
        await api.patch(`/browser-links/${editingId}`, {
          title: form.title.trim(),
          url: form.url.trim(),
          description: form.description.trim() || null,
          category: form.category.trim() || null,
        });

        setSuccess("Browser resource updated successfully.");
      } else {
        await api.post("/browser-links", {
          title: form.title.trim(),
          url: form.url.trim(),
          description: form.description.trim() || null,
          category: form.category.trim() || null,
        });

        setSuccess("Browser resource added successfully.");
      }

      resetForm();

      /*
       * The API client caches GET requests for 30 seconds.
       * Reloading this page after a mutation guarantees that
       * the newly-created/updated resource is fetched fresh.
       */
      window.location.reload();
    } catch (err: any) {
      console.error("Failed to save browser resource:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to save browser resource."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: BrowserLink) => {
    setEditingId(item.id);

    setForm({
      title: item.title || "",
      url: item.url || "",
      description: item.description || "",
      category: item.category || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleToggle = async (item: BrowserLink) => {
    if (togglingId !== null) {
      return;
    }

    const nextActiveState = !item.is_active;

    try {
      setTogglingId(item.id);
      setError("");
      setSuccess("");

      await api.patch(`/browser-links/${item.id}`, {
        is_active: nextActiveState,
      });

      // Update the card immediately without refreshing the page.
      setLinks((current) =>
        current.map((resource) =>
          resource.id === item.id
            ? {
                ...resource,
                is_active: nextActiveState,
              }
            : resource
        )
      );

      setSuccess(
        nextActiveState
          ? "Resource enabled."
          : "Resource disabled."
      );
    } catch (err: any) {
      console.error("Failed to change resource status:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to change resource status."
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (item: BrowserLink) => {
    const confirmed = window.confirm(
      `Delete "${item.title}"?\n\nStudents will no longer see this resource.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/browser-links/${item.id}`);

      setLinks((current) =>
        current.filter((resource) => resource.id !== item.id)
      );

      setSuccess("Browser resource deleted successfully.");
    } catch (err: any) {
      console.error("Failed to delete browser resource:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to delete browser resource."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <span>Learning</span>
              <span className="text-slate-300">/</span>
              <span>Browser</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Browser Resources
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Manage the approved educational resources available
              through the school's controlled browser.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(EMPTY_FORM);
              setError("");
              setSuccess("");
              setShowForm(true);
            }}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Add Resource
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {editingId !== null
                    ? "Edit Browser Resource"
                    : "Add Browser Resource"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  This resource will become available inside the
                  school's controlled browser.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Resource Name
                  </label>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        title: event.target.value,
                      })
                    }
                    placeholder="e.g. Khan Academy"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Category
                  </label>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select category</option>

                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Destination
                </label>

                <input
                  type="url"
                  value={form.url}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      url: event.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  The destination is stored internally and will be
                  opened inside the controlled browser. It is not
                  displayed as an address bar to students.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Briefly describe what students can use this resource for."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Save Changes"
                      : "Add Resource"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resources */}
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <p className="text-sm text-slate-500">
              Loading browser resources...
            </p>
          </div>
        ) : links.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              🌐
            </div>

            <h2 className="text-lg font-semibold text-slate-900">
              No browser resources yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Add approved educational websites that students can
              access through the controlled school browser.
            </p>

            <button
              type="button"
              onClick={() => {
                setForm(EMPTY_FORM);
                setEditingId(null);
                setShowForm(true);
              }}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add First Resource
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {links.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    🌐
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.is_active ? "Active" : "Disabled"}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>

                {item.category && (
                  <div className="mt-2 text-xs font-medium text-blue-600">
                    {item.category}
                  </div>
                )}

                <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-500">
                  {item.description ||
                    "Approved educational resource."}
                </p>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      disabled={togglingId === item.id}
                      className="inline-flex min-w-[76px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {togglingId === item.id ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                          <span>
                            {item.is_active
                              ? "Disabling..."
                              : "Enabling..."}
                          </span>
                        </>
                      ) : (
                        item.is_active ? "Disable" : "Enable"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
