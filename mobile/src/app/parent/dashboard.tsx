import React, { useEffect, useMemo, useState } from "react";
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
import { router } from "expo-router";

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
const isDesktopWeb =
  Platform.OS === "web" && screenWidth >= 900;

const desktopMaxWidth = Math.min(
  Math.max(screenWidth - 48, 320),
  1180
);

function normalizeImageUrl(
  value?: string | null
): string | undefined {
  if (!value) {
    return undefined;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("file://")
  ) {
    return value;
  }

  const base =
    process.env.EXPO_PUBLIC_API_URL ||
    "https://coreone.onrender.com";

  if (value.startsWith("/")) {
    return `${base}${value}`;
  }

  return `${base}/${value}`;
}

function getSchoolBranding(
  school?: School
) {
  return {
    primary:
      school?.branding?.primary_color ||
      school?.primary_color ||
      "#2563EB",

    secondary:
      school?.branding?.secondary_color ||
      school?.secondary_color ||
      "#1E293B",

    accent:
      school?.branding?.accent_color ||
      "#F43F5E",

    logo:
      school?.branding?.logo_url ||
      school?.logo ||
      undefined,

    motto:
      school?.branding?.motto ||
      undefined,
  };
}

export default function ParentDashboard() {
  const { user, logout } = useAuth();

  const [parent, setParent] =
    useState<ParentMe | null>(null);

  const [selectedStudentId, setSelectedStudentId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const selectedStudent = useMemo(
    () =>
      parent?.students?.find(
        (student) =>
          student.id === selectedStudentId
      ) ||
      parent?.students?.[0] ||
      null,
    [parent, selectedStudentId]
  );

  const schoolBranding = getSchoolBranding(
    selectedStudent?.school
  );

  async function loadParentDashboard(
    showSpinner = true
  ) {
    try {
      if (showSpinner) {
        setLoading(true);
      }

      const response =
        await api.get<ParentMe>(
          "/parents/me"
        );

      const data = response.data;

      setParent(data);

      const firstStudent =
        data?.students?.[0];

      if (
        firstStudent &&
        selectedStudentId === null
      ) {
        setSelectedStudentId(
          firstStudent.id
        );
      }
    } catch (error: any) {
      console.log(
        "PARENT DASHBOARD ERROR:",
        error?.response?.data ||
          error?.message
      );

      Alert.alert(
        "Unable to load dashboard",
        "We could not load your children right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParentDashboard();
  }, []);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadParentDashboard(false);
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
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading parent dashboard...
        </Text>
      </View>
    );
  }

  const parentName =
    parent
      ? `${parent.first_name} ${parent.last_name}`.trim()
      : "Parent";

  const students =
    parent?.students || [];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb &&
            styles.desktopScrollContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
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
          {/* ================================================= */}
          {/* SCHOOL HEADER                                     */}
          {/* ================================================= */}

          <View
            style={[
              styles.schoolHeader,
              {
                backgroundColor:
                  schoolBranding.primary,
              },
            ]}
          >
            <View style={styles.schoolHeaderLeft}>
              <View style={styles.schoolLogoWrap}>
                {schoolBranding.logo ? (
                  <Image
                    source={{
                      uri: normalizeImageUrl(
                        schoolBranding.logo
                      ),
                    }}
                    style={styles.schoolLogo}
                  />
                ) : (
                  <Ionicons
                    name="school-outline"
                    size={30}
                    color="#FFFFFF"
                  />
                )}
              </View>

              <View style={styles.schoolTitleBlock}>
                <Text
                  style={styles.schoolName}
                  numberOfLines={2}
                >
                  {selectedStudent?.school?.name ||
                    "School"}
                </Text>

                <Text style={styles.schoolTagline}>
                  Parent Portal
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <Ionicons
                name="log-out-outline"
                size={19}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {/* ================================================= */}
          {/* WELCOME                                           */}
          {/* ================================================= */}

          <View style={styles.welcomeBlock}>
            <Text style={styles.welcomeEyebrow}>
              Welcome back
            </Text>

            <Text style={styles.welcomeTitle}>
              {parentName}
            </Text>

            {schoolBranding.motto ? (
              <Text style={styles.motto}>
                {schoolBranding.motto}
              </Text>
            ) : (
              <Text style={styles.welcomeSubtitle}>
                Stay connected with your children's
                education.
              </Text>
            )}
          </View>

          {/* ================================================= */}
          {/* CHILDREN                                           */}
          {/* ================================================= */}

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                My Children
              </Text>

              <Text style={styles.sectionSubtitle}>
                {students.length === 1
                  ? "1 child linked to your account"
                  : `${students.length} children linked to your account`}
              </Text>
            </View>
          </View>

          {students.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="people-outline"
                  size={28}
                  color="#64748B"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No children linked yet
              </Text>

              <Text style={styles.emptyText}>
                Your school will link your child to
                your parent account.
              </Text>
            </View>
          ) : (
            <View style={styles.childrenList}>
              {students.map((student) => {
                const active =
                  selectedStudent?.id === student.id;

                const studentSchool =
                  getSchoolBranding(
                    student.school
                  );

                const initials =
                  `${student.first_name?.[0] || ""}${
                    student.last_name?.[0] || ""
                  }`.toUpperCase();

                return (
                  <Pressable
                    key={student.id}
                    onPress={() => {
                      setSelectedStudentId(
                        student.id
                      );

                      router.push({
                        pathname: "/parent/child",
                        params: {
                          studentId: String(student.id),
                        },
                      });
                    }}
                    style={({ pressed }) => [
                      styles.childCard,
                      active && {
                        borderColor:
                          studentSchool.primary,
                        backgroundColor:
                          `${studentSchool.primary}0D`,
                      },
                      pressed &&
                        styles.childCardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor:
                            studentSchool.primary,
                        },
                      ]}
                    >
                      {student.passport ? (
                        <Image
                          source={{
                            uri: normalizeImageUrl(
                              student.passport
                            ),
                          }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {initials || "ST"}
                        </Text>
                      )}
                    </View>

                    <View style={styles.childInfo}>
                      <Text
                        style={styles.childName}
                        numberOfLines={1}
                      >
                        {student.first_name}{" "}
                        {student.last_name}
                      </Text>

                      <Text style={styles.childSchool}>
                        {student.school.name}
                      </Text>

                      <Text style={styles.childMeta}>
                        {student.admission_number}
                      </Text>
                    </View>

                    <Ionicons
                      name={
                        active
                          ? "checkmark-circle"
                          : "chevron-forward"
                      }
                      size={23}
                      color={
                        active
                          ? studentSchool.primary
                          : "#94A3B8"
                      }
                    />
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ================================================= */}
          {/* SELECTED CHILD                                    */}
          {/* ================================================= */}

          {selectedStudent && (
            <>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {selectedStudent.first_name}'s
                    Overview
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    {selectedStudent.school.name}
                  </Text>
                </View>
              </View>

              <View style={styles.profileCard}>
                <View
                  style={[
                    styles.profileAccent,
                    {
                      backgroundColor:
                        schoolBranding.primary,
                    },
                  ]}
                />

                <View style={styles.profileHeader}>
                  <View
                    style={[
                      styles.profileAvatar,
                      {
                        borderColor:
                          schoolBranding.primary,
                      },
                    ]}
                  >
                    {selectedStudent.passport ? (
                      <Image
                        source={{
                          uri: normalizeImageUrl(
                            selectedStudent.passport
                          ),
                        }}
                        style={styles.profileAvatarImage}
                      />
                    ) : (
                      <Ionicons
                        name="person-outline"
                        size={34}
                        color={
                          schoolBranding.primary
                        }
                      />
                    )}
                  </View>

                  <View style={styles.profileIdentity}>
                    <Text
                      style={styles.profileName}
                      numberOfLines={1}
                    >
                      {selectedStudent.first_name}{" "}
                      {selectedStudent.last_name}
                    </Text>

                    <Text style={styles.profileSchool}>
                      {selectedStudent.school.name}
                    </Text>

                    <Text style={styles.profileRelationship}>
                      {selectedStudent.relationship_type}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>
                      Admission Number
                    </Text>

                    <Text style={styles.detailValue}>
                      {selectedStudent.admission_number}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>
                      Class
                    </Text>

                    <Text style={styles.detailValue}>
                      {selectedStudent.classroom_id
                        ? `Class #${selectedStudent.classroom_id}`
                        : "Not assigned"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ============================================= */}
              {/* QUICK ACCESS                                    */}
              {/* ============================================= */}

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    School Services
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Access {selectedStudent.first_name}'s
                    school information
                  </Text>
                </View>
              </View>

              <View style={styles.serviceGrid}>
                <ParentServiceCard
                  icon="document-text-outline"
                  title="Results"
                  subtitle="Academic results"
                  color={schoolBranding.primary}
                  onPress={() => {
                    router.push({
                      pathname: "/parent/results",
                      params: {
                        studentId: String(
                          selectedStudent.id
                        ),
                      },
                    });
                  }}
                />

                <ParentServiceCard
                  icon="calendar-outline"
                  title="Attendance"
                  subtitle="Attendance record"
                  color={schoolBranding.accent}
                  onPress={() => {
                    router.push({
                      pathname: "/parent/attendance",
                      params: {
                        studentId: String(
                          selectedStudent.id
                        ),
                      },
                    });
                  }}
                />

                <ParentServiceCard
                  icon="book-outline"
                  title="Learning"
                  subtitle="Learning activities"
                  color="#0F766E"
                />

                <ParentServiceCard
                  icon="notifications-outline"
                  title="Notifications"
                  subtitle="School updates"
                  color="#7C3AED"
                />

                <ParentServiceCard
                  icon="calendar-number-outline"
                  title="Events"
                  subtitle="School events"
                  color="#D97706"
                />

                <ParentServiceCard
                  icon="person-outline"
                  title="Profile"
                  subtitle="Child profile"
                  color={schoolBranding.secondary}
                />
              </View>
            </>
          )}

          {/* ================================================= */}
          {/* FOOTER                                            */}
          {/* ================================================= */}

          <View style={styles.footer}>
            <Text style={styles.footerSchool}>
              {selectedStudent?.school?.name ||
                "School"}
            </Text>

            <Text style={styles.footerText}>
              Parent access is based on your linked
              children.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


function ParentServiceCard({
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
        styles.serviceCard,
        pressed &&
          styles.serviceCardPressed,
      ]}
    >
      <View
        style={[
          styles.serviceIcon,
          {
            backgroundColor: `${color}14`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={color}
        />
      </View>

      <Text style={styles.serviceTitle}>
        {title}
      </Text>

      <Text style={styles.serviceSubtitle}>
        {subtitle}
      </Text>
    </Pressable>
  );
}


const styles = StyleSheet.create({
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

  schoolHeader: {
    marginHorizontal: -16,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  schoolHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  schoolLogoWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  schoolLogo: {
    width: 44,
    height: 44,
    resizeMode: "contain",
  },

  schoolTitleBlock: {
    flex: 1,
    marginLeft: 12,
  },

  schoolName: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  schoolTagline: {
    marginTop: 3,
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "700",
  },

  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  welcomeBlock: {
    paddingTop: 24,
    paddingBottom: 22,
  },

  welcomeEyebrow: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  welcomeTitle: {
    marginTop: 4,
    color: "#0F172A",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  welcomeSubtitle: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
  },

  motto: {
    marginTop: 7,
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },

  sectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
  },

  childrenList: {
    gap: 10,
    marginBottom: 26,
  },

  childCard: {
    minHeight: 82,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  childCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  childInfo: {
    flex: 1,
    marginHorizontal: 12,
  },

  childName: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },

  childSchool: {
    marginTop: 3,
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },

  childMeta: {
    marginTop: 3,
    color: "#94A3B8",
    fontSize: 11,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 24,
    alignItems: "center",
    marginBottom: 26,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 300,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 26,
  },

  profileAccent: {
    height: 5,
  },

  profileHeader: {
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  profileAvatar: {
    width: 74,
    height: 74,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  profileAvatarImage: {
    width: "100%",
    height: "100%",
  },

  profileIdentity: {
    flex: 1,
    marginLeft: 14,
  },

  profileName: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "900",
  },

  profileSchool: {
    marginTop: 4,
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },

  profileRelationship: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 11,
  },

  detailGrid: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: "row",
    gap: 10,
  },

  detailItem: {
    flex: 1,
    padding: 13,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
  },

  detailLabel: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  detailValue: {
    marginTop: 5,
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "800",
  },

  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },

  serviceCard: {
    width: "31.8%",
    minWidth: 100,
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 17,
    padding: 14,
  },

  serviceCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 11,
  },

  serviceTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },

  serviceSubtitle: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },

  footer: {
    paddingTop: 8,
    alignItems: "center",
  },

  footerSchool: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },

  footerText: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
});
