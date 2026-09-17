import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";

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

  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAttendance = useCallback(async () => {
    if (!token) return;

    try {
      setError("");

      const baseUrl =
        process.env.EXPO_PUBLIC_API_URL ||
        "http://127.0.0.1:8000";

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
        throw new Error(
          data?.detail || "Unable to load attendance"
        );
      }

      setRecords(data);
    } catch (err: any) {
      setError(
        err?.message || "Unable to load attendance"
      );
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loading}>
          Loading attendance...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
        />
      }
    >
      <Text style={styles.title}>
        My Attendance
      </Text>

      <Text style={styles.subtitle}>
        Your staff attendance history.
      </Text>

      {error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {records.length === 0 && !error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            No attendance records
          </Text>

          <Text style={styles.emptyText}>
            Your attendance records will appear here.
          </Text>
        </View>
      ) : null}

      {records.map((record) => (
        <View
          key={record.id}
          style={styles.card}
        >
          <View style={styles.cardTop}>
            <Text style={styles.date}>
              {record.attendance_date}
            </Text>

            <View style={styles.status}>
              <Text style={styles.statusText}>
                {record.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {record.remarks ? (
            <Text style={styles.remarks}>
              {record.remarks}
            </Text>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    marginTop: 10,
    color: "#64748B",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  status: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#E2E8F0",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
  },
  remarks: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 13,
  },
  empty: {
    marginTop: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 7,
    color: "#64748B",
    textAlign: "center",
  },
  error: {
    marginTop: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
  },
  errorText: {
    color: "#B91C1C",
  },
});
