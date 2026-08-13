import {
useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");
const isDesktopWeb = Platform.OS === "web" && screenWidth >= 900;
const desktopMaxWidth = Math.min(
  Math.max(screenWidth - 48, 320),
  1180
);


import { getStudentAttendance } from "@/services/student";

type AttendanceRecord = {
  id: number;
  attendance_date: string;
  status: string;
  remarks?: string | null;
};

type AttendanceData = {
  student_id: number;
  attendance_percentage: number;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  records: AttendanceRecord[];
};

export default function StudentAttendanceScreen() {
  const router = useRouter();

  const [data, setData] =
    useState<AttendanceData | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAttendance = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await getStudentAttendance();

        setData(response);
      } catch (err: any) {
        console.log(
          "STUDENT ATTENDANCE ERROR:",
          err?.response?.data || err
        );

        setError(
          err?.response?.data?.detail ||
            "Unable to load attendance."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [loadAttendance])
  );

  function statusColor(status: string) {
    switch (status.toLowerCase()) {
      case "present":
        return "#059669";
      case "absent":
        return "#DC2626";
      case "late":
        return "#D97706";
      case "excused":
        return "#0284C7";
      default:
        return "#64748B";
    }
  }

  function statusIcon(status: string) {
    switch (status.toLowerCase()) {
      case "present":
        return "checkmark-circle";
      case "absent":
        return "close-circle";
      case "late":
        return "time";
      case "excused":
        return "information-circle";
      default:
        return "ellipse";
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#0284C7"
        />

        <Text style={styles.loadingText}>
          Loading attendance...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color="#DC2626"
        />

        <Text style={styles.errorTitle}>
          Attendance unavailable
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          onPress={() => loadAttendance()}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>
            Try Again
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const attendance = data || {
    attendance_percentage: 0,
    total_days: 0,
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    excused_days: 0,
    records: [],
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#0F172A"
          />
        </Pressable>

        <View>
          <Text style={styles.title}>
            Attendance Record
          </Text>

          <Text style={styles.subtitle}>
            Your attendance history
          </Text>
        </View>
      </View>

      <FlatList
        data={attendance.records}
        keyExtractor={(item) =>
          String(item.id)
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAttendance(true)}
          />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.percentageCard}>
              <View style={styles.percentageCircle}>
                <Text style={styles.percentage}>
                  {attendance.attendance_percentage}%
                </Text>
              </View>

              <View style={styles.percentageInfo}>
                <Text style={styles.cardTitle}>
                  Overall Attendance
                </Text>

                <Text style={styles.cardSubtitle}>
                  {attendance.present_days} present days out of{" "}
                  {attendance.total_days} recorded days
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <Stat
                label="Present"
                value={attendance.present_days}
                color="#059669"
                icon="checkmark-circle"
              />

              <Stat
                label="Absent"
                value={attendance.absent_days}
                color="#DC2626"
                icon="close-circle"
              />

              <Stat
                label="Late"
                value={attendance.late_days}
                color="#D97706"
                icon="time"
              />

              <Stat
                label="Excused"
                value={attendance.excused_days}
                color="#0284C7"
                icon="information-circle"
              />
            </View>

            <Text style={styles.sectionTitle}>
              Attendance History
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.recordCard}>
            <View
              style={[
                styles.recordIcon,
                {
                  backgroundColor:
                    statusColor(item.status) + "15",
                },
              ]}
            >
              <Ionicons
                name={statusIcon(item.status) as any}
                size={21}
                color={statusColor(item.status)}
              />
            </View>

            <View style={styles.recordInfo}>
              <Text style={styles.recordDate}>
                {item.attendance_date}
              </Text>

              {item.remarks ? (
                <Text
                  style={styles.recordRemarks}
                  numberOfLines={2}
                >
                  {item.remarks}
                </Text>
              ) : null}
            </View>

            <Text
              style={[
                styles.status,
                {
                  color: statusColor(item.status),
                },
              ]}
            >
              {item.status.charAt(0).toUpperCase() +
                item.status.slice(1)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color="#CBD5E1"
            />

            <Text style={styles.emptyTitle}>
              No attendance records
            </Text>

            <Text style={styles.emptyText}>
              Your attendance records will appear here
              once your school starts recording them.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons
        name={icon as any}
        size={20}
        color={color}
      />

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
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
    color: "#64748B",
    lineHeight: 21,
  },

  retryButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0284C7",
  },

  retryText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    marginRight: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  percentageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0F2FE",
    marginBottom: 14,
  },

  percentageCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },

  percentage: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0284C7",
  },

  percentageInfo: {
    flex: 1,
    marginLeft: 16,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  cardSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },

  statCard: {
    width: "48%",
    minHeight: 105,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  sectionTitle: {
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },

  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  recordIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  recordInfo: {
    flex: 1,
    marginLeft: 12,
  },

  recordDate: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },

  recordRemarks: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },

  status: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "900",
  },

  empty: {
    alignItems: "center",
    paddingVertical: 55,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "800",
    color: "#334155",
  },

  emptyText: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: "#94A3B8",
  },
});
