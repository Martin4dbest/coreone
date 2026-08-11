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
import { useFocusEffect, useRouter } from "expo-router";
import api from "@/services/api";
import { Redirect } from "expo-router";

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

const RESOURCE_THEMES = [
  {
    background: "#EEF4FF",
    border: "#D7E5FF",
    iconBackground: "#DCE9FF",
    icon: "#2563EB",
    title: "#123B7A",
    categoryBackground: "#DCE9FF",
    category: "#1D4ED8",
    description: "#4B6385",
    action: "#2563EB",
  },
  {
    background: "#F0FDF4",
    border: "#D5F5DF",
    iconBackground: "#DCFCE7",
    icon: "#16A34A",
    title: "#14532D",
    categoryBackground: "#DCFCE7",
    category: "#15803D",
    description: "#52735E",
    action: "#15803D",
  },
  {
    background: "#FFF7ED",
    border: "#FEDFC0",
    iconBackground: "#FFEDD5",
    icon: "#EA580C",
    title: "#7C2D12",
    categoryBackground: "#FFEDD5",
    category: "#C2410C",
    description: "#805D4B",
    action: "#C2410C",
  },
  {
    background: "#FDF4FF",
    border: "#F3D8FA",
    iconBackground: "#FAE8FF",
    icon: "#A21CAF",
    title: "#701A75",
    categoryBackground: "#FAE8FF",
    category: "#86198F",
    description: "#76547A",
    action: "#A21CAF",
  },
  {
    background: "#ECFEFF",
    border: "#CDEFF2",
    iconBackground: "#CFFAFE",
    icon: "#0891B2",
    title: "#164E63",
    categoryBackground: "#CFFAFE",
    category: "#0E7490",
    description: "#4C6E78",
    action: "#0E7490",
  },
  {
    background: "#FFF1F2",
    border: "#FDD9DE",
    iconBackground: "#FFE4E6",
    icon: "#E11D48",
    title: "#881337",
    categoryBackground: "#FFE4E6",
    category: "#BE123C",
    description: "#805663",
    action: "#BE123C",
  },
  {
    background: "#F5F3FF",
    border: "#E5DFFF",
    iconBackground: "#EDE9FE",
    icon: "#7C3AED",
    title: "#4C1D95",
    categoryBackground: "#EDE9FE",
    category: "#6D28D9",
    description: "#655A7A",
    action: "#6D28D9",
  },
  {
    background: "#F7FEE7",
    border: "#E3F3BF",
    iconBackground: "#ECFCCB",
    icon: "#65A30D",
    title: "#365314",
    categoryBackground: "#ECFCCB",
    category: "#4D7C0F",
    description: "#61704C",
    action: "#4D7C0F",
  },
];

