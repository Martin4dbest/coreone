import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
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

function formatCurrentDateTime() {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return { dayName, dateStr };
}

export default function ParentDashboard() {
  const { logout } = useAuth();
  const [parent, setParent] = useState<ParentMe | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [dateTimeInfo, setDateTimeInfo] = useState(formatCurrentDateTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTimeInfo(formatCurrentDateTime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const selectedStudent = useMemo(
    () =>
      parent?.students?.find((student) => student.id === selectedStudentId) ||
      parent?.students?.[0] ||
      null,
    [parent, selectedStudentId]
  );

  const schoolBranding = getSchoolBranding(selectedStudent?.school);

  const openStudentProfile = useCallback((studentId: number) => {
    router.push({
      pathname: "/parent/child",
      params: { studentId: String(studentId) },
    });
  }, []);

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
  const relationshipRole = selectedStudent?.relationship_type 
    ? selectedStudent.relationship_type.charAt(0).toUpperCase() + selectedStudent.relationship_type.slice(1).toLowerCase() 
    : "Parent";
    
  const students = parent?.students || [];

  return (
    <SafeAreaView style={styles.safeArea}>
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
                    <Ionicons name="school" size={18} color="#FFFFFF" />
                  )}
                  <View style={styles.brandTitleColumn}>
                    <Text style={styles.heroSchoolName} numberOfLines={1}>
                      {selectedStudent?.school?.name || "CoreOne School"}
                    </Text>
                    {schoolBranding.motto ? (
                      <Text style={styles.heroMotto} numberOfLines={1}>
                        {schoolBranding.motto}
                      </Text>
                    ) : null}
                  </View>
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
                      size={18}
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
                      size={18}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.heroMain}>
                <View style={styles.heroMetaRow}>
                  <View style={styles.datePill}>
                    <Ionicons name="calendar-outline" size={12} color="#FBBF24" />
                    <Text style={styles.datePillText}>
                      {dateTimeInfo.dayName}, {dateTimeInfo.dateStr}
                    </Text>
                  </View>
                </View>

                <Text style={styles.greetingText}>
                  {getGreeting()},{" "}
                  <Text style={styles.parentNameHighlight}>{parentName}</Text>{" "}
                  <Text style={styles.roleHighlight}>({relationshipRole})</Text>
                </Text>
              </View>
            </View>

            {/* ================= CHILDREN SELECTION ================= */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Student Dashboard</Text>
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
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
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
                <Pressable
                  onPress={() => openStudentProfile(selectedStudent.id)}
                  style={({ pressed }) => [
                    styles.profileCard,
                    pressed && styles.pressedState,
                  ]}
                >
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
                        <Ionicons name="person" size={28} color={schoolBranding.primary} />
                      )}
                    </View>

                    <View style={styles.profileBody}>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>ACTIVE STUDENT</Text>
                      </View>
                      <Text style={styles.profileName} numberOfLines={1}>
                        {selectedStudent.first_name} {selectedStudent.last_name}
                      </Text>
                      <Text style={styles.profileSchool}>{selectedStudent.school.name}</Text>
                    </View>

                    <View style={styles.viewDetailButton}>
                      <Ionicons name="chevron-forward" size={16} color="#64748B" />
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailGrid}>
                    <View style={styles.detailCard}>
                      <View style={styles.detailIconCircle}>
                        <Ionicons name="card-outline" size={14} color="#3B82F6" />
                      </View>
                      <View style={styles.detailTextGroup}>
                        <Text style={styles.detailLabel}>Admission No.</Text>
                        <Text style={styles.detailValue}>{selectedStudent.admission_number}</Text>
                      </View>
                    </View>

                    <View style={styles.detailCard}>
                      <View style={styles.detailIconCircle}>
                        <Ionicons name="easel-outline" size={14} color="#10B981" />
                      </View>
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
                </Pressable>

                {/* ================= SERVICES GRID ================= */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Academic Services</Text>
                </View>

                <View style={styles.serviceGrid}>
                  <ServiceTile
                    icon="analytics-outline"
                    title="Results"
                    subtitle="Grade reports"
                    color="#2563EB"
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
                    color="#059669"
                    onPress={() =>
                      router.push({
                        pathname: "/parent/attendance",
                        params: { studentId: String(selectedStudent.id) },
                      })
                    }
                  />
                  <ServiceTile
                    icon="wallet-outline"
                    title="School Fees"
                    subtitle="Fees & payments"
                    color="#0D9488"
                    onPress={() =>
                      router.push({
                        pathname: "/parent/fees",
                        params: { studentId: String(selectedStudent.id) },
                      })
                    }
                  />

                  <ServiceTile
                    icon="library-outline"
                    title="Books"
                    subtitle="Issued books"
                    color="#4F46E5"
                    onPress={() =>
                      router.push({
                        pathname: "/parent/books",
                        params: {
                          studentId: String(selectedStudent.id),
                        },
                      })
                    }
                  />

                  <ServiceTile
                    icon="pulse-outline"
                    title="Activity"
                    subtitle="Learning progress"
                    color="#E11D48"
                    onPress={() =>
                      router.push({
                        pathname: "/parent/activity",
                        params: {
                          studentId: String(selectedStudent.id),
                        },
                      })
                    }
                  />

                    <ServiceTile
                      icon="trending-up-outline"
                      title="Engagement"
                      subtitle="Learning performance"
                      color="#7C3AED"
                      onPress={() =>
                        router.push({
                          pathname: "/parent/engagement",
                          params: { studentId: String(selectedStudent.id) },
                        })
                      }
                    />

                  <ServiceTile
                    icon="notifications-outline"
                    title="Notices"
                    subtitle={
                      unreadNotificationCount > 0
                        ? `${unreadNotificationCount} unread`
                        : "School updates"
                    }
                    color="#0284C7"
                    onPress={() => router.push("/parent/notifications")}
                  />

                  <ServiceTile
                    icon="time-outline"
                    title="Schedule"
                    subtitle="Timetable & events"
                    color="#D97706"
                    onPress={() => router.push("/parent/timetable")}
                  />

                  <ServiceTile
                    icon="person-outline"
                    title="Profile"
                    subtitle="Bio & details"
                    color="#475569"
                    onPress={() => openStudentProfile(selectedStudent.id)}
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
    </SafeAreaView>
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
      style={({ pressed }) => [
        styles.serviceTile,
        { backgroundColor: `${color}0F` },
        pressed && styles.pressedState,
      ]}
    >
      <View style={styles.serviceTileTop}>
        <View style={[styles.serviceIconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
        <Ionicons name="arrow-forward-circle-outline" size={18} color={color} />
      </View>
      <View style={styles.serviceTileBottom}>
        <Text style={styles.serviceTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.serviceSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  desktopScrollContent: {
    minHeight: "100%",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 32 : 16,
    maxWidth: 480,
    alignSelf: "center",
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  heroHeader: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
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
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    flex: 1,
    marginRight: 10,
  },
  schoolLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
  },
  brandTitleColumn: {
    flex: 1,
  },
  heroSchoolName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  heroMotto: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 10,
    marginTop: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },
  heroMain: {
    marginTop: 16,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  datePillText: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "600",
  },
  greetingText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  parentNameHighlight: {
    color: "#FBBF24",
    fontWeight: "800",
  },
  roleHighlight: {
    color: "#34D399",
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  badgeCount: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCountText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },
  childrenHorizontalList: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 18,
  },
  childPillCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 8,
    paddingRight: 14,
    minWidth: 165,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    padding: 1,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  childPillInfo: {
    marginLeft: 10,
    flex: 1,
  },
  childPillName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  childPillMeta: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
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
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#2563EB",
  },
  profileName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  profileSchool: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  viewDetailButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
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
    gap: 10,
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
  detailIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  detailTextGroup: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "700",
  },
  detailValue: {
    fontSize: 11,
    color: "#0F172A",
    fontWeight: "700",
    marginTop: 1,
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  serviceTile: {
    width: "48%",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceTileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceTileBottom: {
    justifyContent: "center",
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  serviceSubtitle: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  pressedState: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 14,
  },
  footerTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  footerSubText: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 2,
  },
});