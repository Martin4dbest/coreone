import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import {
  getParentStudent,
  ParentStudent,
} from "@/services/parent";

function normalizeImageUrl(
  value?: string | null
): string | undefined {
  if (!value) return undefined;

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

  return value.startsWith("/")
    ? `${base}${value}`
    : `${base}/${value}`;
}

export default function ParentChildScreen() {
  const params = useLocalSearchParams<{
    studentId?: string | string[];
  }>();

  const rawStudentId = Array.isArray(params.studentId)
    ? params.studentId[0]
    : params.studentId;

  const studentId = Number(rawStudentId);

  const [student, setStudent] =
    useState<ParentStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError("");
      setStudent(null);

      try {
        if (
          !rawStudentId ||
          !Number.isInteger(studentId) ||
          studentId <= 0
        ) {
          if (active) {
            setLoadError(
              "A valid child profile could not be identified."
            );
          }
          return;
        }

        const data = await getParentStudent(studentId);

        if (!active) return;

        console.log(
          "PARENT CHILD RESPONSE:",
          JSON.stringify(data, null, 2)
        );

        if (!data || typeof data !== "object") {
          setLoadError(
            "The server returned no child profile."
          );
          return;
        }

        setStudent(data);
      } catch (error: any) {
        console.log(
          "PARENT CHILD ERROR:",
          error?.response?.data || error?.message || error
        );

        if (active) {
          setLoadError(
            error?.response?.data?.detail ||
              error?.response?.data?.message ||
              "Unable to load this child profile. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [rawStudentId, studentId]);

  const branding = useMemo(() => ({
    primary:
      student?.school?.branding?.primary_color ||
      student?.school?.primary_color ||
      "#4F46E5",
    secondary:
      student?.school?.branding?.secondary_color ||
      student?.school?.secondary_color ||
      "#0F172A",
    accent:
      student?.school?.branding?.accent_color ||
      "#F43F5E",
    logo:
      student?.school?.branding?.logo_url ||
      student?.school?.logo ||
      undefined,
  }), [student]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>
            Loading child profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color="#94A3B8"
          />
          <Text style={styles.errorTitle}>
            {loadError || "Child profile unavailable"}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressedState,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const initials =
    `${student.first_name?.[0] || ""}${
      student.last_name?.[0] || ""
    }`.toUpperCase();

  const fullName = [
    student.first_name,
    student.middle_name,
    student.last_name,
  ].filter(Boolean).join(" ");

  const className =
    student.class_name ||
    (student.classroom_id
      ? `Class #${student.classroom_id}`
      : "Not assigned");

  const school = student.school;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.viewportContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ================= SCHOOL HEADER BANNER ================= */}
          <View
            style={[
              styles.schoolHeader,
              { backgroundColor: branding.secondary },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.headerBack,
                pressed && styles.pressedState,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.schoolLogoWrap}>
              {branding.logo ? (
                <Image
                  source={{
                    uri: normalizeImageUrl(branding.logo),
                  }}
                  style={styles.schoolLogo}
                />
              ) : (
                <Ionicons
                  name="school-outline"
                  size={24}
                  color="#FFFFFF"
                />
              )}
            </View>

            <Text style={styles.schoolName} numberOfLines={2}>
              {school?.name || "School"}
            </Text>

            <Text style={styles.schoolSubtitle}>
              Official Student Profile
            </Text>
          </View>

          {/* ================= STUDENT HERO ================= */}
          <View style={styles.hero}>
            <View
              style={[
                styles.avatar,
                { borderColor: branding.primary },
              ]}
            >
              {student.passport ? (
                <Image
                  source={{
                    uri: normalizeImageUrl(student.passport),
                  }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text
                  style={[
                    styles.avatarInitials,
                    { color: branding.primary },
                  ]}
                >
                  {initials || "ST"}
                </Text>
              )}
            </View>

            <Text style={styles.name}>
              {fullName || "Student"}
            </Text>

            <View style={[styles.relationshipBadge, { backgroundColor: `${branding.primary}12` }]}>
              <Ionicons name="sparkles" size={12} color={branding.primary} />
              <Text style={[styles.relationshipText, { color: branding.primary }]}>
                STUDENT
              </Text>
            </View>
          </View>

          {/* ================= ACADEMIC DETAILS ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Academic & Personal Details</Text>
            <View style={styles.detailsCard}>
              <Detail
                icon="card-outline"
                label="Admission Number"
                value={student.admission_number || "N/A"}
                color="#2563EB"
              />
              <Detail
                icon="easel-outline"
                label="Class Enrolled"
                value={className}
                color="#059669"
              />
              <Detail
                icon="person-outline"
                label="Gender"
                value={student.gender || "N/A"}
                color="#7C3AED"
              />
              <Detail
                icon="calendar-outline"
                label="Date of Birth"
                value={student.date_of_birth || "Not available"}
                color="#D97706"
              />
            </View>
          </View>

          {/* ================= SCHOOL INFORMATION ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              School Information
            </Text>

            <View style={styles.schoolCard}>
              <View style={styles.schoolCardTop}>
                <View style={[styles.schoolIconContainer, { backgroundColor: `${branding.primary}14` }]}>
                  <Ionicons name="business" size={20} color={branding.primary} />
                </View>
                <View style={styles.schoolMetaGroup}>
                  <Text style={styles.schoolCardName}>
                    {school?.name || "School information unavailable"}
                  </Text>
                  {school?.school_code ? (
                    <Text style={styles.schoolCode}>
                      School Code: {school.school_code}
                    </Text>
                  ) : null}
                </View>
              </View>

              {school?.city || school?.state ? (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text style={styles.schoolLocation}>
                    {[school?.city, school?.state]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ================= PARENT NOTICE CARD ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Parent Services
            </Text>

            <View style={styles.noticeCard}>
              <View style={[styles.noticeIconCircle, { backgroundColor: `${branding.primary}14` }]}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={branding.primary}
                />
              </View>

              <View style={styles.noticeText}>
                <Text style={styles.noticeTitle}>
                  Child-Specific Portal Access
                </Text>
                <Text style={styles.noticeBody}>
                  Academic results, attendance tracking, and fee updates are filtered specifically for {student.first_name || "this child"}.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Detail({
  icon,
  label,
  value,
  color = "#4F46E5",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.detail}>
      <View style={[styles.detailIconBox, { backgroundColor: `${color}14` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={styles.detailTextContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  viewportContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  errorTitle: {
    marginTop: 12,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  backButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    elevation: 2,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  schoolHeader: {
    paddingTop: Platform.OS === "android" ? 28 : 16,
    paddingBottom: 36,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerBack: {
    alignSelf: "flex-start",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  schoolLogoWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  schoolLogo: {
    width: 42,
    height: 42,
    resizeMode: "contain",
  },
  schoolName: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  schoolSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  hero: {
    alignItems: "center",
    marginTop: -26,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 3,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: "800",
  },
  name: {
    marginTop: 10,
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  relationshipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  relationshipText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  detailsCard: {
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  detail: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  detailIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    marginTop: 1,
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  schoolCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  schoolCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  schoolIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  schoolMetaGroup: {
    flex: 1,
  },
  schoolCardName: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  schoolCode: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  schoolLocation: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  noticeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeText: {
    flex: 1,
  },
  noticeTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  noticeBody: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
  },
  pressedState: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});