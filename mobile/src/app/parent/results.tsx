import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  getParentStudentResults,
  ParentResultsReport,
} from "@/services/parent";

export default function ParentResultsScreen() {
  const { studentId } =
    useLocalSearchParams<{
      studentId?: string;
    }>();

  const id = Number(studentId);

  const [report, setReport] =
    useState<ParentResultsReport | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function load() {
    try {
      const data =
        await getParentStudentResults(id);

      setReport(data);
      setErrorMessage("");
    } catch (error: any) {
      console.log(
        "PARENT RESULTS ERROR:",
        error?.response?.data ||
          error?.message
      );

      setErrorMessage(
        error?.response?.data?.detail ||
          "The report card is not available yet."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (Number.isFinite(id)) {
      load();
    } else {
      setLoading(false);
      setErrorMessage(
        "Invalid student reference."
      );
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading results...
        </Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.loading}>
        <Ionicons
          name="document-text-outline"
          size={46}
          color="#94A3B8"
        />

        <Text style={styles.errorTitle}>
          Results not available
        </Text>

        <Text style={styles.errorText}>
          {errorMessage}
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

  const primaryColor =
    report.school.primary_color ||
    "#2563EB";

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: primaryColor,
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backIcon}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#FFFFFF"
            />
          </Pressable>

          <Ionicons
            name="document-text-outline"
            size={30}
            color="#FFFFFF"
          />

          <Text style={styles.headerTitle}>
            Academic Results
          </Text>

          <Text style={styles.headerStudent}>
            {report.student.name}
          </Text>

          <Text style={styles.headerSchool}>
            {report.school.name}
          </Text>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>
              Session
            </Text>

            <Text style={styles.metaValue}>
              {report.session || "—"}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>
              Term
            </Text>

            <Text style={styles.metaValue}>
              {report.term || "—"}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>
              Class
            </Text>

            <Text style={styles.metaValue}>
              {report.student.class || "—"}
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard
            label="Average"
            value={`${report.average}`}
            color={primaryColor}
          />

          <SummaryCard
            label="Position"
            value={
              report.position !== null
                ? `${report.position}`
                : "—"
            }
            color="#7C3AED"
          />

          <SummaryCard
            label="Attendance"
            value={`${report.attendance}%`}
            color="#16A34A"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Subject Results
          </Text>

          <View style={styles.resultsCard}>
            {report.subjects.map(
              (subject, index) => (
                <View
                  key={
                    subject.result_id ||
                    subject.id
                  }
                  style={[
                    styles.subjectRow,
                    index <
                      report.subjects.length - 1 &&
                      styles.subjectDivider,
                  ]}
                >
                  <View style={styles.subjectInfo}>
                    <Text
                      style={styles.subjectName}
                    >
                      {subject.name}
                    </Text>

                    <Text style={styles.scoreText}>
                      CA {subject.ca ?? 0} · Exam{" "}
                      {subject.exam ?? 0}
                    </Text>
                  </View>

                  <View style={styles.subjectScore}>
                    <Text style={styles.totalScore}>
                      {subject.total ?? 0}
                    </Text>

                    <View
                      style={[
                        styles.gradeBadge,
                        {
                          backgroundColor:
                            `${primaryColor}14`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.gradeText,
                          {
                            color:
                              primaryColor,
                          },
                        ]}
                      >
                        {subject.grade || "—"}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            School Remark
          </Text>

          <View style={styles.remarkCard}>
            <Ionicons
              name="school-outline"
              size={22}
              color={primaryColor}
            />

            <Text style={styles.remarkText}>
              {report.remark || "—"}
            </Text>
          </View>
        </View>

        {(
          report.comments?.teacher ||
          report.comments?.class_teacher ||
          report.comments?.principal
        ) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Report Comments
            </Text>

            {report.comments?.class_teacher ||
            report.comments?.teacher ? (
              <CommentCard
                title="Class Teacher"
                text={
                  report.comments.class_teacher ||
                  report.comments.teacher ||
                  ""
                }
                color={primaryColor}
              />
            ) : null}

            {report.comments?.principal ? (
              <CommentCard
                title="Principal / Head"
                text={
                  report.comments.principal
                }
                color="#7C3AED"
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerSchool}>
            {report.school.name}
          </Text>

          <Text style={styles.footerText}>
            Official published report
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.summaryValue,
          { color },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function CommentCard({
  title,
  text,
  color,
}: {
  title: string;
  text: string;
  color: string;
}) {
  return (
    <View style={styles.commentCard}>
      <View
        style={[
          styles.commentLine,
          {
            backgroundColor: color,
          },
        ]}
      />

      <View style={styles.commentBody}>
        <Text style={styles.commentTitle}>
          {title}
        </Text>

        <Text style={styles.commentText}>
          {text}
        </Text>
      </View>
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
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  errorTitle: {
    marginTop: 11,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  errorText: {
    marginTop: 7,
    maxWidth: 310,
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  backButton: {
    marginTop: 18,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: "#0F172A",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  header: {
    paddingTop: 18,
    paddingBottom: 26,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  backIcon: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 9,
  },

  headerTitle: {
    marginTop: 8,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  headerStudent: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  headerSchool: {
    marginTop: 3,
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "600",
  },

  metaCard: {
    margin: 18,
    padding: 14,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    gap: 9,
  },

  metaItem: {
    flex: 1,
    padding: 10,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
  },

  metaLabel: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  metaValue: {
    marginTop: 4,
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "800",
  },

  summaryRow: {
    paddingHorizontal: 18,
    flexDirection: "row",
    gap: 9,
  },

  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },

  summaryLabel: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  summaryValue: {
    marginTop: 5,
    fontSize: 20,
    fontWeight: "900",
  },

  section: {
    paddingHorizontal: 18,
    marginTop: 26,
  },

  sectionTitle: {
    marginBottom: 10,
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
  },

  resultsCard: {
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },

  subjectRow: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  subjectDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  subjectInfo: {
    flex: 1,
  },

  subjectName: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },

  scoreText: {
    marginTop: 4,
    color: "#94A3B8",
    fontSize: 10,
  },

  subjectScore: {
    alignItems: "flex-end",
    marginLeft: 12,
  },

  totalScore: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },

  gradeBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  gradeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  remarkCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
  },

  remarkText: {
    flex: 1,
    marginLeft: 11,
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },

  commentCard: {
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    overflow: "hidden",
  },

  commentLine: {
    width: 5,
  },

  commentBody: {
    flex: 1,
    padding: 15,
  },

  commentTitle: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
  },

  commentText: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
  },

  footer: {
    marginTop: 28,
    alignItems: "center",
  },

  footerSchool: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },

  footerText: {
    marginTop: 3,
    color: "#94A3B8",
    fontSize: 10,
  },
});
