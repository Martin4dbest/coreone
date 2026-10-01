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
  getStudentTimetable,
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

function niceDay(day: string) {
  return (
    day.charAt(0) +
    day.slice(1).toLowerCase()
  );
}

function time(value: string) {
  return value?.slice(0, 5) || "";
}

export default function StudentTimetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const data = await getStudentTimetable();
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

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

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

        <View style={styles.headerText}>
          <Text style={styles.brand}>CoreOne</Text>
          <Text style={styles.title}>My Timetable</Text>
          <Text style={styles.subtitle}>
            Your current class schedule
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>
            Loading timetable...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >
          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {DAYS.map((day) => {
            const dayEntries = entries.filter(
              (entry) => entry.day_of_week === day
            );

            return (
              <View key={day} style={styles.daySection}>
                <Text style={styles.dayTitle}>
                  {niceDay(day)}
                </Text>

                {dayEntries.length === 0 ? (
                  <Text style={styles.empty}>
                    No classes scheduled.
                  </Text>
                ) : (
                  dayEntries.map((entry) => (
                    <View
                      key={entry.id}
                      style={styles.card}
                    >
                      <View style={styles.timeBox}>
                        <Text style={styles.time}>
                          {time(entry.start_time)}
                        </Text>
                        <Text style={styles.to}>to</Text>
                        <Text style={styles.time}>
                          {time(entry.end_time)}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.info}>
                        <Text style={styles.subject}>
                          {entry.subject_name}
                        </Text>
                        <Text style={styles.classText}>
                          {entry.classroom_name}
                        </Text>
                        <Text style={styles.teacher}>
                          {entry.teacher_name}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            );
          })}

          {entries.length === 0 && !error ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="calendar-outline"
                size={38}
                color="#94A3B8"
              />
              <Text style={styles.emptyTitle}>
                No timetable yet
              </Text>
              <Text style={styles.emptyBody}>
                Your school has not published your current timetable.
              </Text>
            </View>
          ) : null}
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
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
  headerText: {
    marginLeft: 12,
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
    fontSize: 12,
    color: SLATE,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: SLATE,
  },
  daySection: {
    marginBottom: 20,
  },
  dayTitle: {
    marginBottom: 8,
    fontSize: 17,
    fontWeight: "800",
    color: DARK,
  },
  empty: {
    fontSize: 13,
    color: "#94A3B8",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeBox: {
    width: 62,
    alignItems: "center",
  },
  time: {
    fontSize: 13,
    fontWeight: "800",
    color: GOLD,
  },
  to: {
    marginVertical: 2,
    fontSize: 10,
    color: "#94A3B8",
  },
  divider: {
    width: 1,
    height: 42,
    marginHorizontal: 12,
    backgroundColor: "#E2E8F0",
  },
  info: {
    flex: 1,
  },
  subject: {
    fontSize: 16,
    fontWeight: "800",
    color: DARK,
  },
  classText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: SLATE,
  },
  teacher: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
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
    lineHeight: 19,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
    color: DARK,
  },
  emptyBody: {
    marginTop: 5,
    maxWidth: 280,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: SLATE,
  },
});
