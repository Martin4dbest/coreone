import React from "react";
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

  const staffName =
    user?.email?.split("@")[0] || "Staff Member";

  const primaryColor =
    (tenant as any)?.school_branding?.primary_color ||
    (tenant as any)?.branding?.primary_color ||
    (tenant as any)?.primary_color ||
    "#F43F5E";

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
        {/* HEADER */}
        <View
          style={[
            styles.header,
            isWeb && styles.webHeader,
            { borderTopColor: primaryColor },
          ]}
        >
          <View style={styles.headerTop}>
            <View style={styles.schoolBlock}>
              <Text style={styles.schoolName} numberOfLines={2}>
                {tenant?.name || "School"}
              </Text>

              <Text style={styles.subtitle}>
                Staff Portal
              </Text>
            </View>

            <View
              style={[
                styles.staffBadge,
                { backgroundColor: `${primaryColor}18` },
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
                STAFF
              </Text>
            </View>
          </View>

          <View style={styles.welcomeArea}>
            <Text style={styles.title}>
              Welcome back
            </Text>

            <Text style={styles.staffName}>
              {staffName}
            </Text>

            <Text style={styles.welcomeText}>
              Manage your staff activities and access your
              school resources.
            </Text>
          </View>
        </View>

        {/* QUICK ACCESS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Quick Access
            </Text>

            <Text style={styles.sectionDescription}>
              Everything you need in one place
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <DashboardCard
            title="My Profile"
            description="View and manage your staff information"
            icon="👤"
            primaryColor={primaryColor}
            onPress={() => open("/staff/profile")}
          />

          <DashboardCard
            title="Attendance"
            description="View your attendance records"
            icon="📅"
            primaryColor={primaryColor}
            onPress={() => open("/staff/attendance")}
          />

          <DashboardCard
            title="Leave"
            description="Submit and manage leave requests"
            icon="📝"
            primaryColor={primaryColor}
            onPress={() => open("/staff/leave")}
          />

          <DashboardCard
            title="Documents"
            description="Access your staff documents"
            icon="📁"
            primaryColor={primaryColor}
            onPress={() => open("/staff/documents")}
          />
        </View>

        {/* LOGOUT */}
        <View style={styles.logoutArea}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            <Text style={styles.logoutIcon}>↪</Text>
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          CoreOne • Staff Portal
        </Text>
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
      activeOpacity={0.82}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${primaryColor}15` },
        ]}
      >
        <Text style={styles.icon}>
          {icon}
        </Text>
      </View>

      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text style={styles.cardDescription}>
        {description}
      </Text>

      <View style={styles.cardFooter}>
        <Text
          style={[
            styles.openText,
            { color: primaryColor },
          ]}
        >
          Open
        </Text>

        <Text
          style={[
            styles.arrow,
            { color: primaryColor },
          ]}
        >
          →
        </Text>
      </View>
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
    paddingTop: 20,
    paddingBottom: 36,
    alignItems: "center",
  },

  webContent: {
    paddingHorizontal: 24,
  },

  page: {
    width: "100%",
    maxWidth: 620,
  },

  webPage: {
    maxWidth: 760,
  },

  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderTopWidth: 4,
    padding: 20,
    marginBottom: 26,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  webHeader: {
    padding: 26,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  schoolBlock: {
    flex: 1,
    paddingRight: 8,
  },

  schoolName: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: "#334155",
  },

  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },

  staffBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    marginRight: 6,
  },

  staffBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  welcomeArea: {
    marginTop: 24,
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  staffName: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },

  welcomeText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    marginTop: 7,
    maxWidth: 520,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionDescription: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 3,
  },

  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48.2%",
    minHeight: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.045,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 1,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  icon: {
    fontSize: 22,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    marginTop: 5,
    minHeight: 36,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 13,
  },

  openText: {
    fontSize: 12,
    fontWeight: "800",
  },

  arrow: {
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 5,
  },

  logoutArea: {
    alignItems: "center",
    marginTop: 12,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
    minWidth: 105,
  },

  logoutIcon: {
    fontSize: 15,
    color: "#64748B",
    marginRight: 6,
  },

  logoutText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },

  footer: {
    textAlign: "center",
    color: "#CBD5E1",
    marginTop: 20,
    fontSize: 11,
  },
});
