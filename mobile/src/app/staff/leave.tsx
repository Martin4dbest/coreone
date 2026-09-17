import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "";

type Leave = {
  id: number;
  staff_id: number;
  school_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  admin_remarks: string | null;
};

export default function StaffLeaveScreen() {
  const { token } = useAuth();

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveType, setLeaveType] = useState("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadLeaves = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/v1/staff/me/leave`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load leave requests");
      }

      const data = await response.json();
      setLeaves(data);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Error",
        "Unable to load your leave requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadLeaves();
    }, [loadLeaves])
  );

  const submitLeave = async () => {
    if (!leaveType.trim()) {
      Alert.alert("Required", "Please enter a leave type.");
      return;
    }

    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert(
        "Required",
        "Please enter both start and end dates."
      );
      return;
    }

    if (!token) return;

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/staff/me/leave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leave_type: leaveType.trim(),
            start_date: startDate.trim(),
            end_date: endDate.trim(),
            reason: reason.trim() || null,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to submit leave request."
        );
      }

      Alert.alert(
        "Submitted",
        "Your leave request has been submitted successfully."
      );

      setStartDate("");
      setEndDate("");
      setReason("");

      await loadLeaves();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Unable to submit leave request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return styles.approved;

      case "REJECTED":
        return styles.rejected;

      default:
        return styles.pending;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={leaves}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadLeaves();
          }}
        />
      }
      ListHeaderComponent={
        <View>
          <Text style={styles.title}>
            Leave Management
          </Text>

          <Text style={styles.subtitle}>
            Submit and track your leave requests.
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>
              Request Leave
            </Text>

            <Text style={styles.label}>
              Leave Type
            </Text>

            <TextInput
              style={styles.input}
              value={leaveType}
              onChangeText={setLeaveType}
              placeholder="Annual"
            />

            <Text style={styles.label}>
              Start Date
            </Text>

            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
            />

            <Text style={styles.label}>
              End Date
            </Text>

            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
            />

            <Text style={styles.label}>
              Reason
            </Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Reason for leave"
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.button}
              onPress={submitLeave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  Submit Leave Request
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>
            My Leave Requests
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No leave requests yet.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.leaveCard}>
          <View style={styles.row}>
            <Text style={styles.leaveType}>
              {item.leave_type}
            </Text>

            <Text
              style={[
                styles.status,
                getStatusStyle(item.status),
              ]}
            >
              {item.status}
            </Text>
          </View>

          <Text style={styles.date}>
            {item.start_date} → {item.end_date}
          </Text>

          {item.reason ? (
            <Text style={styles.detail}>
              Reason: {item.reason}
            </Text>
          ) : null}

          {item.admin_remarks ? (
            <Text style={styles.detail}>
              Admin remarks: {item.admin_remarks}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 5,
  },

  subtitle: {
    color: "#64748B",
    marginBottom: 20,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 25,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
  },

  textArea: {
    minHeight: 90,
  },

  button: {
    backgroundColor: "#0F172A",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 12,
  },

  leaveCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leaveType: {
    fontSize: 17,
    fontWeight: "700",
  },

  status: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  pending: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },

  approved: {
    backgroundColor: "#DCFCE7",
    color: "#166534",
  },

  rejected: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },

  date: {
    marginTop: 10,
    fontWeight: "600",
  },

  detail: {
    marginTop: 8,
    color: "#475569",
  },

  empty: {
    paddingVertical: 30,
    alignItems: "center",
  },

  emptyText: {
    color: "#64748B",
  },
});
