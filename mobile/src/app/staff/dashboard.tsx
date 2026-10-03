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

const COREONE_GOLD = "#C58A00";
const COREONE_GOLD_DARK = "#A86F00";
const COREONE_DARK = "#0F172A";
const COREONE_SLATE = "#64748B";
const BACKGROUND = "#F5F7FA";
const WHITE = "#FFFFFF";
const BORDER = "#E7EBF0";
const SOFT_GOLD = "#FFF7E0";
const SOFT_SLATE = "#F1F5F9";

export default function StaffDashboard() {
  const { user, tenant, logout, loading } = useAuth();

  const authUser = user as any;
  const authTenant = tenant as any;

  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /*
   * STAFF ONLY
   */
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

  /*
   * STAFF NAME
   *
   * The Staff record is the source of truth.
   * Support the common response shapes without changing
   * the backend or creating another name source.
   */
  const staffProfile = useMemo(() => {
    return (
      authUser?.staff ||
      authUser?.staff_profile ||
      authUser?.staffProfile ||
      authUser?.profile ||
      authUser
    );
  }, [authUser]);

  const staffName = useMemo(() => {
    const firstName =
      staffProfile?.first_name ||
      staffProfile?.firstName ||
      "";

    const middleName =
      staffProfile?.middle_name ||
      staffProfile?.middleName ||
      "";

    const lastName =
      staffProfile?.last_name ||
      staffProfile?.lastName ||
      "";

    const fullName = [
      firstName,
      middleName,
      lastName,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(" ");

    return fullName || "Staff Member";
  }, [staffProfile]);

  const initials = useMemo(() => {
    const parts = staffName
      .split(" ")
      .map((part) => part.trim())
      .filter(Boolean);

    if (!parts.length) return "S";

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [staffName]);

  const schoolName =
    authTenant?.school_name ||
    authTenant?.name ||
    authUser?.school_name ||
    "Your School";

  const dateText = now.toLocaleDateString("en-NG", {
    weekday: "long",
    day: "2-digit",
    month: "long",
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
        <ActivityIndicator size="large" color={COREONE_GOLD} />

        <Text style={styles.loadingText}>
          Loading your workspace...
        </Text>
      </SafeAreaView>
    );
  }

  const rawRole = authUser?.role;

  const role =
    typeof rawRole === "string"
      ? rawRole
      : rawRole?.name || rawRole?.role || "";

  if (role !== "STAFF") {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator
          size="small"
          color={COREONE_GOLD}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={BACKGROUND}
      />

      <View style={styles.page}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            isWide && styles.contentWide,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* TOP BAR */}
          <View
            style={[
              styles.topBar,
              isWide && styles.topBarWide,
            ]}
          >
            <View style={styles.brandBlock}>
              <Text style={styles.brand}>
                Core<Text style={styles.brandAccent}>One</Text>
              </Text>

              <View style={styles.schoolRow}>
                <View style={styles.schoolDot} />

                <Text
                  style={styles.schoolName}
                  numberOfLines={1}
                >
                  {schoolName}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color={COREONE_DARK}
              />
            </Pressable>
          </View>

          {/* WELCOME HERO */}
          <View
            style={[
              styles.hero,
              isWide && styles.heroWide,
            ]}
          >
            <View style={styles.heroMain}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {initials}
                </Text>
              </View>

              <View style={styles.heroText}>
                <Text style={styles.eyebrow}>
                  STAFF WORKSPACE
                </Text>

                <Text
                  style={styles.greeting}
                  numberOfLines={2}
                >
                  Welcome, {staffName}
                </Text>

                <Text style={styles.heroSubtitle}>
                  Here’s your workspace for today.
                </Text>
              </View>
            </View>

            <View style={styles.heroDate}>
              <View style={styles.dateIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={COREONE_GOLD}
                />
              </View>

              <View>
                <Text style={styles.dateLabel}>
                  TODAY
                </Text>

                <Text style={styles.dateText}>
                  {dateText}
                </Text>
              </View>
            </View>
          </View>

          {/* LIVE TIME */}
          <View style={styles.timeStrip}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>
                LIVE
              </Text>
            </View>

            <Text style={styles.currentTime}>
              {timeText}
            </Text>

            <Text style={styles.timeHint}>
              Current local time
            </Text>
          </View>

          {/* ATTENDANCE */}
          <View
            style={[
              styles.section,
              isWide && styles.sectionWide,
            ]}
          >
            <SectionHeading
              title="Today’s attendance"
              subtitle="Clock in and manage your attendance"
              icon="time-outline"
            />

            <View style={styles.attendanceCard}>
              <StaffClockInCard />
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View
            style={[
              styles.section,
              isWide && styles.sectionWide,
            ]}
          >
            <SectionHeading
              title="Quick actions"
              subtitle="Access your staff tools"
              icon="grid-outline"
            />

            <View
              style={[
                styles.actionGrid,
                isWide && styles.actionGridWide,
              ]}
            >
              <ActionCard
                icon="calendar-outline"
                title="Attendance"
                subtitle="View my attendance"
                onPress={() =>
                  router.push("/staff/attendance")
                }
              />

              <ActionCard
                icon="document-text-outline"
                title="Documents"
                subtitle="View staff documents"
                onPress={() =>
                  router.push("/staff/documents")
                }
              />

              <ActionCard
                icon="time-outline"
                title="Leave"
                subtitle="Manage leave requests"
                onPress={() =>
                  router.push("/staff/leave")
                }
              />

              <ActionCard
                icon="person-outline"
                title="My Profile"
                subtitle="View staff profile"
                onPress={() =>
                  router.push("/staff/profile")
                }
              />
            </View>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              CoreOne
            </Text>

            <Text style={styles.footerText}>
              School Management Platform
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SectionHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}>
        <Ionicons
          name={icon}
          size={17}
          color={COREONE_GOLD_DARK}
        />
      </View>

      <View style={styles.sectionHeadingText}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text style={styles.sectionSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionPressed,
      ]}
    >
      <View style={styles.actionTop}>
        <View style={styles.actionIcon}>
          <Ionicons
            name={icon}
            size={21}
            color={COREONE_GOLD_DARK}
          />
        </View>

        <Ionicons
          name="chevron-forward"
          size={17}
          color="#94A3B8"
        />
      </View>

      <Text style={styles.actionTitle}>
        {title}
      </Text>

      <Text style={styles.actionSubtitle}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  page: {
    flex: 1,
    width: "100%",
    backgroundColor: BACKGROUND,
  },

  scroll: {
    flex: 1,
  },

  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 40,
  },

  contentWide: {
    maxWidth: 820,
    paddingHorizontal: 28,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COREONE_SLATE,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  topBarWide: {
    marginBottom: 22,
  },

  brandBlock: {
    flex: 1,
    minWidth: 0,
  },

  brand: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: COREONE_DARK,
  },

  brandAccent: {
    color: COREONE_GOLD_DARK,
  },

  schoolRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingRight: 15,
  },

  schoolDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COREONE_GOLD,
    marginRight: 7,
  },

  schoolName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: COREONE_SLATE,
  },

  logoutButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  hero: {
    backgroundColor: WHITE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  heroWide: {
    padding: 22,
    borderRadius: 26,
  },

  heroMain: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: SOFT_GOLD,
    borderWidth: 1,
    borderColor: "#F4E3AE",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "900",
    color: COREONE_GOLD_DARK,
  },

  heroText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: COREONE_GOLD_DARK,
    marginBottom: 4,
  },

  greeting: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: COREONE_DARK,
  },

  heroSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COREONE_SLATE,
  },

  heroDate: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F6",
  },

  dateIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: SOFT_GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  dateLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#94A3B8",
    marginBottom: 2,
  },

  dateText: {
    fontSize: 12,
    fontWeight: "700",
    color: COREONE_DARK,
  },

  timeStrip: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#FFFDF7",
    borderWidth: 1,
    borderColor: "#F1E6C7",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    marginRight: 6,
  },

  liveText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#15803D",
  },

  currentTime: {
    marginLeft: 12,
    fontSize: 13,
    fontWeight: "900",
    color: COREONE_DARK,
  },

  timeHint: {
    marginLeft: "auto",
    fontSize: 10,
    color: "#94A3B8",
  },

  section: {
    marginBottom: 26,
  },

  sectionWide: {
    marginBottom: 30,
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: SOFT_GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  sectionHeadingText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COREONE_DARK,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: COREONE_SLATE,
  },

  attendanceCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  actionGridWide: {
    justifyContent: "flex-start",
    gap: 12,
  },

  actionCard: {
    width: "48.5%",
    minHeight: 128,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
  },

  actionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: SOFT_GOLD,
    alignItems: "center",
    justifyContent: "center",
  },

  actionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COREONE_DARK,
  },

  actionSubtitle: {
    marginTop: 4,
    fontSize: 10.5,
    lineHeight: 15,
    color: COREONE_SLATE,
  },

  actionPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.985 }],
  },

  pressed: {
    opacity: 0.7,
  },

  footer: {
    alignItems: "center",
    paddingTop: 5,
    paddingBottom: 8,
  },

  footerBrand: {
    fontSize: 13,
    fontWeight: "900",
    color: COREONE_GOLD_DARK,
  },

  footerText: {
    marginTop: 3,
    fontSize: 10,
    color: "#94A3B8",
  },
});

