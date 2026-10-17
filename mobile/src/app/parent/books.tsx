import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import {
  getParentStudentBooks,
  ParentBookHistory,
  ParentBookHistoryResponse,
} from "@/services/parent";

const PALETTE = ["#4F46E5", "#059669", "#0D9488", "#7C3AED", "#0284C7", "#D97706"];

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

function formatTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function ParentBooksScreen() {
  const params = useLocalSearchParams<{
    studentId?: string;
  }>();

  const studentId = Number(params.studentId);

  const [data, setData] =
    useState<ParentBookHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadBooks = useCallback(async () => {
    if (!Number.isFinite(studentId) || studentId <= 0) {
      setError("Student information is missing.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const result = await getParentStudentBooks(studentId);
      setData(result);
    } catch (err: any) {
      console.log(
        "PARENT BOOKS ERROR:",
        err?.response?.data || err?.message || err
      );

      setError(
        err?.response?.data?.detail ||
          "Unable to load your child's book history."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadBooks();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>
            Loading book history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Ionicons
            name="book-outline"
            size={52}
            color="#94A3B8"
          />
          <Text style={styles.errorTitle}>
            Unable to load books
          </Text>
          <Text style={styles.errorText}>{error}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
            onPress={loadBooks}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  const studentName = [
    data.student.first_name,
    data.student.middle_name,
    data.student.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.viewport}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#4F46E5"
            />
          }
        >
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#0F172A"
              />
            </Pressable>

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                My Child's Books
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {data.student.school_name}
              </Text>
            </View>
          </View>

          {/* ================= STUDENT CARD ================= */}
          <View style={styles.studentCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(studentName || "Student")}
              </Text>
            </View>

            <View style={styles.studentInfo}>
              <Text style={styles.studentName} numberOfLines={1}>
                {studentName}
              </Text>

              <Text style={styles.admission}>
                Admission No. {data.student.admission_number}
              </Text>

              <View style={styles.classPill}>
                <Ionicons name="easel-outline" size={11} color="#4F46E5" />
                <Text style={styles.className} numberOfLines={1}>
                  {data.student.class_name || "Class not assigned"}
                </Text>
              </View>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>
                {data.books.length}
              </Text>
              <Text style={styles.countLabel}>Books</Text>
            </View>
          </View>

          {/* ================= SECTION HEADER ================= */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderTitleRow}>
              <Ionicons name="library" size={18} color="#4F46E5" />
              <Text style={styles.sectionTitle}>
                Issued Books History
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Books assigned to this student by the school
            </Text>
          </View>

          {/* ================= BOOK LIST ================= */}
          {data.books.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="library-outline"
                  size={32}
                  color="#4F46E5"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No Books Issued Yet
              </Text>

              <Text style={styles.emptyText}>
                Books issued to your child by the school will
                appear here automatically.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {data.books.map(
                (book: ParentBookHistory, index: number) => {
                  const returned =
                    book.status.toUpperCase() ===
                    "RETURNED";
                  const color = PALETTE[index % PALETTE.length];

                  return (
                    <Pressable
                      key={book.id}
                      style={({ pressed }) => [
                        styles.bookCard,
                        { borderLeftColor: color },
                        pressed && styles.pressed,
                      ]}
                      onPress={() =>
                        router.push({
                          pathname:
                            "/parent/books/[distributionStudentId]",
                          params: {
                            studentId: String(studentId),
                            distributionStudentId:
                              String(book.id),
                          },
                        })
                      }
                    >
                      <View style={[styles.bookIcon, { backgroundColor: `${color}14` }]}>
                        <Ionicons
                          name="book"
                          size={22}
                          color={color}
                        />
                      </View>

                      <View style={styles.bookBody}>
                        <Text
                          style={styles.bookTitle}
                          numberOfLines={2}
                        >
                          {book.book_title}
                        </Text>

                        <View style={styles.dateRow}>
                          <Ionicons name="time-outline" size={12} color="#64748B" />
                          <Text style={styles.dateLine}>
                            Issued {formatDate(book.issued_at)} • {formatTime(book.issued_at)}
                          </Text>
                        </View>

                        <Text
                          style={styles.issuedBy}
                          numberOfLines={1}
                        >
                          Issued by{" "}
                          <Text style={styles.issuedByHighlight}>
                            {book.issued_by || "School Staff"}
                          </Text>
                        </Text>
                      </View>

                      <View style={styles.bookRight}>
                        <View
                          style={[
                            styles.statusBadge,
                            returned
                              ? styles.returnedBadge
                              : styles.issuedBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              returned
                                ? styles.returnedText
                                : styles.issuedText,
                            ]}
                          >
                            {returned
                              ? "Returned"
                              : "Issued"}
                          </Text>
                        </View>

                        <View style={styles.chevronCircle}>
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color="#64748B"
                          />
                        </View>
                      </View>
                    </Pressable>
                  );
                }
              )}
            </View>
          )}
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
    maxWidth: 480, // Fitted to mobile view threshold
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
    textAlign: "center",
    lineHeight: 20,
    color: "#64748B",
    maxWidth: 320,
    fontSize: 13,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    elevation: 2,
  },
  retryText: {
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
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    marginTop: 1,
    color: "#64748B",
    fontSize: 12,
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  avatarText: {
    color: "#4F46E5",
    fontSize: 17,
    fontWeight: "800",
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  admission: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  classPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  className: {
    fontSize: 10,
    color: "#4F46E5",
    fontWeight: "700",
  },
  countBadge: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 54,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  countNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#4F46E5",
  },
  countLabel: {
    fontSize: 9,
    color: "#6366F1",
    fontWeight: "700",
    marginTop: 1,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
  },
  sectionHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
  },
  list: {
    gap: 12,
  },
  bookCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  bookIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bookBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 19,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  dateLine: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  issuedBy: {
    marginTop: 3,
    fontSize: 11,
    color: "#64748B",
  },
  issuedByHighlight: {
    color: "#334155",
    fontWeight: "700",
  },
  bookRight: {
    alignItems: "flex-end",
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  issuedBadge: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  returnedBadge: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },
  issuedText: {
    color: "#065F46",
  },
  returnedText: {
    color: "#475569",
  },
  chevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 6,
    maxWidth: 300,
    textAlign: "center",
    lineHeight: 18,
    color: "#64748B",
    fontSize: 12,
  },
});