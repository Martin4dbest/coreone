import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import api from "@/services/api";
import {
  getParentTimetable,
  TimetableEntry,
} from "@/services/timetable";

type ParentStudent = {
  id: number;
  first_name: string;
  last_name: string;
  class_name?: string | null;
};

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

export default function ParentTimetable() {
  const [students, setStudents] = useState<ParentStudent[]>([]);
  const [selectedStudentId, setSelectedStudentId] =
    useState<number | null>(null);

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] =
    useState(false);
  const [error, setError] = useState("");

  const loadStudents = useCallback(async () => {
    const response = await api.get("/parents/me");
    const data = response.data;
    const list = Array.isArray(data?.students)
      ? data.students
      : [];

    setStudents(list);

    if (list.length > 0) {
      setSelectedStudentId(
        (current) => current || list[0].id
      );
    }
  }, []);

  const loadSchedule = useCallback(
    async (studentId: number) => {
      try {
        setError("");
        setLoadingSchedule(true);

        const data =
          await getParentTimetable(studentId);

        setEntries(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
            "Unable to load this child's timetable."
        );
        setEntries([]);
      } finally {
        setLoadingSchedule(false);
      }
    },
    []
  );

  useEffect(() => {
    async function load() {
      try {
        setError("");
        await loadStudents();
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
            "Unable to load linked children."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [loadStudents]);

  useEffect(() => {
    if (selectedStudentId) {
      loadSchedule(selectedStudentId);
    }
  }, [selectedStudentId, loadSchedule]);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
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
            color="#0F172A"
          />
        </Pressable>

        <View>
          <Text style={styles.brand}>CoreOne</Text>
          <Text style={styles.title}>
            Child Timetable
          </Text>
          <Text style={styles.subtitle}>
            School weekly schedule
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#C58A00"
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
        >
          {students.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childList}
            >
              {students.map((student) => {
                const active =
                  student.id === selectedStudentId;

                return (
                  <Pressable
                    key={student.id}
                    onPress={() =>
                      setSelectedStudentId(student.id)
                    }
                    style={[
                      styles.childChip,
                      active && styles.childChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.childName,
                        active &&
                          styles.childNameActive,
                      ]}
                    >
                      {student.first_name}{" "}
                      {student.last_name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                No linked children found.
              </Text>
            </View>
          )}

          {selectedStudent ? (
            <View style={styles.studentBanner}>
              <Text style={styles.studentName}>
                {selectedStudent.first_name}{" "}
                {selectedStudent.last_name}
              </Text>
              {selectedStudent.class_name ? (
                <Text style={styles.studentClass}>
                  {selectedStudent.class_name}
                </Text>
              ) : null}
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          {loadingSchedule ? (
            <View style={styles.centerSmall}>
              <ActivityIndicator
                size="small"
                color="#C58A00"
              />
            </View>
          ) : (
            DAYS.map((day) => {
              const dayEntries = entries.filter(
                (entry) =>
                  entry.day_of_week === day
              );

              return (
                <View
                  key={day}
                  style={styles.section}
                >
                  <Text style={styles.day}>
                    {dayName(day)}
                  </Text>

                  {dayEntries.length === 0 ? (
                    <Text style={styles.none}>
                      No lessons scheduled.
                    </Text>
                  ) : (
                    dayEntries.map((entry) => (
                      <View
                        key={entry.id}
                        style={styles.card}
                      >
                        <Text style={styles.time}>
                          {entry.start_time.slice(0, 5)} –{" "}
                          {entry.end_time.slice(0, 5)}
                        </Text>

                        <Text style={styles.subject}>
                          {entry.subject_name}
                        </Text>

                        <Text style={styles.teacher}>
                          Teacher: {entry.teacher_name}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    color: "#C58A00",
  },
  title: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#475569",
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  childList: {
    gap: 8,
    paddingBottom: 14,
  },
  childChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  childChipActive: {
    backgroundColor: "#FFF8E7",
    borderColor: "#C58A00",
  },
  childName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  childNameActive: {
    color: "#A97000",
  },
  studentBanner: {
    marginBottom: 18,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "#0F172A",
  },
  studentName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  studentClass: {
    marginTop: 4,
    fontSize: 12,
    color: "#CBD5E1",
  },
  section: {
    marginBottom: 20,
  },
  day: {
    marginBottom: 9,
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  none: {
    fontSize: 13,
    color: "#94A3B8",
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
    color: "#C58A00",
  },
  subject: {
    marginTop: 7,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  teacher: {
    marginTop: 4,
    fontSize: 12,
    color: "#475569",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centerSmall: {
    paddingVertical: 25,
    alignItems: "center",
  },
  errorCard: {
    marginBottom: 15,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  errorText: {
    fontSize: 13,
    color: "#9A3412",
  },
});
