import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

type SchoolBranding = {
  logo_url?: string | null;
  app_icon_url?: string | null;
  splash_image_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  motto?: string | null;
  login_title?: string | null;
  login_message?: string | null;
};

type School = {
  id: number;
  name: string;
  school_code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  logo?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  branding?: SchoolBranding | null;
};

type ParentStudent = {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  gender: string;
  date_of_birth?: string | null;
  passport?: string | null;
  classroom_id?: number | null;
  class_name?: string | null;
  relationship_type: string;
  school: School;
};

type ParentMe = {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  students: ParentStudent[];
};

const { width: screenWidth } = Dimensions.get("window");
const isDesktopWeb = Platform.OS === "web" && screenWidth >= 900;
const desktopMaxWidth = Math.min(Math.max(screenWidth - 48, 320), 1200);

function normalizeImageUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("file://")) {
    return value;
  }
  const base = process.env.EXPO_PUBLIC_API_URL || "https://coreone.onrender.com";
  return value.startsWith("/") ? `${base}${value}` : `${base}/${value}`;
}

function getSchoolBranding(school?: School) {
  return {
    primary: school?.branding?.primary_color || school?.primary_color || "#2563EB",
    secondary: school?.branding?.secondary_color || school?.secondary_color || "#0F172A",
    accent: school?.branding?.accent_color || "#F43F5E",
    logo: school?.branding?.logo_url || school?.logo || undefined,
    motto: school?.branding?.motto || undefined,
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const [parent, setParent] = useState<ParentMe | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const selectedStudent = useMemo(
    () =>
      parent?.students?.find((student) => student.id === selectedStudentId) ||
      parent?.students?.[0] ||
      null,
    [parent, selectedStudentId]
  );

  const schoolBranding = getSchoolBranding(selectedStudent?.school);

  async function loadParentDashboard(showSpinner = true) {
    try {
      if (showSpinner) setLoading(true);
      const response = await api.get<ParentMe>("/parents/me");
      const data = response.data;
      setParent(data);

      const firstStudent = data?.students?.[0];
      if (firstStudent && selectedStudentId === null) {
        setSelectedStudentId(firstStudent.id);
      }
    } catch (error: any) {
      console.log("PARENT DASHBOARD ERROR:", error?.response?.data || error?.message);
      Alert.alert("Unable to load dashboard", "We could not load your children right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParentDashboard();
  }, []);

  const loadUnreadNotificationCount = useCallback(async () => {
    try {
      const response = await api.get("/notifications");
      const items = response.data || [];

      setUnreadNotificationCount(
        items.filter((notification: any) => !notification.is_read).length
      );
    } catch (error: any) {
      console.log(
        "PARENT NOTIFICATION COUNT ERROR:",
        error?.response?.data || error?.message
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnreadNotificationCount();
    }, [loadUnreadNotificationCount])
  );

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await Promise.all([
        loadParentDashboard(false),
        loadUnreadNotificationCount(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Fetching profile...</Text>
      </View>
    );
  }

  const parentName = parent ? `${parent.first_name} ${parent.last_name}`.trim() : "Parent";
  const students = parent?.students || [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopScrollContent,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.content,
            isDesktopWeb && {
              maxWidth: desktopMaxWidth,
              alignSelf: "center",
              width: "100%",
            },
          ]}
        >
          {/* ================= HERO HEADER ================= */}
          <View style={[styles.heroHeader, { backgroundColor: schoolBranding.secondary }]}>
            <View style={styles.heroTopRow}>
              <View style={styles.brandBadge}>
                {schoolBranding.logo ? (
                  <Image
                    source={{ uri: normalizeImageUrl(schoolBranding.logo) }}
                    style={styles.schoolLogo}
                  />
                ) : (
                  <Ionicons name="school" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.heroSchoolName} numberOfLines={1}>
                  {selectedStudent?.school?.name || "CoreOne School"}
                </Text>
              </View>

              <View style={styles.heroActions}>
                <Pressable
                  onPress={() => router.push("/parent/notifications")}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.pressedState,
                  ]}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  {unreadNotificationCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {unreadNotificationCount > 99
                          ? "99+"
                          : unreadNotificationCount}
                      </Text>
                    </View>
                  )}
                </Pressable>

                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && styles.pressedState,
                  ]}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.heroMain}>
              <Text style={styles.greetingText}>
                {getGreeting()}, {parentName}
              </Text>
              <Text style={styles.heroSubText}>
                {schoolBranding.motto || "Track your children's educational journey."}
              </Text>
            </View>
          </View>

          {/* ================= CHILDREN SELECTION ================= */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Linked Students</Text>
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{students.length}</Text>
            </View>
          </View>

          {students.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Children Linked</Text>
              <Text style={styles.emptyText}>
                Please reach out to your school administrator to link your account.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childrenHorizontalList}
            >
              {students.map((student) => {
                const active = selectedStudent?.id === student.id;
                const studentBranding = getSchoolBranding(student.school);
                const initials = `${student.first_name?.[0] || ""}${
                  student.last_name?.[0] || ""
                }`.toUpperCase();

                return (
                  <Pressable
                    key={student.id}
                    onPress={() => setSelectedStudentId(student.id)}
                    style={({ pressed }) => [
                      styles.childPillCard,
                      active && {
                        borderColor: studentBranding.primary,
                        backgroundColor: "#FFFFFF",
                        shadowColor: studentBranding.primary,
                        shadowOpacity: 0.15,
                        shadowRadius: 10,
                        elevation: 4,
                      },
                      pressed && styles.pressedState,
                    ]}
                  >
                    <View
                      style={[
                        styles.avatarRing,
                        { borderColor: active ? studentBranding.primary : "#E2E8F0" },
                      ]}
                    >
                      {student.passport ? (
                        <Image
                          source={{ uri: normalizeImageUrl(student.passport) }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatarFallback,
                            { backgroundColor: studentBranding.primary },
                          ]}
                        >
                          <Text style={styles.avatarText}>{initials || "ST"}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.childPillInfo}>
                      <Text style={styles.childPillName} numberOfLines={1}>
                        {student.first_name} {student.last_name}
                      </Text>
                      <Text style={styles.childPillMeta}>{student.admission_number}</Text>
                    </View>

                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={studentBranding.primary}
                        style={styles.activeCheck}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* ================= STUDENT OVERVIEW CARD ================= */}
          {selectedStudent && (
            <>
              <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                  <View
                    style={[
                      styles.profileAvatarContainer,
                      { borderColor: schoolBranding.primary },
                    ]}
                  >
                    {selectedStudent.passport ? (
                      <Image
                        source={{ uri: normalizeImageUrl(selectedStudent.passport) }}
                        style={styles.profileAvatarImage}
                      />
                    ) : (
                      <Ionicons name="person" size={32} color={schoolBranding.primary} />
                    )}
                  </View>

                  <View style={styles.profileBody}>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {selectedStudent.relationship_type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </Text>
                    <Text style={styles.profileSchool}>{selectedStudent.school.name}</Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/parent/child",
                        params: { studentId: String(selectedStudent.id) },
                      })
                    }
                    style={styles.viewDetailButton}
                  >
                    <Ionicons name="chevron-forward" size={18} color="#64748B" />
                  </Pressable>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailGrid}>
                  <View style={styles.detailCard}>
                    <Ionicons name="card-outline" size={16} color="#64748B" />
                    <View style={styles.detailTextGroup}>
                      <Text style={styles.detailLabel}>Admission No.</Text>
                      <Text style={styles.detailValue}>{selectedStudent.admission_number}</Text>
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <Ionicons name="easel-outline" size={16} color="#64748B" />
                    <View style={styles.detailTextGroup}>
                      <Text style={styles.detailLabel}>Class Enrolled</Text>
                      <Text style={styles.detailValue}>
                        {selectedStudent.class_name ||
                        (selectedStudent.classroom_id
                          ? `Class #${selectedStudent.classroom_id}`
                          : "Unassigned")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ================= SERVICES GRID ================= */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Academic Services</Text>
              </View>

              <View style={styles.serviceGrid}>
                <ServiceTile
                  icon="analytics-outline"
                  title="Results"
                  subtitle="Grade reports"
                  color={schoolBranding.primary}
                  onPress={() =>
                    router.push({
                      pathname: "/student/results",
params: {
  studentId: String(selectedStudent.id),
  viewer: "parent",
},
                    })
                  }
                />
                <ServiceTile
                  icon="calendar-outline"
                  title="Attendance"
                  subtitle="Daily tracking"
                  color="#10B981"
                  onPress={() =>
                    router.push({
                      pathname: "/parent/attendance",
                      params: { studentId: String(selectedStudent.id) },
                    })
                  }
                />
                <ServiceTile
                  icon="book-outline"
                  title="Learning"
                  subtitle="Curriculum & tasks"
                  color="#6366F1"
                />
                <ServiceTile
                  icon="notifications-outline"
                  title="Notices"
                  subtitle={
                    unreadNotificationCount > 0
                      ? `${unreadNotificationCount} unread`
                      : "School updates"
                  }
                  color="#8B5CF6"
                  onPress={() => router.push("/parent/notifications")}
                />
                <ServiceTile
                  icon="time-outline"
                  title="Schedule"
                  subtitle="Timetable & events"
                  color="#F59E0B"
                />
                <ServiceTile
                  icon="person-outline"
                  title="Profile"
                  subtitle="Bio & details"
                  color="#64748B"
                />
              </View>
            </>
          )}

          {/* ================= FOOTER ================= */}
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>CoreOne Parent Experience</Text>
            <Text style={styles.footerSubText}>
              Empowering parents through real-time communication.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ServiceTile({
  icon,
  title,
  subtitle,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.serviceTile, pressed && styles.pressedState]}
    >
      <View style={[styles.serviceIconContainer, { backgroundColor: `${color}12` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.serviceTitle}>{title}</Text>
      <Text style={styles.serviceSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  desktopScrollContent: {
    minHeight: "100%",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  heroHeader: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  schoolLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  heroSchoolName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
  heroMain: {
    marginTop: 20,
  },
  greetingText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroSubText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  badgeCount: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeCountText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  childrenHorizontalList: {
    gap: 12,
    paddingBottom: 8,
    marginBottom: 12,
  },
  childPillCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 10,
    minWidth: 180,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    padding: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  childPillInfo: {
    marginLeft: 10,
    flex: 1,
  },
  childPillName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  childPillMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  activeCheck: {
    marginLeft: 6,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  profileAvatarImage: {
    width: "100%",
    height: "100%",
  },
  profileBody: {
    flex: 1,
    marginLeft: 12,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  profileSchool: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  viewDetailButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },
  detailGrid: {
    flexDirection: "row",
    gap: 12,
  },
  detailCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  detailTextGroup: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
  },
  detailValue: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "700",
    marginTop: 1,
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  serviceTile: {
    width: "31%",
    minWidth: 100,
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  serviceSubtitle: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
  },
  pressedState: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  footerSubText: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
  },
});
