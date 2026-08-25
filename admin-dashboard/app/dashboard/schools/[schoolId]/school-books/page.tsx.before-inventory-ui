"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Boxes,
  Edit3,
  Library,
  Plus,
  Search,
  Archive,
  X,
  RefreshCw,
} from "lucide-react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { useTenant } from "@/context/TenantContext";

interface SchoolBook {
  id: number;
  school_id: number;
  title: string;
  author?: string | null;
  isbn?: string | null;
  category?: string | null;
  subject_id?: number | null;
  quantity: number;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

interface Subject {
  id: number;
  name: string;
}

const FALLBACK_PRIMARY = "#2563eb";
const FALLBACK_SECONDARY = "#0f172a";

export default function SchoolBooksPage() {
  const params = useParams();
  const schoolId = Number(params.schoolId);
  const { tenant } = useTenant();

  const primary = tenant?.primary_color || FALLBACK_PRIMARY;
  const secondary = tenant?.secondary_color || FALLBACK_SECONDARY;

  const [books, setBooks] = useState<SchoolBook[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolBook | null>(null);

  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    subject_id: "",
    quantity: "1",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [booksResponse, subjectsResponse] = await Promise.all([
        api.get(`/school-books/${schoolId}`),
        api.get(`/subjects?school_id=${schoolId}`),
      ]);

      setBooks(Array.isArray(booksResponse.data) ? booksResponse.data : []);
      setSubjects(
        Array.isArray(subjectsResponse.data)
          ? subjectsResponse.data
          : []
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to load school books."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolId) loadData();
  }, [schoolId]);

  const filteredBooks = useMemo(() => {
    const term = search.trim().toLowerCase();

    return books.filter((book) => {
      if (!showArchived && !book.is_active) return false;
      if (showArchived && book.is_active) return false;

      if (!term) return true;

      return [
        book.title,
        book.author,
        book.isbn,
        book.category,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        );
    });
  }, [books, search, showArchived]);

  const activeBooks = books.filter((book) => book.is_active);
  const totalCopies = activeBooks.reduce(
    (sum, book) => sum + Number(book.quantity || 0),
    0
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      author: "",
      isbn: "",
      category: "",
      subject_id: "",
      quantity: "1",
    });
    setModalOpen(true);
  };

  const openEdit = (book: SchoolBook) => {
    setEditing(book);
    setForm({
      title: book.title || "",
      author: book.author || "",
      isbn: book.isbn || "",
      category: book.category || "",
      subject_id: book.subject_id
        ? String(book.subject_id)
        : "",
      quantity: String(book.quantity ?? 1),
    });
    setModalOpen(true);
  };

  const saveBook = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        author: form.author.trim() || null,
        isbn: form.isbn.trim() || null,
        category: form.category.trim() || null,
        subject_id: form.subject_id
          ? Number(form.subject_id)
          : null,
        quantity: Math.max(0, Number(form.quantity) || 0),
      };

      if (editing) {
        await api.patch(
          `/school-books/${schoolId}/${editing.id}`,
          payload
        );
      } else {
        await api.post(`/school-books/${schoolId}`, payload);
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to save this book."
      );
    } finally {
      setSaving(false);
    }
  };

  const archiveBook = async (book: SchoolBook) => {
    if (
      !window.confirm(
        `Archive "${book.title}"?`
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/school-books/${schoolId}/${book.id}`
      );
      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to archive this book."
      );
    }
  };

  const subjectName = (id?: number | null) =>
    subjects.find((subject) => subject.id === id)?.name ||
    "General";

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
                <Library size={25} />
              </div>

              <h1 className="text-2xl font-bold sm:text-3xl">
                School Books
              </h1>

              <p className="mt-2 max-w-xl text-sm text-white/80">
                Manage the school&apos;s physical books,
                textbooks and library resources.
              </p>
            </div>

            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold shadow-lg transition hover:scale-[1.02]"
              style={{ color: primary }}
            >
              <Plus size={18} />
              Add Book
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<BookOpen size={20} />}
            label="Active Titles"
            value={activeBooks.length}
            primary={primary}
          />
          <StatCard
            icon={<Boxes size={20} />}
            label="Total Copies"
            value={totalCopies}
            primary={primary}
          />
          <StatCard
            icon={<Archive size={20} />}
            label="Archived"
            value={books.filter((book) => !book.is_active).length}
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
                placeholder="Search books, authors, ISBN..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--tenant-primary)] focus:ring-2 focus:ring-[var(--tenant-primary)]/10"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowArchived(false)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
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
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
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
                onClick={loadData}
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
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
          ) : filteredBooks.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${primary}12`,
                  color: primary,
                }}
              >
                <Library size={28} />
              </div>

              <h3 className="font-semibold text-slate-800">
                {showArchived
                  ? "No archived books"
                  : "No books found"}
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                {search
                  ? "Try changing your search."
                  : "Add your first school book to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Book</th>
                    <th className="px-5 py-4">Subject</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">ISBN</th>
                    <th className="px-5 py-4">Copies</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBooks.map((book) => (
                    <tr
                      key={book.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `${primary}12`,
                              color: primary,
                            }}
                          >
                            <BookOpen size={19} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {book.title}
                            </p>
                            <p className="text-xs text-slate-500">
                              {book.author || "Author not specified"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {subjectName(book.subject_id)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {book.category || "General"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-500">
                        {book.isbn || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="font-bold"
                          style={{ color: primary }}
                        >
                          {book.quantity}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(book)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>

                          {!showArchived && (
                            <button
                              onClick={() => archiveBook(book)}
                              className="rounded-lg border border-red-100 p-2 text-red-500 transition hover:bg-red-50"
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
                  {editing ? "Edit School Book" : "Add School Book"}
                </h2>
                <p className="mt-1 text-sm text-white/75">
                  Keep the school library catalogue up to date.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 transition hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={saveBook}
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Book Title"
                  required
                  value={form.title}
                  onChange={(value) =>
                    setForm({ ...form, title: value })
                  }
                />

                <Field
                  label="Author"
                  value={form.author}
                  onChange={(value) =>
                    setForm({ ...form, author: value })
                  }
                />

                <Field
                  label="ISBN"
                  value={form.isbn}
                  onChange={(value) =>
                    setForm({ ...form, isbn: value })
                  }
                />

                <Field
                  label="Category"
                  value={form.category}
                  onChange={(value) =>
                    setForm({ ...form, category: value })
                  }
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Subject
                  </label>
                  <select
                    value={form.subject_id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        subject_id: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--tenant-primary)]"
                  >
                    <option value="">General / None</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Field
                  label="Quantity"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(value) =>
                    setForm({ ...form, quantity: value })
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
                    : "Add Book"}
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