export default function StudentBrowserPage() {
const router = useRouter();

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

  const openResource = async (resource: BrowserResource) => {
    setWebLoading(true);

    try {
      await api.post(`/browser-links/${resource.id}/activity`);
    } catch (error) {
      console.warn(
        "Could not record browser activity:",
        resource.id,
        error
      );
    }

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
            ) : (
              <Text style={styles.webCategory}>
                Learning Resource
              </Text>
            )}
          </View>

          <View style={styles.secureBadge}>
            <Text style={styles.secureIcon}>●</Text>
            <Text style={styles.secureText}>IN APP</Text>
          </View>
        </View>

        <View style={styles.webViewContainer}>
          {webLoading && (
            <View style={styles.webLoading}>
              <View style={styles.loadingCircle}>
                <ActivityIndicator size="large" />
              </View>

              <Text style={styles.webLoadingTitle}>
                Loading resource
              </Text>

              <Text style={styles.webLoadingText}>
                Please wait while the learning resource opens.
              </Text>
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
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={false}
            onShouldStartLoadWithRequest={(request) => {
              return (
                request.url.startsWith("http://") ||
                request.url.startsWith("https://")
              );
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.pageBackButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.pageBackArrow}>‹</Text>
          </Pressable>

          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>◎</Text>
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Learning Browser
            </Text>

            <Text style={styles.headerSubtitle}>
              Approved resources from your school
            </Text>
          </View>
        </View>

        {!loading && resources.length > 0 && (
          <View style={styles.resourceCountBadge}>
            <View style={styles.statusDot} />

            <Text style={styles.resourceCountText}>
              {resources.length}{" "}
              {resources.length === 1
                ? "resource"
                : "resources"}{" "}
              available
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <View style={styles.loadingCircleLarge}>
            <ActivityIndicator size="large" />
          </View>

          <Text style={styles.loadingTitle}>
            Loading learning resources
          </Text>

          <Text style={styles.loadingText}>
            Please wait...
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
            Your school has not added any approved browser
            resources yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const theme =
              RESOURCE_THEMES[index % RESOURCE_THEMES.length];

            return (
              <Pressable
                onPress={() => openResource(item)}
                style={({ pressed }) => [
                  styles.resourceCard,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressedCard,
                ]}
              >
                <View
                  style={[
                    styles.resourceIcon,
                    {
                      backgroundColor: theme.iconBackground,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.resourceIconText,
                      { color: theme.icon },
                    ]}
                  >
                    ↗
                  </Text>
                </View>

                <View style={styles.resourceContent}>
                  <Text
                    style={[
                      styles.resourceTitle,
                      { color: theme.title },
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  {item.category ? (
                    <View
                      style={[
                        styles.categoryBadge,
                        {
                          backgroundColor:
                            theme.categoryBackground,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.category,
                          { color: theme.category },
                        ]}
                      >
                        {item.category}
                      </Text>
                    </View>
                  ) : null}

                  <Text
                    style={[
                      styles.description,
                      { color: theme.description },
                    ]}
                    numberOfLines={2}
                  >
                    {item.description ||
                      "Approved learning resource"}
                  </Text>

                  <View style={styles.openResourceRow}>
                    <Text
                      style={[
                        styles.openResourceText,
                        { color: theme.action },
                      ]}
                    >
                      Open resource
                    </Text>

                    <Text
                      style={[
                        styles.openResourceArrow,
                        { color: theme.action },
                      ]}
                    >
                      →
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF3",
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  pageBackButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 10,
  },

  pageBackArrow: {
    fontSize: 31,
    lineHeight: 34,
    color: "#0F172A",
    marginTop: -2,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#DCE8FF",
  },

  headerIconText: {
    fontSize: 31,
    fontWeight: "800",
    color: "#2563EB",
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#C99A2E",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  resourceCountBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 7,
  },

  resourceCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },

  list: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 35,
  },

  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 15,
    marginBottom: 13,
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  pressedCard: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  resourceIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 14,
  },

  resourceIconText: {
    fontSize: 27,
    fontWeight: "700",
  },

  resourceContent: {
    flex: 1,
    minWidth: 0,
  },

  resourceTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },

  categoryBadge: {
    alignSelf: "flex-start",
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },

  category: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  description: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 18,
  },

  openResourceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },

  openResourceText: {
    fontSize: 12,
    fontWeight: "700",
  },

  openResourceArrow: {
    marginLeft: 5,
    fontSize: 15,
    fontWeight: "800",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingCircleLarge: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    marginBottom: 18,
  },

  loadingTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  loadingText: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#DCE8FF",
    marginBottom: 20,
  },

  emptyIconText: {
    fontSize: 43,
    color: "#2563EB",
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
  },

  webHeader: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
    fontSize: 34,
    lineHeight: 37,
    color: "#0F172A",
    marginTop: -3,
  },

  webTitleContainer: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  webTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  webCategory: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },

  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    marginLeft: 8,
  },

  secureIcon: {
    fontSize: 7,
    color: "#16A34A",
    marginRight: 5,
  },

  secureText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#15803D",
    letterSpacing: 0.3,
  },

  webViewContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#FFFFFF",
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
    paddingHorizontal: 35,
    backgroundColor: "#FFFFFF",
  },

  loadingCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF4FF",
    marginBottom: 17,
  },

  webLoadingTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },

  webLoadingText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    color: "#64748B",
    textAlign: "center",
  },
});