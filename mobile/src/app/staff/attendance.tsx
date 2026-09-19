import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import StaffClockInCard from "@/components/StaffClockInCard";

type Attendance = {
  id: number;
  staff_id: number;
  school_id: number;
  attendance_date: string;
  status: string;
  remarks?: string | null;
};

export default function StaffAttendanceScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width > 768;

  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Calendar view modal state
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadAttendance = useCallback(async () => {
    if (!token) return;

    try {
      setError("");

      const baseUrl =
        process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";

      const response = await fetch(
        `${baseUrl}/api/v1/staff/me/attendance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Unable to load attendance");
      }

      setRecords(data);
    } catch (err: any) {
      setError(err?.message || "Unable to load attendance");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [loadAttendance])
  );

  const refresh = () => {
    setRefreshing(true);
    loadAttendance();
  };

  // Status badge styling helper
  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case "PRESENT":
        return { bg: "#DCFCE7", text: "#166534", dot: "#22C55E" };
      case "LATE":
        return { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" };
      case "ABSENT":
        return { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" };
      default:
        return { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" };
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loading}>Loading your attendance...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, isWeb && styles.webContent]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#4F46E5" />
        }
      >
        <View style={[styles.wrapper, isWeb && styles.webWrapper]}>
          
          {/* Gorgeous Header Card with Back Button */}
          <View style={styles.headerCard}>
            <View style={styles.headerDecoration} />

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/staff/dashboard")}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backButtonText}>Dashboard</Text>
            </TouchableOpacity>

            <View style={styles.headerIconContainer}>
              <Text style={{ fontSize: 26 }}>📊</Text>
            </View>

            <Text style={styles.title}>My Attendance</Text>
            <Text style={styles.subtitle}>Track your daily presence history and punctuality.</Text>

            <TouchableOpacity
              style={styles.calendarModalTrigger}
              onPress={() => setCalendarModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.calendarTriggerText}>📅 Open Monthly Calendar View</Text>
            </TouchableOpacity>
          </View>

          <StaffClockInCard />

          {error ? (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {records.length === 0 && !error ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🗓️</Text>
              <Text style={styles.emptyTitle}>No attendance records</Text>
              <Text style={styles.emptyText}>
                Your attendance logs will appear here automatically.
              </Text>
            </View>
          ) : null}

          <View style={styles.listSectionHeader}>
            <Text style={styles.sectionTitle}>Attendance Logs</Text>
            <Text style={styles.sectionCount}>{records.length} records</Text>
          </View>

          {records.map((record) => {
            const config = getStatusConfig(record.status);
            return (
              <View key={record.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={styles.recordDateBox}>
                      <Text style={styles.date}>{record.attendance_date}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: config.dot }]} />
                    <Text style={[styles.statusText, { color: config.text }]}>
                      {record.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {record.remarks ? (
                  <View style={styles.remarksBox}>
                    <Text style={styles.remarksLabel}>Remarks:</Text>
                    <Text style={styles.remarks}>{record.remarks}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Calendar Interactive Modal Overlay */}
      <CalendarViewModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        records={records}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
    </View>
  );
}

// Interactive Calendar Component Showing Attendance Statuses per Day
function CalendarViewModal({
  visible,
  onClose,
  records,
  currentMonth,
  setCurrentMonth,
}: {
  visible: boolean;
  onClose: () => void;
  records: Attendance[];
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Map records by date string for quick status lookup
  const recordMap: { [dateStr: string]: string } = {};
  records.forEach((rec) => {
    recordMap[rec.attendance_date] = rec.status.toUpperCase();
  });

  const daysGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysGrid.push(d);
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.calendarCard}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
              <Text style={styles.calNavText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.calMonthTitle}>
              {monthNames[month]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
              <Text style={styles.calNavText}>▶</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, idx) => (
              <Text key={idx} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {daysGrid.map((day, index) => {
              if (day === null) {
                return <View key={index} style={styles.dayCellEmpty} />;
              }
              const formattedMonth = String(month + 1).padStart(2, "0");
              const formattedDay = String(day).padStart(2, "0");
              const dateString = `${year}-${formattedMonth}-${formattedDay}`;
              const status = recordMap[dateString];

              let cellBg = "#F8FAFC";
              let textCol = "#1E293B";
              let borderCol = "#E2E8F0";

              if (status === "PRESENT") {
                cellBg = "#DCFCE7";
                textCol = "#166534";
                borderCol = "#86EFAC";
              } else if (status === "LATE") {
                cellBg = "#FEF3C7";
                textCol = "#92400E";
                borderCol = "#FDE68A";
              } else if (status === "ABSENT") {
                cellBg = "#FEE2E2";
                textCol = "#991B1B";
                borderCol = "#FCA5A5";
              }

              return (
                <View
                  key={index}
                  style={[
                    styles.dayCell,
                    { backgroundColor: cellBg, borderColor: borderCol },
                  ]}
                >
                  <Text style={[styles.dayCellText, { color: textCol }]}>{day}</Text>
                  {status && (
                    <View
                      style={[
                        styles.dayIndicatorDot,
                        {
                          backgroundColor:
                            status === "PRESENT"
                              ? "#22C55E"
                              : status === "LATE"
                              ? "#F59E0B"
                              : "#EF4444",
                        },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} />
              <Text style={styles.legendText}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={styles.legendText}>Late</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.legendText}>Absent</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.calCloseButton} onPress={onClose}>
            <Text style={styles.calCloseText}>Close Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  webContent: {
    alignItems: "center",
  },
  wrapper: {
    width: "100%",
  },
  webWrapper: {
    maxWidth: 680,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  loading: {
    marginTop: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    position: "relative",
  },
  headerDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#EEF2FF",
  },
  backButton: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 10,
  },
  backArrow: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4F46E5",
    marginRight: 4,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
  },
  calendarModalTrigger: {
    marginTop: 16,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  calendarTriggerText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  listSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordDateBox: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  date: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  remarksBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  remarksLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 2,
  },
  remarks: {
    color: "#334155",
    fontSize: 13,
  },
  empty: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 6,
    color: "#64748B",
    textAlign: "center",
    fontSize: 13,
  },
  error: {
    marginTop: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  errorText: {
    color: "#B91C1C",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 13,
  },
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  calHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calMonthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  calNavBtn: {
    padding: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  calNavText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    width: 40,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCellEmpty: {
    width: "14.28%",
    height: 44,
  },
  dayCell: {
    width: "14.28%",
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    position: "relative",
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: "700",
  },
  dayIndicatorDot: {
    position: "absolute",
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  calCloseButton: {
    marginTop: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  calCloseText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
});
