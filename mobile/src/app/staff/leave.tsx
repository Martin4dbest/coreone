import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "";

type Leave = {
  id: number;
  staff_id: number;
  school_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  admin_remarks: string | null;
};

const LEAVE_TYPES = ["Annual", "Sick", "Maternity", "Paternity", "Study", "Unpaid"];

export default function StaffLeaveScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web" && width > 768;

  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [leaveType, setLeaveType] = useState("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calendar Modal State
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [activeField, setActiveField] = useState<"start" | "end">("start");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadLeaves = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/staff/me/leave`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load leave requests");
      }

      const data = await response.json();
      setLeaves(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Unable to load your leave requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadLeaves();
    }, [loadLeaves])
  );

  const submitLeave = async () => {
    if (!leaveType.trim()) {
      Alert.alert("Required", "Please select or enter a leave type.");
      return;
    }

    if (!startDate.trim() || !endDate.trim()) {
      Alert.alert("Required", "Please select both start and end dates using the calendar.");
      return;
    }

    if (!token) return;

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/staff/me/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leave_type: leaveType.trim(),
          start_date: startDate.trim(),
          end_date: endDate.trim(),
          reason: reason.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Unable to submit leave request.");
      }

      Alert.alert("Success 🎉", "Your leave request has been submitted successfully.");

      setStartDate("");
      setEndDate("");
      setReason("");

      await loadLeaves();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Unable to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const openCalendar = (field: "start" | "end") => {
    setActiveField(field);
    setCalendarVisible(true);
  };

  const handleDateSelect = (dateStr: string) => {
    if (activeField === "start") {
      setStartDate(dateStr);
    } else {
      setEndDate(dateStr);
    }
    setCalendarVisible(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return styles.approvedBadge;
      case "REJECTED":
        return styles.rejectedBadge;
      default:
        return styles.pendingBadge;
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return styles.approvedText;
      case "REJECTED":
        return styles.rejectedText;
      default:
        return styles.pendingText;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading leave portal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <FlatList
        data={leaves}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.container, isWeb && styles.webContainer]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadLeaves();
            }}
            tintColor="#6366F1"
          />
        }
        ListHeaderComponent={
          <View style={[styles.wrapper, isWeb && styles.webWrapper]}>
            
            {/* Header with Back Navigation */}
            <View style={styles.headerCard}>
              <View style={styles.headerDecoration} />
              
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/staff/dashboard")}
                activeOpacity={0.7}
              >
                <Text style={styles.backArrow}>←</Text>
                <Text style={styles.backButtonText}>Dashboard</Text>
              </TouchableOpacity>

              <View style={styles.headerIconContainer}>
                <Text style={{ fontSize: 28 }}>🌴</Text>
              </View>

              <Text style={styles.title}>Leave Management</Text>
              <Text style={styles.subtitle}>Plan time off and track your requests seamlessly.</Text>
            </View>

            {/* Leave Application Form */}
            <View style={styles.formCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}>
                  <Text style={{ fontSize: 14 }}>📝</Text>
                </View>
                <Text style={styles.cardTitle}>New Leave Request</Text>
              </View>

              <Text style={styles.label}>Leave Type</Text>
              <View style={styles.typeSelectorRow}>
                {LEAVE_TYPES.map((type) => {
                  const isSelected = leaveType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                      onPress={() => setLeaveType(type)}
                    >
                      <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.dateInputsRow}>
                <View style={styles.dateInputCol}>
                  <Text style={styles.label}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => openCalendar("start")}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {startDate ? startDate : "Select Date 📅"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateInputCol}>
                  <Text style={styles.label}>End Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => openCalendar("end")}
                  >
                    <Text style={styles.datePickerButtonText}>
                      {endDate ? endDate : "Select Date 📅"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.label}>Reason for Leave</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reason}
                onChangeText={setReason}
                placeholder="Provide a clear reason for your absence..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.button, submitting && styles.buttonDisabled]}
                onPress={submitLeave}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Submit Leave Request 🚀</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeadingContainer}>
              <Text style={styles.sectionTitle}>Leave History</Text>
              <Text style={styles.sectionCount}>{leaves.length} requests</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.empty, isWeb && styles.webWrapper, { alignSelf: "center", width: "100%" }]}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>📭</Text>
            <Text style={styles.emptyText}>No leave requests recorded yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.wrapper, isWeb && styles.webWrapper, { alignSelf: "center" }]}>
            <View style={styles.leaveCard}>
              <View style={styles.row}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={styles.leaveCardIcon}>
                    <Text>✈️</Text>
                  </View>
                  <Text style={styles.leaveType}>{item.leave_type} Leave</Text>
                </View>

                <View style={[styles.status, getStatusStyle(item.status)]}>
                  <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={styles.dateBadgeRow}>
                <Text style={styles.dateBadgeText}>
                  📅 {item.start_date} → {item.end_date}
                </Text>
              </View>

              {item.reason ? (
                <View style={styles.detailBox}>
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailText}>{item.reason}</Text>
                </View>
              ) : null}

              {item.admin_remarks ? (
                <View style={[styles.detailBox, { backgroundColor: "#F8FAFC", borderColor: "#E2E8F0" }]}>
                  <Text style={[styles.detailLabel, { color: "#475569" }]}>Admin Remarks:</Text>
                  <Text style={[styles.detailText, { color: "#334155" }]}>{item.admin_remarks}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
      />

      {/* Interactive Calendar Modal */}
      <CalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onSelect={handleDateSelect}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
      />
    </View>
  );
}

// Built-in Clean Calendar Picker Component
function CalendarModal({
  visible,
  onClose,
  onSelect,
  currentMonth,
  setCurrentMonth,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateStr: string) => void;
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysGrid = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysGrid.push(d);
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.calendarCard}>
          <View style={styles.calHeader}>
            <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
              <Text style={styles.calNavText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.calMonthTitle}>
              {monthNames[month]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
              <Text style={styles.calNavText}>▶</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, idx) => (
              <Text key={idx} style={styles.weekDayText}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {daysGrid.map((day, index) => {
              if (day === null) {
                return <View key={index} style={styles.dayCellEmpty} />;
              }
              const formattedMonth = String(month + 1).padStart(2, "0");
              const formattedDay = String(day).padStart(2, "0");
              const dateString = `${year}-${formattedMonth}-${formattedDay}`;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dayCell}
                  onPress={() => onSelect(dateString)}
                >
                  <Text style={styles.dayCellText}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.calCloseButton} onPress={onClose}>
            <Text style={styles.calCloseText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 16,
    paddingBottom: 48,
  },
  webContainer: {
    alignItems: "center",
  },
  wrapper: {
    width: "100%",
  },
  webWrapper: {
    maxWidth: 680,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    height: 60,
    backgroundColor: "#EEF2FF",
  },
  backButton: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 10,
  },
  backArrow: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4F46E5",
    marginRight: 4,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderRow: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginTop: 10,
    marginBottom: 6,
  },
  typeSelectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  typeChipSelected: {
    backgroundColor: "#4F46E5",
    borderColor: "#4F46E5",
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  typeChipTextSelected: {
    color: "#FFFFFF",
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateInputCol: {
    flex: 1,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  datePickerButtonText: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontSize: 13,
  },
  textArea: {
    minHeight: 80,
  },
  button: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 18,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  sectionHeadingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  leaveCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  leaveCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  leaveType: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },
  approvedBadge: {
    backgroundColor: "#DCFCE7",
  },
  rejectedBadge: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  pendingText: {
    color: "#92400E",
  },
  approvedText: {
    color: "#166534",
  },
  rejectedText: {
    color: "#991B1B",
  },
  dateBadgeRow: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  detailBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    marginBottom: 2,
  },
  detailText: {
    fontSize: 12,
    color: "#78350F",
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748B",
    fontWeight: "500",
  },
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  calHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calMonthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  calNavBtn: {
    padding: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },
  calNavText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    width: 36,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCellEmpty: {
    width: "14.28%",
    height: 40,
  },
  dayCell: {
    width: "14.28%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    width: 32,
    height: 32,
    textAlign: "center",
    lineHeight: 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  calCloseButton: {
    marginTop: 16,
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  calCloseText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
});