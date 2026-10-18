// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import {
  AppState,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
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

// DYNAMIC API BASE URL RESOLUTION
const API_BASE_URL = api.defaults?.baseURL || "https://coreone.onrender.com/api/v1";

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
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === "web" && width >= 900;
  const isTablet = width >= 600 && width < 900;

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

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const loadUnreadNotificationCount = useCallback(async () => {
    try {
      const response = await api.get("/notifications");
      const notifications = response?.data;

      if (!Array.isArray(notifications)) {
        setUnreadNotificationCount(0);
        return;
      }

      const unreadCount = notifications.reduce(
        (count: number, notification: any) => {
          return count + (notification?.is_read === false ? 1 : 0);
        },
        0
      );

      setUnreadNotificationCount(unreadCount);
    } catch (error) {
      console.error("Error loading notification unread count:", error);
      setUnreadNotificationCount(0);
    }
  }, []);

  useEffect(() => {
    loadUnreadNotificationCount();

    const interval = setInterval(() => {
      loadUnreadNotificationCount();
    }, 5000);

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        loadUnreadNotificationCount();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [loadUnreadNotificationCount]);

  const [activeTab, setActiveTab] = useState("Home");
  const [logoError, setLogoError] = useState(false);

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
          partner_schools: data.student.partner_schools || [],
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
    loadUnreadNotificationCount();
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

  const partnerSchools = student.partner_schools || [];

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

  const HOME_COLOR = school.primaryColor || "#1E293B";
  const RESULTS_COLOR = "#059669";
  const CBT_COLOR = "#D4AF37";

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* TOP HEADER */}
        <View style={styles.topHeader}>
          <View style={[styles.topHeaderInner, isDesktopWeb && styles.desktopHeaderInner]}>
            <View style={styles.brandRow}>
              {renderSchoolLogo()}

              <View style={styles.brandTextContainer}>
                <Text
                  style={[styles.brandName, { color: school.primaryColor }]}
                  numberOfLines={1}
                >
                  {school.name || "Student Portal"}
                </Text>
                <Text style={styles.brandTagline}>Academic Portal</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.notificationButton,
                unreadNotificationCount > 0 && styles.notificationButtonUnread,
                pressed && styles.pressedState,
              ]}
              onPress={() => router.push("/student/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={unreadNotificationCount > 0 ? "#16A34A" : "#1E293B"}
              />

              {unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotificationCount > 99
                      ? "99+"
                      : String(unreadNotificationCount)}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
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
            <View style={[styles.contentWrapper, isDesktopWeb && styles.desktopContentWrapper]}>
              {/* GREETING */}
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingTitle}>
                  {getGreeting()}
                  {student.first_name ? `, ${student.first_name}` : ""} 👋
                </Text>
                <Text style={styles.greetingSubtitle}>
                  Here is your academic overview for today.
                </Text>
              </View>

              {/* STUDENT PROFILE CARD */}
              <LinearGradient
                colors={[school.primaryColor || "#0F172A", school.secondaryColor || "#1E293B", "#090D16"]}
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

                  {partnerSchools.length > 0 && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Partner School</Text>
                      <Text style={styles.detailValue} numberOfLines={2}>
                        {partnerSchools.map((partner: any) => partner.name).join(", ")}
                      </Text>
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

              {/* Desktop 2-Column Split View */}
              <View style={[styles.mainGridSection, isDesktopWeb && styles.desktopGridSection]}>
                
                {/* Left Column */}
                <View style={isDesktopWeb ? styles.leftColumnDesktop : { width: "100%" }}>
                  {/* ACADEMIC OVERVIEW GRID */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Academic Overview</Text>
                  </View>

                  <View style={[styles.overviewGrid, isDesktopWeb && styles.gridRowDesktop]}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.overviewCard,
                        styles.blueGlow,
                        isDesktopWeb && styles.cardHalfDesktop,
                        pressed && styles.pressedState,
                      ]}
                      onPress={() => router.push("/student/attendance")}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: "rgba(2, 132, 199, 0.12)" }]}>
                        <Ionicons name="calendar-outline" size={20} color="#0284C7" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.overviewCardTitle}>Attendance</Text>
                        <Text style={styles.overviewLabel}>View logs & record</Text>
                      </View>
                      <View style={styles.cardActionButton}>
                        <Text style={[styles.cardActionText, { color: "#0284C7" }]}>Check</Text>
                        <Ionicons name="chevron-forward" size={12} color="#0284C7" />
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.overviewCard,
                        styles.greenGlow,
                        isDesktopWeb && styles.cardHalfDesktop,
                        pressed && styles.pressedState,
                      ]}
                      onPress={() => {
                        setActiveTab("Results");
                        router.push("/student/results");
                      }}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: "rgba(5, 150, 105, 0.12)" }]}>
                        <Ionicons name="trophy-outline" size={20} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.overviewCardTitle}>Report Cards</Text>
                        <Text style={styles.overviewLabel}>Grades & transcripts</Text>
                      </View>
                      <View style={styles.cardActionButton}>
                        <Text style={[styles.cardActionText, { color: "#059669" }]}>Results</Text>
                        <Ionicons name="chevron-forward" size={12} color="#059669" />
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.overviewCard,
                        styles.goldGlow,
                        styles.fullWidthCard,
                        pressed && styles.pressedState,
                      ]}
                      onPress={() => {
                        setActiveTab("CBT");
                        router.push("/student/cbt");
                      }}
                    >
                      <View style={styles.fullWidthCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: "rgba(212, 175, 55, 0.15)", marginBottom: 0 }]}>
                          <Ionicons name="hardware-chip-outline" size={20} color="#C58A00" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.overviewCardTitle}>CBT Examinations</Text>
                          <Text style={styles.overviewLabel}>Online tests, quizzes & instant results</Text>
                        </View>
                        <View style={[styles.cardActionButton, { marginTop: 0 }]}>
                          <Text style={[styles.cardActionText, { color: "#C58A00" }]}>Open</Text>
                          <Ionicons name="chevron-forward" size={12} color="#C58A00" />
                        </View>
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.overviewCard,
                        styles.purpleGlow,
                        styles.fullWidthCard,
                        pressed && styles.pressedState,
                      ]}
                      onPress={() => router.push("/student/engagement")}
                    >
                      <View style={styles.fullWidthCardRow}>
                        <View style={[styles.iconContainer, { backgroundColor: "rgba(124, 58, 237, 0.12)", marginBottom: 0 }]}>
                          <Ionicons name="trending-up-outline" size={20} color="#7C3AED" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.overviewCardTitle}>Performance & Analytics</Text>
                          <Text style={styles.overviewLabel}>Track your subject ranking & progress</Text>
                        </View>
                        <View style={[styles.cardActionButton, { marginTop: 0 }]}>
                          <Text style={[styles.cardActionText, { color: "#7C3AED" }]}>View</Text>
                          <Ionicons name="chevron-forward" size={12} color="#7C3AED" />
                        </View>
                      </View>
                    </Pressable>
                  </View>

                  {/* TIMETABLE SCHEDULE */}
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Schedule</Text>
                    <Pressable onPress={() => router.push("/student/timetable")}>
                      <Text style={styles.viewAllText}>Full Timetable</Text>
                    </Pressable>
                  </View>

                  <View style={[styles.timetableCard, styles.slateGlow]}>
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
                </View>

                {/* Right Column */}
                <View style={isDesktopWeb ? styles.rightColumnDesktop : { width: "100%" }}>
                  {/* LEARNING HUB */}
                  <View style={styles.sectionHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>Learning Hub</Text>
                      <Text style={styles.sectionSubtext}>Academic resources & tools</Text>
                    </View>
                  </View>

                  <View style={[styles.learningHubGrid, isDesktopWeb && styles.gridRowDesktop]}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.hubCard,
                        styles.indigoGlow,
                        isDesktopWeb && styles.cardHalfDesktop,
                        pressed && styles.pressedState,
                      ]}
                      onPress={() => router.push("/student/ebooks")}
                    >
                      <View style={styles.hubContent}>
                        <View style={[styles.hubIconBadge, { backgroundColor: "#EEF2FF" }]}>
                          <Ionicons name="book-outline" size={20} color="#4F46E5" />
                        </View>
                        <Text style={styles.hubTitle}>E-Books</Text>
                        <Text style={styles.hubDescription}>Digital reading material.</Text>
                        <View style={styles.hubMetaRow}>
                          <Text style={[styles.hubMetaText, { color: "#4F46E5" }]}>Library</Text>
                          <Ionicons name="arrow-forward" size={12} color="#4F46E5" />
                        </View>
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.hubCard,
                        styles.tealGlow,
                        isDesktopWeb && styles.cardHalfDesktop,
                        pressed && styles.pressedState,
                      ]}
                      onPress={() => router.push("/student/browser")}
                    >
                      <View style={styles.hubContent}>
                        <View style={[styles.hubIconBadge, { backgroundColor: "#E6FFFA" }]}>
                          <Ionicons name="globe-outline" size={20} color="#0D9488" />
                        </View>
                        <Text style={styles.hubTitle}>Browser</Text>
                        <Text style={styles.hubDescription}>Controlled research portal.</Text>
                        <View style={styles.hubMetaRow}>
                          <Text style={[styles.hubMetaText, { color: "#0D9488" }]}>Browse</Text>
                          <Ionicons name="arrow-forward" size={12} color="#0D9488" />
                        </View>
                      </View>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.hubCard,
                        styles.roseGlow,
                        styles.fullWidthCard,
                        pressed && styles.pressedState,
                      ]}
                      onPress={() => router.push("/student/youtube-learning")}
                    >
                      <View style={[styles.hubContent, { flexDirection: "row", alignItems: "center" }]}>
                        <View style={[styles.hubIconBadge, { backgroundColor: "#FEF2F2" }]}>
                          <Ionicons name="logo-youtube" size={22} color="#DC2626" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.hubTitle}>Video Learning</Text>
                          <Text style={styles.hubDescription}>Approved educational video lessons</Text>
                        </View>
                        <View style={styles.hubMetaRow}>
                          <Text style={[styles.hubMetaText, { color: "#DC2626" }]}>Watch</Text>
                          <Ionicons name="arrow-forward" size={12} color="#DC2626" />
                        </View>
                      </View>
                    </Pressable>
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
                            styles.slateGlow,
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
                </View>

              </View>

              <View style={{ height: 32 }} />
            </View>
          </ScrollView>
        )}

        {/* BOTTOM NAVIGATION */}
        <SafeAreaView edges={["bottom"]} style={styles.bottomNavSafeArea}>
          <View style={[styles.bottomNavContainer, isDesktopWeb && styles.desktopBottomNav]}>
            <Pressable
              style={styles.navItem}
              onPress={() => {
                setActiveTab("Home");
                router.push("/student/dashboard");
              }}
            >
              <Ionicons
                name={activeTab === "Home" ? "grid" : "grid-outline"}
                size={20}
                color={activeTab === "Home" ? HOME_COLOR : "#64748B"}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: activeTab === "Home" ? HOME_COLOR : "#64748B" },
                  activeTab === "Home" && styles.activeNavText,
                ]}
              >
                Home
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
                size={20}
                color={activeTab === "Results" ? RESULTS_COLOR : "#64748B"}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: activeTab === "Results" ? RESULTS_COLOR : "#64748B" },
                  activeTab === "Results" && styles.activeNavText,
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
                size={20}
                color={activeTab === "CBT" ? CBT_COLOR : "#64748B"}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: activeTab === "CBT" ? CBT_COLOR : "#64748B" },
                  activeTab === "CBT" && styles.activeNavText,
                ]}
              >
                CBT
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
  loadingText: { marginTop: 10, color: "#64748B", fontSize: 13, fontWeight: "500" },
  emptyText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginVertical: 12,
  },
  pressedState: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  topHeader: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  desktopHeaderInner: {
    maxWidth: 1120,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 28,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  schoolLogoImage: { width: 34, height: 34, borderRadius: 8 },
  schoolLogoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  schoolBadgeText: { fontWeight: "800", fontSize: 13 },
  brandTextContainer: { flex: 1 },
  brandName: { fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
  brandTagline: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 1,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  notificationButtonUnread: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 3,
    borderRadius: 9,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  scrollContent: {
    paddingTop: 12,
    width: "100%",
  },
  contentWrapper: {
    width: "100%",
    paddingHorizontal: 16,
    alignSelf: "center",
  },
  desktopContentWrapper: {
    maxWidth: 1120,
    paddingHorizontal: 28,
  },
  greetingContainer: {
    marginBottom: 14,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },
  profileCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    position: "relative",
  },
  cardGoldAccentBorder: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: "rgba(212, 175, 55, 0.4)",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.6)",
  },
  defaultAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.6)",
  },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  profileMainInfo: { flex: 1 },
  studentName: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  schoolNameText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "700",
    color: "#FDE68A",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  badgeRow: { flexDirection: "row", marginTop: 4 },
  classBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  classBadgeText: { color: "#F8FAFC", fontSize: 11, fontWeight: "600" },
  profileDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginVertical: 12,
  },
  profileDetailsGrid: { flexDirection: "row", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  detailItem: { minWidth: "45%", flex: 1 },
  detailLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  detailValue: { color: "#FFFFFF", fontSize: 12, fontWeight: "600", marginTop: 2 },
  schoolCodeBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    alignSelf: "flex-start",
    marginTop: 3,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  schoolCodeBadgeText: {
    color: "#FDE68A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  /* Split Layout Grid for Desktop */
  mainGridSection: {
    width: "100%",
  },
  desktopGridSection: {
    flexDirection: "row",
    gap: 24,
  },
  leftColumnDesktop: {
    flex: 1,
  },
  rightColumnDesktop: {
    flex: 1,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: -0.2 },
  sectionSubtext: { fontSize: 11, color: "#64748B", marginTop: 1 },
  viewAllText: { fontSize: 12, fontWeight: "700", color: "#1E293B" },

  /* Glowing Card Variations */
  blueGlow: {
    borderColor: "#BAE6FD",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  greenGlow: {
    borderColor: "#A7F3D0",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  goldGlow: {
    borderColor: "#FDE68A",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  purpleGlow: {
    borderColor: "#DDD6FE",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  indigoGlow: {
    borderColor: "#C7D2FE",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tealGlow: {
    borderColor: "#99F6E4",
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  roseGlow: {
    borderColor: "#FECDD3",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  slateGlow: {
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 10,
    width: "100%",
  },
  gridRowDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  overviewCard: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    justifyContent: "space-between",
    minHeight: 110,
  },
  cardHalfDesktop: {
    width: "48.5%",
  },
  fullWidthCard: {
    width: "100%",
    minHeight: "auto",
  },
  fullWidthCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overviewCardTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
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
    marginTop: 8,
    gap: 2,
  },
  cardActionText: { fontSize: 11, fontWeight: "800" },

  learningHubGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 10,
    width: "100%",
  },
  hubCard: {
    width: "48.5%",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    overflow: "hidden",
  },
  hubContent: {
    padding: 12,
    justifyContent: "space-between",
  },
  hubIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  hubTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A", marginTop: 4 },
  hubDescription: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15,
  },
  hubMetaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 6 },
  hubMetaText: { fontSize: 11, fontWeight: "800" },

  timetableCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  scheduleRow: { flexDirection: "row", alignItems: "center" },
  timeColumn: { width: 70 },
  timeText: { fontSize: 11, fontWeight: "700", color: "#0F172A" },
  liveIndicator: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: "rgba(30, 41, 59, 0.1)",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  liveIndicatorText: { fontSize: 8, fontWeight: "800", color: "#1E293B" },
  scheduleBar: {
    width: 3,
    height: 32,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    marginHorizontal: 10,
  },
  scheduleInfo: { flex: 1 },
  subjectText: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  roomText: { fontSize: 11, color: "#64748B", marginTop: 1 },
  scheduleDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },

  announcementsContainer: { gap: 8, marginBottom: 10 },
  announcementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  announcementDate: { fontSize: 10, color: "#94A3B8" },
  announcementTitle: { fontSize: 12, fontWeight: "700", color: "#0F172A" },

  bottomNavSafeArea: { backgroundColor: "#FFFFFF" },
  bottomNavContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  desktopBottomNav: {
    maxWidth: 500,
    alignSelf: "center",
    width: "100%",
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  navItem: { alignItems: "center", justifyContent: "center" },
  navLabel: { fontSize: 10, marginTop: 3, fontWeight: "500" },
  activeNavText: { fontWeight: "700" },
});