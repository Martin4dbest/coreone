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
  check_in_location_name: string | null;
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

function getErrorMessage(error: any): string {
  const responseData = error?.response?.data;

  console.error(
    "[CLOCK-IN ERROR] Full error:",
    JSON.stringify(
      {
        message: error?.message,
        status: error?.response?.status,
        data: responseData,
        detail: responseData?.detail,
        serverMessage: responseData?.message,
      },
      null,
      2,
    ),
  );

  const detail =
    typeof responseData?.detail === "string"
      ? responseData.detail.trim()
      : "";

  if (
    error?.response?.status === 403 &&
    detail.toLowerCase().includes("outside the school's attendance area")
  ) {
    return "You cannot clock in from this area. Please move closer to the school premises and try again.";
  }

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (detail) {
    return detail;
  }

  if (Array.isArray(responseData?.detail)) {
    return responseData.detail
      .map((item: any) => item?.msg || JSON.stringify(item))
      .join("\n");
  }

  if (
    responseData?.detail &&
    typeof responseData.detail === "object"
  ) {
    return JSON.stringify(responseData.detail);
  }

  if (
    typeof responseData?.message === "string" &&
    responseData.message.trim()
  ) {
    return responseData.message;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Unable to mark attendance. Please try again.";
}

async function getBestClockInLocation(): Promise<Location.LocationObject> {
  const readings: Location.LocationObject[] = [];

  const attempts = 3;

  for (let i = 0; i < attempts; i += 1) {
    try {
      const reading = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        mayShowUserSettingsDialog: true,
      });

      readings.push(reading);

      console.log(
        `[CLOCK-IN GPS] Reading ${i + 1}/${attempts}:`,
        JSON.stringify({
          latitude: reading.coords.latitude,
          longitude: reading.coords.longitude,
          accuracy: reading.coords.accuracy,
          mocked: Boolean(
            (reading as Location.LocationObject & { mocked?: boolean }).mocked
          ),
        })
      );

      if (
        typeof reading.coords.accuracy === "number" &&
        reading.coords.accuracy > 0 &&
        reading.coords.accuracy <= 50
      ) {
        break;
      }
    } catch (error) {
      console.error(
        "[CLOCK-IN GPS] Location reading failed:",
        error
      );
    }
  }

  if (!readings.length) {
    throw new Error(
      "Unable to obtain your current GPS location. Please enable location services and try again."
    );
  }

  readings.sort((a, b) => {
    const aa = a.coords.accuracy ?? Number.POSITIVE_INFINITY;
    const bb = b.coords.accuracy ?? Number.POSITIVE_INFINITY;
    return aa - bb;
  });

  const best = readings[0];

  console.log(
    "[CLOCK-IN GPS] Best reading:",
    JSON.stringify({
      latitude: best.coords.latitude,
      longitude: best.coords.longitude,
      accuracy: best.coords.accuracy,
      mocked: Boolean(
        (best as Location.LocationObject & { mocked?: boolean }).mocked
      ),
    })
  );

  return best;
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

      const position = await getBestClockInLocation();

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy ?? 9999;

      const mocked = Boolean(
        (position as Location.LocationObject & { mocked?: boolean }).mocked,
      );

      console.log(
        "[CLOCK-IN] Payload:",
        JSON.stringify(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            mocked: Boolean(
              (position as Location.LocationObject & { mocked?: boolean }).mocked
            ),
          },
          null,
          2
        )
      );

      const response = await api.post<Attendance>("/staff/me/clock-in", {
        latitude,
        longitude,
        accuracy,
        mocked,
      });
      console.log(
        "[CLOCK-IN] Server success:",
        JSON.stringify(response.data, null, 2),
      );


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
              Location:{" "}
              {attendance.check_in_location_name || "Address unavailable"}
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
