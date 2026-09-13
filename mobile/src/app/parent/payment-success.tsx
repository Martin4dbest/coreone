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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import api from "@/services/api";

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

export default function PaymentSuccessScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    reference?: string;
  }>();

  const reference =
    typeof params.reference === "string"
      ? params.reference.trim()
      : "";

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] =
    useState<PaymentVerifyResponse | null>(null);

  useEffect(() => {
    if (!reference) {
      setLoading(false);

      Alert.alert(
        "Payment reference missing",
        "We could not identify this payment.",
        [
          {
            text: "Go to Dashboard",
            onPress: () =>
              router.replace("/parent/dashboard"),
          },
        ]
      );

      return;
    }

    verifyPayment();
  }, [reference]);

  const verifyPayment = async () => {
    setLoading(true);

    try {
      let result: PaymentVerifyResponse | null = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response =
            await api.post<PaymentVerifyResponse>(
              "/payments/verify",
              { reference }
            );

          result = response.data;

          if (result.status === "SUCCESS") {
            setPayment(result);
            return;
          }
        } catch (error: any) {
          console.log(
            `Payment verification attempt ${attempt} failed:`,
            error?.response?.data ||
              error?.message ||
              error
          );
        }

        if (attempt < 3) {
          await new Promise((resolve) =>
            setTimeout(resolve, 2000)
          );
        }
      }

      if (!result || result.status !== "SUCCESS") {
        Alert.alert(
          "Payment verification pending",
          "We could not confirm the payment yet. Please check your payment history shortly.",
          [
            {
              text: "Go to Dashboard",
              onPress: () =>
                router.replace("/parent/dashboard"),
            },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const money = (value: number | string) => {
    const numericValue = Number(value);

    return `₦${numericValue.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#4F46E5"
          />

          <Text style={styles.loadingTitle}>
            Verifying payment
          </Text>

          <Text style={styles.loadingText}>
            Please wait while CoreOne confirms your
            transaction.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!payment || payment.status !== "SUCCESS") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.pendingTitle}>
            Payment verification pending
          </Text>

          <Text style={styles.loadingText}>
            Your payment has not been confirmed yet.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.replace("/parent/dashboard")
            }
          >
            <Text style={styles.primaryButtonText}>
              Return to Parent Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✓</Text>
        </View>

        <Text style={styles.title}>
          Payment Successful
        </Text>

        <Text style={styles.subtitle}>
          Your payment has been verified successfully
          and your school fee account has been updated.
        </Text>

        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptBrand}>
              CoreOne
            </Text>

            <Text style={styles.receiptLabel}>
              PAYMENT RECEIPT
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>
              Amount Paid
            </Text>

            <Text style={styles.amount}>
              {money(payment.amount)}
            </Text>
          </View>

          <View style={styles.separator} />

          <ReceiptRow
            label="Reference"
            value={payment.reference}
          />

          <ReceiptRow
            label="Payment Status"
            value="SUCCESS"
          />

          <ReceiptRow
            label="Fee Status"
            value={payment.fee_status.replace(
              "_",
              " "
            )}
          />

          <ReceiptRow
            label="Outstanding Balance"
            value={money(payment.outstanding_balance)}
          />

          <ReceiptRow
            label="Currency"
            value={payment.currency}
          />

          <ReceiptRow
            label="Payment ID"
            value={String(payment.payment_id)}
          />

          <View style={styles.verifiedBox}>
            <Text style={styles.verifiedText}>
              ✓ Payment verified by CoreOne
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() =>
            router.replace("/parent/dashboard")
          }
        >
          <Text style={styles.primaryButtonText}>
            Return to Parent Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={() =>
            router.replace("/parent/fees")
          }
        >
          <Text style={styles.secondaryButtonText}>
            View School Fees
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Keep this payment reference for your records.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReceiptRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>

      <Text
        style={styles.rowValue}
        numberOfLines={2}
      >
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

  content: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 32,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  loadingText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
  },

  pendingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },

  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  successIconText: {
    fontSize: 38,
    fontWeight: "900",
    color: "#16A34A",
  },

  title: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: "#64748B",
  },

  receiptCard: {
    marginTop: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  receiptHeader: {
    alignItems: "center",
  },

  receiptBrand: {
    fontSize: 24,
    fontWeight: "900",
    color: "#4F46E5",
  },

  receiptLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#64748B",
  },

  separator: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 18,
  },

  amountSection: {
    alignItems: "center",
  },

  amountLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  amount: {
    marginTop: 5,
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 9,
  },

  rowLabel: {
    flex: 1,
    fontSize: 13,
    color: "#64748B",
  },

  rowValue: {
    flex: 1.4,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    color: "#0F172A",
  },

  verifiedBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  verifiedText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    color: "#15803D",
  },

  primaryButton: {
    marginTop: 22,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 18,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    marginTop: 10,
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 18,
  },

  secondaryButtonText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "800",
  },

  footer: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 12,
    color: "#94A3B8",
  },
});
