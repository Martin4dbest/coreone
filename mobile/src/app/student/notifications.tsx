import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  recipient_type?: string | null;
  is_read: boolean;
  sent_at: string;
  is_active: boolean;
};

export default function StudentNotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (notification: NotificationItem) => {
    if (notification.is_read) {
      return;
    }

    // Update the UI immediately.
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, is_read: true }
          : item
      )
    );

    try {
      await api.patch(`/notifications/${notification.id}/read`);
    } catch (error) {
      console.error("Error marking notification as read:", error);

      // Restore the unread state if the API request failed.
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: false }
            : item
        )
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications-outline" size={26} color="#0F172A" />
        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            School notifications and important updates
          </Text>
        </View>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications();
            }}
          />
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.list
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => markAsRead(item)}
            style={({ pressed }) => [
              styles.card,
              !item.is_read && styles.unreadCard,
              pressed && styles.pressedCard,
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                !item.is_read && styles.unreadIconCircle,
              ]}
            >
              <Ionicons
                name={item.is_read ? "notifications-outline" : "notifications"}
                size={20}
                color="#2563EB"
              />
            </View>

            <View style={styles.content}>
              <View style={styles.row}>
                <View style={styles.titleRow}>
                  <Text style={styles.notificationTitle}>
                    {item.title}
                  </Text>

                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.date}>
                  {formatDate(item.sent_at)}
                </Text>
              </View>

              <Text style={styles.message}>{item.message}</Text>

              {item.recipient_type && (
                <Text style={styles.recipient}>
                  For {item.recipient_type.toLowerCase()}s
                </Text>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#94A3B8"
            />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptyText}>
              You don't have any notifications yet.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#64748B",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  unreadCard: {
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FBFF",
  },
  pressedCard: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  unreadIconCircle: {
    backgroundColor: "#DBEAFE",
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  date: {
    fontSize: 11,
    color: "#94A3B8",
  },
  message: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },
  recipient: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
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
  emptyContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  empty: {
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#334155",
  },
  emptyText: {
    marginTop: 5,
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
});
