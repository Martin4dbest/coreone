"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  History,
  Library,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Users,
  X,
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

interface Classroom {
  id: number;
  name?: string | null;
  title?: string | null;
  level_name?: string | null;
  school_id?: number | null;
}

interface Student {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  admission_number?: string | null;
  classroom_id?: number | null;
  class_id?: number | null;
  school_id?: number | null;
}

interface Receipt {
  id: number;
  school_book_id: number;
  quantity_received: number;
  date_received: string;
  supplier?: string | null;
  reference_number?: string | null;
  received_by?: number | null;
  notes?: string | null;
}

interface Distribution {
  id: number;
  school_book_id: number;
  classroom_id: number;
  quantity_issued: number;
  student_count: number;
  date_issued: string;
  issued_by?: number | null;
  notes?: string | null;
  students?: Array<{
    student_id: number;
    quantity_issued: number;
  }>;
}

type ModalType =
  | "book"
  | "receive"
  | "issue"
  | "history"
  | null;

type HistoryTab = "receipts" | "distributions";

const FALLBACK_PRIMARY = "#2563eb";
const FALLBACK_SECONDARY = "#0f172a";

const today = () => new Date().toISOString().slice(0, 10);

export default function SchoolBooksPage() {
  const params = useParams();
  const schoolId = Number(params.schoolId);
  const { tenant } = useTenant();

  const primary = tenant?.primary_color || FALLBACK_PRIMARY;
  const secondary = tenant?.secondary_color || FALLBACK_SECONDARY;

  const [books, setBooks] = useState<SchoolBook[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modal, setModal] = useState<ModalType>(null);
  const [selectedBook, setSelectedBook] = useState<SchoolBook | null>(null);

  const [historyTab, setHistoryTab] =
    useState<HistoryTab>("receipts");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [distributions, setDistributions] =
    useState<Distribution[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "",
    subject_id: "",
    quantity: "1",
  });

  const [receiveForm, setReceiveForm] = useState({
    quantity: "1",
    date_received: today(),
    supplier: "",
    reference_number: "",
    notes: "",
  });

  const [issueForm, setIssueForm] = useState({
    classroom_id: "",
    quantity_issued: "1",
    student_count: "1",
    date_issued: today(),
    notes: "",
  });

  const [selectedStudentIds, setSelectedStudentIds] =
    useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const loadData = async () => {
    if (!schoolId) return;

    try {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        api.get(`/school-books/${schoolId}`),
        api.get(`/subjects?school_id=${schoolId}`),
        api.get(`/classes?school_id=${schoolId}`),
      ]);

      // ----------------------------------------------------------
      // BOOKS
      // ----------------------------------------------------------
      if (results[0].status === "fulfilled") {
        const data = results[0].value.data;

        setBooks(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
              ? data.items
              : Array.isArray(data?.data)
                ? data.data
                : []
        );
      } else {
        console.error(
          "Failed to load school books:",
          results[0].reason
        );

        setBooks([]);
      }

      // ----------------------------------------------------------
      // SUBJECTS
      // ----------------------------------------------------------
      if (results[1].status === "fulfilled") {
        const data = results[1].value.data;

        setSubjects(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
              ? data.items
              : Array.isArray(data?.data)
                ? data.data
                : []
        );
      } else {
        console.error(
          "Failed to load subjects:",
          results[1].reason
        );

        setSubjects([]);
      }

      // ----------------------------------------------------------
      // CLASSROOMS
      //
      // The Classes API may return either:
      //   [...]
      // or
      //   { items: [...] }
      // or
      //   { data: [...] }
      //
      // Normalise all supported response shapes.
      // ----------------------------------------------------------
      if (results[2].status === "fulfilled") {
        const rawClassData = results[2].value.data;

        const classData: Classroom[] =
          Array.isArray(rawClassData)
            ? rawClassData
            : Array.isArray(rawClassData?.items)
              ? rawClassData.items
              : Array.isArray(rawClassData?.data)
                ? rawClassData.data
                : [];

        console.log(
          "SCHOOL BOOKS — CLASS API RESPONSE:",
          rawClassData
        );

        console.log(
          "SCHOOL BOOKS — NORMALIZED CLASSROOMS:",
          classData
        );

        setClassrooms(
          classData.filter(
            (item: Classroom) =>
              !item.school_id ||
              Number(item.school_id) === schoolId
          )
        );
      } else {
        console.error(
          "Failed to load classrooms:",
          results[2].reason
        );

        setClassrooms([]);
      }

      // Only show a page-level error if the critical book request
      // itself failed. Class/subject failures are logged separately
      // so one failing endpoint does not hide the others.
      if (results[0].status === "rejected") {
        throw results[0].reason;
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to load school book inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadStudents = async (classroomId?: number) => {
    try {
      const response = await api.get("/students/", {
        params: {
          school_id: schoolId,
          ...(classroomId
            ? { classroom_id: classroomId }
            : {}),
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const schoolStudents = data.filter(
        (student: Student) =>
          !student.school_id ||
          Number(student.school_id) === schoolId
      );

      setStudents(schoolStudents);
    } catch (err) {
      console.error("Unable to load students:", err);
      setStudents([]);
    }
  };

  const activeBooks = books.filter((book) => book.is_active);

  const archivedBooks = books.filter(
    (book) => !book.is_active
  );

  const totalCopies = activeBooks.reduce(
    (sum, book) => sum + Number(book.quantity || 0),
    0
  );

  const lowStockBooks = activeBooks.filter(
    (book) => Number(book.quantity || 0) <= 5
  );

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
        subjectName(subjects, book.subject_id),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(term)
        );
    });
  }, [books, search, showArchived, subjects]);

  function subjectName(
    list: Subject[],
    id?: number | null
  ) {
    return (
      list.find((subject) => subject.id === id)?.name ||
      "General"
    );
  }

  const classroomName = (id?: number | null) => {
    const classroom = classrooms.find(
      (item) => item.id === id
    );

    return (
      classroom?.name ||
      classroom?.title ||
      classroom?.level_name ||
      `Class #${id ?? "—"}`
    );
  };

  const studentName = (student: Student) => {
    if (student.name) return student.name;

    return [student.first_name, student.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || `Student #${student.id}`;
  };

  const openCreate = () => {
    clearMessages();
    setSelectedBook(null);

    setBookForm({
      title: "",
      author: "",
      isbn: "",
      category: "",
      subject_id: "",
      quantity: "1",
    });

    setModal("book");
  };

  const openEdit = (book: SchoolBook) => {
    clearMessages();
    setSelectedBook(book);

    setBookForm({
      title: book.title || "",
      author: book.author || "",
      isbn: book.isbn || "",
      category: book.category || "",
      subject_id: book.subject_id
        ? String(book.subject_id)
        : "",
      quantity: String(book.quantity ?? 0),
    });

    setModal("book");
  };

  const openReceive = (book: SchoolBook) => {
    clearMessages();
    setSelectedBook(book);

    setReceiveForm({
      quantity: "1",
      date_received: today(),
      supplier: "",
      reference_number: "",
      notes: "",
    });

    setModal("receive");
  };

  const openIssue = async (book: SchoolBook) => {
    clearMessages();
    setSelectedBook(book);

    setIssueForm({
      classroom_id: "",
      quantity_issued: "1",
      student_count: "1",
      date_issued: today(),
      notes: "",
    });

    setSelectedStudentIds([]);
    setStudentSearch("");
    setStudents([]);

    await loadStudents();
    setModal("issue");
  };

  const openHistory = async (
    book: SchoolBook,
    tab: HistoryTab = "receipts"
  ) => {
    clearMessages();
    setSelectedBook(book);
    setHistoryTab(tab);
    setModal("history");

    await loadHistory(book, tab);
  };

  const loadHistory = async (
    book: SchoolBook,
    tab: HistoryTab
  ) => {
    try {
      setHistoryLoading(true);

      if (tab === "receipts") {
        const response = await api.get(
          `/${"school-books"}/${schoolId}/${book.id}/receipts/history`
        );

        setReceipts(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } else {
        const response = await api.get(
          `/school-books/${schoolId}/${book.id}/distributions/history`
        );

        setDistributions(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to load inventory history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveBook = async (event: FormEvent) => {
    event.preventDefault();

    if (!bookForm.title.trim()) {
      setError("Book title is required.");
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      const payload = {
        title: bookForm.title.trim(),
        author: bookForm.author.trim() || null,
        isbn: bookForm.isbn.trim() || null,
        category: bookForm.category.trim() || null,
        subject_id: bookForm.subject_id
          ? Number(bookForm.subject_id)
          : null,
        quantity: Math.max(
          0,
          Number(bookForm.quantity) || 0
        ),
      };

      if (selectedBook) {
        await api.patch(
          `/school-books/${schoolId}/${selectedBook.id}`,
          payload
        );
        setSuccess("Book details updated successfully.");
      } else {
        await api.post(
          `/school-books/${schoolId}`,
          payload
        );
        setSuccess("Book added to inventory successfully.");
      }

      setModal(null);
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

  const receiveBooks = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedBook) return;

    const quantity = Number(receiveForm.quantity);

    if (!quantity || quantity <= 0) {
      setError("Enter a valid received quantity.");
      return;
    }

    const selectedStudents = students.filter(
      (student) =>
        selectedStudentIds.includes(student.id) &&
        (!issueForm.classroom_id ||
          Number(student.classroom_id) ===
            Number(issueForm.classroom_id))
    );

    if (
      selectedStudents.length !== selectedStudentIds.length
    ) {
      setError(
        "One or more selected students do not belong to the selected classroom."
      );
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      await api.post(
        `/school-books/${schoolId}/${selectedBook.id}/receipts`,
        null,
        {
          params: {
            quantity,
            date_received:
              receiveForm.date_received,
            supplier:
              receiveForm.supplier.trim() || undefined,
            reference_number:
              receiveForm.reference_number.trim() ||
              undefined,
            notes:
              receiveForm.notes.trim() || undefined,
          },
        }
      );

      setModal(null);
      setSuccess(
        `${quantity} ${quantity === 1 ? "copy" : "copies"} received successfully.`
      );

      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to record received books."
      );
    } finally {
      setSaving(false);
    }
  };

  const issueBooks = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedBook) return;

    const classroomId = Number(issueForm.classroom_id);
    const quantity = Number(issueForm.quantity_issued);
    const count = Number(issueForm.student_count);

    if (!classroomId) {
      setError("Please select a classroom.");
      return;
    }

    if (!quantity || quantity <= 0) {
      setError("Enter a valid quantity to issue.");
      return;
    }

    if (!count || count <= 0) {
      setError("Enter a valid student count.");
      return;
    }

    if (selectedStudentIds.length === 0) {
      setError(
        "Select the students who received the books so the distribution can be recorded."
      );
      return;
    }

    if (selectedStudentIds.length !== count) {
      setError(
        "The number of selected students must match the student count."
      );
      return;
    }

    if (quantity > Number(selectedBook.quantity)) {
      setError(
        `Only ${selectedBook.quantity} copies are currently available.`
      );
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      await api.post(
        `/school-books/${schoolId}/${selectedBook.id}/distributions`,
        {
          classroom_id: classroomId,
          quantity_issued: quantity,
          student_count: count,
          date_issued: issueForm.date_issued,
          student_ids: selectedStudentIds,
          notes:
            issueForm.notes.trim() || undefined,
        }
      );

      setModal(null);
      setSuccess(
        `${quantity} ${quantity === 1 ? "copy" : "copies"} issued successfully.`
      );

      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to issue books."
      );
    } finally {
      setSaving(false);
    }
  };

  const archiveBook = async (book: SchoolBook) => {
    if (
      !window.confirm(
        `Archive "${book.title}"? It will remain in history but will no longer appear in active inventory.`
      )
    ) {
      return;
    }

    try {
      clearMessages();

      await api.delete(
        `/school-books/${schoolId}/${book.id}`
      );

      setSuccess(`"${book.title}" has been archived.`);
      await loadData();
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to archive this book."
      );
    }
  };

  // Only students belonging to the selected classroom can
  // appear in the distribution selector.
  const classroomStudents = issueForm.classroom_id
    ? students.filter(
        (student) =>
          Number(student.classroom_id) ===
          Number(issueForm.classroom_id)
      )
    : [];

  const filteredStudents = classroomStudents.filter((student) =>
    studentName(student)
      .toLowerCase()
      .includes(studentSearch.trim().toLowerCase())
  );

  const allClassroomStudentsSelected =
    classroomStudents.length > 0 &&
    classroomStudents.every((student) =>
      selectedStudentIds.includes(student.id)
    );

  const toggleSelectAllStudents = () => {
    if (!issueForm.classroom_id || classroomStudents.length === 0) {
      return;
    }

    if (allClassroomStudentsSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(
        classroomStudents.map((student) => student.id)
      );
    }
  };

  const toggleStudent = (studentId: number) => {
    const student = classroomStudents.find(
      (item) => item.id === studentId
    );

    if (!student) {
      return;
    }

    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId]
    );
  };

  const handleClassroomChange = async (
    classroomId: string
  ) => {
    setIssueForm((current) => ({
      ...current,
      classroom_id: classroomId,
    }));

    // Changing classroom clears all previous student selections.
    setSelectedStudentIds([]);
    setStudentSearch("");

    if (classroomId) {
      await loadStudents(Number(classroomId));
    } else {
      await loadStudents();
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f6f8fc] px-4 py-6 text-slate-900 sm:px-6 lg:px-8"
      style={
        {
          "--tenant-primary": primary,
          "--tenant-secondary": secondary,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header
          className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-2xl sm:p-8"
          style={{
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
          }}
        >
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-40 h-60 w-60 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Library size={25} />
              </div>

              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold sm:text-3xl">
                  School Book Inventory
                </h1>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                Manage textbooks, physical learning resources,
                stock receipts, classroom distribution and
                individual student allocations from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold shadow-lg transition hover:-translate-y-0.5"
                style={{ color: primary }}
              >
                <Plus size={18} />
                Add Book
              </button>


              <a
                href={`/dashboard/schools/${schoolId}/school-books/records`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                <History size={17} />
                Distribution Records
              </a>

              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                <RefreshCw size={17} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {success && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={18} />
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess("")}>
              <X size={17} />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={<BookOpen size={20} />}
            label="Active Titles"
            value={activeBooks.length}
            primary={primary}
          />

          <StatCard
            icon={<Boxes size={20} />}
            label="Copies in Stock"
            value={totalCopies}
            primary={primary}
          />

          <StatCard
            icon={<PackageCheck size={20} />}
            label="Low Stock"
            value={lowStockBooks.length}
            primary={primary}
          />

          <StatCard
            icon={<Archive size={20} />}
            label="Archived"
            value={archivedBooks.length}
            primary={primary}
          />

          <StatCard
            icon={<Truck size={20} />}
            label="Inventory Status"
            value={loading ? "..." : "Live"}
            primary={primary}
          />
        </section>

        {lowStockBooks.length > 0 && !showArchived && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
                <PackageCheck size={18} />
              </div>
              <div>
                <p className="font-bold text-amber-900">
                  Low stock attention needed
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {lowStockBooks.length} title
                  {lowStockBooks.length === 1 ? "" : "s"} currently
                  {lowStockBooks.length === 1 ? " has" : " have"} 5
                  or fewer copies available.
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Inventory Catalogue
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search and manage the school&apos;s physical
                  learning resources.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative sm:w-[320px]">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search title, author, ISBN..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--tenant-primary)] focus:ring-4 focus:ring-[var(--tenant-primary)]/10"
                  />
                </div>

                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setShowArchived(false)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      !showArchived
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Active
                  </button>

                  <button
                    onClick={() => setShowArchived(true)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      showArchived
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    Archived
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <RefreshCw
                  className="mx-auto animate-spin text-slate-400"
                  size={30}
                />
                <p className="mt-3 text-sm text-slate-500">
                  Loading inventory...
                </p>
              </div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <EmptyState
              archived={showArchived}
              onAdd={openCreate}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">Book</th>
                    <th className="px-5 py-4">Subject</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredBooks.map((book) => {
                    const quantity = Number(
                      book.quantity || 0
                    );

                    const stockClass =
                      quantity === 0
                        ? "bg-red-50 text-red-700 border-red-200"
                        : quantity <= 5
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200";

                    return (
                      <tr
                        key={book.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                              style={{
                                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                              }}
                            >
                              <BookOpen size={19} />
                            </div>

                            <div>
                              <p className="font-bold text-slate-900">
                                {book.title}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {book.author || "Unknown author"}
                                {book.isbn
                                  ? ` • ISBN ${book.isbn}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {subjectName(
                            subjects,
                            book.subject_id
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                            {book.category || "General"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1.5 text-xs font-bold ${stockClass}`}
                          >
                            {quantity}{" "}
                            {quantity === 1
                              ? "copy"
                              : "copies"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${
                              book.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                book.is_active
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {book.is_active
                              ? "Active"
                              : "Archived"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {book.is_active && (
                              <>
                                <ActionButton
                                  title="Receive books"
                                  onClick={() =>
                                    openReceive(book)
                                  }
                                  icon={
                                    <ArrowDownToLine
                                      size={16}
                                    />
                                  }
                                  tone="green"
                                />

                                <ActionButton
                                  title="Issue books"
                                  onClick={() =>
                                    openIssue(book)
                                  }
                                  icon={
                                    <ArrowUpFromLine
                                      size={16}
                                    />
                                  }
                                  tone="blue"
                                />
                              </>
                            )}

                            <ActionButton
                              title="View history"
                              onClick={() =>
                                openHistory(book)
                              }
                              icon={
                                <History size={16} />
                              }
                              tone="slate"
                            />

                            {book.is_active && (
                              <>
                                <ActionButton
                                  title="Edit book"
                                  onClick={() =>
                                    openEdit(book)
                                  }
                                  icon={
                                    <Edit3 size={16} />
                                  }
                                  tone="slate"
                                />

                                <ActionButton
                                  title="Archive book"
                                  onClick={() =>
                                    archiveBook(book)
                                  }
                                  icon={
                                    <Archive size={16} />
                                  }
                                  tone="red"
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {modal === "book" && (
        <Modal
          title={
            selectedBook ? "Edit Book" : "Add Book to Inventory"
          }
          subtitle={
            selectedBook
              ? "Update the catalogue information for this book."
              : "Create a new physical book record and set its opening stock."
          }
          onClose={() => setModal(null)}
          wide={false}
        >
          <form onSubmit={saveBook} className="space-y-5">
            <Field
              label="Book Title"
              required
              value={bookForm.title}
              onChange={(value) =>
                setBookForm((f) => ({
                  ...f,
                  title: value,
                }))
              }
              placeholder="e.g. New General Mathematics"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Author"
                value={bookForm.author}
                onChange={(value) =>
                  setBookForm((f) => ({
                    ...f,
                    author: value,
                  }))
                }
                placeholder="Author name"
              />

              <Field
                label="ISBN"
                value={bookForm.isbn}
                onChange={(value) =>
                  setBookForm((f) => ({
                    ...f,
                    isbn: value,
                  }))
                }
                placeholder="ISBN"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Subject"
                value={bookForm.subject_id}
                onChange={(value) =>
                  setBookForm((f) => ({
                    ...f,
                    subject_id: value,
                  }))
                }
              >
                <option value="">General / None</option>
                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
              </SelectField>

              <Field
                label="Category"
                value={bookForm.category}
                onChange={(value) =>
                  setBookForm((f) => ({
                    ...f,
                    category: value,
                  }))
                }
                placeholder="Textbook, Reference, etc."
              />
            </div>

            <Field
              label={
                selectedBook
                  ? "Current Stock"
                  : "Opening Quantity"
              }
              type="number"
              min="0"
              value={bookForm.quantity}
              onChange={(value) =>
                setBookForm((f) => ({
                  ...f,
                  quantity: value,
                }))
              }
            />

            <ModalFooter
              saving={saving}
              onClose={() => setModal(null)}
              submitLabel={
                selectedBook
                  ? "Save Changes"
                  : "Add to Inventory"
              }
            />
          </form>
        </Modal>
      )}

      {modal === "receive" && selectedBook && (
        <Modal
          title="Receive Books"
          subtitle={`Add newly received copies of "${selectedBook.title}" to stock.`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={receiveBooks} className="space-y-5">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Current Stock
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">
                {selectedBook.quantity} copies
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Quantity Received"
                required
                type="number"
                min="1"
                value={receiveForm.quantity}
                onChange={(value) =>
                  setReceiveForm((f) => ({
                    ...f,
                    quantity: value,
                  }))
                }
              />

              <Field
                label="Date Received"
                required
                type="date"
                value={receiveForm.date_received}
                onChange={(value) =>
                  setReceiveForm((f) => ({
                    ...f,
                    date_received: value,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Supplier"
                value={receiveForm.supplier}
                onChange={(value) =>
                  setReceiveForm((f) => ({
                    ...f,
                    supplier: value,
                  }))
                }
                placeholder="Supplier / vendor"
              />

              <Field
                label="Reference Number"
                value={receiveForm.reference_number}
                onChange={(value) =>
                  setReceiveForm((f) => ({
                    ...f,
                    reference_number: value,
                  }))
                }
                placeholder="Invoice / GRN / reference"
              />
            </div>

            <TextAreaField
              label="Notes"
              value={receiveForm.notes}
              onChange={(value) =>
                setReceiveForm((f) => ({
                  ...f,
                  notes: value,
                }))
              }
              placeholder="Optional receiving notes..."
            />

            <ModalFooter
              saving={saving}
              onClose={() => setModal(null)}
              submitLabel="Record Receipt"
              submitIcon={<ArrowDownToLine size={17} />}
            />
          </form>
        </Modal>
      )}

      {modal === "issue" && selectedBook && (
        <Modal
          title="Issue Books"
          subtitle={`Distribute copies of "${selectedBook.title}" to a classroom and optionally record each student.`}
          onClose={() => setModal(null)}
          wide
        >
          <form onSubmit={issueBooks} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <InfoTile
                label="Available Stock"
                value={`${selectedBook.quantity}`}
                icon={<Boxes size={18} />}
              />

              <InfoTile
                label="Students Selected"
                value={`${selectedStudentIds.length}`}
                icon={<Users size={18} />}
              />

              <InfoTile
                label="Book"
                value={selectedBook.title}
                icon={<BookOpen size={18} />}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Classroom"
                required
                value={issueForm.classroom_id}
                onChange={handleClassroomChange}
              >
                <option value="">Select classroom</option>
                {classrooms.map((classroom) => (
                  <option
                    key={classroom.id}
                    value={classroom.id}
                  >
                    {classroom.name ||
                      classroom.title ||
                      classroom.level_name ||
                      `Class #${classroom.id}`}
                  </option>
                ))}
              </SelectField>

              <Field
                label="Date Issued"
                required
                type="date"
                value={issueForm.date_issued}
                onChange={(value) =>
                  setIssueForm((f) => ({
                    ...f,
                    date_issued: value,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Quantity Issued"
                required
                type="number"
                min="1"
                max={selectedBook.quantity}
                value={issueForm.quantity_issued}
                onChange={(value) =>
                  setIssueForm((f) => ({
                    ...f,
                    quantity_issued: value,
                  }))
                }
              />

              <Field
                label="Student Count"
                required
                type="number"
                min="1"
                value={issueForm.student_count}
                onChange={(value) =>
                  setIssueForm((f) => ({
                    ...f,
                    student_count: value,
                  }))
                }
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-900">
                    Individual Students
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Required. Select every student who received
                    a copy so the distribution can be tracked individually.
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                  {selectedStudentIds.length} selected
                </span>
              </div>

              <div className="relative mt-4">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={studentSearch}
                  onChange={(event) =>
                    setStudentSearch(event.target.value)
                  }
                  placeholder={
                    issueForm.classroom_id
                      ? "Search students in this classroom..."
                      : "Select a classroom first..."
                  }
                  disabled={!issueForm.classroom_id}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[var(--tenant-primary)]"
                />
              </div>

              {issueForm.classroom_id && (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {classroomStudents.length > 0 && (
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          {classroomStudents.length} student
                          {classroomStudents.length === 1 ? "" : "s"} in this class
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {selectedStudentIds.length} selected
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={toggleSelectAllStudents}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
                      >
                        {allClassroomStudentsSelected
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <div className="p-5 text-center text-sm text-slate-500">
                      No students found.
                    </div>
                  ) : (
                    filteredStudents.map((student) => {
                      const selected =
                        selectedStudentIds.includes(
                          student.id
                        );

                      return (
                        <button
                          type="button"
                          key={student.id}
                          onClick={() =>
                            toggleStudent(student.id)
                          }
                          className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                              selected
                                ? "border-[var(--tenant-primary)] text-white"
                                : "border-slate-300"
                            }`}
                            style={
                              selected
                                ? {
                                    backgroundColor:
                                      primary,
                                  }
                                : undefined
                            }
                          >
                            {selected && (
                              <CheckCircle2 size={14} />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800">
                              {studentName(student)}
                            </span>

                            {student.admission_number && (
                              <span className="block text-xs text-slate-400">
                                {student.admission_number}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })
                  )}
                  </div>
                </div>
              )}
            </div>

            <TextAreaField
              label="Notes"
              value={issueForm.notes}
              onChange={(value) =>
                setIssueForm((f) => ({
                  ...f,
                  notes: value,
                }))
              }
              placeholder="Optional distribution notes..."
            />

            <ModalFooter
              saving={saving}
              onClose={() => setModal(null)}
              submitLabel="Issue Books"
              submitIcon={<ArrowUpFromLine size={17} />}
            />
          </form>
        </Modal>
      )}

      {modal === "history" && selectedBook && (
        <Modal
          title="Inventory History"
          subtitle={`${selectedBook.title} — complete receipt and distribution records.`}
          onClose={() => setModal(null)}
          wide
        >
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={async () => {
                setHistoryTab("receipts");
                await loadHistory(
                  selectedBook,
                  "receipts"
                );
              }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold ${
                historyTab === "receipts"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Receipts
            </button>

            <button
              type="button"
              onClick={async () => {
                setHistoryTab("distributions");
                await loadHistory(
                  selectedBook,
                  "distributions"
                );
              }}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold ${
                historyTab === "distributions"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Distributions
            </button>
          </div>

          {historyLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <RefreshCw
                className="animate-spin text-slate-400"
                size={28}
              />
            </div>
          ) : historyTab === "receipts" ? (
            <ReceiptHistory
              receipts={receipts}
            />
          ) : (
            <DistributionHistory
              distributions={distributions}
              classroomName={classroomName}
            />
          )}
        </Modal>
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
  value: React.ReactNode;
  primary: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: primary }}
        >
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          CoreOne
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  icon,
  title,
  onClick,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  tone: "blue" | "green" | "red" | "slate";
}) {
  const styles = {
    blue: "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100",
    green:
      "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    red: "border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
    slate:
      "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg border p-2 transition ${styles[tone]}`}
    >
      {icon}
    </button>
  );
}

function EmptyState({
  archived,
  onAdd,
}: {
  archived: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {archived ? (
          <Archive size={28} />
        ) : (
          <Library size={28} />
        )}
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-900">
        {archived
          ? "No archived books"
          : "No books in inventory"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {archived
          ? "Archived books will appear here."
          : "Start building your school book inventory by adding your first textbook or physical learning resource."}
      </p>

      {!archived && (
        <button
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm"
          style={{
            backgroundColor: "var(--tenant-primary)",
          }}
        >
          <Plus size={17} />
          Add First Book
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  max?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <input
        type={type}
        min={min}
        max={max}
        required={required}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--tenant-primary)] focus:ring-4 focus:ring-[var(--tenant-primary)]/10"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        rows={3}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--tenant-primary)] focus:ring-4 focus:ring-[var(--tenant-primary)]/10"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <div className="relative">
        <select
          required={required}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 pr-10 text-sm text-slate-800 outline-none focus:border-[var(--tenant-primary)] focus:ring-4 focus:ring-[var(--tenant-primary)]/10"
        >
          {children}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </label>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div
        className={`max-h-[92vh] w-full overflow-hidden rounded-[26px] bg-white shadow-2xl ${
          wide ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-100px)] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalFooter({
  saving,
  onClose,
  submitLabel,
  submitIcon,
}: {
  saving: boolean;
  onClose: () => void;
  submitLabel: string;
  submitIcon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--tenant-primary)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <RefreshCw
            size={17}
            className="animate-spin"
          />
        ) : (
          submitIcon || <CheckCircle2 size={17} />
        )}
        {saving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

function ReceiptHistory({
  receipts,
}: {
  receipts: Receipt[];
}) {
  if (!receipts.length) {
    return (
      <HistoryEmpty
        icon={<ArrowDownToLine size={26} />}
        title="No receipt history"
        text="Received stock transactions for this book will appear here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[750px]">
        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Quantity</th>
            <th className="px-4 py-3">Supplier</th>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Notes</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {receipts.map((receipt) => (
            <tr key={receipt.id}>
              <td className="px-4 py-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays
                    size={15}
                    className="text-slate-400"
                  />
                  {formatDate(receipt.date_received)}
                </span>
              </td>

              <td className="px-4 py-4">
                <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                  +{receipt.quantity_received}
                </span>
              </td>

              <td className="px-4 py-4 text-sm font-medium text-slate-700">
                {receipt.supplier || "—"}
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                {receipt.reference_number || "—"}
              </td>

              <td className="max-w-xs px-4 py-4 text-sm text-slate-500">
                {receipt.notes || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DistributionHistory({
  distributions,
  classroomName,
}: {
  distributions: Distribution[];
  classroomName: (id?: number | null) => string;
}) {
  if (!distributions.length) {
    return (
      <HistoryEmpty
        icon={<ArrowUpFromLine size={26} />}
        title="No distribution history"
        text="Book issues to classrooms will appear here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[800px]">
        <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Classroom</th>
            <th className="px-4 py-3">Copies</th>
            <th className="px-4 py-3">Students</th>
            <th className="px-4 py-3">Notes</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {distributions.map((distribution) => (
            <tr key={distribution.id}>
              <td className="px-4 py-4 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <Clock3
                    size={15}
                    className="text-slate-400"
                  />
                  {formatDate(distribution.date_issued)}
                </span>
              </td>

              <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                {classroomName(
                  distribution.classroom_id
                )}
              </td>

              <td className="px-4 py-4">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                  -{distribution.quantity_issued}
                </span>
              </td>

              <td className="px-4 py-4">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                  {distribution.student_count}
                </span>
              </td>

              <td className="max-w-xs px-4 py-4 text-sm text-slate-500">
                {distribution.notes || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryEmpty({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
        {icon}
      </div>
      <p className="mt-4 font-bold text-slate-800">
        {title}
      </p>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
