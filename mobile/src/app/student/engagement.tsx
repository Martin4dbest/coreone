import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 900;

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
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
          tintColor="#1E293B"
          colors={["#1E293B"]}
        />
      }
    >
      <View style={[styles.mainWrapper, isDesktop && styles.desktopWrapper]}>
        {/* HERO CARD */}
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#334155"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.eyebrowBadge}>
            <Ionicons name="sparkles" size={10} color="#D4AF37" />
            <Text style={styles.eyebrow}>STUDENT PERFORMANCE</Text>
          </View>
          <Text style={styles.heading}>Engagement Leaderboard</Text>
          <Text style={styles.subtitle}>
            See how you are progressing based on your recorded school activity.
          </Text>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E293B" />
            <Text style={styles.loadingText}>Loading engagement data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={20} color="#B91C1C" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : (
          categories.map((category) => (
            <View key={category.key} style={[styles.card, styles.glowShadow]}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryIconBadge}>
                  <Ionicons name="trophy-outline" size={18} color="#C58A00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{category.title}</Text>
                  <Text style={styles.muted}>{category.description}</Text>
                </View>
              </View>

              {/* PERSONAL RESULT BOX */}
              <LinearGradient
                colors={["#EEF2FF", "#F5F3FF"]}
                style={styles.personal}
              >
                <View style={styles.personalHeader}>
                  <Text style={styles.personalLabel}>YOUR PERFORMANCE</Text>
                  {category.my_result && (
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>
                        Rank #{category.my_result.rank}
                      </Text>
                    </View>
                  )}
                </View>

                {category.my_result ? (
                  <View style={styles.personalScoreRow}>
                    <Text style={styles.medalIcon}>
                      {medal(category.my_result.rank)}
                    </Text>
                    <Text style={styles.personalValue}>
                      {category.my_result.value}
                      <Text style={styles.unitText}>
                        {category.unit === "%" ? "%" : ` ${category.unit}`}
                      </Text>
                    </Text>
                    <Text style={styles.totalRankedText}>
                      of {category.total_ranked} students
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noRecordText}>
                    No qualifying records yet. Keep learning and check again later.
                  </Text>
                )}
              </LinearGradient>

              {/* TOP 5 RANKINGS */}
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="ribbon-outline" size={14} color="#64748B" />
                <Text style={styles.sectionTitle}>TOP 5 LEADERBOARD</Text>
              </View>

              {category.top5.length === 0 ? (
                <Text style={styles.muted}>No qualifying records yet.</Text>
              ) : (
                category.top5.map((row, idx) => {
                  const isTopThree = row.rank <= 3;
                  return (
                    <View
                      key={row.student_id}
                      style={[
                        styles.rankRow,
                        idx === category.top5.length - 1 && styles.noBorder,
                      ]}
                    >
                      <View style={styles.rankBadgeContainer}>
                        <Text style={styles.rankText}>{medal(row.rank)}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {row.student_name}
                        </Text>
                        <Text style={styles.className}>{row.class_name}</Text>
                      </View>

                      <View
                        style={[
                          styles.scoreBadge,
                          isTopThree && styles.topThreeScoreBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.scoreText,
                            isTopThree && styles.topThreeScoreText,
                          ]}
                        >
                          {row.value}
                          {row.unit === "%" ? "%" : ` ${row.unit}`}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ))
        )}

        <Text style={styles.footer}>
          Rankings reflect verified recorded activity and submission records.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  mainWrapper: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 12 : 16,
    alignSelf: "center",
  },
  desktopWrapper: {
    maxWidth: 720,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  /* HERO */
  hero: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  eyebrowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  eyebrow: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heading: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  /* LOADING & ERROR */
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  error: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  /* CARD & GLOW */
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  glowShadow: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  categoryIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  muted: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },

  /* PERSONAL RESULT */
  personal: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    marginBottom: 14,
  },
  personalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  personalLabel: {
    color: "#4F46E5",
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  rankBadge: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  personalScoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 6,
    gap: 6,
  },
  medalIcon: {
    fontSize: 18,
    marginRight: 2,
  },
  personalValue: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
  },
  unitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
  },
  totalRankedText: {
    color: "#64748B",
    fontSize: 11,
    marginLeft: "auto",
  },
  noRecordText: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 6,
  },

  /* TOP 5 SECTION */
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.4,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  rankBadgeContainer: {
    width: 28,
    alignItems: "center",
  },
  rankText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  studentName: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
  },
  className: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 1,
  },
  scoreBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  topThreeScoreBadge: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  scoreText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "800",
  },
  topThreeScoreText: {
    color: "#C58A00",
  },

  /* FOOTER */
  footer: {
    color: "#94A3B8",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
    marginTop: 8,
    paddingHorizontal: 16,
  },
});