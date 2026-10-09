import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";
import StaffClockInCard from "@/components/StaffClockInCard";

const GOLD = "#D97706";
const GOLD_LIGHT = "#FEF3C7";
const NAVY = "#0F172A";
const MUTED = "#64748B";
const BACKGROUND = "#F4F7FB";
const WHITE = "#FFFFFF";
const BORDER = "#E2E8F0";

export default function StaffDashboard() {
  const { user, tenant, logout, loading } = useAuth();
  const { width } = useWindowDimensions();

  const authUser = user as any;
  const authTenant = tenant as any;

  const compact = width < 380;
  const tablet = width >= 768;

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const rawRole = authUser?.role;
    const role = (
      typeof rawRole === "string"
        ? rawRole
        : rawRole?.name || rawRole?.role || ""
    ).toUpperCase();

    if (role === "STUDENT") {
      router.replace("/student/dashboard");
    } else if (role === "PARENT") {
      router.replace("/parent/dashboard");
    } else if (role === "TEACHER") {
      router.replace("/teacher/dashboard");
    } else if (role !== "STAFF") {
      router.replace("/login");
    }
  }, [loading, user, authUser]);

  const staffName = useMemo(() => {
    if (!authUser) return "Staff Member";

    const candidates = [
      authUser.full_name,
      authUser.fullName,
      authUser.display_name,
      authUser.displayName,
      authUser.name,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }

    const first = String(
      authUser.first_name || authUser.firstName || ""
    ).trim();
    const last = String(
      authUser.last_name || authUser.lastName || ""
    ).trim();
    const combined = `${first} ${last}`.trim();

    if (combined) return combined;

    if (typeof authUser.email === "string" && authUser.email.includes("@")) {
      return authUser.email.split("@")[0];
    }

    return "Staff Member";
  }, [authUser]);

  const staffInitials = useMemo(() => {
    const parts = staffName.trim().split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return (parts[0] || "SM").slice(0, 2).toUpperCase();
  }, [staffName]);

  const schoolName =
    authTenant?.school_name ||
    authTenant?.name ||
    "Your Institution";

  const dateText = now.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const timeText = now.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />
        <View style={styles.loadingIcon}>
          <Ionicons name="grid" size={26} color={GOLD} />
        </View>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={styles.loadingText}>Preparing your workspace...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <View style={styles.frame}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: compact ? 14 : tablet ? 28 : 20,
              paddingTop: compact ? 12 : 20,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <View style={styles.brandIconBox}>
                <Ionicons name="grid" size={20} color={WHITE} />
              </View>

              <View style={styles.brandTextContainer}>
                <Text style={styles.brand}>
                  Core<Text style={styles.brandAccent}>One</Text>
                </Text>
                <Text style={styles.schoolName} numberOfLines={1}>
                  {schoolName}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push("/staff/profile")}
                accessibilityRole="button"
                accessibilityLabel={`Open profile for ${staffName}`}
                style={({ pressed }) => [
                  styles.avatarButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.avatarText}>{staffInitials}</Text>
              </Pressable>

              <Pressable
                onPress={handleLogout}
                accessibilityRole="button"
                accessibilityLabel="Log out"
                hitSlop={8}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="log-out-outline" size={20} color={MUTED} />
              </Pressable>
            </View>
          </View>

          <View style={styles.identityCard}>
            <View style={styles.identityTop}>
              <View style={styles.staffAvatarLarge}>
                <Text style={styles.staffAvatarLargeText}>{staffInitials}</Text>
              </View>

              <View style={styles.identityText}>
                <Text style={styles.eyebrow}>STAFF WORKSPACE</Text>
                <Text style={styles.identityName} numberOfLines={2}>
                  {staffName}
                </Text>
                <View style={styles.rolePill}>
                  <Ionicons name="shield-checkmark" size={12} color={GOLD} />
                  <Text style={styles.rolePillText}>Staff Member</Text>
                </View>
              </View>
            </View>

            <View style={styles.welcomeDivider} />

            <Text style={styles.welcomeHeading}>
              Welcome back!
            </Text>
            <Text style={styles.welcomeDescription}>
              Your workday starts here. Manage your attendance, documents,
              leave requests and account from one place.
            </Text>

            <View style={styles.dateTimeRow}>
              <View style={styles.dateIcon}>
                <Ionicons name="calendar-outline" size={16} color={GOLD} />
              </View>
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateLabel}>TODAY</Text>
                <Text style={styles.dateValue}>{dateText}</Text>
              </View>

              <View style={styles.timeBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.timeText}>{timeText}</Text>
              </View>
            </View>

            <View style={styles.heroDecoration} />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeadingGroup}>
                <Text style={styles.sectionTitle}>Daily Attendance</Text>
                <Text style={styles.sectionDescription}>
                  Record and review your workday attendance.
                </Text>
              </View>
              <View style={styles.sectionIcon}>
                <Ionicons name="time-outline" size={19} color={GOLD} />
              </View>
            </View>

            {/* Preserve the existing GPS clock-in and verification component. */}
            <StaffClockInCard />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeadingGroup}>
                <Text style={styles.sectionTitle}>Your Workspace</Text>
                <Text style={styles.sectionDescription}>
                  Quick access to your staff services.
                </Text>
              </View>
            </View>

            <View style={styles.actionGrid}>
              <ActionCard
                icon="calendar-outline"
                title="Attendance Log"
                subtitle="View your history"
                color="#0284C7"
                bgColor="#E0F2FE"
                compact={compact}
                onPress={() => router.push("/staff/attendance")}
              />

              <ActionCard
                icon="folder-open-outline"
                title="Documents"
                subtitle="Access staff files"
                color="#7C3AED"
                bgColor="#F3E8FF"
                compact={compact}
                onPress={() => router.push("/staff/documents")}
              />

              <ActionCard
                icon="airplane-outline"
                title="Leave Request"
                subtitle="Apply and track leave"
                color="#059669"
                bgColor="#D1FAE5"
                compact={compact}
                onPress={() => router.push("/staff/leave")}
              />

              <ActionCard
                icon="person-outline"
                title="My Profile"
                subtitle="View account details"
                color={GOLD}
                bgColor={GOLD_LIGHT}
                compact={compact}
                onPress={() => router.push("/staff/profile")}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerBrandRow}>
              <View style={styles.footerMark}>
                <Ionicons name="grid" size={13} color={WHITE} />
              </View>
              <Text style={styles.footerBrand}>
                Core<Text style={styles.brandAccent}>One</Text>
              </Text>
            </View>
            <Text style={styles.footerText}>
              Staff Workspace · Secure access
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  color,
  bgColor,
  compact,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  compact: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      style={({ pressed }) => [
        styles.actionCard,
        { width: compact ? "100%" : "48.5%" },
        pressed && styles.pressedCard,
      ]}
    >
      <View style={[styles.actionIconBox, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>

      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.actionSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  frame: {
    flex: 1,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    backgroundColor: BACKGROUND,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 34,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: WHITE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: MUTED,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
    gap: 10,
  },
  brandContainer: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  brandTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  brandIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  brand: {
    fontSize: 21,
    fontWeight: "900",
    color: NAVY,
    letterSpacing: -0.7,
  },
  brandAccent: {
    color: GOLD,
  },
  schoolName: {
    marginTop: 2,
    fontSize: 11,
    color: MUTED,
    fontWeight: "600",
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: GOLD_LIGHT,
    borderWidth: 1,
    borderColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#92400E",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  identityCard: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: NAVY,
    borderRadius: 26,
    padding: 21,
    marginBottom: 28,
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    elevation: 5,
  },
  identityTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  staffAvatarLarge: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  staffAvatarLargeText: {
    color: "#FDE68A",
    fontSize: 21,
    fontWeight: "900",
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: "#FCD34D",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 5,
  },
  identityName: {
    color: WHITE,
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "rgba(217,119,6,0.16)",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginTop: 8,
  },
  rolePillText: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "700",
  },
  welcomeDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.13)",
    marginTop: 20,
    marginBottom: 18,
  },
  welcomeHeading: {
    color: WHITE,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginBottom: 7,
  },
  welcomeDescription: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  dateIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(217,119,6,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateTextContainer: {
    flex: 1,
    minWidth: 125,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 3,
  },
  dateValue: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  timeText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  heroDecoration: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -105,
    top: -90,
    backgroundColor: "rgba(217,119,6,0.12)",
  },
  section: {
    marginBottom: 29,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  sectionHeadingGroup: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: NAVY,
    letterSpacing: -0.4,
  },
  sectionDescription: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: GOLD_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionCard: {
    minHeight: 92,
    backgroundColor: WHITE,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 7,
    elevation: 2,
  },
  actionIconBox: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: NAVY,
    lineHeight: 18,
  },
  actionSubtitle: {
    fontSize: 11,
    color: MUTED,
    marginTop: 4,
    lineHeight: 15,
  },
  footer: {
    alignItems: "center",
    paddingTop: 7,
    paddingBottom: 12,
  },
  footerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  footerMark: {
    width: 23,
    height: 23,
    borderRadius: 7,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: "900",
    color: NAVY,
  },
  footerText: {
    marginTop: 7,
    fontSize: 11,
    color: MUTED,
  },
  pressed: {
    opacity: 0.72,
  },
  pressedCard: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
});
