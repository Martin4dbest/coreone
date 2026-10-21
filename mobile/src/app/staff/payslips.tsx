import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import api from "@/services/api";
import { getTenant, getToken } from "@/storage/auth";

const GOLD = "#D97706";
const NAVY = "#0F172A";
const MUTED = "#64748B";
const BACKGROUND = "#F4F7FB";
const WHITE = "#FFFFFF";
const BORDER = "#E2E8F0";
const GREEN = "#15803D";

type Payslip = {
  id: number;
  period: string;
  year: number;
  month: number;
  staff_name: string;
  basic_salary: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  payment_status: string;
  published_at: string | null;
  pdf_url: string;
};

function formatMoney(value: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function readableError(error: any) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (typeof error?.message === "string") return error.message;
  return "Unable to load payslips. Please try again.";
}

export default function StaffPayslipsScreen() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadPayslips = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await api.get<Payslip[]>("/payroll/me/payslips");
      setPayslips(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setError(readableError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPayslips();
  }, [loadPayslips]);

  async function openPayslip(item: Payslip) {
    if (openingId !== null) return;

    setOpeningId(item.id);

    try {
      const token = await getToken();
      const tenant = await getTenant();

      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const tenantCode = String(
        tenant?.school_code ||
          tenant?.code ||
          tenant?.schoolCode ||
          ""
      ).trim().toUpperCase();

      const apiBase = (
        process.env.EXPO_PUBLIC_API_URL ||
        "https://coreone.onrender.com"
      ).replace(/\/+$/, "");

      const directory =
        FileSystem.cacheDirectory || FileSystem.documentDirectory;

      if (!directory) {
        throw new Error("The device does not provide a file storage location.");
      }

      const safePeriod = String(item.period || `${item.year}-${item.month}`)
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      const fileUri = `${directory}CoreOne_Payslip_${safePeriod}_${item.id}.pdf`;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      };

      if (tenantCode) headers["X-Tenant"] = tenantCode;

      const result = await FileSystem.downloadAsync(
        `${apiBase}/api/v1${item.pdf_url}`,
        fileUri,
        { headers }
      );

      if (result.status < 200 || result.status >= 300) {
        throw new Error("The payslip PDF could not be downloaded.");
      }

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: "application/pdf",
          dialogTitle: `Payslip ${item.period}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert(
          "Payslip downloaded",
          `The PDF was saved to the app's temporary file area:\n${result.uri}`
        );
      }
    } catch (e: any) {
      Alert.alert("Unable to open payslip", readableError(e));
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BACKGROUND} />

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to staff dashboard"
          onPress={() => router.replace("/staff/dashboard")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={21} color={NAVY} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.brand}>
            Core<Text style={styles.brandAccent}>One</Text>
          </Text>
          <Text style={styles.headerSubtitle}>My Payslips</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh payslips"
          onPress={() => void loadPayslips(true)}
          disabled={loading || refreshing}
          style={styles.refreshButton}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={GOLD} />
          ) : (
            <Ionicons name="refresh-outline" size={21} color={GOLD} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Ionicons name="document-text-outline" size={26} color={GOLD} />
          </View>
          <Text style={styles.title}>Your salary records</Text>
          <Text style={styles.description}>
            View payslips your school has published and open or share each PDF.
            Only your own published payslips are shown here.
          </Text>
          <View style={styles.countPill}>
            <Ionicons name="lock-closed-outline" size={13} color={GREEN} />
            <Text style={styles.countText}>
              {payslips.length} published payslip
              {payslips.length === 1 ? "" : "s"}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={styles.stateText}>Loading your payslips...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Ionicons
              name="cloud-offline-outline"
              size={34}
              color="#DC2626"
            />
            <Text style={styles.stateTitle}>Could not load payslips</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadPayslips()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : payslips.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="document-text-outline"
                size={30}
                color={MUTED}
              />
            </View>
            <Text style={styles.stateTitle}>No published payslips yet</Text>
            <Text style={styles.stateText}>
              When your school publishes your payslip, it will appear here.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadPayslips(true)}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Refresh</Text>
            </Pressable>
          </View>
        ) : (
          payslips.map((item) => (
            <View key={item.id} style={styles.payslipCard}>
              <View style={styles.cardTop}>
                <View style={styles.periodIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={21}
                    color={GOLD}
                  />
                </View>
                <View style={styles.periodText}>
                  <Text style={styles.periodTitle}>{item.period}</Text>
                  <Text style={styles.publishedText}>
                    Published
                    {item.published_at
                      ? ` · ${new Date(item.published_at).toLocaleDateString(
                          "en-NG"
                        )}`
                      : ""}
                  </Text>
                </View>
                <View style={styles.publishedBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={GREEN}
                  />
                  <Text style={styles.publishedBadgeText}>Available</Text>
                </View>
              </View>

              <View style={styles.netPayBox}>
                <Text style={styles.netPayLabel}>NET PAY</Text>
                <Text style={styles.netPayValue}>
                  {formatMoney(item.net_pay)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Basic salary</Text>
                <Text style={styles.detailValue}>
                  {formatMoney(item.basic_salary)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Gross pay</Text>
                <Text style={styles.detailValue}>
                  {formatMoney(item.gross_pay)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total deductions</Text>
                <Text style={styles.deductionValue}>
                  {formatMoney(item.total_deductions)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment status</Text>
                <Text style={styles.detailValue}>
                  {String(item.payment_status || "UNPAID").replace(/_/g, " ")}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open PDF payslip for ${item.period}`}
                disabled={openingId !== null}
                onPress={() => void openPayslip(item)}
                style={({ pressed }) => [
                  styles.pdfButton,
                  (pressed || openingId === item.id) &&
                    styles.pdfButtonPressed,
                  openingId !== null &&
                    openingId !== item.id &&
                    styles.disabledButton,
                ]}
              >
                {openingId === item.id ? (
                  <ActivityIndicator size="small" color={WHITE} />
                ) : (
                  <Ionicons
                    name="document-attach-outline"
                    size={18}
                    color={WHITE}
                  />
                )}
                <Text style={styles.pdfButtonText}>
                  {openingId === item.id ? "Preparing PDF..." : "Open / Share PDF"}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, marginLeft: 12 },
  brand: { fontSize: 21, fontWeight: "900", color: NAVY },
  brandAccent: { color: GOLD },
  headerSubtitle: { marginTop: 2, fontSize: 12, color: MUTED },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 18, paddingBottom: 36 },
  introCard: {
    backgroundColor: WHITE,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: "900", color: NAVY },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    marginTop: 8,
  },
  countPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginTop: 15,
  },
  countText: { fontSize: 12, fontWeight: "700", color: GREEN },
  stateCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: NAVY,
    textAlign: "center",
    marginTop: 12,
  },
  stateText: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryText: { color: GOLD, fontSize: 13, fontWeight: "800" },
  payslipCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  periodIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  periodText: { flex: 1, marginLeft: 11 },
  periodTitle: { fontSize: 17, fontWeight: "900", color: NAVY },
  publishedText: { fontSize: 11, color: MUTED, marginTop: 4 },
  publishedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  publishedBadgeText: { fontSize: 10, fontWeight: "800", color: GREEN },
  netPayBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 15,
    padding: 15,
    marginTop: 17,
    marginBottom: 12,
  },
  netPayLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: MUTED,
  },
  netPayValue: {
    fontSize: 25,
    fontWeight: "900",
    color: NAVY,
    marginTop: 5,
  },
  detailRow: {
    minHeight: 37,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailLabel: { flex: 1, fontSize: 12, color: MUTED },
  detailValue: {
    fontSize: 12,
    color: NAVY,
    fontWeight: "700",
    textAlign: "right",
  },
  deductionValue: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "700",
    textAlign: "right",
  },
  pdfButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: NAVY,
    borderRadius: 13,
    marginTop: 17,
    paddingHorizontal: 14,
  },
  pdfButtonPressed: { opacity: 0.8 },
  disabledButton: { opacity: 0.45 },
  pdfButtonText: { fontSize: 13, fontWeight: "800", color: WHITE },
});
