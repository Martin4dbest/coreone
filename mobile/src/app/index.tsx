import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function StaffDashboard() {
  const { user, tenant, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [now, setNow] = useState(new Date());

  // Real-time clock tick every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const formattedDate = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const rawStaffName = user?.email?.split("@")[0] || "Staff Member";
  const staffName =
    rawStaffName.charAt(0).toUpperCase() + rawStaffName.slice(1);
  const initials = staffName.slice(0, 2).toUpperCase();

  // Dynamic School Branded Primary Color with fallback
  const primaryColor =
    (tenant as any)?.school_branding?.primary_color ||
    (tenant as any)?.branding?.primary_color ||
    (tenant as any)?.primary_color ||
    "#4F46E5";

  const open = (path: string) => {
    router.push(path as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        isWeb && styles.webContent,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.page, isWeb && styles.webPage]}>
        {/* HEADER BAR */}
        <View style={styles.topHeaderBar}>
          <View style={styles.schoolBlock}>
            <Text style={styles.schoolName} numberOfLines={1}>
              {tenant?.name || "Educational Portal"}
            </Text>
            <Text style={styles.subtitle}>Staff Dashboard</Text>
          </View>

          <View
            style={[
              styles.staffBadge,
              { backgroundColor: `${primaryColor}15` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: primaryColor },
              ]}
            />
            <Text
              style={[
                styles.staffBadgeText,
                { color: primaryColor },
              ]}
            >
              ACTIVE
            </Text>
          </View>
        </View>

        {/* HERO CARD (Uses Brand Primary Color) */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: primaryColor },
          ]}
        >
          {/* Decorative Background Accents */}
          <View style={styles.heroBackgroundCircle} />
          <View style={styles.heroBackgroundCircleSmall} />

          <View style={styles.heroHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            {/* REAL-TIME CLOCK CHIP */}
            <View style={styles.dateTimeBadge}>
              <Text style={styles.clockIcon}>🕒</Text>
              <View>
                <Text style={styles.timeText}>{formattedTime}</Text>
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.welcomeArea}>
            <Text style={styles.welcomeSubhead}>Welcome back,</Text>
            <Text style={styles.staffName}>{staffName}</Text>
            <Text style={styles.welcomeText}>
              Ready to manage your workspace? Here is your daily summary and
              quick actions.
            </Text>
          </View>
        </View>

        {/* QUICK ACCESS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <Text style={styles.sectionDescription}>
            Essential actions and staff services
          </Text>
        </View>

        <View style={styles.grid}>
          <DashboardCard
            title="My Profile"
            description="Manage your personal and staff details"
            icon="👤"
            primaryColor={primaryColor}
            onPress={() => open("/staff/profile")}
          />

          <DashboardCard
            title="Attendance"
            description="View logs and work schedules"
            icon="📅"
            primaryColor={primaryColor}
            onPress={() => open("/staff/attendance")}
          />

          <DashboardCard
            title="Leave"
            description="Request and track leave history"
            icon="📝"
            primaryColor={primaryColor}
            onPress={() => open("/staff/leave")}
          />

          <DashboardCard
            title="Documents"
            description="Access resources and forms"
            icon="📁"
            primaryColor={primaryColor}
            onPress={() => open("/staff/documents")}
          />
        </View>

        {/* LOGOUT BUTTON */}
        <View style={styles.logoutArea}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            <Text style={styles.logoutIcon}>⎋</Text>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>CoreOne • Staff Workspace</Text>
      </View>
    </ScrollView>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  primaryColor,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  primaryColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${primaryColor}15` },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View
          style={[
            styles.arrowCircle,
            { backgroundColor: `${primaryColor}12` },
          ]}
        >
          <Text style={[styles.arrow, { color: primaryColor }]}>↗</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: "center",
  },

  webContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  page: {
    width: "100%",
    maxWidth: 520,
  },

  webPage: {
    maxWidth: 720,
  },

  topHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  schoolBlock: {
    flex: 1,
    paddingRight: 12,
  },

  schoolName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },

  staffBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  staffBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  heroBackgroundCircle: {
    position: "absolute",
    right: -30,
    bottom: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  heroBackgroundCircleSmall: {
    position: "absolute",
    left: -20,
    top: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },

  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  dateTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },

  clockIcon: {
    fontSize: 14,
    marginRight: 8,
  },

  timeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  dateText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10,
    fontWeight: "600",
  },

  welcomeArea: {
    marginTop: 20,
  },

  welcomeSubhead: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
  },

  staffName: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    marginTop: 2,
    letterSpacing: -0.4,
  },

  welcomeText: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255, 255, 255, 0.88)",
    marginTop: 6,
  },

  sectionHeader: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },

  sectionDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    justifyContent: "space-between",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  icon: {
    fontSize: 20,
  },

  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  arrow: {
    fontSize: 14,
    fontWeight: "800",
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },

  cardDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: "#64748B",
    marginTop: 4,
  },

  logoutArea: {
    alignItems: "center",
    marginTop: 16,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    width: "100%",
    shadowColor: "#0F172A",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },

  logoutIcon: {
    fontSize: 16,
    color: "#EF4444",
    marginRight: 8,
    fontWeight: "800",
  },

  logoutText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "700",
  },

  footer: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 24,
    fontSize: 11,
    fontWeight: "500",
  },
});