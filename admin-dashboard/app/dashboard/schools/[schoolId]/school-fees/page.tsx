"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  Banknote,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings2,
  Users,
  WalletCards,
} from "lucide-react";

import api from "@/lib/api";

type Tab =
  | "overview"
  | "structures"
  | "invoices"
  | "balances"
  | "history"
  | "settings";

type AcademicSession = {
  id: number;
  name: string;
  is_current?: boolean;
};

type Term = {
  id: number;
  name: string;
  academic_session_id?: number;
  is_current?: boolean;
};

type Classroom = {
  id: number;
  name: string;
  level_id?: number;
  is_active?: boolean;
};

type Student = {
  id: number;
  admission_number?: string;
  first_name?: string;
  middle_name?: string | null;
  surname?: string;
  last_name?: string;
  classroom_id?: number | null;
  is_active?: boolean;
};

type FeeItem = {
  id?: number;
  name: string;
  description?: string | null;
  amount: string | number;
};

type FeeStructure = {
  id: number;
  school_id: number;
  academic_session_id: number;
  term_id: number;
  classroom_id?: number | null;
  name: string;
  description?: string | null;
  is_active: boolean;
  total_amount: string | number;
  items: FeeItem[];
};

type StudentFee = {
  id: number;
  school_id: number;
  student_id: number;
  fee_structure_id: number;
  invoice_number: string;
  amount_due: string | number;
  amount_paid: string | number;
  balance: string | number;
  adjustment_amount: string | number;
  adjustment_reason?: string | null;
  status: string;
};

type PaymentSettings = {
  school_id: number;
  configured: boolean;
  enabled: boolean;
  provider?: string | null;
  currency?: string | null;
};
type PaymentHistoryItem = {
  id: number;
  student_id: number;
  student_name: string;
  admission_number: string;
  invoice_number: string;
  amount: string | number;
  currency: string;
  provider: string;
  reference: string;
  status: string;
  fee_status: string;
  paid_at?: string | null;
  verified_at?: string | null;
};


type FeeItemDraft = {
  name: string;
  amount: string;
};

const emptyItem = (): FeeItemDraft => ({
  name: "",
  amount: "",
});

