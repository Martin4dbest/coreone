import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import api from "@/services/api";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  recipient_type?: string | null;
  is_read: boolean;
  sent_at?: string | null;
};

function formatNotificationDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ParentNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }

      const response = await api.get<NotificationItem[]>("/notifications");

      setNotifications(response.data || []);
    } catch (error: any) {
      console.log(
        "PARENT NOTIFICATIONS ERROR:",
        error?.response?.data || error?.message
      );

      Alert.alert(
        "Unable to load notifications",
        "We could not load your notifications right now."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadNotifications(false);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleNotificationPress(notification: NotificationItem) {
    if (notification.is_read) {
      return;
    }

    try {
      await api.patch(`/notifications/${notification.id}/read`);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );
    } catch (error: any) {
      console.log(
        "MARK PARENT NOTIFICATION READ ERROR:",
        error?.response?.data || error?.message
      );
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.viewport}>
          {/* ================= HEADER ================= */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressedState,
              ]}
            >
              <Ionicons name="chevron-back" size={22} color="#0F172A" />
            </Pressable>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`
                  : "You're all caught up"}
              </Text>
            </View>

            <View style={styles.headerBell}>
              <Ionicons
                name="notifications-sharp"
                size={20}
                color="#2563EB"
              />
              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ================= NOTIFICATION LIST ================= */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#2563EB"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={32}
                    color="#2563EB"
                  />
                </View>

                <Text style={styles.emptyTitle}>No Notifications</Text>

                <Text style={styles.emptyText}>
                  You don't have any school notifications at the moment.
                </Text>
              </View>
            ) : (
              notifications.map((notification) => {
                const unread = !notification.is_read;

                return (
                  <Pressable
                    key={notification.id}
                    onPress={() => handleNotificationPress(notification)}
                    style={({ pressed }) => [
                      styles.notificationCard,
                      unread ? styles.unreadCard : styles.readCard,
                      pressed && styles.pressedState,
                    ]}
                  >
                    <View
                      style={[
                        styles.notificationIcon,
                        unread ? styles.unreadIcon : styles.readIcon,
                      ]}
                    >
                      <Ionicons
                        name={
                          unread
                            ? "notifications-sharp"
                            : "notifications-outline"
                        }
                        size={18}
                        color={unread ? "#FFFFFF" : "#64748B"}
                      />
                    </View>

                    <View style={styles.notificationContent}>
                      <View style={styles.notificationTitleRow}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            unread && styles.unreadNotificationTitle,
                          ]}
                          numberOfLines={1}
                        >
                          {notification.title}
                        </Text>

                        {unread && <View style={styles.unreadDot} />}
                      </View>

                      <Text style={styles.notificationMessage}>
                        {notification.message}
                      </Text>

                      {!!notification.sent_at && (
                        <View style={styles.dateRow}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color="#94A3B8"
                          />
                          <Text style={styles.notificationDate}>
                            {formatNotificationDate(notification.sent_at)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  viewport: {
    flex: 1,
    maxWidth: 480, // Fitted to standard mobile & web width
    width: "100%",
    alignSelf: "center",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 28 : 12,
    paddingBottom: 14,
    backgroundColor: "#F8FAFC",
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },

  headerBell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  headerBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },

  notificationCard: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },

  unreadCard: {
    borderColor: "#BFDBFE",
    backgroundColor: "#F0F7FF",
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  },

  readCard: {
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },

  notificationIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  unreadIcon: {
    backgroundColor: "#2563EB",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  readIcon: {
    backgroundColor: "#F1F5F9",
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },

  unreadNotificationTitle: {
    color: "#0F172A",
    fontWeight: "800",
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginLeft: 8,
  },

  notificationMessage: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    marginTop: 4,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },

  notificationDate: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 16,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
  },

  pressedState: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});