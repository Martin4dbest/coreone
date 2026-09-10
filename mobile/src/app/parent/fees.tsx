import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "@/services/api";

type FeeItem = {
  id: number;
  name: string;
  description?: string | null;
  amount: number;
};

type PaymentHistory = {
  id: number;
  amount: number;
  currency: string;
  provider: string;
  transaction_reference: string;
  status: string;
  paid_at?: string | null;
};

type Invoice = {
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
  items: FeeItem[];
  payments: PaymentHistory[];
};

type FeesResponse = {
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
  invoices: Invoice[];
};

const money = (value: number | string | null | undefined) => {
  const amount = Number(value || 0);
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ParentFeesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const studentId = Number(params.studentId);

  const [data, setData] = useState<FeesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadFees = useCallback(async () => {
    if (!studentId) {
      setError("Student information is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const response = await api.get<FeesResponse>(
        `/parents/me/students/${studentId}/fees`
      );
      setData(response.data);
    } catch (err: any) {
      console.log("FEES ERROR:", err?.response?.data || err);
      setError(
        err?.response?.data?.detail ||
          "Unable to load school fees. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFees();
  };

  const handlePay = (invoice: Invoice) => {
    if (invoice.outstanding_balance <= 0) {
      Alert.alert("Payment complete", "This invoice has already been fully paid.");
      return;
    }

    router.push({
      pathname: "/parent/payment",
      params: {
        studentFeeId: String(invoice.id),
        amount: String(invoice.outstanding_balance),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading fee breakdown...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.errorIconWrapper}>
            <Text style={styles.errorIcon}>!</Text>
          </View>
          <Text style={styles.errorTitle}>Unable to load fees</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadFees}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  const { student, totals, invoices } = data;
  const studentName = [student.first_name, student.middle_name, student.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.viewportContainer}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>

            <View style={styles.headerInfo}>
              <Text style={styles.headerText}>School Fees</Text>
              <Text style={styles.subtitle}>{student.school_name}</Text>
            </View>
          </View>

          {/* Student Banner */}
          <View style={styles.studentCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {student.first_name?.[0] || "S"}
              </Text>
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{studentName}</Text>
              <View style={styles.studentMeta}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{student.class_name || "Unassigned"}</Text>
                </View>
                <Text style={styles.metaText}>ID: {student.admission_number}</Text>
              </View>
            </View>
          </View>

          {/* Account Overview Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardHeaderTitle}>Account Overview</Text>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total Due</Text>
                <Text style={styles.summaryValue}>{money(totals.total_due)}</Text>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryLabel}>Total Paid</Text>
                <Text style={styles.paidValue}>{money(totals.total_paid)}</Text>
              </View>
            </View>

            <View style={styles.balanceBox}>
              <View>
                <Text style={styles.balanceLabel}>Outstanding Balance</Text>
                <Text style={styles.balanceSubtext}>Amount pending payment</Text>
              </View>
              <Text style={styles.balanceValue}>
                {money(totals.outstanding_balance)}
              </Text>
            </View>
          </View>

          {/* Invoices List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Invoices</Text>
            <Text style={styles.invoiceCount}>{invoices.length} total</Text>
          </View>

          {invoices.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No fee invoices have been assigned to this student yet.
              </Text>
            </View>
          ) : (
            invoices.map((invoice) => {
              const isPaid = invoice.outstanding_balance <= 0;
              const status = isPaid ? "PAID" : invoice.status || "UNPAID";

              return (
                <View key={invoice.id} style={styles.invoiceCard}>
                  {/* Invoice Header */}
                  <View style={styles.invoiceHeader}>
                    <View style={styles.invoiceHeaderLeft}>
                      <Text style={styles.invoiceTitle}>
                        {invoice.fee_structure_name}
                      </Text>
                      <Text style={styles.invoiceNumber}>
                        {invoice.invoice_number} • {invoice.academic_session_name} ({invoice.term_name})
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, isPaid ? styles.statusPaid : styles.statusUnpaid]}>
                      <Text style={[styles.statusText, isPaid ? styles.statusTextPaid : styles.statusTextUnpaid]}>
                        {status}
                      </Text>
                    </View>
                  </View>

                  {/* Stat Metrics */}
                  <View style={styles.amountRow}>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>Due</Text>
                      <Text style={styles.amountValue}>{money(invoice.amount_due)}</Text>
                    </View>

                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>Paid</Text>
                      <Text style={styles.amountValue}>{money(invoice.amount_paid)}</Text>
                    </View>

                    <View style={[styles.amountBox, !isPaid && styles.amountBoxPending]}>
                      <Text style={styles.amountLabel}>Balance</Text>
                      <Text style={[styles.amountValue, !isPaid && styles.balanceAmount]}>
                        {money(invoice.outstanding_balance)}
                      </Text>
                    </View>
                  </View>

                  {/* Fee Breakdown */}
                  {invoice.items.length > 0 && (
                    <View style={styles.breakdownSection}>
                      <Text style={styles.breakdownTitle}>Fee Breakdown</Text>
                      <View style={styles.breakdownContainer}>
                        {invoice.items.map((item) => (
                          <View key={item.id} style={styles.itemRow}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemAmount}>{money(item.amount)}</Text>
                          </View>
                        ))}

                        {/* Adjustments */}
                        {Number(invoice.adjustment_amount || 0) !== 0 && (
                          <View style={styles.adjustmentRow}>
                            <Text style={styles.adjustmentName}>
                              Adjustment {invoice.adjustment_reason ? `(${invoice.adjustment_reason})` : ""}
                            </Text>
                            <Text style={styles.adjustmentAmount}>
                              {money(invoice.adjustment_amount)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Action Button */}
                  {!isPaid && (
                    <Pressable
                      style={({ pressed }) => [styles.payButton, pressed && styles.buttonPressed]}
                      onPress={() => handlePay(invoice)}
                    >
                      <Text style={styles.payButtonText}>Pay Outstanding Balance</Text>
                    </Pressable>
                  )}

                  {/* History Accordion/List */}
                  {invoice.payments.length > 0 && (
                    <View style={styles.historyCard}>
                      <Text style={styles.historyTitle}>Payment History</Text>
                      {invoice.payments.map((payment) => (
                        <View key={payment.id} style={styles.paymentRow}>
                          <View style={styles.paymentLeft}>
                            <Text style={styles.paymentReference}>
                              {payment.transaction_reference}
                            </Text>
                            <Text style={styles.paymentDate}>
                              {formatDate(payment.paid_at)} • {payment.provider}
                            </Text>
                          </View>

                          <View style={styles.paymentRight}>
                            <Text style={styles.paymentAmount}>
                              {money(payment.amount)}
                            </Text>
                            <Text style={styles.paymentStatus}>
                              {payment.status}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  viewportContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  /* Header Styles */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 2 },
      web: { boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)" },
    }),
  },

  backText: {
    fontSize: 28,
    lineHeight: 30,
    color: "#0F172A",
    marginTop: -2,
  },

  headerInfo: {
    flex: 1,
  },

  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  /* Student Card */
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4F46E5",
  },

  studentDetails: {
    flex: 1,
  },

  studentName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  studentMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },

  badge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },

  metaText: {
    fontSize: 12,
    color: "#64748B",
  },

  /* Account Overview Card */
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  summaryGrid: {
    flexDirection: "row",
    gap: 12,
  },

  summaryBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
  },

  summaryLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  paidValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
  },

  balanceBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  balanceLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#991B1B",
  },

  balanceSubtext: {
    fontSize: 11,
    color: "#B91C1C",
    marginTop: 1,
  },

  balanceValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#DC2626",
  },

  /* Section Title */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },

  invoiceCount: {
    fontSize: 12,
    color: "#64748B",
  },

  /* Invoice Card */
  invoiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  invoiceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  invoiceHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },

  invoiceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  invoiceNumber: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  statusPaid: {
    backgroundColor: "#DCFCE7",
  },

  statusUnpaid: {
    backgroundColor: "#FEE2E2",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  statusTextPaid: {
    color: "#15803D",
  },

  statusTextUnpaid: {
    color: "#B91C1C",
  },

  amountRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
  },

  amountBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
  },

  amountBoxPending: {
    backgroundColor: "#FEF2F2",
  },

  amountLabel: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 2,
    textTransform: "uppercase",
  },

  amountValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },

  balanceAmount: {
    color: "#DC2626",
  },

  /* Item breakdown */
  breakdownSection: {
    marginTop: 14,
  },

  breakdownTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 6,
  },

  breakdownContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },

  itemName: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    paddingRight: 10,
  },

  itemAmount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
  },

  adjustmentRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginTop: 4,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  adjustmentName: {
    fontSize: 12,
    color: "#D97706",
  },

  adjustmentAmount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
  },

  /* Buttons */
  payButton: {
    marginTop: 14,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
  },

  buttonPressed: {
    opacity: 0.85,
  },

  payButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Payment History */
  historyCard: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 14,
    paddingTop: 10,
  },

  historyTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 6,
  },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },

  paymentLeft: {
    flex: 1,
    paddingRight: 10,
  },

  paymentReference: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "600",
  },

  paymentDate: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 1,
  },

  paymentRight: {
    alignItems: "flex-end",
  },

  paymentAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },

  paymentStatus: {
    fontSize: 10,
    color: "#16A34A",
    fontWeight: "600",
  },

  /* States */
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  emptyText: {
    textAlign: "center",
    fontSize: 13,
    color: "#64748B",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },

  errorIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  errorIcon: {
    fontSize: 20,
    fontWeight: "800",
    color: "#DC2626",
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },

  errorText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
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
    fontSize: 13,
    fontWeight: "700",
  },

  bottomSpace: {
    height: 24,
  },
});