function money(value: string | number | null | undefined) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function studentName(student: Student) {
  return [
    student.first_name,
    student.middle_name,
    student.surname || student.last_name,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function SchoolFeesPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [paymentHistory, setPaymentHistory] =
    useState<PaymentHistoryItem[]>([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] =
    useState(false);
  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedStructureId, setSelectedStructureId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  const [search, setSearch] = useState("");

  const [showStructureForm, setShowStructureForm] = useState(false);
  const [structureName, setStructureName] = useState("");
  const [structureDescription, setStructureDescription] = useState("");
  const [structureItems, setStructureItems] = useState<FeeItemDraft[]>([
    emptyItem(),
  ]);
  const [creatingStructure, setCreatingStructure] = useState(false);
  const [generatingInvoices, setGeneratingInvoices] = useState(false);

  const [settingsProvider, setSettingsProvider] = useState("paystack");
  const [settingsEnabled, setSettingsEnabled] = useState(false);
  const [settingsPublicKey, setSettingsPublicKey] = useState("");
  const [settingsSecretKey, setSettingsSecretKey] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    params.then(({ schoolId: rawSchoolId }) => {
      const parsed = Number(rawSchoolId);
      if (Number.isFinite(parsed) && parsed > 0) {
        setSchoolId(parsed);
      }
    });
  }, [params]);

  const loadCoreData = useCallback(async () => {
    if (!schoolId) return;

    setLoading(true);
    setError("");

    try {
      const [
        sessionsResponse,
        termsResponse,
        classesResponse,
        structuresResponse,
        settingsResponse,
      ] = await Promise.all([
        api.get("/academic-sessions", {
          params: { school_id: schoolId },
        }),
        api.get("/terms", {
          params: { school_id: schoolId },
        }),
        api.get("/classes", {
          params: { school_id: schoolId },
        }),
        api.get("/fees/structures", {
          params: { school_id: schoolId },
        }),
        api.get("/payments/settings", {
          params: { school_id: schoolId },
        }),
      ]);

      const sessionData = Array.isArray(sessionsResponse.data)
        ? sessionsResponse.data
        : [];

      const termData = Array.isArray(termsResponse.data)
        ? termsResponse.data
        : [];

      const classData = Array.isArray(classesResponse.data)
        ? classesResponse.data
        : [];

      const structureData = Array.isArray(structuresResponse.data)
        ? structuresResponse.data
        : [];

      setSessions(sessionData);
      setTerms(termData);
      setClassrooms(classData);
      setStructures(structureData);
      setPaymentSettings(settingsResponse.data || null);

      const currentSession =
        sessionData.find((item: AcademicSession) => item.is_current) ||
        sessionData[0];

      if (currentSession) {
        setSelectedSessionId(String(currentSession.id));
      }

      const matchingTerms = termData.filter(
        (term: Term) =>
          !currentSession ||
          !term.academic_session_id ||
          term.academic_session_id === currentSession.id,
      );

      const currentTerm =
        matchingTerms.find((item: Term) => item.is_current) ||
        matchingTerms[0];

      if (currentTerm) {
        setSelectedTermId(String(currentTerm.id));
      }

      if (structureData.length > 0) {
        setSelectedStructureId(String(structureData[0].id));
      }

      setSettingsProvider(settingsResponse.data?.provider || "paystack");
      setSettingsEnabled(Boolean(settingsResponse.data?.enabled));
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load the school fees workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) {
      void loadCoreData();
    }
  }, [schoolId, loadCoreData]);

  const loadBalances = useCallback(async () => {
    if (!schoolId) return;

    setLoadingBalances(true);

    try {
      const response = await api.get("/fees/student-fees");
      const data = Array.isArray(response.data) ? response.data : [];
      const schoolFees = data.filter(
        (item: StudentFee) => item.school_id === schoolId,
      );

      setStudentFees(schoolFees);

      if (schoolFees.length > 0) {
        const studentsResponse = await api.get("/students/");
        const allStudents = Array.isArray(studentsResponse.data)
          ? studentsResponse.data
          : [];

        const feeStudentIds = new Set(
          schoolFees.map((fee: StudentFee) => fee.student_id),
        );

        const matchingStudents = allStudents.filter((student: Student) =>
          feeStudentIds.has(student.id),
        );

        setStudents((current) => {
          const merged = new Map(
            current.map((student) => [student.id, student]),
          );

          for (const student of matchingStudents) {
            merged.set(student.id, student);
          }

          return Array.from(merged.values());
        });
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load student fee balances.",
      );
    } finally {
      setLoadingBalances(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId && activeTab === "balances") {
      void loadBalances();
    }
  }, [schoolId, activeTab, loadBalances]);

  const loadPaymentHistory = useCallback(async () => {
    if (!schoolId) return;

    setLoadingPaymentHistory(true);

    try {
      const response = await api.get("/payments/history", {
        params: { school_id: schoolId },
      });

      const data = response.data;

      setPaymentHistory(
        Array.isArray(data?.items) ? data.items : [],
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load payment history.",
      );
    } finally {
      setLoadingPaymentHistory(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId && activeTab === "history") {
      void loadPaymentHistory();
    }
  }, [schoolId, activeTab, loadPaymentHistory]);

  const loadStudents = useCallback(async () => {
    if (!schoolId) return;

    try {
      const params: Record<string, unknown> = {};

      if (selectedClassroomId) {
        params.class_id = Number(selectedClassroomId);
      }

      const response = await api.get("/students/", {
        params,
      });

      const data = Array.isArray(response.data) ? response.data : [];
      setStudents(data);
      setSelectedStudentIds([]);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load students.",
      );
      setStudents([]);
      setSelectedStudentIds([]);
    }
  }, [schoolId, selectedClassroomId]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const filteredStructures = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return structures;

    return structures.filter((structure) =>
      [
        structure.name,
        structure.description,
        String(structure.total_amount),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [structures, search]);

  const filteredBalances = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return studentFees;

    return studentFees.filter((fee) => {
      const student = students.find((item) => item.id === fee.student_id);

      return [
        fee.invoice_number,
        fee.status,
        student ? studentName(student) : "",
        student?.admission_number || "",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [studentFees, students, search]);

  const totals = useMemo(() => {
    return studentFees.reduce(
      (result, fee) => {
        result.invoiced += Number(fee.amount_due || 0);
        result.paid += Number(fee.amount_paid || 0);
        result.balance += Number(fee.balance || 0);
        result.count += 1;
        return result;
      },
      {
        invoiced: 0,
        paid: 0,
        balance: 0,
        count: 0,
      },
    );
  }, [studentFees]);

  const structureTotal = useMemo(
    () =>
      structureItems.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0,
      ),
    [structureItems],
  );

  const activeStudents = useMemo(
    () => students.filter((student) => student.is_active !== false),
    [students],
  );

  function updateItem(index: number, field: keyof FeeItemDraft, value: string) {
    setStructureItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setStructureItems((current) => [...current, emptyItem()]);
  }

  function removeItem(index: number) {
    setStructureItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function createStructure() {
    if (!schoolId) return;

    setError("");
    setSuccess("");

    if (!selectedSessionId || !selectedTermId) {
      setError("Select an academic session and term first.");
      return;
    }

    if (!structureName.trim()) {
      setError("Enter a fee structure name.");
      return;
    }

    const validItems = structureItems.filter(
      (item) => item.name.trim() && Number(item.amount) > 0,
    );

    if (!validItems.length) {
      setError("Add at least one fee item with a valid amount.");
      return;
    }

    setCreatingStructure(true);

    try {
      const response = await api.post("/fees/structures", {
        school_id: schoolId,
        academic_session_id: Number(selectedSessionId),
        term_id: Number(selectedTermId),
        classroom_id: selectedClassroomId
          ? Number(selectedClassroomId)
          : null,
        name: structureName.trim(),
        description: structureDescription.trim() || null,
        items: validItems.map((item) => ({
          name: item.name.trim(),
          amount: Number(item.amount),
        })),
      });

      const created = response.data as FeeStructure;

      setStructures((current) => [created, ...current]);
      setSelectedStructureId(String(created.id));

      setStructureName("");
      setStructureDescription("");
      setStructureItems([emptyItem()]);
      setShowStructureForm(false);
      setSuccess("Fee structure created successfully.");
      setActiveTab("structures");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to create the fee structure.",
      );
    } finally {
      setCreatingStructure(false);
    }
  }

  async function generateInvoices() {
    if (!schoolId || !selectedStructureId) {
      setError("Select a fee structure first.");
      return;
    }

    if (!selectedClassroomId && selectedStudentIds.length === 0) {
      setError("Select a class or select individual students.");
      return;
    }

    setError("");
    setSuccess("");
    setGeneratingInvoices(true);

    try {
      const payload: Record<string, unknown> = {
        school_id: schoolId,
        fee_structure_id: Number(selectedStructureId),
      };

      if (selectedStudentIds.length > 0) {
        payload.student_ids = selectedStudentIds;
      } else if (selectedClassroomId) {
        payload.classroom_id = Number(selectedClassroomId);
      } else {
        setError("Select a class or select individual students.");
        setGeneratingInvoices(false);
        return;
      }

      const response = await api.post("/fees/student-fees/bulk", payload);

      const result = response.data;

      setSuccess(
        `Invoice generation completed. ${result?.created_count || 0} created, ${
          result?.skipped_count || 0
        } skipped.`,
      );

      setSelectedStudentIds([]);
      await loadBalances();
      setActiveTab("balances");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to generate student invoices.",
      );
    } finally {
      setGeneratingInvoices(false);
    }
  }

  async function savePaymentSettings() {
    if (!schoolId) return;

    setError("");
    setSuccess("");
    setSavingSettings(true);

    try {
      const payload: Record<string, unknown> = {
        school_id: schoolId,
        provider: settingsProvider,
        is_enabled: settingsEnabled,
        public_key: settingsPublicKey.trim() || null,
        currency: "NGN",
      };

      if (settingsSecretKey.trim()) {
        payload.secret_key = settingsSecretKey.trim();
      }

      const response = await api.put("/payments/settings", payload);

      const data = response.data;

      setPaymentSettings({
        school_id: schoolId,
        configured: Boolean(data?.has_secret_key),
        enabled: Boolean(data?.is_enabled),
        provider: data?.provider || settingsProvider,
        currency: data?.currency || "NGN",
      });

      setSettingsSecretKey("");
      setSuccess("Payment settings saved securely.");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to save payment settings.",
      );
    } finally {
      setSavingSettings(false);
    }
  }

  function toggleStudent(studentId: number) {
    setSelectedStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  function selectAllStudents() {
    setSelectedStudentIds((current) =>
      current.length === activeStudents.length
        ? []
        : activeStudents.map((student) => student.id),
    );
  }

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  const tabs: { key: Tab; label: string; icon: typeof WalletCards }[] = [
    { key: "overview", label: "Overview", icon: WalletCards },
    { key: "structures", label: "Fee Structures", icon: FileText },
    { key: "invoices", label: "Generate Invoices", icon: Receipt },
    { key: "balances", label: "Student Balances", icon: Users },
    { key: "history", label: "Payment History", icon: Banknote },
    { key: "settings", label: "Payment Settings", icon: Settings2 },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading School Fees...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <WalletCards className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                School Fees
              </h1>
              <p className="text-sm text-slate-500">
                Manage fee structures, invoices, balances and payment
                configuration.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            clearMessages();
            void loadCoreData();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="flex min-w-max border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  clearMessages();
                  setActiveTab(tab.key);
                }}
                className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-medium transition ${
                  active
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Invoiced"
              value={money(totals.invoiced)}
              icon={FileText}
            />
            <MetricCard
              label="Total Collected"
              value={money(totals.paid)}
              icon={Banknote}
            />
            <MetricCard
              label="Outstanding"
              value={money(totals.balance)}
              icon={WalletCards}
            />
            <MetricCard
              label="Invoices"
              value={totals.count.toLocaleString()}
              icon={Receipt}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Fee Management
                  </h2>
                  <p className="text-sm text-slate-500">
                    Current configuration for this school.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <InfoRow
                  label="Fee structures"
                  value={structures.length.toString()}
                />
                <InfoRow
                  label="Payment provider"
                  value={
                    paymentSettings?.provider
                      ? paymentSettings.provider.toUpperCase()
                      : "Not configured"
                  }
                />
                <InfoRow
                  label="Online payments"
                  value={
                    paymentSettings?.enabled ? "Enabled" : "Disabled"
                  }
                />
                <InfoRow
                  label="Currency"
                  value={paymentSettings?.currency || "NGN"}
                />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Start a common finance task.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <QuickAction
                  icon={Plus}
                  title="Create Fee Structure"
                  description="Set tuition and other charges."
                  onClick={() => {
                    setShowStructureForm(true);
                    setActiveTab("structures");
                  }}
                />
                <QuickAction
                  icon={Receipt}
                  title="Generate Invoices"
                  description="Assign fees to students."
                  onClick={() => setActiveTab("invoices")}
                />
                <QuickAction
                  icon={Users}
                  title="View Balances"
                  description="Review outstanding fees."
                  onClick={() => setActiveTab("balances")}
                />
                <QuickAction
                  icon={Settings2}
                  title="Payment Settings"
                  description="Configure this school's gateway."
                  onClick={() => setActiveTab("settings")}
                />
              </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === "structures" && (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Fee Structures
              </h2>
              <p className="text-sm text-slate-500">
                Define what students are expected to pay.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                clearMessages();
                setShowStructureForm((value) => !value);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New Fee Structure
            </button>
          </div>

          {showStructureForm && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h3 className="font-semibold text-slate-900">
                  Create Fee Structure
                </h3>
                <p className="text-sm text-slate-500">
                  A structure can be assigned to a specific class or left
                  available for the school.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Academic Session">
                  <Select
                    value={selectedSessionId}
                    onChange={(event) => {
                      setSelectedSessionId(event.target.value);
                      const sessionId = Number(event.target.value);
                      const matchingTerms = terms.filter(
                        (term) =>
                          !term.academic_session_id ||
                          term.academic_session_id === sessionId,
                      );
                      setSelectedTermId(
                        matchingTerms.find((term) => term.is_current)
                          ? String(
                              matchingTerms.find(
                                (term) => term.is_current,
                              )!.id,
                            )
                          : matchingTerms[0]
                            ? String(matchingTerms[0].id)
                            : "",
                      );
                    }}
                  >
                    <option value="">Select session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                        {session.is_current ? " — Current" : ""}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Term">
                  <Select
                    value={selectedTermId}
                    onChange={(event) =>
                      setSelectedTermId(event.target.value)
                    }
                  >
                    <option value="">Select term</option>
                    {terms
                      .filter(
                        (term) =>
                          !selectedSessionId ||
                          !term.academic_session_id ||
                          term.academic_session_id ===
                            Number(selectedSessionId),
                      )
                      .map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.name}
                          {term.is_current ? " — Current" : ""}
                        </option>
                      ))}
                  </Select>
                </Field>

                <Field label="Class / Level">
                  <Select
                    value={selectedClassroomId}
                    onChange={(event) =>
                      setSelectedClassroomId(event.target.value)
                    }
                  >
                    <option value="">
                      All classes / school-wide
                    </option>
                    {classrooms
                      .filter((classroom) => classroom.is_active !== false)
                      .map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
                  </Select>
                </Field>

                <Field label="Structure Name">
                  <input
                    value={structureName}
                    onChange={(event) =>
                      setStructureName(event.target.value)
                    }
                    placeholder="e.g. First Term Fees"
                    className="input"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Description">
                    <textarea
                      value={structureDescription}
                      onChange={(event) =>
                        setStructureDescription(event.target.value)
                      }
                      rows={3}
                      placeholder="Optional description"
                      className="input resize-none"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">
                      Fee Items
                    </h4>
                    <p className="text-xs text-slate-500">
                      Add each charge separately.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {structureItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_220px_auto]"
                    >
                      <input
                        value={item.name}
                        onChange={(event) =>
                          updateItem(index, "name", event.target.value)
                        }
                        placeholder="Fee name e.g. Tuition"
                        className="input"
                      />

                      <input
                        value={item.amount}
                        onChange={(event) =>
                          updateItem(index, "amount", event.target.value)
                        }
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Amount"
                        className="input"
                      />

                      <button
                        type="button"
                        disabled={structureItems.length === 1}
                        onClick={() => removeItem(index)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="rounded-lg bg-slate-50 px-4 py-3 text-right">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Total
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {money(structureTotal)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowStructureForm(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={creatingStructure}
                  onClick={() => void createStructure()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {creatingStructure && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Create Structure
                </button>
              </div>
            </section>
          )}

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search fee structures..."
                  className="input pl-9"
                />
              </div>

              <span className="text-sm text-slate-500">
                {filteredStructures.length} structure
                {filteredStructures.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Structure</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Term</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStructures.map((structure) => (
                    <tr
                      key={structure.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          {structure.name}
                        </div>
                        {structure.description && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {structure.description}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {sessions.find(
                          (session) =>
                            session.id === structure.academic_session_id,
                        )?.name || `#${structure.academic_session_id}`}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {terms.find(
                          (term) => term.id === structure.term_id,
                        )?.name || `#${structure.term_id}`}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {structure.classroom_id
                          ? classrooms.find(
                              (classroom) =>
                                classroom.id === structure.classroom_id,
                            )?.name || `#${structure.classroom_id}`
                          : "School-wide"}
                      </td>

                      <td className="px-4 py-4 text-right font-semibold text-slate-900">
                        {money(structure.total_amount)}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge
                          active={structure.is_active}
                          activeLabel="Active"
                          inactiveLabel="Inactive"
                        />
                      </td>
                    </tr>
                  ))}

                  {filteredStructures.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-slate-500"
                      >
                        No fee structures have been created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">
              Invoice Setup
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select a fee structure and choose a class or individual
              students.
            </p>

            <div className="mt-5 space-y-4">
              <Field label="Fee Structure">
                <Select
                  value={selectedStructureId}
                  onChange={(event) =>
                    setSelectedStructureId(event.target.value)
                  }
                >
                  <option value="">Select fee structure</option>
                  {structures
                    .filter((structure) => structure.is_active)
                    .map((structure) => (
                      <option key={structure.id} value={structure.id}>
                        {structure.name} —{" "}
                        {money(structure.total_amount)}
                      </option>
                    ))}
                </Select>
              </Field>

              <Field label="Class">
                <Select
                  value={selectedClassroomId}
                  onChange={(event) =>
                    setSelectedClassroomId(event.target.value)
                  }
                >
                  <option value="">
                    Select a class for all students
                  </option>
                  {classrooms
                    .filter((classroom) => classroom.is_active !== false)
                    .map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.name}
                      </option>
                    ))}
                </Select>
              </Field>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Selected Structure
                </div>

                {(() => {
                  const structure = structures.find(
                    (item) => item.id === Number(selectedStructureId),
                  );

                  if (!structure) {
                    return (
                      <div className="mt-2 text-sm text-slate-500">
                        No fee structure selected.
                      </div>
                    );
                  }

                  return (
                    <div className="mt-2">
                      <div className="font-semibold text-slate-900">
                        {structure.name}
                      </div>
                      <div className="mt-1 text-lg font-bold text-slate-900">
                        {money(structure.total_amount)}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <button
                type="button"
                disabled={generatingInvoices}
                onClick={() => void generateInvoices()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {generatingInvoices && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Generate Invoices
              </button>

              <p className="text-xs leading-5 text-slate-500">
                Existing invoices for the same student and fee structure
                are skipped automatically by the backend.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Students
                  </h2>
                  <p className="text-sm text-slate-500">
                    Select a class for everyone, or choose individual
                    students for a targeted invoice.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!activeStudents.length}
                  onClick={selectAllStudents}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  {selectedStudentIds.length === activeStudents.length &&
                  activeStudents.length
                    ? "Clear All"
                    : "Select All"}
                </button>
              </div>
            </div>

            <div className="max-h-[520px] overflow-y-auto">
              {activeStudents.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">
                  No active students were found in this class.
                </div>
              ) : (
                activeStudents.map((student) => {
                  const selected = selectedStudentIds.includes(student.id);

                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudent(student.id)}
                      className={`flex w-full items-center gap-3 border-b border-slate-100 px-5 py-4 text-left transition ${
                        selected ? "bg-slate-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selected && (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-900">
                          {studentName(student) || `Student #${student.id}`}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {student.admission_number || "No admission number"}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {selectedStudentIds.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-600">
                {selectedStudentIds.length} student
                {selectedStudentIds.length === 1 ? "" : "s"} selected.
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "balances" && (
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Student Balances
              </h2>
              <p className="text-sm text-slate-500">
                Review issued invoices and outstanding balances.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student or invoice..."
                  className="input pl-9"
                />
              </div>

              <button
                type="button"
                onClick={() => void loadBalances()}
                className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
                title="Refresh balances"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    loadingBalances ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
            <MiniMetric
              label="Invoiced"
              value={money(totals.invoiced)}
            />
            <MiniMetric
              label="Collected"
              value={money(totals.paid)}
            />
            <MiniMetric
              label="Outstanding"
              value={money(totals.balance)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3 text-right">Due</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredBalances.map((fee) => {
                  const student = students.find(
                    (item) => item.id === fee.student_id,
                  );

                  return (
                    <tr
                      key={fee.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          {student
                            ? studentName(student)
                            : `Student #${fee.student_id}`}
                        </div>
                        {student?.admission_number && (
                          <div className="text-xs text-slate-500">
                            {student.admission_number}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700">
                        {fee.invoice_number}
                      </td>

                      <td className="px-4 py-4 text-right text-slate-700">
                        {money(fee.amount_due)}
                      </td>

                      <td className="px-4 py-4 text-right text-slate-700">
                        {money(fee.amount_paid)}
                      </td>

                      <td className="px-4 py-4 text-right font-semibold text-slate-900">
                        {money(fee.balance)}
                      </td>

                      <td className="px-4 py-4">
                        <PaymentStatus status={fee.status} />
                      </td>
                    </tr>
                  );
                })}

                {filteredBalances.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-slate-500"
                    >
                      No student invoices found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "settings" && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">
              School Payment Account
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              This configuration belongs to this school. CoreOne does not
              use a central payment account for the school's fee
              collections.
            </p>

            <div className="mt-6 space-y-5">
              <Field label="Payment Provider">
                <Select
                  value={settingsProvider}
                  onChange={(event) =>
                    setSettingsProvider(event.target.value)
                  }
                >
                  <option value="paystack">Paystack</option>
                  <option value="flutterwave" disabled>
                    Flutterwave — Coming soon
                  </option>
                </Select>
              </Field>

              <Field label="Public Key">
                <input
                  value={settingsPublicKey}
                  onChange={(event) =>
                    setSettingsPublicKey(event.target.value)
                  }
                  placeholder={
                    paymentSettings?.configured
                      ? "Leave blank to keep existing configuration"
                      : "pk_live_..."
                  }
                  className="input"
                />
              </Field>

              <Field label="Secret Key">
                <input
                  type="password"
                  value={settingsSecretKey}
                  onChange={(event) =>
                    setSettingsSecretKey(event.target.value)
                  }
                  placeholder={
                    paymentSettings?.configured
                      ? "Leave blank to keep existing secret key"
                      : "sk_live_..."
                  }
                  className="input"
                  autoComplete="new-password"
                />
              </Field>

              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 p-4">
                <div>
                  <div className="font-medium text-slate-900">
                    Enable online payments
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Parents can only pay when the school's gateway is
                    enabled and configured.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={settingsEnabled}
                  onChange={(event) =>
                    setSettingsEnabled(event.target.checked)
                  }
                  className="h-5 w-5 rounded border-slate-300"
                />
              </label>

              <button
                type="button"
                disabled={savingSettings}
                onClick={() => void savePaymentSettings()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingSettings && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Save Payment Settings
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="font-semibold text-slate-900">
              Configuration Status
            </h2>

            <div className="mt-5 space-y-3">
              <StatusLine
                label="Provider"
                value={
                  paymentSettings?.provider
                    ? paymentSettings.provider.toUpperCase()
                    : "Not configured"
                }
              />
              <StatusLine
                label="Account credentials"
                value={
                  paymentSettings?.configured
                    ? "Configured"
                    : "Not configured"
                }
              />
              <StatusLine
                label="Online payments"
                value={
                  paymentSettings?.enabled ? "Enabled" : "Disabled"
                }
              />
              <StatusLine
                label="Currency"
                value={paymentSettings?.currency || "NGN"}
              />
            </div>

            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              Secret keys are sent only to the CoreOne backend and stored
              encrypted. They are never returned to the mobile app or
              displayed after saving.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof WalletCards;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-lg font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function StatusLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function PaymentStatus({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const className =
    normalized === "PAID"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "PARTIAL"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {status}
    </span>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Plus;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`input appearance-none pr-9 ${props.className || ""}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
