import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "expo-router";
import api from "@/services/api";

type BrowserResource = {
  id: number;
  school_id: number;
  title: string;
  url: string;
  description?: string | null;
  category?: string | null;
  created_by: number;
  is_active: boolean;
};

export default function StudentBrowserPage() {
  const [resources, setResources] = useState<BrowserResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] =
    useState<BrowserResource | null>(null);
  const [webLoading, setWebLoading] = useState(true);

  const loadResources = async () => {
    try {
      setLoading(true);

      const response = await api.get("/browser-links");

      const activeResources = Array.isArray(response.data)
        ? response.data.filter(
            (item: BrowserResource) => item.is_active !== false
          )
        : [];

      setResources(activeResources);
    } catch (error) {
      console.error("Failed to load browser resources:", error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadResources();
    }, [])
  );

  const openResource = (resource: BrowserResource) => {
    setWebLoading(true);
    setSelectedResource(resource);
  };

  const closeBrowser = () => {
    setSelectedResource(null);
    setWebLoading(true);
  };

  if (selectedResource) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webHeader}>
          <Pressable
            onPress={closeBrowser}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.webTitleContainer}>
            <Text style={styles.webTitle} numberOfLines={1}>
              {selectedResource.title}
            </Text>

            {selectedResource.category ? (
              <Text style={styles.webCategory} numberOfLines={1}>
                {selectedResource.category}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.webViewContainer}>
          {webLoading && (
            <View style={styles.webLoading}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Loading resource...</Text>
            </View>
          )}

          <WebView
            source={{ uri: selectedResource.url }}
            style={styles.webView}
            onLoadStart={() => setWebLoading(true)}
            onLoadEnd={() => setWebLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            allowsBackForwardNavigationGestures
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browser</Text>
        <Text style={styles.headerSubtitle}>
          Approved learning resources
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>
            Loading resources...
          </Text>
        </View>
      ) : resources.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>◎</Text>
          </View>

          <Text style={styles.emptyTitle}>
            No resources available
          </Text>

          <Text style={styles.emptyText}>
            Your school has not added any approved browser resources yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openResource(item)}
              style={({ pressed }) => [
                styles.resourceCard,
                pressed && styles.pressedCard,
              ]}
            >
              <View style={styles.resourceIcon}>
                <Text style={styles.resourceIconText}>↗</Text>
              </View>

              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                {item.category ? (
                  <Text style={styles.category}>
                    {item.category}
                  </Text>
                ) : null}

                {item.description ? (
                  <Text
                    style={styles.description}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : (
                  <Text style={styles.description}>
                    Approved learning resource
                  </Text>
                )}
              </View>

              <Text style={styles.arrow}>›</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#64748B",
  },

  list: {
    padding: 16,
    paddingBottom: 30,
  },

  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  pressedCard: {
    opacity: 0.7,
    transform: [{ scale: 0.99 }],
  },

  resourceIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    marginRight: 14,
  },

  resourceIconText: {
    fontSize: 25,
    fontWeight: "700",
    color: "#2563EB",
  },

  resourceContent: {
    flex: 1,
    minWidth: 0,
  },

  resourceTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  category: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    textTransform: "uppercase",
  },

  description: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },

  arrow: {
    marginLeft: 10,
    fontSize: 28,
    color: "#94A3B8",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748B",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    marginBottom: 18,
  },

  emptyIconText: {
    fontSize: 38,
    color: "#2563EB",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },

  webHeader: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },

  pressed: {
    opacity: 0.6,
  },

  backButtonText: {
    fontSize: 32,
    lineHeight: 34,
    color: "#0F172A",
  },

  webTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },

  webTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  webCategory: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748B",
  },

  webViewContainer: {
    flex: 1,
    position: "relative",
  },

  webView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  webLoading: {
    position: "absolute",
    zIndex: 10,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
