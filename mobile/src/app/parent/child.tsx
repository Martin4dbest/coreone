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

  return value.startsWith("/")
    ? `${base}${value}`
    : `${base}/${value}`;
}

export default function ParentChildScreen() {
  const params = useLocalSearchParams<{
    studentId?: string;
  }>();

  const studentId = Number(params.studentId);

  const [student, setStudent] =
    useState<ParentStudent | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!Number.isFinite(studentId)) {
          return;
        }

        const data = await getParentStudent(studentId);

        console.log(
          "PARENT CHILD RESPONSE:",
          JSON.stringify(data, null, 2)
        );

        setStudent(data);
      } catch (error) {
        console.log("PARENT CHILD ERROR:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [studentId]);

  const branding = useMemo(() => {
    return {
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
    };
  }, [student]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading child profile...</Text>
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
          <Text style={styles.errorTitle}>Child not found</Text>
          <Pressable
            style={styles.backButton}
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
  ]
    .filter(Boolean)
    .join(" ");

  const className =
    student.class_name ||
    (student.classroom_id ? `Class #${student.classroom_id}` : "Not assigned");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.viewportContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* School Header */}
          <View
            style={[
              styles.schoolHeader,
              { backgroundColor: branding.primary },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              style={styles.headerBack}
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
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
                  size={26}
                  color="#FFFFFF"
                />
              )}
            </View>

            <Text style={styles.schoolName} numberOfLines={2}>
              {student.school.name}
            </Text>

            <Text style={styles.schoolSubtitle}>Parent Portal</Text>
          </View>

          {/* Student Profile Hero */}
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

            <Text style={styles.name}>{fullName}</Text>

            {student.relationship_type ? (
              <View style={styles.relationshipBadge}>
                <Text style={styles.relationshipText}>
                  {student.relationship_type}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <Detail
              label="Admission Number"
              value={student.admission_number || "N/A"}
            />
            <Detail label="Class" value={className} />
            <Detail label="Gender" value={student.gender || "N/A"} />
            <Detail
              label="Date of Birth"
              value={student.date_of_birth || "Not available"}
            />
          </View>

          {/* School Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>School Information</Text>

            <View style={styles.schoolCard}>
              <Text style={styles.schoolCardName}>
                {student.school.name}
              </Text>

              {student.school.school_code ? (
                <Text style={styles.schoolCode}>
                  School Code: {student.school.school_code}
                </Text>
              ) : null}

              {student.school.city || student.school.state ? (
                <Text style={styles.schoolLocation}>
                  {[student.school.city, student.school.state]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Services Notice */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parent Services</Text>

            <View style={styles.noticeCard}>
              <View style={styles.noticeIconCircle}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={branding.primary}
                />
              </View>

              <View style={styles.noticeText}>
                <Text style={styles.noticeTitle}>
                  Child-Specific Access
                </Text>
                <Text style={styles.noticeBody}>
                  Academic results, attendance records, learning updates,
                  and notifications are filtered specifically for {student.first_name || "this child"}.
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
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  viewportContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },

  scrollContent: {
    paddingBottom: 32,
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
  },

  errorTitle: {
    marginTop: 12,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
  },

  backButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#4F46E5",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  schoolHeader: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerBack: {
    alignSelf: "flex-start",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  schoolLogoWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  schoolLogo: {
    width: 48,
    height: 48,
    resizeMode: "contain",
  },

  schoolName: {
    marginTop: 10,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },

  schoolSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  hero: {
    alignItems: "center",
    marginTop: -32,
    paddingHorizontal: 16,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      web: { boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)" },
    }),
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
  },

  name: {
    marginTop: 12,
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },

  relationshipBadge: {
    marginTop: 6,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  relationshipText: {
    color: "#4F46E5",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  detailsCard: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },

  detail: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },

  detailLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  detailValue: {
    marginTop: 4,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 18,
  },

  sectionTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },

  schoolCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  schoolCardName: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },

  schoolCode: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
  },

  schoolLocation: {
    marginTop: 2,
    color: "#94A3B8",
    fontSize: 12,
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },

  noticeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  noticeText: {
    flex: 1,
  },

  noticeTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },

  noticeBody: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
  },
});