import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";

type StaffProfile = {
  id: number;
  user_id: number;
  employee_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  address: string | null;
  job_title: string | null;
  department: string | null;
  employment_type: string | null;
  date_employed: string | null;
  qualification: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
  profile_photo: string | null;
  notes: string | null;
  email: string;
  is_active: boolean;
};

export default function StaffProfileScreen() {
  const { token, tenant } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width > 768;

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
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${baseUrl}/api/v1/staff/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to load staff profile");
      }
      setProfile(data);
    } catch (err: any) {
      setError(err?.message || "Unable to load staff profile");
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

  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : "Staff Member";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading beautiful profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isWeb && styles.webContent]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
    >
      <View style={[styles.wrapper, isWeb && styles.webWrapper]}>
        
        {/* Colorful Header Card with Back Button */}
        <View style={styles.headerCard}>
          <View style={styles.headerDecoration} />

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/staff/dashboard");
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{fullName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: profile?.is_active ? "#ECFDF5" : "#FEF2F2" }]}>
              <View style={[styles.statusDot, { backgroundColor: profile?.is_active ? "#10B981" : "#EF4444" }]} />
              <Text style={[styles.statusText, { color: profile?.is_active ? "#047857" : "#B91C1C" }]}>
                {profile?.is_active ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <View style={styles.roleContainer}>
            <Text style={styles.roleText}>{profile?.job_title || "Staff Member"}</Text>
            {profile?.department && (
              <>
                <Text style={styles.roleSeparator}>•</Text>
                <Text style={styles.departmentText}>{profile.department}</Text>
              </>
            )}
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Section: Personal Information */}
        <SectionCard title="Personal Information" color="#6366F1" iconSymbol="👤">
          <ProfileRow label="Employee Number" value={profile?.employee_number} />
          <ProfileRow label="First Name" value={profile?.first_name} />
          <ProfileRow label="Middle Name" value={profile?.middle_name} />
          <ProfileRow label="Last Name" value={profile?.last_name} />
          <ProfileRow label="Gender" value={profile?.gender} />
          <ProfileRow label="Date of Birth" value={profile?.date_of_birth} />
          <ProfileRow label="Phone" value={profile?.phone} />
          <ProfileRow label="Address" value={profile?.address} last />
        </SectionCard>

        {/* Section: Employment Information */}
        <SectionCard title="Employment Details" color="#0EA5E9" iconSymbol="💼">
          <ProfileRow label="Job Title" value={profile?.job_title} />
          <ProfileRow label="Department" value={profile?.department} />
          <ProfileRow label="Employment Type" value={profile?.employment_type} />
          <ProfileRow label="Date Employed" value={profile?.date_employed} />
          <ProfileRow label="Qualification" value={profile?.qualification} last />
        </SectionCard>

        {/* Section: Account Information */}
        <SectionCard title="Account Information" color="#10B981" iconSymbol="🔒">
          <ProfileRow label="Email" value={profile?.email} />
          <ProfileRow label="School" value={tenant?.name} />
          <ProfileRow label="Status" value={profile?.is_active ? "Active" : "Inactive"} last />
        </SectionCard>

        {/* Section: Emergency Contact */}
        <SectionCard title="Emergency Contact" color="#F59E0B" iconSymbol="🚨">
          <ProfileRow label="Name" value={profile?.emergency_contact_name} />
          <ProfileRow label="Relationship" value={profile?.emergency_contact_relationship} />
          <ProfileRow label="Phone" value={profile?.emergency_contact_phone} last />
        </SectionCard>

        {/* Section: Notes */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: "#8B5CF620" }]}>
              <Text>📝</Text>
            </View>
            <Text style={styles.sectionTitle}>Administrative Notes</Text>
          </View>
          <Text style={styles.notes}>{profile?.notes || "No notes available."}</Text>
        </View>

      </View>
    </ScrollView>
  );
}

function SectionCard({ 
  title, 
  color, 
  iconSymbol, 
  children 
}: { 
  title: string; 
  color: string; 
  iconSymbol: string; 
  children: React.ReactNode 
}) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
          <Text style={{ fontSize: 14 }}>{iconSymbol}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: "#0F172A" }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function ProfileRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value?: string | null;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.lastRow]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={2}>{value || "-"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  webContent: {
    alignItems: "center",
    paddingVertical: 32,
  },
  wrapper: {
    width: "100%",
  },
  webWrapper: {
    maxWidth: 640,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    position: "relative",
  },
  headerDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#EEF2FF",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backArrow: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4F46E5",
    marginRight: 4,
  },
  backText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4F46E5",
  },
  avatarContainer: {
    position: "relative",
    marginTop: 20,
    marginBottom: 14,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statusBadge: {
    position: "absolute",
    bottom: 0,
    right: -2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  roleSeparator: {
    marginHorizontal: 6,
    color: "#94A3B8",
  },
  departmentText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardBody: {
    gap: 2,
  },
  notes: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  errorBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});