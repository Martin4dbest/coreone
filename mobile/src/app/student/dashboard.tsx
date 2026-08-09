// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

import { useAuth } from "../../context/AuthContext";
import {
  StudentInfo,
  AcademicOverviewData,
  TimetableClass,
  Announcement,
} from "../../types/student";

const { width } = Dimensions.get("window");

// DYNAMIC API BASE URL RESOLUTION
const API_BASE_URL = api.defaults?.baseURL || "http://10.196.122.196:8000";

const getOriginHost = (baseUrl: string): string => {
  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return baseUrl.replace(/\/api\/v\d+.*$/i, "").replace(/\/+$/, "");
  }
};

const ORIGIN_HOST = getOriginHost(API_BASE_URL);

const normalizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== "string") return null;

  let cleanedUrl = url
    .replace(/^https?:\/\/localhost:8000\/?/, "/")
    .replace(/^https?:\/\/127\.0\.0\.1:8000\/?/, "/");

  if (
    cleanedUrl.startsWith("http://") ||
    cleanedUrl.startsWith("https://") ||
    cleanedUrl.startsWith("data:")
  ) {
    return cleanedUrl;
  }

  if (!cleanedUrl.startsWith("/")) {
    cleanedUrl = `/${cleanedUrl}`;
  }

  return `${ORIGIN_HOST}${cleanedUrl}`;
};

// KNOWN BRAND PRESETS
const KNOWN_SCHOOL_BRANDS: Record<
  string,
  { primary: string; secondary: string; accent: string; fallbackLogoUrl?: string }
> = {
  "": {
    primary: "#1E293B",
    secondary: "#0F172A",
    accent: "#D4AF37",
    fallbackLogoUrl: `${ORIGIN_HOST}/media/school_logo.png`,
  },
  DEFAULT: {
    primary: "#1E293B",
    secondary: "#0F172A",
    accent: "#D4AF37",
  },
};

