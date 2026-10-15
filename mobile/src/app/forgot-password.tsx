import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";
import { setPasswordResetLoginDetails } from "@/utils/passwordResetRedirect";

export default function ForgotPasswordScreen() {
  const [schoolCode, setSchoolCode] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResetPassword() {
    if (
      !schoolCode.trim() ||
      !email.trim() ||
      !newPassword ||
      !confirmPassword
    ) {
      Alert.alert("Missing Information", "Please complete all fields.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Password Too Short",
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords Do Not Match", "Please enter matching passwords.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/mobile-reset-password", {
        school_code: schoolCode.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setPasswordResetLoginDetails({
        schoolCode: schoolCode.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        password: newPassword,
      });

      const successMessage = "Password changed successfully! You can now sign in with your new password.";

      if (Platform.OS === "web") {
        window.alert(successMessage);
        router.replace("/login");
      } else {
        Alert.alert("Password Updated", successMessage, [
          { text: "Continue to Login", onPress: () => router.replace("/login") },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Unable to Reset Password",
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Please check your school code and registered email, then try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#FFF7F7", "#F8FAFC", "#EEF2FF"]}
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={30} color="#B91C1C" />
              </View>

              <Text style={styles.title}>Reset Your Password</Text>
              <Text style={styles.subtitle}>
                Enter your school code and registered email, then choose a new
                password.
              </Text>

              <Text style={styles.label}>School Code</Text>
              <TextInput
                value={schoolCode}
                onChangeText={setSchoolCode}
                placeholder="Enter school code"
                autoCapitalize="characters"
                autoCorrect={false}
                style={styles.input}
                editable={!loading}
              />

              <Text style={styles.label}>Registered Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                editable={!loading}
              />

              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.passwordInput}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowPassword((current) => !current)}
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  hitSlop={10}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={21}
                    color="#64748B"
                  />
                </Pressable>
              </View>

              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={styles.input}
                editable={!loading}
              />

              <Pressable
                onPress={handleResetPassword}
                disabled={loading}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  loading && styles.buttonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark-outline" size={19} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Update Password</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => router.replace("/login")}
                disabled={loading}
                style={styles.backLink}
              >
                <Ionicons name="arrow-back" size={17} color="#B91C1C" />
                <Text style={styles.backText}>Back to Login</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },
  card: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 7,
    marginTop: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 13,
    color: "#0F172A",
    fontSize: 14,
  },
  passwordContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    color: "#0F172A",
    fontSize: 14,
  },
  button: {
    minHeight: 49,
    borderRadius: 25,
    backgroundColor: "#B91C1C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 24,
  },
  buttonPressed: { opacity: 0.85 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 20,
    paddingVertical: 8,
  },
  backText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "700",
  },
});
