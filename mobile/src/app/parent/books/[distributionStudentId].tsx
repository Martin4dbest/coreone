import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={17}
          color="#4F46E5"
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
            style={styles.backAction}
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

  const returned =
    book.status.toUpperCase() === "RETURNED";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.viewport}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
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
                Transaction details
              </Text>
            </View>
          </View>

          <View style={styles.receiptHeader}>
            <View style={styles.receiptIcon}>
              <Ionicons
                name="book"
                size={30}
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
                returned
                  ? styles.mainStatusReturned
                  : styles.mainStatusIssued,
              ]}
            >
              <Ionicons
                name={
                  returned
                    ? "checkmark-circle"
                    : "book"
                }
                size={15}
                color={
                  returned ? "#166534" : "#166534"
                }
              />
              <Text style={styles.mainStatusText}>
                {returned ? "RETURNED" : "ISSUED"}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Transaction
            </Text>

            <DetailRow
              icon="finger-print-outline"
              label="Transaction / Receipt ID"
              value={book.transaction_id}
            />

            <DetailRow
              icon="barcode-outline"
              label="Book Reference"
              value={book.book_reference}
            />

            <DetailRow
              icon="barcode-outline"
              label="ISBN"
              value={book.isbn}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Student
            </Text>

            <DetailRow
              icon="person-outline"
              label="Student Name"
              value={book.student_name}
            />

            <DetailRow
              icon="card-outline"
              label="Admission Number"
              value={book.admission_number}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Issue Details
            </Text>

            <DetailRow
              icon="calendar-outline"
              label="Date Issued"
              value={formatDate(book.issued_at)}
            />

            <DetailRow
              icon="time-outline"
              label="Time Issued"
              value={formatTime(book.issued_at)}
            />

            <DetailRow
              icon="person-circle-outline"
              label="Issued By"
              value={book.issued_by}
            />

            <DetailRow
              icon="briefcase-outline"
              label="Staff Role"
              value={book.issued_by_role}
            />

            <DetailRow
              icon="shield-checkmark-outline"
              label="Condition at Issue"
              value={book.condition_at_issue}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Return Details
            </Text>

            <DetailRow
              icon="calendar-outline"
              label="Return Date"
              value={
                book.returned_at
                  ? formatDate(book.returned_at)
                  : returned
                    ? "Not recorded"
                    : "Not yet returned"
              }
            />

            <DetailRow
              icon="time-outline"
              label="Return Time"
              value={
                book.returned_at
                  ? formatTime(book.returned_at)
                  : returned
                    ? "Not recorded"
                    : "Not yet returned"
              }
            />

            <DetailRow
              icon="person-circle-outline"
              label="Received By"
              value={book.returned_by}
            />

            <DetailRow
              icon="briefcase-outline"
              label="Receiver Role"
              value={book.returned_by_role}
            />

            <DetailRow
              icon="shield-checkmark-outline"
              label="Return Condition"
              value={book.return_condition}
            />

            <DetailRow
              icon="chatbubble-ellipses-outline"
              label="Return Remarks"
              value={book.return_remarks}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Inventory & Records
            </Text>

            <DetailRow
              icon="cube-outline"
              label="Inventory Status"
              value={book.inventory_status}
            />

            <DetailRow
              icon="document-text-outline"
              label="Remarks / Notes"
              value={book.notes}
            />
          </View>

          <View style={styles.auditFooter}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#64748B"
            />
            <Text style={styles.auditText}>
              This record is generated from the school's
              official book distribution history.
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
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
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
  },
  errorTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  errorText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 420,
    lineHeight: 21,
  },
  backAction: {
    marginTop: 18,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backActionText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748B",
  },
  receiptHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  receiptIcon: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  bookTitle: {
    marginTop: 14,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
    color: "#0F172A",
  },
  schoolName: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 13,
  },
  mainStatus: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  mainStatusIssued: {
    backgroundColor: "#DCFCE7",
  },
  mainStatusReturned: {
    backgroundColor: "#DCFCE7",
  },
  mainStatusText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  detailValue: {
    marginTop: 3,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
    lineHeight: 19,
  },
  auditFooter: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 5,
    paddingVertical: 12,
  },
  auditText: {
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
});
