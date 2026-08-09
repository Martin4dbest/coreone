"use client";

import { getAbsoluteUploadUrl } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {

  BookOpen,
  Plus,
  Search,
  Filter,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  Trash2,
  ExternalLink,
  Star,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type EbookActivity = {
  id: number;
  user_id: number;
  student_name: string;
  class_name?: string | null;
  email?: string | null;
  activity_type: "view" | "download" | string;
  created_at: string;
};

type Ebook = {
  id: number;
  title: string;
  author?: string | null;
  description?: string | null;
  file_url: string;
  category?: string | null;
  subject_id?: number | null;
  classroom_id?: number | null;
  cover_image_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  featured: boolean;
  download_count: number;
  view_count: number;
  is_active: boolean;
  created_at?: string | null;
};

export default function AdminEbooksPage() {
  const params = useParams();
  const schoolId = String(params.schoolId);

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
const [showArchived, setShowArchived] = useState(false);

const [activityEbook, setActivityEbook] = useState<Ebook | null>(null);
const [activities, setActivities] = useState<EbookActivity[]>([]);
const [activityLoading, setActivityLoading] = useState(false);
const [activityError, setActivityError] = useState("");


  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    author: "",
    description: "",
    category: "",
    file_url: "",
    file_name: "",
    file_size: "",
    file_type: "",
    cover_image_url: "",
    subject_id: "",
    classroom_id: "",
    featured: false,
  });

  const [deletingEbookId, setDeletingEbookId] = useState<number | null>(null);


    const [assignmentEbook, setAssignmentEbook] =
      useState<Ebook | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [assignedStudentIds, setAssignedStudentIds] =
      useState<Set<number>>(new Set());
    const [assignmentLoading, setAssignmentLoading] =
      useState(false);
    const [assignmentSaving, setAssignmentSaving] =
      useState<number | null>(null);

  const loadEbooks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/ebooks", {
        params: {
          school_id: schoolId,
          search: search || undefined,
          category: category || undefined,
        include_archived: showArchived,
        },
      });

      setEbooks(response.data || []);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to load ebooks."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEbooks();
  }, [schoolId, search, category, showArchived]);

  const loadEbookActivity = async (ebook: Ebook) => {
  try {
    setActivityEbook(ebook);
    setActivities([]);
    setActivityError("");
    setActivityLoading(true);

    const response = await api.get(
      `/ebooks/${ebook.id}/activity`
    );

    setActivities(response.data || []);
  } catch (err: any) {
    console.error("Failed to load ebook activity:", err);

    setActivityError(
      err?.response?.data?.detail ||
        "Unable to load ebook activity."
    );
  } finally {
    setActivityLoading(false);
  }
};

const closeActivity = () => {
  setActivityEbook(null);
  setActivities([]);
  setActivityError("");
};

