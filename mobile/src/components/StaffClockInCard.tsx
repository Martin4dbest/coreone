import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";

import api from "@/services/api";

type Attendance = {
  id: number;
  staff_id: number;
  school_id: number;
  attendance_date: string;
  check_in_at: string;
  status: string;
  check_in_latitude: number;
  check_in_longitude: number;
  check_in_accuracy: number;
  check_in_distance_meters: number;
  check_in_mocked: boolean;
  message?: string;
};

type ClockInStatus = {
  checked_in: boolean;
  attendance: Attendance | null;
};

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Africa/Lagos",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getErrorMessage(error: any) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    "Unable to mark attendance. Please try again."
  );
}

export default function StaffClockInCard() {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [attendance, setAttendance] = useState<Attendance | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);

      const response = await api.get<ClockInStatus>(
        "/staff/me/clock-in-status",
      );

      setCheckedIn(Boolean(response.data?.checked_in));
      setAttendance(response.data?.attendance ?? null);
    } catch {
      // Do not block the screen if status check fails.
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus]),
  );

  const clockIn = async () => {
    if (clockingIn || checkedIn) {
      return;
    }

    try {
      setClockingIn(true);

      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        Alert.alert(
          "Location is Off",
          "Please turn on your device location and try again.",
        );
        return;
      }

      let permission = await Location.getForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          "Location Permission Required",
          "CoreOne needs your current location to verify that you are at the school before recording attendance.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        mayShowUserSettingsDialog: true,
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy ?? 9999;

      const mocked = Boolean(
        (position as Location.LocationObject & { mocked?: boolean }).mocked,
      );

      const response = await api.post<Attendance>("/staff/me/clock-in", {
        latitude,
        longitude,
        accuracy,
        mocked,
      });

      setAttendance(response.data);
      setCheckedIn(true);

      Alert.alert(
        "Attendance Marked",
        `Your attendance was recorded successfully at ${formatTime(
          response.data.check_in_at,
        )}.`,
      );
    } catch (error: any) {
      Alert.alert("Clock-In Failed", getErrorMessage(error));
    } finally {
      setClockingIn(false);
      await loadStatus();
    }
  };

  if (loadingStatus) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>Checking attendance status...</Text>
        </View>
      </View>
    );
  }

  if (checkedIn && attendance) {
    return (
      <View style={[styles.card, styles.successCard]}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={24} color="#166534" />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Attendance Marked</Text>

          <Text style={styles.subtitle}>
            Your attendance has already been recorded for today.
          </Text>

          <View style={styles.details}>
            <Text style={styles.detailText}>
              Check-in: {formatTime(attendance.check_in_at)}
            </Text>

            <Text style={styles.detailText}>
              Distance: {Math.round(attendance.check_in_distance_meters)}m
            </Text>

            <Text style={styles.detailText}>
              GPS accuracy: ±{Math.round(attendance.check_in_accuracy)}m
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name="location" size={24} color="#2563EB" />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Mark Attendance</Text>

        <Text style={styles.subtitle}>
          Clock in using your current location. CoreOne will verify that you
          are within the school attendance area.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            clockingIn && styles.buttonDisabled,
          ]}
          onPress={clockIn}
          disabled={clockingIn}
        >
          {clockingIn ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.buttonText}>Verifying Location...</Text>
            </>
          ) : (
            <>
              <Ionicons name="finger-print" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Mark Attendance</Text>
            </>
          )}
        </Pressable>

        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}>
            Attendance is verified by the CoreOne server.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 14,
    marginTop: 16,
    marginBottom: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  successCard: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
  },
  button: {
    minHeight: 48,
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
  },
  details: {
    marginTop: 10,
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#166534",
    fontWeight: "600",
  },
});
