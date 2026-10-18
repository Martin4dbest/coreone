import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import api from "@/services/api";

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

export default function StudentEngagementScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await api.get("/student-engagement/me");
      setCategories(response.data.categories ?? []);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Unable to load your performance and engagement."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        <Text style={styles.eyebrow}>COREONE STUDENT DASHBOARD</Text>
        <Text style={styles.heading}>My Performance</Text>
        <Text style={styles.subtitle}>
          See how you are progressing using your recorded school activity.
        </Text>
      </View>

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
              <Text style={styles.personalLabel}>YOUR RESULT</Text>
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
                  No qualifying records yet. Keep learning and check again later.
                </Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>TOP 5</Text>
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
        Rankings reflect recorded activity, not unverified reading or video completion.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f4f6fb" },
  content: { padding: 16, paddingBottom: 36 },
  hero: {
    backgroundColor: "#111c3b",
    padding: 22,
    borderRadius: 22,
    marginBottom: 16,
  },
  eyebrow: { color: "#a5b4fc", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  heading: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 8 },
  subtitle: { color: "#dbe3f5", marginTop: 8, lineHeight: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5eaf3",
  },
  cardTitle: { fontSize: 18, fontWeight: "800", color: "#17213d" },
  muted: { color: "#718096", fontSize: 12, marginTop: 4 },
  personal: {
    backgroundColor: "#eef2ff",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  personalLabel: { color: "#4f46e5", fontWeight: "800", fontSize: 10, letterSpacing: 1 },
  personalValue: { color: "#202b55", fontSize: 23, fontWeight: "800", marginTop: 7 },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: "#64748b", marginTop: 18, marginBottom: 8 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#edf0f5" },
  rank: { width: 34, fontSize: 17, fontWeight: "800", color: "#26365c" },
  studentName: { color: "#1e293b", fontSize: 13, fontWeight: "700" },
  score: { color: "#293a70", fontSize: 13, fontWeight: "800" },
  error: { color: "#b91c1c", backgroundColor: "#fee2e2", padding: 14, borderRadius: 12 },
  footer: { color: "#8993a6", fontSize: 11, textAlign: "center", lineHeight: 17, padding: 10 },
});
