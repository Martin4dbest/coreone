import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function StaffDashboard() {
  const { user, tenant, logout } = useAuth();

  const staffName =
    user?.email?.split("@")[0] || "Staff Member";

  const open = (path: string) => {
    router.push(path as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.schoolName}>
          {tenant?.name || "School"}
        </Text>

        <Text style={styles.title}>
          Staff Dashboard
        </Text>

        <Text style={styles.welcome}>
          Welcome, {staffName}
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            NON-TEACHING STAFF
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Quick Access
      </Text>

      <View style={styles.grid}>
        <DashboardCard
          title="My Profile"
          description="View your staff information"
          icon="👤"
          onPress={() => open("/staff/profile")}
        />

        <DashboardCard
          title="Attendance"
          description="View your attendance"
          icon="📅"
          onPress={() => open("/staff/attendance")}
        />

        <DashboardCard
          title="Leave"
          description="Manage leave requests"
          icon="📝"
          onPress={() => open("/staff/leave")}
        />

        <DashboardCard
          title="Documents"
          description="Access staff documents"
          icon="📁"
          onPress={() => open("/staff/documents")}
        />
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        <Text style={styles.logoutText}>
          Logout
        </Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        CoreOne
      </Text>
    </ScrollView>
  );
}

function DashboardCard({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{icon}</Text>

      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text style={styles.cardDescription}>
        {description}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
    marginBottom: 24,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 6,
  },
  welcome: {
    fontSize: 15,
    color: "#475569",
    marginTop: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E2E8F0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    minHeight: 150,
  },
  icon: {
    fontSize: 28,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    marginTop: 6,
  },
  logoutButton: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 24,
    fontSize: 12,
  },
});
