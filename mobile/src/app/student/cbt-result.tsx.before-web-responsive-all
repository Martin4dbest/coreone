import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getCBTResult } from "@/services/cbt";
import { Redirect } from "expo-router";

interface Question {
  question_id: number;
  question: string;
  selected_answer?: string;
  correct_answer?: string;
  marks_awarded?: number;
  marks?: number;
}

interface ResultData {
  exam_title?: string;
  school_logo?: string;
  primary_color?: string;
  score?: number;
  total_marks?: number;
  percentage?: number;
  passed?: boolean;
  questions?: Question[];
}

export default function CBTResult() {
const { attemptId } = useLocalSearchParams();
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResult();
  }, []);

  async function loadResult() {
    try {
      const result = await getCBTResult(Number(attemptId));
      setData(result);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Unable to load CBT result."
      );
    } finally {
      setLoading(false);
    }
  }

  const primaryColor = data?.primary_color || "#2563EB";

  const computedTotal =
    data?.total_marks && data.total_marks > 0
      ? data.total_marks
      : (data?.questions ?? []).reduce((acc, q) => acc + (q.marks ?? 0), 0);

  const obtainedScore = data?.score ?? 0;
  const isPassed = data?.passed ?? false;

  const handleDownloadPDF = async () => {
    if (!data) return;
    setDownloading(true);

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; }
              .header { text-align: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 16px; margin-bottom: 20px; }
              .logo { height: 60px; margin-bottom: 10px; object-fit: contain; }
              .exam-title { font-size: 22px; font-weight: 800; margin: 6px 0; color: #0f172a; }
              .summary { display: flex; justify-content: space-around; background: #f8fafc; padding: 16px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
              .summary-item { text-align: center; }
              .summary-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
              .summary-val { font-size: 18px; font-weight: 800; margin-top: 4px; }
              .q-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 12px; page-break-inside: avoid; }
              .q-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 12px; color: #64748b; margin-bottom: 8px; }
              .answer { padding: 8px 12px; border-radius: 6px; margin-top: 6px; font-size: 13px; }
              .bg-correct { background-color: #f0fdf4; color: #15803d; }
              .bg-incorrect { background-color: #fef2f2; color: #b91c1c; }
            </style>
          </head>
          <body>
            <div class="header">
              ${data.school_logo ? `<img src="${data.school_logo}" class="logo" />` : ""}
              <div class="exam-title">${data.exam_title ?? "CBT Result"}</div>
            </div>

            <div class="summary">
              <div class="summary-item">
                <div class="summary-label">Final Score</div>
                <div class="summary-val">${obtainedScore} / ${computedTotal}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Percentage</div>
                <div class="summary-val" style="color: ${primaryColor}">${(data.percentage ?? 0).toFixed(1)}%</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Status</div>
                <div class="summary-val" style="color: ${isPassed ? "#15803d" : "#b91c1c"}">
                  ${isPassed ? "PASSED" : "FAILED"}
                </div>
              </div>
            </div>

            <h3 style="margin-bottom: 12px;">Question Breakdown</h3>
            ${(data.questions ?? [])
              .map((q, idx) => {
                const isCorrect = q.selected_answer === q.correct_answer;
                return `
                  <div class="q-card">
                    <div class="q-header">
                      <span>QUESTION ${idx + 1}</span>
                      <span>${q.marks_awarded ?? 0} / ${q.marks ?? 0} Marks</span>
                    </div>
                    <p style="margin: 0 0 10px 0; font-weight: 600;">${q.question}</p>
                    <div class="answer ${isCorrect ? "bg-correct" : "bg-incorrect"}">
                      <strong>Your Answer:</strong> ${q.selected_answer ?? "Not Answered"}
                    </div>
                    ${
                      !isCorrect
                        ? `<div class="answer bg-correct">
                            <strong>Correct Answer:</strong> ${q.correct_answer ?? "-"}
                          </div>`
                        : ""
                    }
                  </div>
                `;
              })
              .join("")}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
    } catch (err) {
      Alert.alert("Export Error", "Unable to generate PDF at this time.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Loading Result...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Result not available"}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section with Logo & Compact Top Download Button */}
        <View style={styles.headerWrapper}>
          {data.school_logo ? (
            <Image
              source={{ uri: data.school_logo }}
              style={styles.schoolLogo}
              resizeMode="contain"
            />
          ) : null}

          <Text style={styles.examTitle}>
            {data.exam_title ?? "CBT Result"}
          </Text>

          <TouchableOpacity
            style={[styles.smallPdfBtn, { backgroundColor: primaryColor }]}
            onPress={handleDownloadPDF}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color="#ffffff" />
                <Text style={styles.smallPdfBtnText}>Download PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Performance Overview Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabel}>Final Score</Text>
            <Text style={styles.scoreValue}>
              {obtainedScore} <Text style={styles.scoreTotal}>/ {computedTotal}</Text>
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabel}>Percentage</Text>
            <Text style={[styles.percentValue, { color: primaryColor }]}>
              {(data.percentage ?? 0).toFixed(1)}%
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.scoreBlock}>
            <Text style={styles.scoreLabel}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                isPassed ? styles.passBadge : styles.failBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isPassed ? styles.passText : styles.failText,
                ]}
              >
                {isPassed ? "PASSED" : "FAILED"}
              </Text>
            </View>
          </View>
        </View>

        {/* Question Breakdown List */}
        <Text style={styles.sectionHeading}>Question Breakdown</Text>

        {(data.questions ?? []).map((q, index) => {
          const isCorrect = q.selected_answer === q.correct_answer;
          return (
            <View key={q.question_id || index} style={styles.questionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                <Text
                  style={[
                    styles.marksBadge,
                    isCorrect ? styles.correctMarks : styles.incorrectMarks,
                  ]}
                >
                  {q.marks_awarded ?? 0} / {q.marks ?? 0} Marks
                </Text>
              </View>

              <Text style={styles.questionText}>{q.question}</Text>

              <View style={styles.answersContainer}>
                <View
                  style={[
                    styles.answerRow,
                    isCorrect ? styles.bgCorrect : styles.bgIncorrect,
                  ]}
                >
                  <Text style={styles.answerLabel}>Your Answer:</Text>
                  <Text
                    style={[
                      styles.answerValue,
                      isCorrect ? styles.textCorrect : styles.textIncorrect,
                    ]}
                  >
                    {q.selected_answer ?? "Not Answered"}
                  </Text>
                </View>

                {!isCorrect && (
                  <View style={[styles.answerRow, styles.bgCorrect]}>
                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                    <Text style={[styles.answerValue, styles.textCorrect]}>
                      {q.correct_answer ?? "-"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Bottom PDF Download Button */}
        <View style={styles.bottomBtnWrapper}>
          <TouchableOpacity
            style={[styles.smallPdfBtn, { backgroundColor: primaryColor }]}
            onPress={handleDownloadPDF}
            disabled={downloading}
            activeOpacity={0.8}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color="#ffffff" />
                <Text style={styles.smallPdfBtnText}>Download PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
  },
  error: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  // Centered Header & Top PDF Button
  headerWrapper: {
    alignItems: "center",
    marginVertical: 12,
  },
  schoolLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 8,
  },
  examTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },

  // Compact Rounded PDF Pill Button
  smallPdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  smallPdfBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  bottomBtnWrapper: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },

  // Summary Card Styles
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreBlock: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: "#e2e8f0",
  },
  scoreLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  scoreTotal: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  percentValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  passBadge: {
    backgroundColor: "#dcfce7",
  },
  failBadge: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  passText: {
    color: "#15803d",
  },
  failText: {
    color: "#b91c1c",
  },

  // Question Card Styles
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  questionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    flex: 1,
  },
  marksBadge: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  correctMarks: {
    backgroundColor: "#f0fdf4",
    color: "#166534",
  },
  incorrectMarks: {
    backgroundColor: "#fef2f2",
    color: "#991b1b",
  },
  questionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 14,
    lineHeight: 22,
  },
  answersContainer: {
    gap: 8,
  },
  answerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
  bgCorrect: {
    backgroundColor: "#f0fdf4",
  },
  bgIncorrect: {
    backgroundColor: "#fef2f2",
  },
  answerLabel: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  answerValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  textCorrect: {
    color: "#15803d",
  },
  textIncorrect: {
    color: "#b91c1c",
  },
});