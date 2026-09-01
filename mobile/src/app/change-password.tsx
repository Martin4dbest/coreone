import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const { width: screenWidth } = Dimensions.get("window");

const isDesktopWeb =
  Platform.OS === "web" && screenWidth >= 900;

const desktopMaxWidth = Math.min(
  Math.max(screenWidth - 40, 320),
  520
);

export default function ChangePassword() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  async function submit() {
    if (!currentPassword || !newPassword) {
      Alert.alert(
        "Missing Details",
        "Please enter your current password and a new password."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (user?.role === "PARENT") {
        router.replace("/parent/dashboard");
      } else if (user?.role === "STUDENT") {
        router.replace("/student/dashboard");
      } else {
        router.replace("/");
      }
    } catch (error: any) {
      console.log(
        "CHANGE PASSWORD ERROR:",
        error?.response?.data || error?.message
      );

      Alert.alert(
        "Error",
        error?.response?.data?.detail ||
          "Unable to change password"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#020617", "#0f172a"]}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          Secure Your Account
        </Text>

        <Text style={styles.subtitle}>
          Create a new password before continuing
        </Text>
      </View>

      <View style={styles.card}>

        {/* Current Password */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Current Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showCurrentPassword}
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={styles.eyeButton}
            onPress={() =>
              setShowCurrentPassword(
                !showCurrentPassword
              )
            }
            hitSlop={10}
          >
            <Ionicons
              name={
                showCurrentPassword
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={22}
              color="#64748b"
            />
          </Pressable>
        </View>

        {/* New Password */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="New Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showNewPassword}
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={styles.eyeButton}
            onPress={() =>
              setShowNewPassword(
                !showNewPassword
              )
            }
            hitSlop={10}
          >
            <Ionicons
              name={
                showNewPassword
                  ? "eye-off-outline"
                  : "eye-outline"
              }
              size={22}
              color="#64748b"
            />
          </Pressable>
        </View>

        <Pressable
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#020617" />
          ) : (
            <Text style={styles.buttonText}>
              Update Password
            </Text>
          )}
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 25,
  },

  header: {
    width: "100%",
    maxWidth: desktopMaxWidth,
    alignItems: "center",
    marginBottom: 30,
  },

  title: {
    color: "#fff",
    fontSize: isDesktopWeb ? 32 : 30,
    fontWeight: "900",
    textAlign: "center",
  },

  subtitle: {
    color: "#cbd5e1",
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
  },

  card: {
    width: "100%",
    maxWidth: desktopMaxWidth,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 22,
  },

  inputContainer: {
    width: "100%",
    position: "relative",
    marginBottom: 14,
  },

  input: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingRight: 50,
    paddingVertical: 14,
    color: "#0f172a",
    fontSize: 16,
  },

  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  button: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#020617",
    fontSize: 16,
    fontWeight: "800",
  },
});
