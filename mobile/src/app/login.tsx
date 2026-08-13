import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";

const { width } = Dimensions.get("window");
const isDesktopWeb = Platform.OS === "web" && width >= 900;
const desktopLoginWidth = Math.min(
  Math.max(width - 48, 320),
  460
);

export default function Login() {
  const { login } = useAuth();

  const [schoolCode, setSchoolCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  async function handleLogin() {
    if (!schoolCode || !email || !password) {
      Alert.alert("Missing Details", "Please fill in all fields to sign in.");
      return;
    }

    try {
      setLoading(true);

      const data = await login(schoolCode.trim(), email.trim(), password);

      if (data?.user?.must_change_password) {
        router.replace("/change-password");
        return;
      }

      if (data?.user?.role === "STUDENT") {
        router.replace("/student/dashboard");
      } else if (data?.user?.role === "PARENT") {
        router.replace("/parent/dashboard");
      } else {
        router.replace("/");
      }
    } catch (error) {
      Alert.alert("Login Failed", "Invalid school code or account credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#FFFFFF", "#F8FAFC", "#F1F5F9"]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.safeArea}>

        {/* Top Navigation Bar with Back Button */}
        <View style={styles.navHeader}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Image
                  source={require("../../assets/images/presense-logo.png")}
                  style={styles.logo}
                />
              </View>
              {/* Customized PreSense text styling */}
              <Text style={styles.brand}>
                <Text style={styles.brandPre}>Pre</Text>
                <Text style={styles.brandSense}>Sense</Text>
              </Text>
              <Text style={styles.title}>Portal Sign In</Text>
              <Text style={styles.subtitle}>Enter your institutional credentials</Text>
            </View>

            {/* Input Form Card */}
            <View style={styles.card}>

              {/* School Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>School Code</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    placeholder="e.g. LB1234"
                    placeholderTextColor="#94A3B8"
                    value={schoolCode}
                    onChangeText={setSchoolCode}
                    style={styles.input}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    ref={emailRef}
                    placeholder="student@school.edu"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={12}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#334155"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Action Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Sign In to Portal</Text>
                    <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

            </View>

            {/* Professional Bottom Back Button Link */}
            <Pressable
              style={({ pressed }) => [
                styles.bottomBackLink,
                pressed && styles.bottomBackLinkPressed,
              ]}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <Ionicons name="arrow-back-circle-outline" size={20} color="#64748B" />
              <Text style={styles.bottomBackText}>Return to Overview</Text>
            </Pressable>

            {/* Footer with PreSense text color customization */}
            <Text style={styles.footer}>
              Powered by <Text style={styles.brandPre}>Pre</Text><Text style={styles.brandSense}>Sense</Text> Technologies
            </Text>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  navHeader: {
    width: isDesktopWeb ? desktopLoginWidth : "100%",
    alignSelf: "center",
    paddingHorizontal: isDesktopWeb ? 0 : 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonPressed: {
    opacity: 0.8,
    backgroundColor: "#F1F5F9",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: isDesktopWeb ? 0 : 22,
    paddingBottom: isDesktopWeb ? 32 : 24,
    width: isDesktopWeb ? desktopLoginWidth : "100%",
    alignSelf: "center",
  },

  /* Header Section */
  header: {
    alignItems: "center",
    width: "100%",
    marginBottom: isDesktopWeb ? 22 : 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  brand: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandPre: {
    color: "#000000",
  },
  brandSense: {
    color: "#B91C1C",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B91C1C",
    marginTop: 6,
  },
  subtitle: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
    textAlign: "center",
  },

  /* Input Card */
  card: {
    width: isDesktopWeb ? desktopLoginWidth : "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: isDesktopWeb ? 22 : 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500",
  },
  eyeIcon: {
    padding: 4,
  },

  /* Primary Button */
  button: {
    height: 48,
    width: "100%",
    borderRadius: 24,
    backgroundColor: "#B91C1C",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    shadowColor: "#B91C1C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  /* Bottom Back Navigation Link */
  bottomBackLink: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(241, 245, 249, 0.6)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bottomBackLinkPressed: {
    backgroundColor: "#E2E8F0",
  },
  bottomBackText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },

  /* Footer */
  footer: {
    alignSelf: "center",
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 16,
  },
});