export default function StudentDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;

  // State
  const [studentDetails, setStudentDetails] = useState<StudentInfo | null>(null);
  const [tenantInfo, setTenantInfo] = useState<{
    name: string;
    code: string;
    logo: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  } | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<TimetableClass[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [logoError, setLogoError] = useState(false);

  // Fetch student dashboard data
  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get("/mobile/student/dashboard");

      setLogoError(false);

      const tenant = data?.tenant || user?.tenant || data?.student?.tenant || {};
      const rawSchoolName = (
        data?.student?.school_name ||
        tenant?.name ||
        user?.tenant?.name ||
        ""
      ).trim();

      const schoolCode =
        tenant?.school_code ||
        tenant?.code ||
        data?.student?.school_code ||
        user?.tenant?.school_code ||
        "";

      const schoolNameUpper = rawSchoolName.toUpperCase();
      const presetBrand =
        KNOWN_SCHOOL_BRANDS[schoolNameUpper] || KNOWN_SCHOOL_BRANDS["DEFAULT"];

      const primaryColor =
        tenant?.primary_color || tenant?.theme_color || presetBrand.primary;
      const secondaryColor = tenant?.secondary_color || presetBrand.secondary;
      const accentColor = tenant?.accent_color || presetBrand.accent;

      const rawLogoPath =
        tenant?.logo_url ||
        tenant?.logo ||
        tenant?.school_logo ||
        tenant?.brand_logo ||
        tenant?.attributes?.logo ||
        data?.student?.tenant?.logo_url ||
        data?.student?.tenant?.logo ||
        data?.student?.school_logo ||
        data?.student?.school?.logo ||
        presetBrand?.fallbackLogoUrl;

      const resolvedLogo = normalizeImageUrl(rawLogoPath);

      setTenantInfo({
        name: rawSchoolName,
        code: schoolCode,
        logo: resolvedLogo,
        primaryColor,
        secondaryColor,
        accentColor,
      });

      if (data?.student) {
        setStudentDetails({
          id: data.student.id ?? user?.id,
          first_name: data.student.first_name || "",
          last_name: data.student.last_name || "",
          school_name: rawSchoolName,
          class_level: data.student.class_level || data.student.classroom || null,
          department: data.student.department || null,
          admission_number: data.student.admission_number || null,
          email: data.student.email || user?.email || "",
          profile_image: normalizeImageUrl(data.student.profile_image),
        });
      }

      setTodaySchedule(data?.today_schedule || []);
      setAnnouncements(data?.announcements || []);
    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const student = studentDetails || {
    id: user?.id || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    school_name: user?.tenant?.name || "",
    class_level: null,
    department: null,
    admission_number: null,
    email: user?.email || "",
    profile_image: null,
  };

  const school = tenantInfo || {
    name: "",
    code: "",
    logo: null,
    primaryColor: "#1E293B",
    secondaryColor: "#0F172A",
    accentColor: "#D4AF37",
  };

  const schoolInitials = school.name
    .split(" ")
    .map((word: string) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const studentInitials = `${student.first_name?.[0] || "S"}${
    student.last_name?.[0] || ""
  }`;

  const classBadgeText = [student.class_level, student.department]
    .filter(Boolean)
    .join(" • ");

  const renderSchoolLogo = () => {
    const logoUri = tenantInfo?.logo;

    if (logoUri && !logoError) {
      return (
        <Image
          source={{ uri: logoUri }}
          style={styles.schoolLogoImage}
          contentFit="contain"
          cachePolicy="disk"
          onError={() => setLogoError(true)}
        />
      );
    }

    return (
      <View style={[styles.schoolLogoBadge, { backgroundColor: school.primaryColor }]}>
        <Text style={[styles.schoolBadgeText, { color: school.accentColor }]}>
          {schoolInitials}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* TOP HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            {renderSchoolLogo()}

            <View style={styles.brandTextContainer}>
              <Text
                style={[styles.brandName, { color: school.primaryColor }]}
                numberOfLines={1}
              >
                {school.name}
              </Text>
              <Text style={styles.brandTagline}>Student Portal</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.notificationButton,
              pressed && styles.pressedState,
            ]}
            onPress={() => router.push("/student/notifications")}
          >
            <Ionicons name="notifications-outline" size={20} color="#1E293B" />
            <View style={styles.notificationBadge} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={school.primaryColor} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={school.primaryColor}
                colors={[school.primaryColor]}
              />
            }
          >
            {/* GREETING */}
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingTitle}>
                {getGreeting()}
                {student.first_name ? `, ${student.first_name}` : ""} 👋
              </Text>
              <Text style={styles.greetingSubtitle}>
                Welcome back to your academic portal.
              </Text>
            </View>

            {/* STUDENT PROFILE CARD */}
            <LinearGradient
              colors={[school.primaryColor || "#1E293B", school.secondaryColor || "#0F172A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              <View style={styles.cardGoldAccentBorder} />

              <View style={styles.profileHeader}>
                {student.profile_image ? (
                  <Image
                    source={{ uri: normalizeImageUrl(student.profile_image) }}
                    style={styles.profileAvatar}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.defaultAvatar}>
                    <Text style={styles.avatarText}>{studentInitials}</Text>
                  </View>
                )}

                <View style={styles.profileMainInfo}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {student.first_name} {student.last_name}
                  </Text>

                  <Text style={styles.schoolNameText} numberOfLines={1}>
                    {school.name}
                  </Text>

                  {classBadgeText ? (
                    <View style={styles.badgeRow}>
                      <View style={styles.classBadge}>
                        <Text style={styles.classBadgeText}>{classBadgeText}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.profileDivider} />

              <View style={styles.profileDetailsGrid}>
                {student.admission_number && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Admission No.</Text>
                    <Text style={styles.detailValue}>{student.admission_number}</Text>
                  </View>
                )}
                {school.code ? (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>School Code</Text>
                    <View style={styles.schoolCodeBadge}>
                      <Text style={styles.schoolCodeBadgeText}>{school.code}</Text>
                    </View>
                  </View>
                ) : null}
                {student.email && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Email Address</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {student.email}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* ACADEMIC OVERVIEW GRID */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Academic Overview</Text>
            </View>

            <View style={styles.overviewGrid}>
              {/* Attendance Card */}
              <Pressable
                style={({ pressed }) => [
                  styles.overviewCard,
                  { borderColor: "#E0F2FE" },
                  pressed && styles.pressedState,
                ]}
                onPress={() => router.push("/student/attendance")}
              >
                <View style={[styles.iconContainer, { backgroundColor: "#E0F2FE" }]}>
                  <Ionicons name="calendar" size={20} color="#0284C7" />
                </View>
                <Text style={styles.overviewCardTitle}>Attendance Record</Text>
                <View style={styles.cardActionButton}>
                  <Text style={[styles.cardActionText, { color: "#0284C7" }]}>Check Attendance</Text>
                  <Ionicons name="chevron-forward" size={12} color="#0284C7" />
                </View>
              </Pressable>

              {/* Termly Report Card / Result */}
              <Pressable
                style={({ pressed }) => [
                  styles.overviewCard,
                  { borderColor: "#D1FAE5" },
                  pressed && styles.pressedState,
                ]}
                onPress={() => router.push("/student/results")}
              >
                <View style={[styles.iconContainer, { backgroundColor: "#D1FAE5" }]}>
                  <Ionicons name="trophy" size={20} color="#059669" />
                </View>
                <Text style={styles.overviewCardTitle}>Termly Report Card / Result</Text>
                <View style={styles.cardActionButton}>
                  <Text style={[styles.cardActionText, { color: "#059669" }]}>View Report Card</Text>
                  <Ionicons name="chevron-forward" size={12} color="#059669" />
                </View>
              </Pressable>

              {/* CBT (Tests & Exams) Card */}
              <Pressable
                style={({ pressed }) => [
                  styles.overviewCard,
                  { width: "100%", borderColor: "#DDD6FE" },
                  pressed && styles.pressedState,
                ]}
                onPress={() => router.push("/student/cbt")}
              >
                <View style={styles.fullWidthCardRow}>
                  <View style={[styles.iconContainer, { backgroundColor: "#F3E8FF", marginBottom: 0 }]}>
                    <Ionicons name="hardware-chip" size={20} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.overviewCardTitle}>CBT (Tests & Exams)</Text>
                    <Text style={styles.overviewLabel}>Take online tests & review past exams</Text>
                  </View>
                  <View style={[styles.cardActionButton, { marginTop: 0 }]}>
                    <Text style={[styles.cardActionText, { color: "#7C3AED" }]}>Open Portal</Text>
                    <Ionicons name="chevron-forward" size={12} color="#7C3AED" />
                  </View>
                </View>
              </Pressable>
            </View>

            {/* LEARNING HUB */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Learning Hub</Text>
              <Text style={styles.sectionSubtext}>Academic resources & portal tools</Text>
            </View>

            <View style={styles.learningHubGrid}>
              {/* E-Books */}
              <Pressable
                style={({ pressed }) => [styles.hubCard, pressed && styles.pressedState]}
                onPress={() => router.push("/student/ebooks")}
              >
                <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={[styles.hubGradient, { borderColor: "#E0E7FF" }]}>
                  <View style={[styles.hubIconBadge, { backgroundColor: "#EEF2FF" }]}>
                    <Ionicons name="book" size={22} color="#4F46E5" />
                  </View>
                  <Text style={styles.hubTitle}>E-Books</Text>
                  <Text style={styles.hubDescription}>Digital textbooks & reading materials.</Text>
                  <View style={styles.hubMetaRow}>
                    <Text style={[styles.hubMetaText, { color: "#4F46E5" }]}>Access Library</Text>
                    <Ionicons name="arrow-forward" size={12} color="#4F46E5" />
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Browser */}
              <Pressable
                style={({ pressed }) => [styles.hubCard, pressed && styles.pressedState]}
                onPress={() => router.push("/student/browser")}
              >
                <LinearGradient colors={["#FFFFFF", "#F8FAFC"]} style={[styles.hubGradient, { borderColor: "#CCFBF1" }]}>
                  <View style={[styles.hubIconBadge, { backgroundColor: "#E6FFFA" }]}>
                    <Ionicons name="globe" size={22} color="#0D9488" />
                  </View>
                  <Text style={styles.hubTitle}>Browser</Text>
                  <Text style={styles.hubDescription}>Controlled portal research search.</Text>
                  <View style={styles.hubMetaRow}>
                    <Text style={[styles.hubMetaText, { color: "#0D9488" }]}>Browse Safely</Text>
                    <Ionicons name="arrow-forward" size={12} color="#0D9488" />
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Video Learning */}
              <Pressable
                style={({ pressed }) => [styles.hubCard, { width: "100%" }, pressed && styles.pressedState]}
                onPress={() => router.push("/student/youtube-learning")}
              >
                <LinearGradient colors={["#FFFFFF", "#FFF5F5"]} style={[styles.hubGradient, { borderColor: "#FECDD3", height: "auto" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={[styles.hubIconBadge, { backgroundColor: "#FEF2F2" }]}>
                      <Ionicons name="logo-youtube" size={24} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.hubTitle}>Video Learning</Text>
                      <Text style={styles.hubDescription}>Watch approved video lessons & tutorials.</Text>
                    </View>
                    <View style={styles.hubMetaRow}>
                      <Text style={[styles.hubMetaText, { color: "#DC2626" }]}>Watch</Text>
                      <Ionicons name="arrow-forward" size={12} color="#DC2626" />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>

            {/* TIMETABLE SCHEDULE */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <Pressable onPress={() => router.push("/student/timetable")}>
                <Text style={styles.viewAllText}>Full Schedule</Text>
              </Pressable>
            </View>

            <View style={styles.timetableCard}>
              {todaySchedule.length === 0 ? (
                <Text style={styles.emptyText}>No scheduled classes for today.</Text>
              ) : (
                todaySchedule.map((item, index) => (
                  <View key={item.id || index}>
                    <View style={styles.scheduleRow}>
                      <View style={styles.timeColumn}>
                        <Text style={styles.timeText}>{item.time}</Text>
                        {item.is_current && (
                          <View style={styles.liveIndicator}>
                            <Text style={styles.liveIndicatorText}>NOW</Text>
                          </View>
                        )}
                      </View>

                      <View
                        style={[
                          styles.scheduleBar,
                          item.is_current && { backgroundColor: school.primaryColor },
                        ]}
                      />

                      <View style={styles.scheduleInfo}>
                        <Text style={styles.subjectText}>{item.subject}</Text>
                        <Text style={styles.roomText}>{item.room || "Main Class"}</Text>
                      </View>
                    </View>
                    {index < todaySchedule.length - 1 && (
                      <View style={styles.scheduleDivider} />
                    )}
                  </View>
                ))
              )}
            </View>

            {/* ANNOUNCEMENTS */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Announcements</Text>
              <Pressable onPress={() => router.push("/student/announcements")}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>

            <View style={styles.announcementsContainer}>
              {announcements.length === 0 ? (
                <Text style={styles.emptyText}>No recent announcements.</Text>
              ) : (
                announcements.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.announcementCard,
                      pressed && styles.pressedState,
                    ]}
                  >
                    <View style={styles.announcementHeader}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                      </View>
                      <Text style={styles.announcementDate}>{item.date}</Text>
                    </View>
                    <Text style={styles.announcementTitle}>{item.title}</Text>
                  </Pressable>
                ))
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* BOTTOM NAVIGATION */}
        <SafeAreaView edges={["bottom"]} style={styles.bottomNavSafeArea}>
          <View style={styles.bottomNavContainer}>
            <Pressable style={styles.navItem} onPress={() => setActiveTab("Home")}>
              <Ionicons
                name={activeTab === "Home" ? "grid" : "grid-outline"}
                size={22}
                color={activeTab === "Home" ? school.primaryColor : "#64748B"}
              />
              <Text
                style={[
                  styles.navLabel,
                  activeTab === "Home" && styles.activeNavLabel,
                ]}
              >
                Home
              </Text>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() => {
                setActiveTab("Learning");
                router.push("/student/learning");
              }}
            >
              <Ionicons
                name={activeTab === "Learning" ? "book" : "book-outline"}
                size={22}
                color={activeTab === "Learning" ? school.primaryColor : "#64748B"}
              />
              <Text
                style={[
                  styles.navLabel,
                  activeTab === "Learning" && styles.activeNavLabel,
                ]}
              >
                Learning
              </Text>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() => {
                setActiveTab("Results");
                router.push("/student/results");
              }}
            >
              <Ionicons
                name={
                  activeTab === "Results" ? "stats-chart" : "stats-chart-outline"
                }
                size={22}
                color={activeTab === "Results" ? school.primaryColor : "#64748B"}
              />
              <Text
                style={[
                  styles.navLabel,
                  activeTab === "Results" && styles.activeNavLabel,
                ]}
              >
                Results
              </Text>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() => {
                setActiveTab("CBT");
                router.push("/student/cbt");
              }}
            >
              <Ionicons
                name={
                  activeTab === "CBT" ? "hardware-chip" : "hardware-chip-outline"
                }
                size={22}
                color={activeTab === "CBT" ? school.primaryColor : "#64748B"}
              />
              <Text
                style={[
                  styles.navLabel,
                  activeTab === "CBT" && styles.activeNavLabel,
                ]}
              >
                CBT
              </Text>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() => {
                setActiveTab("Profile");
                router.push("/student/profile");
              }}
            >
              <Ionicons
                name={activeTab === "Profile" ? "person" : "person-outline"}
                size={22}
                color={activeTab === "Profile" ? school.primaryColor : "#64748B"}
              />
              <Text
                style={[
                  styles.navLabel,
                  activeTab === "Profile" && styles.activeNavLabel,
                ]}
              >
                Profile
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#64748B", fontSize: 13, fontWeight: "500" },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginVertical: 12,
  },
  pressedState: { opacity: 0.85 },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  schoolLogoImage: { width: 38, height: 38, borderRadius: 8 },
  schoolLogoBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  schoolBadgeText: { fontWeight: "800", fontSize: 13 },
  brandTextContainer: { flex: 1 },
  brandName: { fontSize: 14, fontWeight: "800", letterSpacing: -0.2 },
  brandTagline: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D4AF37",
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  greetingContainer: { marginBottom: 16 },
  greetingTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  profileCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
    position: "relative",
  },
  cardGoldAccentBorder: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: "rgba(212, 175, 55, 0.4)",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.6)",
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.6)",
  },
  avatarText: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  profileMainInfo: { flex: 1 },
  studentName: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
  schoolNameText: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: "700",
    color: "#FDE68A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  badgeRow: { flexDirection: "row", marginTop: 6 },
  classBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  classBadgeText: { color: "#F8FAFC", fontSize: 11, fontWeight: "600" },
  profileDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginVertical: 14,
  },
  profileDetailsGrid: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  detailItem: { flex: 1 },
  detailLabel: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  detailValue: { color: "#FFFFFF", fontSize: 12, fontWeight: "600", marginTop: 2 },
  schoolCodeBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 3,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.5)",
  },
  schoolCodeBadgeText: {
    color: "#FDE68A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  sectionSubtext: { fontSize: 11, color: "#64748B" },
  viewAllText: { fontSize: 12, fontWeight: "700", color: "#1E293B" },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  overviewCard: {
    width: (width - 52) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: "space-between",
  },
  fullWidthCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overviewCardTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A" },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  overviewLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  cardActionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 4,
  },
  cardActionText: { fontSize: 11, fontWeight: "800" },
  learningHubGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  hubCard: { width: (width - 52) / 2, borderRadius: 16, overflow: "hidden" },
  hubGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    height: 150,
    justifyContent: "space-between",
  },
  hubIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  hubTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginTop: 4 },
  hubDescription: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15,
  },
  hubMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  hubMetaText: { fontSize: 11, fontWeight: "800" },
  timetableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  scheduleRow: { flexDirection: "row", alignItems: "center" },
  timeColumn: { width: 75 },
  timeText: { fontSize: 11, fontWeight: "700", color: "#0F172A" },
  liveIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(30, 41, 59, 0.1)",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  liveIndicatorText: { fontSize: 8, fontWeight: "800", color: "#1E293B" },
  scheduleBar: {
    width: 3,
    height: 36,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginHorizontal: 12,
  },
  scheduleInfo: { flex: 1 },
  subjectText: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  roomText: { fontSize: 11, color: "#64748B", marginTop: 1 },
  scheduleDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  announcementsContainer: { gap: 10, marginBottom: 10 },
  announcementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  announcementDate: { fontSize: 10, color: "#94A3B8" },
  announcementTitle: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  bottomNavSafeArea: { backgroundColor: "#FFFFFF" },
  bottomNavContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  navItem: { alignItems: "center", justifyContent: "center" },
  navLabel: { fontSize: 10, marginTop: 4, color: "#64748B", fontWeight: "500" },
  activeNavLabel: { fontWeight: "700" },
});