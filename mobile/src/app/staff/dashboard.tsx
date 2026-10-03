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
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";
import StaffClockInCard from "@/components/StaffClockInCard";

const PRIMARY_GOLD = "#D97706";
const PRIMARY_GOLD_LIGHT = "#FEF3C7";
const DARK_SLATE = "#0F172A";
const BODY_SLATE = "#334155";
const MUTED_SLATE = "#64748B";
const BACKGROUND = "#F8FAFC";
const WHITE = "#FFFFFF";
const BORDER = "#E2E8F0";

export default function StaffDashboard() {
  const { user, tenant, logout, loading } = useAuth();

  const authUser = user as any;
  const authTenant = tenant as any;

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const rawRole = authUser?.role;
    const role =
      typeof rawRole === "string"
        ? rawRole
        : rawRole?.name || rawRole?.role || "";

    if (role === "STUDENT") {
      router.replace("/student/dashboard");
      return;
    }
    if (role === "PARENT") {
      router.replace("/parent/dashboard");
      return;
    }
    if (role === "TEACHER") {
      router.replace("/teacher/dashboard");
      return;
    }
    if (role !== "STAFF") {
      router.replace("/login");
    }
  }, [loading, user, authUser]);

  // Robust staff name check to guarantee the exact name is shown
  const staffName = useMemo(() => {
    if (!authUser) return "Staff Member";

    const explicitFullName =
      authUser.full_name ||
      authUser.fullName ||
      authUser.name;

    if (explicitFullName && typeof explicitFullName === "string") {
      return explicitFullName.trim();
    }

    const first =
      authUser.first_name ||
      authUser.firstName ||
      "";

    const last =
      authUser.last_name ||
      authUser.lastName ||
      "";

    const combined = `${first} ${last}`.trim();
    if (combined) return combined;

    if (authUser.email) {
      return authUser.email.split("@")[0];
    }

    return "Staff Member";
  }, [authUser]);

  const staffInitials = useMemo(() => {
    const parts = staffName.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return staffName.substring(0, 2).toUpperCase();
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
    second: "2-digit",
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
        <ActivityIndicator size="large" color={PRIMARY_GOLD} />
        <Text style={styles.loadingText}>Preparing your workspace...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <View style={styles.desktopFrame}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* MODERN HEADER */}
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <View style={styles.brandIconBox}>
                <Ionicons name="grid" size={18} color={WHITE} />
              </View>
              <View>
                <Text style={styles.brand}>
                  Core<Text style={styles.brandAccent}>One</Text>
                </Text>
                <Text style={styles.schoolName} numberOfLines={1}>
                  {schoolName}
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <Pressable
                onPress={() => router.push("/staff/profile")}
                style={({ pressed }) => [
                  styles.profileButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.profileInitials}>{staffInitials}</Text>
              </Pressable>

              <Pressable
                onPress={handleLogout}
                accessibilityRole="button"
                accessibilityLabel="Log out"
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="log-out-outline" size={18} color={MUTED_SLATE} />
              </Pressable>
            </View>
          </View>

          {/* WELCOME / GREETING HERO CARD */}
          <View style={styles.heroCard}>
            <View style={styles.heroBackgroundPattern} />
            <View style={styles.heroContent}>
              <View style={styles.heroTopRow}>
                <View style={styles.badgeContainer}>
                  <Ionicons name="shield-checkmark" size={12} color={PRIMARY_GOLD} />
                  <Text style={styles.badgeText}>VERIFIED STAFF</Text>
                </View>

                <View style={styles.liveClockBadge}>
                  <Ionicons name="time" size={13} color={MUTED_SLATE} />
                  <Text style={styles.liveClockText}>{timeText}</Text>
                </View>
              </View>

              <Text style={styles.greetingTitle}>Welcome back, {staffName}!</Text>
              <Text style={styles.greetingSubtitle}>
                Here is an overview of your schedule and operational tools for today.
              </Text>

              <View style={styles.heroDateRow}>
                <Ionicons name="calendar-clear-outline" size={15} color={PRIMARY_GOLD} />
                <Text style={styles.heroDateText}>{dateText}</Text>
              </View>
            </View>
          </View>

          {/* ATTENDANCE MODULE */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Daily Attendance</Text>
              <Text style={styles.sectionCaption}>Clock-in & Out</Text>
            </View>
            <StaffClockInCard />
          </View>

          {/* QUICK ACTIONS GRID */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Navigation</Text>

            <View style={styles.actionGrid}>
              <ActionCard
                icon="calendar-outline"
                title="Attendance Log"
                subtitle="View history"
                color="#0284C7"
                bgColor="#E0F2FE"
                onPress={() => router.push("/staff/attendance")}
              />

              <ActionCard
                icon="folder-open-outline"
                title="Documents"
                subtitle="Staff files"
                color="#7C3AED"
                bgColor="#F3E8FF"
                onPress={() => router.push("/staff/documents")}
              />

              <ActionCard
                icon="airplane-outline"
                title="Leave Request"
                subtitle="Apply & track"
                color="#059669"
                bgColor="#D1FAE5"
                onPress={() => router.push("/staff/leave")}
              />

              <ActionCard
                icon="person-circle-outline"
                title="My Profile"
                subtitle="Account settings"
                color={PRIMARY_GOLD}
                bgColor={PRIMARY_GOLD_LIGHT}
                onPress={() => router.push("/staff/profile")}
              />
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>CoreOne Platform</Text>
            <Text style={styles.footerText}>Secure Staff Portal • Version 2.4</Text>
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
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.pressedCard,
      ]}
    >
      <View style={[styles.actionIconBox, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.actionSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  desktopFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
    backgroundColor: BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: MUTED_SLATE,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DARK_SLATE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brand: {
    fontSize: 20,
    fontWeight: "800",
    color: DARK_SLATE,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: PRIMARY_GOLD,
  },
  schoolName: {
    fontSize: 11,
    color: MUTED_SLATE,
    fontWeight: "600",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: PRIMARY_GOLD_LIGHT,
    borderWidth: 1,
    borderColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    fontSize: 12,
    fontWeight: "800",
    color: PRIMARY_GOLD,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: DARK_SLATE,
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  heroBackgroundPattern: {
    position: "absolute",
    right: -30,
    bottom: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(217, 119, 6, 0.12)",
  },
  heroContent: {
    zIndex: 1,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(217, 119, 6, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: PRIMARY_GOLD,
    letterSpacing: 0.8,
  },
  liveClockBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  liveClockText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: WHITE,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
    marginBottom: 16,
  },
  heroDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 12,
  },
  heroDateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E2E8F0",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: DARK_SLATE,
    marginBottom: 10,
  },
  sectionCaption: {
    fontSize: 11,
    color: MUTED_SLATE,
    fontWeight: "600",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionCard: {
    width: "48.5%",
    backgroundColor: WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  actionTextContainer: {
    flex: 1,
    marginRight: 4,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: DARK_SLATE,
  },
  actionSubtitle: {
    fontSize: 10,
    color: MUTED_SLATE,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingTop: 10,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: "700",
    color: MUTED_SLATE,
  },
  footerText: {
    marginTop: 3,
    fontSize: 10,
    color: "#94A3B8",
  },
  pressed: {
    opacity: 0.7,
  },
  pressedCard: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});