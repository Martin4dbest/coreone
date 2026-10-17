import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import {
  getParentStudentBook,
  ParentBookHistory,
} from "@/services/parent";

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailRow({
  icon,
  label,
  value,
  color = "#4F46E5",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  color?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: `${color}14` }]}>
        <Ionicons
          name={icon}
          size={16}
          color={color}
        />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>
          {value || "Not recorded"}
        </Text>
      </View>
    </View>
  );
}

export default function ParentBookDetailScreen() {
  const params = useLocalSearchParams<{
    studentId?: string;
    distributionStudentId?: string;
  }>();

  const studentId = Number(params.studentId);
  const distributionStudentId = Number(
    params.distributionStudentId
  );

  const [book, setBook] =
    useState<ParentBookHistory | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBook = useCallback(async () => {
    if (
      !Number.isFinite(studentId) ||
      studentId <= 0 ||
      !Number.isFinite(distributionStudentId) ||
      distributionStudentId <= 0
    ) {
      setError("Book transaction information is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const result = await getParentStudentBook(
        studentId,
        distributionStudentId
      );

      setBook(result);
    } catch (err: any) {
      console.log(
        "PARENT BOOK DETAIL ERROR:",
        err?.response?.data || err?.message || err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load this book transaction."
      );
    } finally {
      setLoading(false);
    }
  }, [studentId, distributionStudentId]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#4F46E5"
          />
          <Text style={styles.loadingText}>
            Loading book receipt...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !book) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Ionicons
            name="receipt-outline"
            size={52}
            color="#94A3B8"
          />
          <Text style={styles.errorTitle}>
            Unable to load receipt
          </Text>
          <Text style={styles.errorText}>
            {error || "Book transaction not found."}
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.backAction,
              pressed && styles.pressedState,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backActionText}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.viewport}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressedState,
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#0F172A"
              />
            </Pressable>

            <View>
              <Text style={styles.headerTitle}>
                Book Receipt
              </Text>
              <Text style={styles.headerSubtitle}>
                Official transaction record
              </Text>
            </View>
          </View>

          {/* ================= RECEIPT HERO ================= */}
          <View style={styles.receiptHeader}>
            <View style={styles.receiptIcon}>
              <Ionicons
                name="book-sharp"
                size={32}
                color="#4F46E5"
              />
            </View>

            <Text style={styles.bookTitle}>
              {book.book_title}
            </Text>

            <Text style={styles.schoolName}>
              {book.school_name}
            </Text>

            <View
              style={[
                styles.mainStatus,
                styles.mainStatusIssued,
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#059669"
              />
              <Text style={styles.mainStatusText}>
                {book.status || "ISSUED"}
              </Text>
            </View>
          </View>

          {/* ================= SECTION 1: TRANSACTION DETAILS ================= */}
          <View style={[styles.card, styles.cardIndigo]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="receipt-outline" size={18} color="#4F46E5" />
              <Text style={styles.cardTitle}>Transaction Reference</Text>
            </View>

            <DetailRow
              icon="finger-print-outline"
              label="Transaction / Receipt ID"
              value={book.transaction_id}
              color="#4F46E5"
            />

            <DetailRow
              icon="barcode-outline"
              label="Book Reference"
              value={book.book_reference}
              color="#4F46E5"
            />

            <DetailRow
              icon="qr-code-outline"
              label="ISBN"
              value={book.isbn}
              color="#4F46E5"
            />
          </View>

          {/* ================= SECTION 2: CHARGES ================= */}
          <View style={[styles.card, styles.cardEmerald]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="wallet-outline" size={18} color="#059669" />
              <Text style={styles.cardTitle}>Book Charges</Text>
            </View>

            <DetailRow
              icon="pricetag-outline"
              label="Selling Price"
              value={
                book.unit_selling_price != null
                  ? `₦${Number(
                      book.unit_selling_price
                    ).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : null
              }
              color="#059669"
            />

            <DetailRow
              icon="cash-outline"
              label="Total Amount"
              value={
                book.total_selling_amount != null
                  ? `₦${Number(
                      book.total_selling_amount
                    ).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : null
              }
              color="#059669"
            />
          </View>

          {/* ================= SECTION 3: STUDENT DETAILS ================= */}
          <View style={[styles.card, styles.cardSky]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="person-outline" size={18} color="#0284C7" />
              <Text style={styles.cardTitle}>Student Information</Text>
            </View>

            <DetailRow
              icon="person-circle-outline"
              label="Student Name"
              value={book.student_name}
              color="#0284C7"
            />

            <DetailRow
              icon="card-outline"
              label="Admission Number"
              value={book.admission_number}
              color="#0284C7"
            />
          </View>

          {/* ================= SECTION 4: ISSUE DETAILS ================= */}
          <View style={[styles.card, styles.cardAmber]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="calendar-outline" size={18} color="#D97706" />
              <Text style={styles.cardTitle}>Issue Details</Text>
            </View>

            <DetailRow
              icon="calendar-clear-outline"
              label="Date Issued"
              value={formatDate(book.issued_at)}
              color="#D97706"
            />

            <DetailRow
              icon="time-outline"
              label="Time Issued"
              value={formatTime(book.issued_at)}
              color="#D97706"
            />

            <DetailRow
              icon="person-outline"
              label="Issued By"
              value={book.issued_by}
              color="#D97706"
            />

            <DetailRow
              icon="briefcase-outline"
              label="Staff Role"
              value={book.issued_by_role}
              color="#D97706"
            />

            <DetailRow
              icon="shield-checkmark-outline"
              label="Condition at Issue"
              value={book.condition_at_issue}
              color="#D97706"
            />
          </View>

          {/* ================= SECTION 5: INVENTORY ================= */}
          <View style={[styles.card, styles.cardPurple]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="cube-outline" size={18} color="#7C3AED" />
              <Text style={styles.cardTitle}>Inventory & Records</Text>
            </View>

            <DetailRow
              icon="layers-outline"
              label="Inventory Status"
              value={book.inventory_status}
              color="#7C3AED"
            />

            <DetailRow
              icon="document-text-outline"
              label="Remarks / Notes"
              value={book.notes}
              color="#7C3AED"
            />
          </View>

          {/* ================= AUDIT FOOTER ================= */}
          <View style={styles.auditFooter}>
            <Ionicons
              name="shield-checkmark-sharp"
              size={18}
              color="#10B981"
            />
            <Text style={styles.auditText}>
              This record is verified and generated directly from the school's official book distribution history.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  viewport: {
    flex: 1,
    maxWidth: 480, // Fitted to mobile view dimensions
    width: "100%",
    alignSelf: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 28 : 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  errorTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  errorText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 320,
    fontSize: 13,
    lineHeight: 20,
  },
  backAction: {
    marginTop: 20,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  backActionText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    marginTop: 1,
    fontSize: 12,
    color: "#64748B",
  },
  receiptHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    color: "#0F172A",
    lineHeight: 24,
  },
  schoolName: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  mainStatus: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  mainStatusIssued: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  mainStatusText: {
    color: "#065F46",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIndigo: {
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  cardEmerald: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  cardSky: {
    borderLeftWidth: 4,
    borderLeftColor: "#0284C7",
  },
  cardAmber: {
    borderLeftWidth: 4,
    borderLeftColor: "#D97706",
  },
  cardPurple: {
    borderLeftWidth: 4,
    borderLeftColor: "#7C3AED",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
  },
  detailValue: {
    marginTop: 2,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
    lineHeight: 18,
  },
  pressedState: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  auditFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
  },
  auditText: {
    flex: 1,
    color: "#166534",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
});