import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import api from "@/services/api";

type ParentFeeItem = {
  id: number;
  name: string;
  description?: string | null;
  amount: number;
};

type ParentPayment = {
  id: number;
  amount: number;
  currency: string;
  provider: string;
  transaction_reference: string;
  status: string;
  paid_at?: string | null;
};

type ParentInvoice = {
  id: number;
  invoice_number: string;
  fee_structure_id: number;
  fee_structure_name: string;
  academic_session_id: number;
  academic_session_name: string;
  term_id: number;
  term_name: string;
  amount_due: number;
  amount_paid: number;
  outstanding_balance: number;
  adjustment_amount: number;
  adjustment_reason?: string | null;
  status: string;
  items: ParentFeeItem[];
  payments: ParentPayment[];
};

type ParentFeesResponse = {
  student: {
    id: number;
    admission_number: string;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    class_name?: string | null;
    school_name: string;
  };
  totals: {
    total_due: number;
    total_paid: number;
    outstanding_balance: number;
  };
  invoices: ParentInvoice[];
};

function formatMoney(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ParentFeesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string }>();

  const [data, setData] = useState<ParentFeesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadFees = useCallback(async () => {
    try {
      setError("");

      let studentId = params.studentId
        ? Number(params.studentId)
        : null;

      if (!studentId) {
        const studentsResponse = await api.get("/parents/me/students");
        const students = studentsResponse.data;

        if (!Array.isArray(students) || students.length === 0) {
          throw new Error("No student is linked to this parent account.");
        }

        studentId = Number(students[0].id);
      }

      if (!studentId) {
        throw new Error("Unable to determine the student.");
      }

      const response = await api.get<ParentFeesResponse>(
        `/parents/me/students/${studentId}/fees`
      );

      setData(response.data);
    } catch (err: any) {
      console.error("Parent fees load error:", err);

      const message =
        err?.response?.data?.detail ||
        err?.message ||
        "Unable to load school fees.";

      setError(String(message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.studentId]);

  useFocusEffect(
    useCallback(() => {
      loadFees();
    }, [loadFees])
  );

  const refresh = () => {
    setRefreshing(true);
    loadFees();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading school fees...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Unable to load fees</Text>
        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>No fee information found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const studentName = [
    data.student.first_name,
    data.student.middle_name,
    data.student.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>School Fees</Text>
            <Text style={styles.subtitle}>{data.student.school_name}</Text>
          </View>
        </View>

        <View style={styles.studentCard}>
          <Text style={styles.studentName}>{studentName}</Text>

          <Text style={styles.studentMeta}>
            Admission No: {data.student.admission_number}
          </Text>

          <Text style={styles.studentMeta}>
            Class: {data.student.class_name || "Unassigned"}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Fees</Text>
              <Text style={styles.summaryValue}>
                {formatMoney(data.totals.total_due)}
              </Text>
            </View>

            <View>
              <Text style={styles.summaryLabel}>Paid</Text>
              <Text style={[styles.summaryValue, styles.paidValue]}>
                {formatMoney(data.totals.total_paid)}
              </Text>
            </View>
          </View>

          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>Outstanding Balance</Text>
            <Text style={styles.balanceValue}>
              {formatMoney(data.totals.outstanding_balance)}
            </Text>
          </View>

          {data.totals.outstanding_balance > 0 && (
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => {
                const firstOutstanding = data.invoices.find(
                  (invoice) => invoice.outstanding_balance > 0
                );

                if (firstOutstanding) {
                  router.push({
                    pathname: "/parent/payment",
                    params: {
                      studentFeeId: String(firstOutstanding.id),
                      amount: String(firstOutstanding.outstanding_balance),
                    },
                  });
                }
              }}
            >
              <Text style={styles.payButtonText}>Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Invoices</Text>

        {data.invoices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No school fee invoice has been created for this student.
            </Text>
          </View>
        ) : (
          data.invoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceCard}>
              <View style={styles.invoiceHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invoiceTitle}>
                    {invoice.fee_structure_name}
                  </Text>
                  <Text style={styles.invoiceNumber}>
                    {invoice.invoice_number}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    invoice.status === "PAID"
                      ? styles.statusPaid
                      : styles.statusUnpaid,
                  ]}
                >
                  <Text style={styles.statusText}>{invoice.status}</Text>
                </View>
              </View>

              <Text style={styles.sessionText}>
                {invoice.academic_session_name} • {invoice.term_name}
              </Text>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Amount Due</Text>
                <Text style={styles.amountValue}>
                  {formatMoney(invoice.amount_due)}
                </Text>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Amount Paid</Text>
                <Text style={styles.amountValue}>
                  {formatMoney(invoice.amount_paid)}
                </Text>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Outstanding</Text>
                <Text style={styles.outstandingValue}>
                  {formatMoney(invoice.outstanding_balance)}
                </Text>
              </View>

              <Text style={styles.breakdownTitle}>Fee Breakdown</Text>

              {invoice.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemAmount}>
                    {formatMoney(item.amount)}
                  </Text>
                </View>
              ))}

              {invoice.payments.length > 0 && (
                <>
                  <Text style={styles.breakdownTitle}>
                    Payment History
                  </Text>

                  {invoice.payments.map((payment) => (
                    <View key={payment.id} style={styles.paymentCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.paymentAmount}>
                          {formatMoney(payment.amount, payment.currency)}
                        </Text>

                        <Text style={styles.paymentReference}>
                          {payment.transaction_reference}
                        </Text>

                        <Text style={styles.paymentDate}>
                          {formatDate(payment.paid_at)}
                        </Text>
                      </View>

                      <Text style={styles.paymentStatus}>
                        {payment.status}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#64748B",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  errorText: {
    marginTop: 8,
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#0F172A",
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#E2E8F0",
  },
  backText: {
    fontSize: 32,
    lineHeight: 34,
    color: "#0F172A",
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: "#64748B",
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  studentName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  studentMeta: {
    marginTop: 5,
    fontSize: 14,
    color: "#64748B",
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 22,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  summaryValue: {
    marginTop: 5,
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
  },
  paidValue: {
    color: "#15803D",
  },
  balanceBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
  },
  balanceLabel: {
    fontSize: 13,
    color: "#991B1B",
  },
  balanceValue: {
    marginTop: 5,
    fontSize: 25,
    fontWeight: "900",
    color: "#B91C1C",
  },
  payButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 11,
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  invoiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  invoiceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  invoiceNumber: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusPaid: {
    backgroundColor: "#DCFCE7",
  },
  statusUnpaid: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
  },
  sessionText: {
    marginTop: 12,
    marginBottom: 12,
    fontSize: 13,
    color: "#64748B",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  amountLabel: {
    fontSize: 14,
    color: "#64748B",
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  outstandingValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B91C1C",
  },
  breakdownTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#475569",
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 7,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  paymentReference: {
    marginTop: 3,
    fontSize: 11,
    color: "#64748B",
  },
  paymentDate: {
    marginTop: 3,
    fontSize: 11,
    color: "#94A3B8",
  },
  paymentStatus: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803D",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
});
