import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
            style={styles.retryButton}
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

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                My Child's Books
              </Text>
              <Text style={styles.headerSubtitle}>
                {data.student.school_name}
              </Text>
            </View>
          </View>

          <View style={styles.studentCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(studentName || "Student")}
              </Text>
            </View>

            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>
                {studentName}
              </Text>

              <Text style={styles.admission}>
                Admission No. {data.student.admission_number}
              </Text>

              <Text style={styles.className}>
                {data.student.class_name || "Class not assigned"}
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>
                {data.books.length}
              </Text>
              <Text style={styles.countLabel}>Books</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Book History
              </Text>
              <Text style={styles.sectionSubtitle}>
                Books issued to this student
              </Text>
            </View>
          </View>

          {data.books.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="library-outline"
                  size={32}
                  color="#6366F1"
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
                (book: ParentBookHistory) => {
                  const returned =
                    book.status.toUpperCase() ===
                    "RETURNED";

                  return (
                    <Pressable
                      key={book.id}
                      style={({ pressed }) => [
                        styles.bookCard,
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
                      <View style={styles.bookIcon}>
                        <Ionicons
                          name="book"
                          size={24}
                          color="#4F46E5"
                        />
                      </View>

                      <View style={styles.bookBody}>
                        <Text
                          style={styles.bookTitle}
                          numberOfLines={2}
                        >
                          {book.book_title}
                        </Text>

                        <Text style={styles.dateLine}>
                          Issued {formatDate(book.issued_at)}{" "}
                          • {formatTime(book.issued_at)}
                        </Text>

                        <Text
                          style={styles.issuedBy}
                          numberOfLines={1}
                        >
                          Issued by{" "}
                          {book.issued_by || "School Staff"}
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

                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color="#94A3B8"
                        />
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
    fontWeight: "700",
    color: "#0F172A",
  },
  errorText: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 21,
    color: "#64748B",
    maxWidth: 420,
  },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#4F46E5",
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "700",
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
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 13,
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#4F46E5",
    fontSize: 18,
    fontWeight: "800",
  },
  studentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  studentName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  admission: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  className: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
  },
  countBadge: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 58,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
  },
  countNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: "#4F46E5",
  },
  countLabel: {
    marginTop: 1,
    fontSize: 10,
    color: "#6366F1",
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 13,
  },
  list: {
    gap: 12,
  },
  bookCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.78,
  },
  bookIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  bookBody: {
    flex: 1,
    marginLeft: 13,
    marginRight: 10,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  dateLine: {
    marginTop: 5,
    fontSize: 12,
    color: "#64748B",
  },
  issuedBy: {
    marginTop: 3,
    fontSize: 12,
    color: "#475569",
  },
  bookRight: {
    alignItems: "flex-end",
    gap: 9,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  issuedBadge: {
    backgroundColor: "#DCFCE7",
  },
  returnedBadge: {
    backgroundColor: "#E2E8F0",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  issuedText: {
    color: "#166534",
  },
  returnedText: {
    color: "#475569",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 7,
    maxWidth: 420,
    textAlign: "center",
    lineHeight: 21,
    color: "#64748B",
    fontSize: 13,
  },
});
