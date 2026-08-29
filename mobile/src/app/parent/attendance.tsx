import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import {
  getParentStudentAttendance,
  getParentStudent,
  ParentAttendance,
  ParentStudent,
} from "@/services/parent";

function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case "present":
      return "#16A34A";
    case "late":
      return "#D97706";
    case "absent":
      return "#DC2626";
    case "excused":
      return "#7C3AED";
    default:
      return "#64748B";
  }
}

export default function ParentAttendanceScreen() {
  const { studentId } =
    useLocalSearchParams<{
      studentId?: string;
    }>();

  const id = Number(studentId);

  const [student, setStudent] =
    useState<ParentStudent | null>(null);

  const [attendance, setAttendance] =
    useState<ParentAttendance | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  async function load() {
    try {
      const [studentData, attendanceData] =
        await Promise.all([
          getParentStudent(id),
          getParentStudentAttendance(id),
        ]);

      setStudent(studentData);
      setAttendance(attendanceData);
    } catch (error) {
      console.log(
        "PARENT ATTENDANCE ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (Number.isFinite(id)) {
      load();
    } else {
      setLoading(false);
    }
  }, [id]);

  async function refresh() {
    try {
      setRefreshing(true);
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const primaryColor =
    student?.school?.branding?.primary_color ||
    student?.school?.primary_color ||
    "#2563EB";

  const percentage =
    attendance?.attendance_percentage ?? 0;

  const percentageText =
    `${percentage.toFixed(1)}%`;

  const statusSummary = useMemo(
    () => [
      {
        label: "Present",
        value: attendance?.present_days ?? 0,
        icon: "checkmark-circle-outline" as const,
        color: "#16A34A",
      },
      {
        label: "Absent",
        value: attendance?.absent_days ?? 0,
        icon: "close-circle-outline" as const,
        color: "#DC2626",
      },
      {
        label: "Late",
        value: attendance?.late_days ?? 0,
        icon: "time-outline" as const,
        color: "#D97706",
      },
      {
        label: "Excused",
        value: attendance?.excused_days ?? 0,
        icon: "shield-checkmark-outline" as const,
        color: "#7C3AED",
      },
    ],
    [attendance]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={primaryColor}
        />

        <Text style={styles.loadingText}>
          Loading attendance...
        </Text>
      </View>
    );
  }

  if (!student || !attendance) {
    return (
      <View style={styles.loading}>
        <Ionicons
          name="calendar-outline"
          size={44}
          color="#94A3B8"
        />

        <Text style={styles.errorTitle}>
          Attendance unavailable
        </Text>

        <Pressable
          style={[
            styles.backButton,
            {
              backgroundColor: primaryColor,
            },
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: primaryColor,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.headerBack}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#FFFFFF"
            />
          </Pressable>

          <Ionicons
            name="calendar-outline"
            size={30}
            color="#FFFFFF"
          />

          <Text style={styles.headerTitle}>
            Attendance
          </Text>

          <Text style={styles.headerStudent}>
            {student.first_name}{" "}
            {student.last_name}
          </Text>

          <Text style={styles.headerSchool}>
            {student.school.name}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Attendance Rate
          </Text>

          <Text
            style={[
              styles.percentage,
              {
                color: primaryColor,
              },
            ]}
          >
            {percentageText}
          </Text>

          <Text style={styles.summaryCaption}>
            Based on {attendance.total_days} recorded
            school day
            {attendance.total_days === 1 ? "" : "s"}
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(
                    Math.max(percentage, 0),
                    100
                  )}%`,
                  backgroundColor: primaryColor,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.grid}>
          {statusSummary.map((item) => (
            <View
              key={item.label}
              style={styles.statusCard}
            >
              <View
                style={[
                  styles.statusIcon,
                  {
                    backgroundColor:
                      `${item.color}14`,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.color}
                />
              </View>

              <Text style={styles.statusValue}>
                {item.value}
              </Text>

              <Text style={styles.statusLabel}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Attendance History
          </Text>

          {attendance.records.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="calendar-clear-outline"
                size={34}
                color="#94A3B8"
              />

              <Text style={styles.emptyTitle}>
                No attendance records yet
              </Text>

              <Text style={styles.emptyText}>
                Attendance records will appear here as
                the school records them.
              </Text>
            </View>
          ) : (
            <View style={styles.recordsCard}>
              {attendance.records.map(
                (record, index) => {
                  const color = statusColor(
                    record.status
                  );

                  return (
                    <View
                      key={`${record.attendance_date}-${index}`}
                      style={[
                        styles.recordRow,
                        index <
                          attendance.records.length - 1 &&
                          styles.recordDivider,
                      ]}
                    >
                      <View style={styles.recordDate}>
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#64748B"
                        />

                        <Text style={styles.dateText}>
                          {record.attendance_date}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              `${color}14`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color,
                            },
                          ]}
                        >
                          {record.status}
                        </Text>
                      </View>

                      {record.remarks ? (
                        <Text
                          style={styles.remarks}
                          numberOfLines={2}
                        >
                          {record.remarks}
                        </Text>
                      ) : null}
                    </View>
                  );
                }
              )}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerSchool}>
            {student.school.name}
          </Text>

          <Text style={styles.footerText}>
            Attendance for {student.first_name}{" "}
            {student.last_name}
          </Text>
        </View>
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
    paddingBottom: 40,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  errorTitle: {
    marginTop: 10,
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },

  backButton: {
    marginTop: 18,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 22,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  header: {
    paddingTop: 18,
    paddingBottom: 25,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  headerBack: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 9,
  },

  headerTitle: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  headerStudent: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  headerSchool: {
    marginTop: 3,
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "600",
  },

  summaryCard: {
    margin: 18,
    padding: 22,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },

  summaryLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  percentage: {
    marginTop: 4,
    fontSize: 42,
    fontWeight: "900",
  },

  summaryCaption: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: "center",
    marginTop: 3,
  },

  progressTrack: {
    marginTop: 17,
    height: 9,
    width: "100%",
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 10,
  },

  grid: {
    paddingHorizontal: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  statusCard: {
    width: "48%",
    flexGrow: 1,
    minWidth: 140,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  statusValue: {
    marginTop: 10,
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
  },

  statusLabel: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },

  section: {
    marginTop: 26,
    paddingHorizontal: 18,
  },

  sectionTitle: {
    marginBottom: 11,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 10,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },

  emptyText: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    maxWidth: 290,
  },

  recordsCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    overflow: "hidden",
  },

  recordRow: {
    padding: 15,
  },

  recordDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  recordDate: {
    flexDirection: "row",
    alignItems: "center",
  },

  dateText: {
    marginLeft: 8,
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "capitalize",
  },

  remarks: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
  },

  footer: {
    alignItems: "center",
    marginTop: 28,
  },

  footerSchool: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },

  footerText: {
    marginTop: 3,
    color: "#94A3B8",
    fontSize: 10,
  },
});
