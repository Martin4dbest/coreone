// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  StatusBar,
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

// 1. DYNAMIC API BASE URL RESOLUTION
const API_BASE_URL = api.defaults?.baseURL || "http://10.196.122.196:8000";

/**
 * Extracts only the origin host (e.g. http://10.196.122.196:8000)
 * excluding path suffixes like /api/v1
 */
const getOriginHost = (baseUrl: string): string => {
  try {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return baseUrl.replace(/\/api\/v\d+.*$/i, "").replace(/\/+$/, "");
  }
};

const ORIGIN_HOST = getOriginHost(API_BASE_URL);

/**
 * Normalizes relative and absolute image paths for mobile devices.
 * Replaces localhost or 127.0.0.1 loopback URLs with the active API origin host
 * and avoids appending /api/v1 to static asset upload paths.
 */
const normalizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== "string") return null;

  // 1. Strip localhost/127.0.0.1 prefix and keep relative path
  let cleanedUrl = url
    .replace(/^https?:\/\/localhost:8000\/?/, "/")
    .replace(/^https?:\/\/127\.0\.0\.1:8000\/?/, "/");

  // 2. If it's already a valid external HTTP(S) or Data URI, return directly
  if (
    cleanedUrl.startsWith("http://") ||
    cleanedUrl.startsWith("https://") ||
    cleanedUrl.startsWith("data:")
  ) {
    return cleanedUrl;
  }

  // 3. Ensure path starts with a single leading slash
  if (!cleanedUrl.startsWith("/")) {
    cleanedUrl = `/${cleanedUrl}`;
  }

  // 4. Prepend origin host (without /api/v1 prefix)
  return `${ORIGIN_HOST}${cleanedUrl}`;
};

// KNOWN BRAND PRESETS
const KNOWN_SCHOOL_BRANDS: Record<
  string,
  { primary: string; secondary: string; accent: string; fallbackLogoUrl?: string }
