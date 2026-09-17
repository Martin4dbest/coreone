import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";

export default function StaffDashboard() {
  const { user, tenant, logout } = useAuth();

  const staffName = user?.email?.split("@")[0] || "Staff Member";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcome}>Welcome back</Text>

              <Text style={styles.name}>
                {staffName}
              </Text>

              <Text style={styles.school}>
                {tenant?.name || "School"}
              </Text>
            </View>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color="#B91C1C"
              />
            </Pressable>
          </View>

          {/* Staff Identity Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons
                name="person-outline"
                size={28}
                color="#B91C1C"
              />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileTitle}>
                Staff Portal
              </Text>

              <Text style={styles.profileEmail}>
                {user?.email || "Staff account"}
              </Text>

              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  STAFF
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Access */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Quick Access
            </Text>

            <Text style={styles.sectionSubtitle}>
              Staff services and workplace tools
            </Text>
          </View>

          <View style={styles.grid}>
            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.iconBox}>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color="#B91C1C"
                />
              </View>

              <Text style={styles.actionTitle}>
                Attendance
              </Text>

              <Text style={styles.actionDescription}>
                View and manage your attendance
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.iconBox}>
                <Ionicons
                  name="time-outline"
                  size={24}
                  color="#B91C1C"
                />
              </View>

              <Text style={styles.actionTitle}>
                Leave
              </Text>

              <Text style={styles.actionDescription}>
                Manage leave requests
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.iconBox}>
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color="#B91C1C"
                />
              </View>

              <Text style={styles.actionTitle}>
                Documents
              </Text>

              <Text style={styles.actionDescription}>
                Access your staff documents
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.iconBox}>
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color="#B91C1C"
                />
              </View>

              <Text style={styles.actionTitle}>
                My Profile
              </Text>

              <Text style={styles.actionDescription}>
                View your staff information
              </Text>
            </Pressable>
          </View>

          {/* Coming Soon */}
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#64748B"
            />

            <Text style={styles.noticeText}>
              More staff services will be added to your
              portal as they become available.
            </Text>
          </View>

          <Text style={styles.footer}>
            Powered by CoreOne Technologies
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  safeArea: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  welcome: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },

  name: {
    fontSize: 25,
    color: "#0F172A",
    fontWeight: "800",
    marginTop: 3,
    textTransform: "capitalize",
  },

  school: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 30,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  profileInfo: {
    flex: 1,
  },

  profileTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  profileEmail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },

  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 8,
  },

  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B91C1C",
    letterSpacing: 0.5,
  },

  sectionHeader: {
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },

  actionCard: {
    width: "48%",
    minHeight: 155,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  actionDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: "#64748B",
    marginTop: 5,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 24,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
  },

  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
  },

  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 30,
  },

  pressed: {
    opacity: 0.75,
  },
});
