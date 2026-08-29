import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!Number.isFinite(studentId)) {
          return;
        }

        const data =
          await getParentStudent(studentId);

        setStudent(data);
      } catch (error) {
        console.log(
          "PARENT CHILD ERROR:",
          error
        );
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
        "#2563EB",

      secondary:
        student?.school?.branding?.secondary_color ||
        student?.school?.secondary_color ||
        "#1E293B",

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
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading child profile...
        </Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.loading}>
        <Ionicons
          name="alert-circle-outline"
          size={44}
          color="#94A3B8"
        />

        <Text style={styles.errorTitle}>
          Child not found
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  const initials =
    `${student.first_name?.[0] || ""}${
      student.last_name?.[0] || ""
    }`.toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.schoolHeader,
            {
              backgroundColor:
                branding.primary,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.headerBack}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#FFFFFF"
            />
          </Pressable>

          <View style={styles.schoolLogoWrap}>
            {branding.logo ? (
              <Image
                source={{
                  uri: normalizeImageUrl(
                    branding.logo
                  ),
                }}
                style={styles.schoolLogo}
              />
            ) : (
              <Ionicons
                name="school-outline"
                size={28}
                color="#FFFFFF"
              />
            )}
          </View>

          <Text
            style={styles.schoolName}
            numberOfLines={2}
          >
            {student.school.name}
          </Text>

          <Text style={styles.schoolSubtitle}>
            Parent Portal
          </Text>
        </View>

        <View style={styles.hero}>
          <View
            style={[
              styles.avatar,
              {
                borderColor:
                  branding.primary,
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
              <Text
                style={[
                  styles.avatarInitials,
                  {
                    color:
                      branding.primary,
                  },
                ]}
              >
                {initials || "ST"}
              </Text>
            )}
          </View>

          <Text style={styles.name}>
            {student.first_name}{" "}
            {student.last_name}
          </Text>

          <Text style={styles.relationship}>
            {student.relationship_type}
          </Text>

          <Text style={styles.schoolText}>
            {student.school.name}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <Detail
            label="Admission Number"
            value={student.admission_number}
          />

          <Detail
            label="Class"
            value={
              student.classroom_id
                ? `Class #${student.classroom_id}`
                : "Not assigned"
            }
          />

          <Detail
            label="Gender"
            value={student.gender}
          />

          <Detail
            label="Date of Birth"
            value={
              student.date_of_birth || "Not available"
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            School
          </Text>

          <View style={styles.schoolCard}>
            <Text style={styles.schoolCardName}>
              {student.school.name}
            </Text>

            <Text style={styles.schoolCode}>
              School Code:{" "}
              {student.school.school_code}
            </Text>

            {student.school.city ||
            student.school.state ? (
              <Text style={styles.schoolLocation}>
                {[
                  student.school.city,
                  student.school.state,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Parent Services
          </Text>

          <View style={styles.noticeCard}>
            <Ionicons
              name="information-circle-outline"
              size={23}
              color={branding.primary}
            />

            <View style={styles.noticeText}>
              <Text style={styles.noticeTitle}>
                Child-specific access
              </Text>

              <Text style={styles.noticeBody}>
                Academic results, attendance, learning,
                notifications and other school services
                will be displayed for this child only.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    paddingBottom: 40,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  errorTitle: {
    marginTop: 10,
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },

  backButton: {
    marginTop: 18,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: "#0F172A",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  schoolHeader: {
    paddingTop: 18,
    paddingBottom: 24,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  headerBack: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  schoolLogoWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  schoolLogo: {
    width: 52,
    height: 52,
    resizeMode: "contain",
  },

  schoolName: {
    marginTop: 11,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  schoolSubtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "700",
  },

  hero: {
    alignItems: "center",
    paddingTop: 26,
    paddingHorizontal: 20,
  },

  avatar: {
    width: 104,
    height: 104,
    borderRadius: 32,
    borderWidth: 4,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitials: {
    fontSize: 30,
    fontWeight: "900",
  },

  name: {
    marginTop: 15,
    color: "#0F172A",
    fontSize: 25,
    fontWeight: "900",
  },

  relationship: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  schoolText: {
    marginTop: 5,
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
  },

  detailsCard: {
    margin: 18,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },

  detail: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
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
    fontSize: 13,
    fontWeight: "800",
  },

  section: {
    paddingHorizontal: 18,
    marginTop: 6,
  },

  sectionTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 10,
  },

  schoolCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  schoolCardName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },

  schoolCode: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 11,
  },

  schoolLocation: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 11,
  },

  noticeCard: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  noticeText: {
    flex: 1,
    marginLeft: 11,
  },

  noticeTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },

  noticeBody: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
  },
});
