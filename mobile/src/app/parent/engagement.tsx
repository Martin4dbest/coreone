import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import api from "@/services/api";
import { getParentStudents } from "@/services/parent";

type StudentOption = {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
};

type RankRow = {
  rank: number;
  student_id: number;
  student_name: string;
  class_name: string;
  value: number;
  unit: string;
};

type Category = {
  key: string;
  title: string;
  description: string;
  unit: string;
  total_ranked: number;
  top5: RankRow[];
  my_result: RankRow | null;
};

const medal = (rank: number) =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

export default function ParentEngagementScreen() {
  const params = useLocalSearchParams<{ studentId?: string | string[] }>();
  const routeStudentId = Array.isArray(params.studentId)
    ? params.studentId[0]
    : params.studentId;
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const id = Number(routeStudentId);
    return Number.isInteger(id) && id > 0 ? id : null;
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response: any = await getParentStudents();
      const list: StudentOption[] = Array.isArray(response)
        ? response
        : response?.students ?? response?.data ?? [];
      setStudents(list);
      const id =
        selectedId !== null && list.some((student) => student.id === selectedId)
          ? selectedId
          : list[0]?.id ?? null;
      setSelectedId(id);
      if (id !== null) {
        const result = await api.get(
          `/student-engagement/parent/students/${id}`
        );
        setCategories(result.data.categories ?? []);
      } else {
        setCategories([]);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Unable to load your child's rankings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const chooseStudent = async (studentId: number) => {
    setSelectedId(studentId);
    setLoading(true);
    setError("");
    try {
      const result = await api.get(
        `/student-engagement/parent/students/${studentId}`
      );
      setCategories(result.data.categories ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Could not load this child's rankings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        />
      }
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>COREONE PARENT DASHBOARD</Text>
        <Text style={styles.heading}>Child's Performance</Text>
        <Text style={styles.subtitle}>
          View your child's private results alongside the school's Top 5.
        </Text>
      </View>

      {students.length > 1 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SELECT CHILD</Text>
          <View style={styles.studentChoices}>
            {students.map((student) => (
              <Pressable
                key={student.id}
                onPress={() => void chooseStudent(student.id)}
                style={[
                  styles.studentChoice,
                  selectedId === student.id && styles.studentChoiceActive,
                ]}
              >
                <Text
                  style={[
                    styles.studentChoiceText,
                    selectedId === student.id && styles.studentChoiceTextActive,
                  ]}
                >
                  {student.name ||
                    `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() ||
                    `Student ${student.id}`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        categories.map((category) => (
          <View key={category.key} style={styles.card}>
            <Text style={styles.cardTitle}>{category.title}</Text>
            <Text style={styles.muted}>{category.description}</Text>
            <View style={styles.personal}>
              <Text style={styles.personalLabel}>YOUR CHILD'S RESULT</Text>
              {category.my_result ? (
                <>
                  <Text style={styles.personalValue}>
                    {medal(category.my_result.rank)}{" "}
                    {category.my_result.value}
                    {category.unit === "%" ? "%" : ` ${category.unit}`}
                  </Text>
                  <Text style={styles.muted}>
                    Rank {category.my_result.rank} of {category.total_ranked}
                  </Text>
                </>
              ) : (
                <Text style={styles.muted}>
                  No qualifying records available yet.
                </Text>
              )}
            </View>
            <Text style={styles.sectionTitle}>SCHOOL TOP 5</Text>
            {category.top5.length === 0 ? (
              <Text style={styles.muted}>No qualifying records yet.</Text>
            ) : (
              category.top5.map((row) => (
                <View key={row.student_id} style={styles.rankRow}>
                  <Text style={styles.rank}>{medal(row.rank)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{row.student_name}</Text>
                    <Text style={styles.muted}>{row.class_name}</Text>
                  </View>
                  <Text style={styles.score}>
                    {row.value}{row.unit === "%" ? "%" : ` ${row.unit}`}
                  </Text>
                </View>
              ))
            )}
          </View>
        ))
      )}
      <Text style={styles.footer}>
        Only your linked child's private results are available to this account.
        Activity counts do not prove reading or video completion.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f4f6fb" },
  content: { padding: 16, paddingBottom: 36 },
  hero: { backgroundColor: "#111c3b", padding: 22, borderRadius: 22, marginBottom: 16 },
  eyebrow: { color: "#a5b4fc", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  heading: { color: "#fff", fontSize: 25, fontWeight: "800", marginTop: 8 },
  subtitle: { color: "#dbe3f5", marginTop: 8, lineHeight: 20 },
  card: { backgroundColor: "#fff", padding: 18, borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: "#e5eaf3" },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#17213d" },
  muted: { color: "#718096", fontSize: 12, marginTop: 4 },
  personal: { backgroundColor: "#eef2ff", borderRadius: 14, padding: 14, marginTop: 16 },
  personalLabel: { color: "#4f46e5", fontWeight: "800", fontSize: 10, letterSpacing: 1 },
  personalValue: { color: "#202b55", fontSize: 23, fontWeight: "800", marginTop: 7 },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: "#64748b", marginTop: 18, marginBottom: 8 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#edf0f5" },
  rank: { width: 34, fontSize: 17, fontWeight: "800", color: "#26365c" },
  studentName: { color: "#1e293b", fontSize: 13, fontWeight: "700" },
  score: { color: "#293a70", fontSize: 13, fontWeight: "800" },
  error: { color: "#b91c1c", backgroundColor: "#fee2e2", padding: 14, borderRadius: 12 },
  studentChoices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  studentChoice: { borderWidth: 1, borderColor: "#dbe2ee", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  studentChoiceActive: { backgroundColor: "#293a70", borderColor: "#293a70" },
  studentChoiceText: { color: "#334155", fontSize: 12, fontWeight: "700" },
  studentChoiceTextActive: { color: "#fff" },
  footer: { color: "#8993a6", fontSize: 11, textAlign: "center", lineHeight: 17, padding: 10 },
});