const uploadFile = async (
    file: File,
    endpoint: string
  ) => {
    const body = new FormData();
    body.append("file", file);

    const response = await api.post(endpoint, body, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);

      const data = await uploadFile(
        file,
        "/ebooks/upload"
      );

      setForm((current) => ({
        ...current,
        file_url: data.file_url || data.url,
        file_name: data.file_name || file.name,
        file_size: String(
          data.file_size || file.size
        ),
        file_type:
          data.file_type ||
          file.type ||
          "application/octet-stream",
      }));
    } catch (err: any) {
      alert(
        err?.response?.data?.detail ||
          "Ebook upload failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSaving(true);

      const data = await uploadFile(
        file,
        "/ebooks/upload-cover"
      );

      setForm((current) => ({
        ...current,
        cover_image_url:
          data.cover_image_url || data.url,
      }));
    } catch (err: any) {
      alert(
        err?.response?.data?.detail ||
          "Cover upload failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const createEbook = async () => {
    if (!form.title.trim()) {
      alert("Enter the ebook title.");
      return;
    }

    if (!form.file_url) {
      alert("Upload the ebook file first.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/ebooks", {
        title: form.title.trim(),
        author: form.author || null,
        description: form.description || null,
        category: form.category || null,
        file_url: form.file_url,
        file_name: form.file_name || null,
        file_size: form.file_size
          ? Number(form.file_size)
          : null,
        file_type: form.file_type || null,
        cover_image_url:
          form.cover_image_url || null,
        subject_id: form.subject_id
          ? Number(form.subject_id)
          : null,
        classroom_id: form.classroom_id
          ? Number(form.classroom_id)
          : null,
        featured: form.featured,
      });

      setShowModal(false);

      setForm({
        title: "",
        author: "",
        description: "",
        category: "",
        file_url: "",
        file_name: "",
        file_size: "",
        file_type: "",
        cover_image_url: "",
        subject_id: "",
        classroom_id: "",
        featured: false,
      });

      await loadEbooks();
    } catch (err: any) {
      alert(
        err?.response?.data?.detail ||
          "Failed to create ebook."
      );
    } finally {
      setSaving(false);
    }
  };

  const restoreEbook = async (id: number) => {
  if (!window.confirm("Restore this ebook to the active library?")) {
    return;
  }

  try {
    await api.patch(`/ebooks/${id}`, {
      is_active: true,
    });

    await loadEbooks();
  } catch (err: any) {
    alert(
      err?.response?.data?.detail ||
        "Unable to restore ebook."
    );
  }
};

const archiveEbook = async (id: number) => {
    if (
      !window.confirm(
        "Archive this ebook?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`/ebooks/${id}`);
      await loadEbooks();
    } catch (err: any) {
      alert(
        err?.response?.data?.detail ||
          "Unable to archive ebook."
      );
    }
  };

  const formatSize = (size?: number | null) => {
    if (!size) return "—";

    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };


    const openAssignmentModal = async (ebook: Ebook) => {
      try {
        setAssignmentEbook(ebook);
        setStudents([]);
        setAssignedStudentIds(new Set());
        setAssignmentLoading(true);

        const response = await api.get("/students/", {
          params: {
            school_id: schoolId,
          },
        });

        const studentList = Array.isArray(response.data)
          ? response.data
          : response.data?.students ||
            response.data?.items ||
            [];

        setStudents(studentList);

        const assigned = new Set<number>();

        await Promise.all(
          studentList.map(async (student: any) => {
            try {
              const accessResponse = await api.get(
                `/ebooks/${ebook.id}/students/${student.id}`
              );

              if (
                accessResponse.data?.assigned &&
                accessResponse.data?.is_active
              ) {
                assigned.add(Number(student.id));
              }
            } catch (error) {
              console.warn(
                "Could not check ebook access for student:",
                student.id,
                error
              );
            }
          })
        );

        setAssignedStudentIds(assigned);
      } catch (error: any) {
        console.error(
          "Failed to load students for ebook assignment:",
          error
        );

        alert(
          error?.response?.data?.detail ||
            "Unable to load students for ebook assignment."
        );

        setAssignmentEbook(null);
      } finally {
        setAssignmentLoading(false);
      }
    };

    const closeAssignmentModal = () => {
      setAssignmentEbook(null);
      setStudents([]);
      setAssignedStudentIds(new Set());
      setAssignmentLoading(false);
      setAssignmentSaving(null);
    };

    const toggleStudentAssignment = async (
      studentId: number,
      assigned: boolean
    ) => {
      if (!assignmentEbook) return;

      try {
        setAssignmentSaving(studentId);

        if (assigned) {
          await api.delete(
            `/ebooks/${assignmentEbook.id}/students/${studentId}`
          );

          setAssignedStudentIds((current) => {
            const next = new Set(current);
            next.delete(studentId);
            return next;
          });
        } else {
          await api.post(
            `/ebooks/${assignmentEbook.id}/students/${studentId}`
          );

          setAssignedStudentIds((current) => {
            const next = new Set(current);
            next.add(studentId);
            return next;
          });
        }
      } catch (error: any) {
        console.error(
          "Failed to update ebook assignment:",
          error
        );

        alert(
          error?.response?.data?.detail ||
            "Unable to update ebook assignment."
        );
      } finally {
        setAssignmentSaving(null);
      }
    };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-8 text-slate-800">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Library Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Ebooks & Digital Learning
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Upload, organize, and manage digital learning materials for your school.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ebook</span>
          </button>
        </div>

        {/* Active / Archived Tabs */}
    <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-sm w-fit">
      <button
        type="button"
        onClick={() => setShowArchived(false)}
        className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
          !showArchived
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        Active Ebooks
      </button>

      <button
        type="button"
        onClick={() => setShowArchived(true)}
        className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
          showArchived
            ? "bg-slate-700 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        Archived Ebooks
      </button>
    </div>

    {/* Search & Filter Bar */}
        <div className="grid gap-3 sm:grid-cols-2 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ebooks by title..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Filter by category e.g. Science..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Ebooks List / States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-16 text-slate-400 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading ebooks library...</p>
          </div>
        ) : ebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
              <BookOpen className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              No ebooks found
            </h2>
            <p className="mt-1 text-sm text-slate-500 max-w-md">
              No digital learning materials match your current criteria. Upload your first ebook to get started.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Ebook</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ebooks.map((ebook) => (
              <div
                key={ebook.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300"
              >
                {/* Book Cover Container */}
                <div className="relative aspect-[16/10] bg-slate-100 border-b border-slate-100 overflow-hidden flex items-center justify-center">
                  {getAbsoluteUploadUrl(ebook.cover_image_url) ? (
                    <img
                      src={getAbsoluteUploadUrl(ebook.cover_image_url)}
                      alt={ebook.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}

                  {ebook.featured && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      Featured
                    </span>
                  )}
                </div>

                {/* Content Details */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div className="space-y-1.5">
                    <h2 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {ebook.title}
                    </h2>

                    {ebook.author && (
                      <p className="text-xs font-medium text-slate-500">
                        By {ebook.author}
                      </p>
                    )}

                    {ebook.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 pt-1 leading-relaxed">
                        {ebook.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {ebook.category && (
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                          {ebook.category}
                        </span>
                      )}

                      <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-500 uppercase">
                        {formatSize(ebook.file_size)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {ebook.view_count || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        {ebook.download_count || 0} downloads
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                    type="button"
                    onClick={async () => {
                      const newTab = window.open("", "_blank");

                      try {
                        const response = await api.get(
                          `/ebooks/${ebook.id}/file`,
                          {
                            responseType: "blob",
                          }
                        );

                        const blobUrl = URL.createObjectURL(response.data);

                        if (newTab) {
                          newTab.location.href = blobUrl;
                        } else {
                          window.open(blobUrl, "_blank");
                        }

                        setTimeout(() => {
                          URL.revokeObjectURL(blobUrl);
                        }, 60000);
                      } catch (error) {
                        console.error("Failed to open ebook:", error);

                        if (newTab) {
                          newTab.close();
                        }

                        alert("Unable to open this ebook.");
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </button>
                  <button
                    onClick={() => loadEbookActivity(ebook)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Activity
                  </button>

                    <button
                      type="button"
                      onClick={() => openAssignmentModal(ebook)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      Assign Students
                    </button>




                      <button
                        onClick={() => archiveEbook(ebook.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Archive
                      </button>
                  {showArchived && (
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Permanently delete "${ebook.title}"? This cannot be undone.`
                        );

                        if (!confirmed) {
                          return;
                        }

                        try {
                          setDeletingEbookId(ebook.id);

                          await api.delete(
                            `/ebooks/${ebook.id}/permanent`
                          );

                          setEbooks((currentEbooks) =>
                            currentEbooks.filter(
                              (item) => item.id !== ebook.id
                            )
                          );

                          alert(
                            `"${ebook.title}" was permanently deleted successfully.`
                          );
                        } catch (error) {
                          console.error(
                            "Failed to permanently delete ebook:",
                            error
                          );

                          alert(
                            "Unable to permanently delete this ebook."
                          );
                        } finally {
                          setDeletingEbookId(null);
                        }
                      }}
                      disabled={deletingEbookId === ebook.id}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {deletingEbookId === ebook.id ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-700" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  )}

                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        
          {/* Ebook Student Assignment Modal */}
          {assignmentEbook && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Assign Students
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {assignmentEbook.title}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeAssignmentModal}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {assignmentLoading ? (
                    <div className="flex min-h-[240px] items-center justify-center">
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading students...
                      </div>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                      <BookOpen className="mb-3 h-10 w-10 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-700">
                        No students found
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        There are no students available to assign this ebook to.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Students
                          </p>
                          <p className="text-xs text-slate-500">
                            Select the students who should have access.
                          </p>
                        </div>

                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {assignedStudentIds.size} assigned
                        </span>
                      </div>

                      {students.map((student: any) => {
                        const studentId = Number(student.id);
                        const isAssigned = assignedStudentIds.has(studentId);
                        const isSaving = assignmentSaving === studentId;

                        const name =
                          [
                            student.first_name,
                            student.middle_name,
                            student.last_name,
                          ]
                            .filter(Boolean)
                            .join(" ") ||
                          student.name ||
                          `Student #${studentId}`;

                        return (
                          <label
                            key={studentId}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                              isAssigned
                                ? "border-emerald-200 bg-emerald-50/60"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {name}
                              </p>

                              <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                                <p className="truncate">
                                  <span className="font-medium text-slate-600">
                                    School:
                                  </span>{" "}
                                  {student.school_name ||
                                    student.school?.name ||
                                    "—"}
                                </p>

                                <p className="truncate">
                                  <span className="font-medium text-slate-600">
                                    Class:
                                  </span>{" "}
                                  {student.class_name ||
                                    student.classroom_name ||
                                    student.classroom?.name ||
                                    student.class?.name ||
                                    student.level_name ||
                                    "—"}
                                </p>

                                {(student.admission_number || student.email) && (
                                  <p className="truncate">
                                    {student.admission_number ||
                                      student.email}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="ml-4 flex shrink-0 items-center gap-3">
                              {isSaving && (
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                              )}

                              <input
                                type="checkbox"
                                checked={isAssigned}
                                disabled={isSaving}
                                onChange={() =>
                                  toggleStudentAssignment(
                                    studentId,
                                    isAssigned
                                  )
                                }
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
                  <button
                    type="button"
                    onClick={closeAssignmentModal}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

{/* Ebook Activity Modal */}
    {activityEbook && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Eye className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Ebook Activity
                </h2>
                <p className="text-xs text-slate-500">
                  {activityEbook.title}
                </p>
              </div>
            </div>

            <button
              onClick={closeActivity}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {activityLoading ? (
            <div className="flex flex-col items-center justify-center p-16">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-indigo-600" />
              <p className="text-sm font-medium text-slate-600">
                Loading student activity...
              </p>
            </div>
          ) : activityError ? (
            <div className="p-6">
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{activityError}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 border-b border-slate-100 bg-slate-50 p-5">

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Total Activity
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {activities.length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Views
                  </p>
                  <p className="mt-1 text-2xl font-bold text-indigo-600">
                    {activities.filter(
                      (item) => item.activity_type === "view"
                    ).length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Downloads
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600">
                    {activities.filter(
                      (item) => item.activity_type === "download"
                    ).length}
                  </p>
                </div>

              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Eye className="h-6 w-6" />
                    </div>

                    <h3 className="text-sm font-semibold text-slate-800">
                      No activity yet
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      No students have viewed or downloaded this ebook yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Student
                            </th>
                              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Class
                              </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Activity
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Date & Time
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                          {activities.map((activity) => (
                            <tr
                              key={activity.id}
                              className="hover:bg-slate-50"
                            >
                              <td className="px-4 py-4">
                                <p className="text-sm font-semibold text-slate-800">
                                  {activity.student_name}
                                </p>

                                {activity.email && (
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {activity.email}
                                  </p>
                                )}
                              </td>

                                <td className="px-4 py-4">
                                  <p className="text-sm font-medium text-slate-700">
                                    {activity.class_name || "—"}
                                  </p>
                                </td>

                              <td className="px-4 py-4">
                                {activity.activity_type === "download" ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    <Download className="h-3.5 w-3.5" />
                                    Downloaded
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                    <Eye className="h-3.5 w-3.5" />
                                    Viewed
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-4 text-xs text-slate-500">
                                {activity.created_at
                                  ? new Date(
                                      activity.created_at
                                    ).toLocaleString()
                                  : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end border-t border-slate-200 px-6 py-4">
            <button
              onClick={closeActivity}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    )}

    {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-800">

              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Add New Ebook
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload a digital learning resource to the library.
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Title *
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g. Advanced High School Physics"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Author
                    </label>
                    <input
                      value={form.author}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          author: e.target.value,
                        })
                      }
                      placeholder="Author name"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Category
                    </label>
                    <input
                      value={form.category}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          category: e.target.value,
                        })
                      }
                      placeholder="e.g. Mathematics"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description of the material..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Ebook File Upload Zone */}
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                        Ebook Document *
                      </p>
                      <p className="text-xs text-slate-400">PDF or EPUB files accepted</p>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.epub,application/pdf,application/epub+zip"
                    onChange={handleFileUpload}
                    disabled={saving}
                    className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                  />

                  {form.file_name && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">{form.file_name}</span>
                    </div>
                  )}
                </div>

                {/* Cover Image Upload Zone */}
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                        Cover Image
                      </p>
                      <p className="text-xs text-slate-400">JPEG, PNG, or WebP</p>
                    </div>
                  </div>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverUpload}
                    disabled={saving}
                    className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 transition-all"
                  />

                  {form.cover_image_url && (
                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={form.cover_image_url}
                        alt="Cover preview"
                        className="h-20 w-16 rounded-md object-cover border border-slate-200 shadow-sm"
                      />
                      <span className="text-xs text-emerald-600 font-medium">Cover uploaded successfully</span>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        featured: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />

                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">
                      Feature this ebook
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Promote this material to the top of student dashboards.
                    </span>
                  </div>
                </label>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={createEbook}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Ebook</span>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
