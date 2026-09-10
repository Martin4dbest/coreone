import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import api from "@/services/api";

type PaymentInitializeResponse = {
  payment_id: number;
  reference: string;
  amount: string | number;
  currency: string;
  provider: string;
  authorization_url: string;
  access_code?: string | null;
};

type PaymentVerifyResponse = {
  payment_id: number;
  reference: string;
  status: string;
  amount: string | number;
  currency: string;
  payment_idempotent: boolean;
  student_fee_id: number;
  amount_paid: string | number;
  outstanding_balance: string | number;
  fee_status: string;
};

export default function ParentPaymentScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    studentFeeId?: string;
    amount?: string;
  }>();

  const studentFeeId = Number(params.studentFeeId);
  const amount = Number(params.amount);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paymentResult, setPaymentResult] =
    useState<PaymentVerifyResponse | null>(null);

  useEffect(() => {
    if (!studentFeeId || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert(
        "Invalid payment",
        "The payment information could not be loaded.",
        [
          {
            text: "Go Back",
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [studentFeeId, amount, router]);

  const formatAmount = (value: number | string) => {
    const numericValue = Number(value);

    return `₦${numericValue.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const verifyPayment = async (reference: string) => {
    setChecking(true);

    try {
      let lastResponse: PaymentVerifyResponse | null = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await api.post<PaymentVerifyResponse>(
            "/payments/verify",
            { reference }
          );

          lastResponse = response.data;

          if (lastResponse.status === "SUCCESS") {
            setPaymentResult(lastResponse);
            return true;
          }
        } catch (error: any) {
          console.log(
            `Payment verification attempt ${attempt} failed:`,
            error?.response?.data || error?.message
          );
        }

        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      if (lastResponse) {
        setPaymentResult(lastResponse);
      }

      return false;
    } finally {
      setChecking(false);
    }
  };

  const startPayment = async () => {
    if (!studentFeeId || !Number.isFinite(amount) || amount <= 0) {
      Alert.alert(
        "Invalid payment",
        "The payment information is not valid."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await api.post<PaymentInitializeResponse>(
        "/payments/initialize",
        {
          student_fee_id: studentFeeId,
          amount,
        }
      );

      const payment = response.data;

      if (!payment?.authorization_url) {
        throw new Error(
          "The payment gateway did not return a checkout URL."
        );
      }

      const checkoutUrl = payment.authorization_url.trim();

      if (!checkoutUrl.startsWith("https://")) {
        throw new Error("Invalid Paystack checkout URL.");
      }

      console.log("PAYSTACK CHECKOUT URL:", checkoutUrl);

      if (Platform.OS === "web") {
        window.location.href = checkoutUrl;
        return;
      }

      await Linking.openURL(checkoutUrl);
    } catch (error: any) {
      console.log(
        "Payment initialization error:",
        error?.response?.data || error?.message || error
      );

      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Unable to start the payment.";

      Alert.alert("Payment failed", String(detail));
    } finally {
      setLoading(false);
    }
  };

  if (!studentFeeId || !Number.isFinite(amount) || amount <= 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  /* Success View */
  if (paymentResult?.status === "SUCCESS") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.viewportContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                router.replace({
                  pathname: "/parent/fees",
                  params: {
                    studentId: String(params.studentFeeId),
                  },
                })
              }
            >
              <Text style={styles.backText}>‹ Fees</Text>
            </TouchableOpacity>

            <View style={styles.successPanel}>
              <View style={styles.successBadge}>
                <Text style={styles.successCheck}>✓</Text>
              </View>

              <Text style={styles.successTitle}>Payment Successful</Text>

              <Text style={styles.successSubtitle}>
                Your payment has been verified and your school fee balance has
                been updated.
              </Text>

              <View style={styles.successAmount}>
                <Text style={styles.successAmountLabel}>Amount Paid</Text>
                <Text style={styles.successAmountValue}>
                  {formatAmount(paymentResult.amount)}
                </Text>
              </View>

              <View style={styles.receiptRows}>
                <InfoRow label="Reference" value={paymentResult.reference} />
                <InfoRow
                  label="Fee status"
                  value={paymentResult.fee_status.replace("_", " ")}
                />
                <InfoRow
                  label="Outstanding"
                  value={formatAmount(paymentResult.outstanding_balance)}
                />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() =>
                  router.replace({
                    pathname: "/parent/fees",
                    params: {
                      studentId: String(params.studentFeeId),
                    },
                  })
                }
              >
                <Text style={styles.primaryButtonText}>
                  Return to School Fees
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  /* Payment Form View */
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.viewportContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading || checking}
          >
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.eyebrow}>SCHOOL FEES</Text>
            <Text style={styles.title}>Make a Payment</Text>
            <Text style={styles.subtitle}>
              Pay your outstanding school fees securely.
            </Text>
          </View>

          <View style={styles.paymentCard}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.cardLabel}>Amount to pay</Text>
                <Text style={styles.amount}>{formatAmount(amount)}</Text>
              </View>

              <View style={styles.secureBadge}>
                <Text style={styles.secureBadgeText}>SECURE</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.paymentRow}>
              <View style={styles.paymentIcon}>
                <Text style={styles.paymentIconText}>₦</Text>
              </View>

              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>
                  Online School Fee Payment
                </Text>
                <Text style={styles.paymentDescription}>
                  You will complete payment securely through Paystack.
                </Text>
              </View>
            </View>

            <View style={styles.notice}>
              <View style={styles.noticeIconCircle}>
                <Text style={styles.noticeIcon}>i</Text>
              </View>
              <Text style={styles.noticeText}>
                Your fee balance will only be updated after CoreOne verifies
                the transaction.
              </Text>
            </View>

            {checking ? (
              <View style={styles.checking}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.checkingText}>
                  Verifying payment status...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  loading && styles.disabledButton,
                ]}
                onPress={startPayment}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.primaryButtonText}>
                      Starting payment...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Continue to Paystack
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <Text style={styles.footerNote}>
              Secure payment • NGN • Powered by Paystack
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading || checking}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  /* Navigation / Top */
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)" },
    }),
  },

  backText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },

  header: {
    marginBottom: 18,
  },

  eyebrow: {
    color: "#4F46E5",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  title: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 4,
  },

  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },

  /* Payment Card */
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  cardLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  amount: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  secureBadge: {
    backgroundColor: "#EEF2FF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  secureBadgeText: {
    color: "#4F46E5",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    marginRight: 14,
  },

  paymentIconText: {
    color: "#4F46E5",
    fontSize: 18,
    fontWeight: "700",
  },

  paymentInfo: {
    flex: 1,
  },

  paymentTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },

  paymentDescription: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
  },

  /* Notice */
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 10,
  },

  noticeIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  noticeIcon: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  noticeText: {
    flex: 1,
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
  },

  /* Actions & Buttons */
  checking: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },

  checkingText: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },

  primaryButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    width: "100%",
  },

  disabledButton: {
    opacity: 0.65,
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  footerNote: {
    color: "#94A3B8",
    fontSize: 11,
    textAlign: "center",
    marginTop: 14,
  },

  cancelButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  cancelText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  /* Success View Styles */
  successPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 24,
    alignItems: "center",
  },

  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  successCheck: {
    color: "#16A34A",
    fontSize: 28,
    fontWeight: "800",
  },

  successTitle: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },

  successSubtitle: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 20,
  },

  successAmount: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },

  successAmountLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  successAmountValue: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
  },

  receiptRows: {
    width: "100%",
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  infoLabel: {
    color: "#64748B",
    fontSize: 12,
  },

  infoValue: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
});