import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

import api from "@/services/api";
import {
  getParentStudent,
  ParentStudent,
} from "@/services/parent";

type ActivityItem = {
  id: number;
  activity_type: string;
  created_at: string | null;
  ebook_title?: string | null;
  resource_title?: string | null;
  video_title?: string | null;
};

type CBTScore = {
  attempt_id: number;
  exam_title: string;
  subject?: string | null;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  submitted_at?: string | null;
};

type StudentActivity = {
  student: {
    first_name: string;
    last_name: string;
    admission_number: string;
    classroom?: string | null;
  };
  cbt_scores: CBTScore[];
  ebook_activity: ActivityItem[];
  browser_activity: ActivityItem[];
  youtube_activity: ActivityItem[];
};

function formatDate(value?: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString();
}

function ActivitySection({
  title,
  subtitle,
  icon,
  color,
  children,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={21} color={color} />
        </View>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Text style={styles.emptyText}>{message}</Text>
  );
}

export default function ParentActivityScreen() {
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();
  const id = Number(studentId);

  const [student, setStudent] = useState<ParentStudent | null>(null);
  const [activity, setActivity] = useState<StudentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setError("A valid student was not selected.");
      setLoading(false);
      return;
    }

    try {
      setError("");
      const [studentData, activityResponse] = await Promise.all([
        getParentStudent(id),
        api.get<StudentActivity>(`/students/${id}/activity`),
      ]);

      setStudent(studentData);
      setActivity(activityResponse.data);
    } catch (err: any) {
      console.log("PARENT STUDENT ACTIVITY ERROR:", err);
      setError(
        err?.response?.data?.detail ||
          "Unable to load student activity. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const primaryColor =
    student?.school?.branding?.primary_color ||
    student?.school?.primary_color ||
    "#2563EB";

  const totalActivities =
    (activity?.ebook_activity.length ?? 0) +
    (activity?.browser_activity.length ?? 0) +
    (activity?.youtube_activity.length ?? 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Loading student activity…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.topRow}>
          <View style={styles.topIcon}>
            <Ionicons name="pulse-outline" size={25} color="#0F766E" />
          </View>
          <View style={styles.topHeading}>
            <Text style={styles.pageTitle}>Student Activity</Text>
            <Text style={styles.pageSubtitle}>
              Learning progress and digital activity
            </Text>
          </View>
        </View>

        <View style={[styles.studentCard, { borderLeftColor: primaryColor }]}>
          <Text style={styles.studentName}>
            {student
              ? `${student.first_name} ${student.last_name}`
              : "Selected student"}
          </Text>
          <Text style={styles.studentMeta}>
            Admission No: {student?.admission_number || "—"}
          </Text>
          <Text style={styles.studentMeta}>
            Class: {student?.class_name || activity?.student.classroom || "—"}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={22} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {activity?.cbt_scores.length ?? 0}
                </Text>
                <Text style={styles.summaryLabel}>CBT attempts</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{totalActivities}</Text>
                <Text style={styles.summaryLabel}>Learning activities</Text>
              </View>
            </View>

            <ActivitySection
              title="CBT Results"
              subtitle="Completed computer-based tests"
              icon="school-outline"
              color="#2563EB"
            >
              {activity?.cbt_scores.length ? (
                activity.cbt_scores.map((item) => (
                  <View key={item.attempt_id} style={styles.activityRow}>
                    <View style={styles.activityText}>
                      <Text style={styles.itemTitle}>{item.exam_title}</Text>
                      <Text style={styles.itemMeta}>
                        {item.subject || "General"} · {formatDate(item.submitted_at)}
                      </Text>
                    </View>
                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreValue}>
                        {Number(item.percentage ?? 0).toFixed(1)}%
                      </Text>
                      <Text
                        style={[
                          styles.scoreStatus,
                          { color: item.passed ? "#15803D" : "#B91C1C" },
                        ]}
                      >
                        {item.passed ? "Passed" : "Not passed"}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState message="No completed CBT results yet." />
              )}
            </ActivitySection>

            <ActivitySection
              title="E-book Activity"
              subtitle="Digital books opened or used"
              icon="book-outline"
              color="#7C3AED"
            >
              {activity?.ebook_activity.length ? (
                activity.ebook_activity.map((item) => (
                  <View key={item.id} style={styles.activityRow}>
                    <View style={styles.activityText}>
                      <Text style={styles.itemTitle}>
                        {item.ebook_title || "E-book"}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.activity_type} · {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState message="No e-book activity recorded." />
              )}
            </ActivitySection>

            <ActivitySection
              title="Browser Activity"
              subtitle="Learning resources accessed"
              icon="globe-outline"
              color="#0F766E"
            >
              {activity?.browser_activity.length ? (
                activity.browser_activity.map((item) => (
                  <View key={item.id} style={styles.activityRow}>
                    <View style={styles.activityText}>
                      <Text style={styles.itemTitle}>
                        {item.resource_title || "Learning resource"}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.activity_type} · {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState message="No browser learning activity recorded." />
              )}
            </ActivitySection>

            <ActivitySection
              title="YouTube Learning"
              subtitle="Educational videos accessed"
              icon="play-circle-outline"
              color="#DC2626"
            >
              {activity?.youtube_activity.length ? (
                activity.youtube_activity.map((item) => (
                  <View key={item.id} style={styles.activityRow}>
                    <View style={styles.activityText}>
                      <Text style={styles.itemTitle}>
                        {item.video_title || "Educational video"}
                      </Text>
                      <Text style={styles.itemMeta}>
                        {item.activity_type} · {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <EmptyState message="No YouTube learning activity recorded." />
              )}
            </ActivitySection>
          </>
        )}

        <Text style={styles.footerText}>
          Pull down to refresh the latest available activity.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  topIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  topHeading: {
    flex: 1,
    marginLeft: 12,
  },
  pageTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
  },
  pageSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#64748B",
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 16,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  studentMeta: {
    marginTop: 5,
    fontSize: 13,
    color: "#64748B",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
  },
  summaryValue: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0F766E",
  },
  summaryLabel: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeading: {
    flex: 1,
    marginLeft: 11,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
    paddingVertical: 12,
    gap: 10,
  },
  activityText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  itemMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
  },
  scoreBox: {
    alignItems: "flex-end",
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  scoreStatus: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  emptyText: {
    paddingVertical: 12,
    color: "#64748B",
    fontSize: 13,
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 15,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    color: "#991B1B",
    fontSize: 13,
  },
  footerText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
  },
});
