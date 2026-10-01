import React, { useCallback, useState } from "react";
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
import { router, useFocusEffect } from "expo-router";

import {
  getTeacherTimetable,
  TimetableEntry,
} from "@/services/timetable";

const GOLD = "#C58A00";
const DARK = "#0F172A";
const SLATE = "#475569";
const BG = "#F8FAFC";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function dayName(day: string) {
  return (
    day.charAt(0) + day.slice(1).toLowerCase()
  );
}

function formatTime(value: string) {
  return value?.slice(0, 5) || "";
}

export default function TeacherTimetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await getTeacherTimetable();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          "Unable to load your timetable."
      );
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={DARK}
          />
        </Pressable>

        <View>
          <Text style={styles.brand}>CoreOne</Text>
          <Text style={styles.title}>My Timetable</Text>
          <Text style={styles.subtitle}>
            Your teaching schedule
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loading}>
            Loading timetable...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
        >
          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {DAYS.map((day) => {
            const dayEntries = entries.filter(
              (entry) => entry.day_of_week === day
            );

            return (
              <View key={day} style={styles.section}>
                <Text style={styles.day}>{dayName(day)}</Text>

                {dayEntries.length === 0 ? (
                  <Text style={styles.none}>
                    No lessons assigned.
                  </Text>
                ) : (
                  dayEntries.map((entry) => (
                    <View key={entry.id} style={styles.card}>
                      <Text style={styles.time}>
                        {formatTime(entry.start_time)} –{" "}
                        {formatTime(entry.end_time)}
                      </Text>

                      <Text style={styles.subject}>
                        {entry.subject_name}
                      </Text>

                      <Text style={styles.className}>
                        {entry.classroom_name}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 12,
    fontWeight: "800",
    color: GOLD,
  },
  title: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "800",
    color: DARK,
  },
  subtitle: {
    marginTop: 3,
    color: SLATE,
    fontSize: 12,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loading: {
    marginTop: 10,
    color: SLATE,
  },
  section: {
    marginBottom: 20,
  },
  day: {
    marginBottom: 9,
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
  },
  none: {
    color: "#94A3B8",
    fontSize: 13,
  },
  card: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  time: {
    fontSize: 12,
    fontWeight: "800",
    color: GOLD,
  },
  subject: {
    marginTop: 7,
    fontSize: 16,
    fontWeight: "800",
    color: DARK,
  },
  className: {
    marginTop: 4,
    fontSize: 13,
    color: SLATE,
  },
  errorCard: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  errorText: {
    color: "#9A3412",
    fontSize: 13,
  },
});