> = {
  "LIBERTY BELLS SCHOOL": {
    primary: "#1E293B", // Elegant Navy / Slate
    secondary: "#0F172A",
    accent: "#D4AF37", // Classical Gold
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
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [academicData, setAcademicData] = useState<AcademicOverviewData | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<TimetableClass[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [logoError, setLogoError] = useState<boolean>(false);

  // Fetch student dashboard data
  const fetchDashboardData = async () => {
    try {
      console.log("-----------------------------------------");
      console.log("🔥 FETCHING DASHBOARD & TENANT BRANDING...");
      const { data } = await api.get("/mobile/student/dashboard");

      setLogoError(false);

      // 1. Academic Overview
      setAcademicData(data?.overview ?? null);

      // 2. Multi-tenant Branding Resolution
      const tenant = data?.tenant || user?.tenant || data?.student?.tenant || {};
      const rawSchoolName = (
        data?.student?.school_name ||
        tenant?.name ||
        user?.tenant?.name ||
        "LIBERTY BELLS SCHOOL"
      ).trim();

      const schoolNameUpper = rawSchoolName.toUpperCase();
      const presetBrand = KNOWN_SCHOOL_BRANDS[schoolNameUpper] || KNOWN_SCHOOL_BRANDS["DEFAULT"];

      const primaryColor = tenant?.primary_color || tenant?.theme_color || presetBrand.primary;
      const secondaryColor = tenant?.secondary_color || presetBrand.secondary;
      const accentColor = tenant?.accent_color || presetBrand.accent;

      // Extract raw logo path
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

      // Normalize logo URL
      const resolvedLogo = normalizeImageUrl(rawLogoPath);

      // Diagnostic Console Logs
      console.log("School branding:", {
        id: tenant?.id || tenant?.school_id,
        logo_url: rawLogoPath,
        name: rawSchoolName,
        primaryColor,
      });
      console.log("Logo URL:", resolvedLogo);
      console.log("-----------------------------------------");

      setTenantInfo({
        name: rawSchoolName,
        code: tenant?.school_code || "",
        logo: resolvedLogo,
        primaryColor,
        secondaryColor,
        accentColor,
      });

      // 3. Student Details
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

      setTodaySchedule([]);
      setAnnouncements([]);
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

  // Fallbacks
  const student = studentDetails || {
    id: user?.id || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    school_name: user?.tenant?.name || "LIBERTY BELLS SCHOOL",
    class_level: null,
    department: null,
    admission_number: null,
    email: user?.email || "",
    profile_image: null,
  };

  const school = tenantInfo || {
    name: "LIBERTY BELLS SCHOOL",
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

  // Helper to render logo safely
  const renderSchoolLogo = () => {
    const logoUri = normalizeImageUrl(school.logo);

    if (logoUri && !logoError) {
      return (
        <Image
          source={{ uri: logoUri }}
          style={styles.schoolLogoImage}
          contentFit="contain"
          cachePolicy="disk"
          onError={(e) => {
            console.warn("⚠️ Failed to render remote logo from:", logoUri, e?.error || e);
            setLogoError(true);
          }}
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        
        {/* BRANDED CLASSICAL HEADER */}
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

            {/* CLASSICAL STUDENT PROFILE CARD */}
            <LinearGradient
              colors={[school.primaryColor || "#1E293B", school.secondaryColor || "#0F172A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileCard}
            >
              {/* Subtle Ambient Gold Crest Overlay */}
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
                  
                  {/* CHANGED: Replaced red accent color with elegant soft gold */}
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
              <View style={styles.overviewCard}>
                <View style={[styles.iconContainer, { backgroundColor: "#F8FAFC" }]}>
                  <Ionicons name="calendar-outline" size={18} color="#1E293B" />
                </View>
                <Text style={styles.overviewValue}>
                  {academicData?.attendance_percentage ?? 0}%
                </Text>
                <Text style={styles.overviewLabel}>Attendance</Text>
                <Pressable
                  style={styles.cardActionButton}
                  onPress={() => router.push("/student/attendance")}
                >
                  <Text style={styles.cardActionText}>View Attendance</Text>
                  <Ionicons name="chevron-forward" size={11} color="#64748B" />
                </Pressable>
              </View>

              <View style={styles.overviewCard}>
                <View style={[styles.iconContainer, { backgroundColor: "#F0FDF4" }]}>
                  <Ionicons name="trophy-outline" size={18} color="#16A34A" />
                </View>
                <Text style={styles.overviewValue}>
                  {academicData?.latest_grade ?? "N/A"}
                </Text>
                <Text style={styles.overviewLabel}>Performance</Text>
                <Pressable
                  style={styles.cardActionButton}
                  onPress={() => router.push("/student/results")}
                >
                  <Text style={styles.cardActionText}>View Results</Text>
                  <Ionicons name="chevron-forward" size={11} color="#64748B" />
                </Pressable>
              </View>

              <View style={styles.overviewCard}>
                <View style={[styles.iconContainer, { backgroundColor: "#FFFBEB" }]}>
                  <Ionicons name="document-text-outline" size={18} color="#D97706" />
                </View>
                <Text style={styles.overviewValue}>
                  {academicData?.pending_assignments_count ?? 0} Pending
                </Text>
                <Text style={styles.overviewLabel}>Assignments</Text>
                <Pressable
                  style={styles.cardActionButton}
                  onPress={() => router.push("/student/assignments")}
                >
                  <Text style={styles.cardActionText}>View Assignments</Text>
                  <Ionicons name="chevron-forward" size={11} color="#64748B" />
                </Pressable>
              </View>

              <View style={styles.overviewCard}>
                <View style={[styles.iconContainer, { backgroundColor: "#EFF6FF" }]}>
                  <Ionicons name="hardware-chip-outline" size={18} color="#2563EB" />
                </View>
                <Text style={styles.overviewValue}>
                  {academicData?.cbt_average_score ?? 0}%
                </Text>
                <Text style={styles.overviewLabel}>Average Score</Text>
                <Pressable
                  style={styles.cardActionButton}
                  onPress={() => router.push("/student/cbt")}
                >
                  <Text style={styles.cardActionText}>Practice CBT</Text>
                  <Ionicons name="chevron-forward" size={11} color="#64748B" />
                </Pressable>
              </View>
            </View>

            {/* LEARNING HUB */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Learning Hub</Text>
              <Text style={styles.sectionSubtext}>Academic resources & portal tools</Text>
            </View>

            <View style={styles.learningHubGrid}>
              <Pressable
                style={({ pressed }) => [styles.hubCard, pressed && styles.pressedState]}
                onPress={() => router.push("/student/ebooks")}
              >
                <LinearGradient colors={["#FFFFFF", "#FAFAFA"]} style={styles.hubGradient}>
                  <View style={[styles.hubIconBadge, { backgroundColor: "#F8FAFC" }]}>
                    <Ionicons name="book-outline" size={22} color="#1E293B" />
                  </View>
                  <Text style={styles.hubTitle}>E-Books</Text>
                  <Text style={styles.hubDescription}>Digital textbooks & library.</Text>
                  <View style={styles.hubMetaRow}>
                    <Text style={styles.hubMetaText}>Access Library</Text>
                    <Ionicons name="arrow-forward" size={12} color="#1E293B" />
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.hubCard, pressed && styles.pressedState]}
                onPress={() => router.push("/student/browser")}
              >
                <LinearGradient colors={["#FFFFFF", "#FAFAFA"]} style={styles.hubGradient}>
                  <View style={[styles.hubIconBadge, { backgroundColor: "#F0FDF4" }]}>
                    <Ionicons name="globe-outline" size={22} color="#16A34A" />
                  </View>
                  <Text style={styles.hubTitle}>Browser</Text>
                  <Text style={styles.hubDescription}>Controlled portal search.</Text>
                  <View style={styles.hubMetaRow}>
                    <Text style={styles.hubMetaText}>Browse Safely</Text>
                    <Ionicons name="arrow-forward" size={12} color="#1E293B" />
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.hubCard, pressed && styles.pressedState]}
                onPress={() => router.push("/student/youtube-learning")}
              >
                <LinearGradient colors={["#FFFFFF", "#FAFAFA"]} style={styles.hubGradient}>
                  <View style={[styles.hubIconBadge, { backgroundColor: "#FEF2F2" }]}>
                    <Ionicons name="logo-youtube" size={22} color="#DC2626" />
                  </View>
                  <Text style={styles.hubTitle}>Video Learning</Text>
                  <Text style={styles.hubDescription}>Curated video lectures.</Text>
                  <View style={styles.hubMetaRow}>
                    <Text style={styles.hubMetaText}>Watch Videos</Text>
                    <Ionicons name="arrow-forward" size={12} color="#1E293B" />
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.hubCard, pressed && styles.pressedState]}
                onPress={() => router.push("/student/cbt-practice")}
              >
                <LinearGradient colors={["#FFFFFF", "#FAFAFA"]} style={styles.hubGradient}>
                  <View style={[styles.hubIconBadge, { backgroundColor: "#EFF6FF" }]}>
                    <Ionicons name="laptop-outline" size={22} color="#2563EB" />
                  </View>
                  <Text style={styles.hubTitle}>CBT Practice</Text>
                  <Text style={styles.hubDescription}>Online exams & practice tests.</Text>
                  <View style={styles.hubMetaRow}>
                    <Text style={styles.hubMetaText}>Start Test</Text>
                    <Ionicons name="arrow-forward" size={12} color="#1E293B" />
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
    borderColor: "rgba(212, 175, 55, 0.3)", // Subtle classical gold accent border
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
  
  // CHANGED: Soft warm gold classical color (Replacing harsh red)
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
  profileDetailsGrid: { flexDirection: "row", justifyContent: "space-between" },
  detailItem: { flex: 1 },
  detailLabel: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  detailValue: { color: "#FFFFFF", fontSize: 12, fontWeight: "600", marginTop: 2 },
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
    gap: 10,
  },
  overviewCard: {
    width: (width - 50) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  overviewValue: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  overviewLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  cardActionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 4,
  },
  cardActionText: { fontSize: 11, fontWeight: "700", color: "#1E293B" },
  learningHubGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  hubCard: { width: (width - 52) / 2, borderRadius: 14, overflow: "hidden" },
  hubGradient: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 155,
    justifyContent: "space-between",
  },
  hubIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  hubTitle: { fontSize: 14, fontWeight: "800", color: "#0F172A", marginTop: 4 },
  hubDescription: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 14,
  },
  hubMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  hubMetaText: { fontSize: 11, fontWeight: "700", color: "#1E293B" },
  timetableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(30, 41, 59, 0.08)",
  },
  categoryBadgeText: { fontSize: 10, fontWeight: "700", color: "#1E293B" },
  announcementDate: { fontSize: 10, color: "#94A3B8" },
  announcementTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 18,
  },
  pressedState: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  bottomNavSafeArea: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  bottomNavContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  navItem: { alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  navLabel: { fontSize: 10, color: "#64748B", fontWeight: "500", marginTop: 2 },
  activeNavLabel: { color: "#1E293B", fontWeight: "800" },
});