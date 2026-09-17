import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";

type StaffProfile = {
  id: number;
  user_id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
};

export default function StaffProfileScreen() {
  const { token, tenant } = useAuth();

  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setError("");

      const baseUrl =
        process.env.EXPO_PUBLIC_API_URL ||
        "http://127.0.0.1:8000";

      const response = await fetch(
        `${baseUrl}/api/v1/staff/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to load staff profile"
        );
      }

      setProfile(data);
    } catch (err: any) {
      setError(
        err?.message || "Unable to load staff profile"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : "Staff Member";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {fullName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{fullName}</Text>

        <Text style={styles.role}>
          Non-Teaching Staff
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Staff Information
        </Text>

        <ProfileRow
          label="Employee Number"
          value={profile?.employee_number || "-"}
        />

        <ProfileRow
          label="First Name"
          value={profile?.first_name || "-"}
        />

        <ProfileRow
          label="Last Name"
          value={profile?.last_name || "-"}
        />

        <ProfileRow
          label="Email"
          value={profile?.email || "-"}
        />

        <ProfileRow
          label="School"
          value={tenant?.name || "-"}
        />

        <ProfileRow
          label="Status"
          value={profile?.is_active ? "Active" : "Inactive"}
          last
        />
      </View>
    </ScrollView>
  );
}

function ProfileRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        last && styles.lastRow,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 10,
    color: "#64748B",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: "700",
    color: "#334155",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
  },
  role: {
    marginTop: 5,
    fontSize: 14,
    color: "#64748B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  row: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 5,
  },
  value: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
  },
});
