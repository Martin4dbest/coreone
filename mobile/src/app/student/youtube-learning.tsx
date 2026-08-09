import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect, useRouter } from "expo-router";
import api from "@/services/api";

type YoutubeVideo = {
  id: number;
  school_id: number;
  title: string;
  video_url: string;
  description?: string | null;
  subject?: string | null;
  class_id?: number | null;
  uploaded_by: number;
  is_active: boolean;
};

// Helper to extract YouTube Video ID
function getYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").trim();
    } else if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return videoId;
      if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] || null;
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] || null;
    }
  } catch (error) {
    console.warn("Could not parse YouTube URL:", error);
  }
  return null;
}

function getYoutubeThumbnailUrl(url: string): string | null {
  const id = getYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

function getYoutubeEmbedUrl(url: string) {
  const id = getYoutubeId(url);
  if (id) {
    return (
      `https://www.youtube-nocookie.com/embed/${id}` +
      `?rel=0` +
      `&playsinline=1` +
      `&enablejsapi=1`
    );
  }
  return url;
}

export default function YoutubeLearningPage() {
  const router = useRouter();

  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
  const [webLoading, setWebLoading] = useState(true);

  const loadVideos = async () => {
    try {
      setLoading(true);

      const response = await api.get("/youtube-learning");

      const data = Array.isArray(response.data)
        ? response.data.filter(
            (item: YoutubeVideo) => item.is_active !== false
          )
        : [];

      setVideos(data);
    } catch (error) {
      console.error("Failed to load YouTube learning:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadVideos();
    }, [])
  );

  const openVideo = async (video: YoutubeVideo) => {
    setWebLoading(true);

    try {
      await api.post(`/youtube-learning/${video.id}/activity`);
    } catch (error) {
      console.warn("Could not record YouTube activity:", video.id, error);
    }

    setSelectedVideo(video);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    setWebLoading(true);
  };

  if (selectedVideo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.videoHeader}>
          <Pressable
            onPress={closeVideo}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.videoHeaderText}>
            <Text style={styles.videoTitle} numberOfLines={1}>
              {selectedVideo.title}
            </Text>

            <Text style={styles.videoSubtitle}>
              {selectedVideo.subject || "YouTube Learning"}
            </Text>
          </View>

          <View style={styles.youtubeBadge}>
            <Text style={styles.youtubeBadgeText}>YOUTUBE</Text>
          </View>
        </View>

        <View style={styles.webViewContainer}>
          {webLoading && (
            <View style={styles.webLoading}>
              <ActivityIndicator size="large" color="#FF0000" />

              <Text style={styles.webLoadingTitle}>Loading video...</Text>

              <Text style={styles.webLoadingText}>
                Please wait while the lesson video opens.
              </Text>
            </View>
          )}

          <WebView
            source={{
              uri: getYoutubeEmbedUrl(selectedVideo.video_url),
              headers: {
                Referer: "https://www.youtube-nocookie.com/",
              },
            }}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            onLoadStart={() => setWebLoading(true)}
            onLoadEnd={() => setWebLoading(false)}
            setSupportMultipleWindows={false}
            javaScriptCanOpenWindowsAutomatically={false}
            onShouldStartLoadWithRequest={(request) =>
              request.url.startsWith("http://") ||
              request.url.startsWith("https://")
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SECTION - Brought down with extra padding & lowered alignment */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.pageBackButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.pageBackText}>‹</Text>
          </Pressable>

          {/* YouTube Brand Icon */}
          <View style={styles.youtubeHeaderIcon}>
            <View style={styles.playIconTriangle} />
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>YouTube Learning</Text>
            <Text style={styles.headerSubtitle}>
              Fun educational lessons from your school
            </Text>
          </View>
        </View>

        {!loading && videos.length > 0 && (
          <View style={styles.countBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.countText}>
              {videos.length} {videos.length === 1 ? "lesson" : "lessons"} to watch
            </Text>
          </View>
        )}
      </View>

      {/* CONTENT AREA */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF0000" />
          <Text style={styles.loadingTitle}>Loading videos...</Text>
          <Text style={styles.loadingText}>Fetching your learning library</Text>
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <View style={styles.emptyPlayTriangle} />
          </View>

          <Text style={styles.emptyTitle}>No lessons here yet!</Text>

          <Text style={styles.emptyText}>
            Your school hasn't added any YouTube learning videos. Check back soon!
          </Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const thumbnailUrl = getYoutubeThumbnailUrl(item.video_url);

            return (
              <Pressable
                onPress={() => openVideo(item)}
                style={({ pressed }) => [
                  styles.videoCard,
                  pressed && styles.pressedCard,
                ]}
              >
                {/* VIDEO THUMBNAIL COVER */}
                <View style={styles.thumbnailContainer}>
                  {thumbnailUrl ? (
                    <Image
                      source={{ uri: thumbnailUrl }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbnailFallback}>
                      <Text style={styles.fallbackText}>▶</Text>
                    </View>
                  )}

                  {/* Play Button Overlay */}
                  <View style={styles.playButtonOverlay}>
                    <View style={styles.playButtonCircle}>
                      <View style={styles.playTriangle} />
                    </View>
                  </View>

                  {/* Subject Tag on Thumbnail */}
                  {item.subject ? (
                    <View style={styles.subjectBadgeOnImage}>
                      <Text style={styles.subjectTextOnImage}>
                        {item.subject}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* CARD METADATA */}
                <View style={styles.videoContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  {item.description ? (
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={styles.openRow}>
                    <Text style={styles.watchText}>Watch Lesson</Text>
                    <Text style={styles.watchArrow}>→</Text>
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
    backgroundColor: "#F8FAFC",
  },

  /* HEADER - Pushed down for comfortable top spacing */
  header: {
    paddingHorizontal: 20,
    paddingTop: 28, // Pushed down from top
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  pageBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  pageBackText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: -2,
  },

  /* Official Red YouTube Icon Badge */
  youtubeHeaderIcon: {
    width: 46,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#FF0000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#FF0000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },

  playIconTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderBottomWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "#FFFFFF",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    marginLeft: 2,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },

  countBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },

  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },

  /* LIST & CARDS */
  list: {
    padding: 18,
    paddingBottom: 40,
  },

  videoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  thumbnailContainer: {
    width: "100%",
    height: 190,
    backgroundColor: "#000000",
    position: "relative",
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  thumbnailFallback: {
    flex: 1,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },

  fallbackText: {
    fontSize: 36,
    color: "#EF4444",
  },

  playButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },

  playButtonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 0, 0, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },

  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 14,
    borderRightWidth: 0,
    borderBottomWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "#FFFFFF",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    marginLeft: 3,
  },

  subjectBadgeOnImage: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },

  subjectTextOnImage: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  videoContent: {
    padding: 16,
  },

  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800",
    color: "#0F172A",
  },

  description: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: "#64748B",
  },

  openRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  watchText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#DC2626",
  },

  watchArrow: {
    marginLeft: 6,
    fontSize: 15,
    fontWeight: "800",
    color: "#DC2626",
  },

  pressedCard: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },

  pressed: {
    opacity: 0.6,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  loadingText: {
    marginTop: 4,
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
    width: 68,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyPlayTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 14,
    borderRightWidth: 0,
    borderBottomWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "#DC2626",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderTopColor: "transparent",
    marginLeft: 3,
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },

  /* VIDEO PLAYER OVERLAY HEADER */
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  backButtonText: {
    fontSize: 28,
    lineHeight: 32,
    color: "#1E293B",
  },

  videoHeaderText: {
    flex: 1,
    marginHorizontal: 12,
  },

  videoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  videoSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "#64748B",
  },

  youtubeBadge: {
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },

  youtubeBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#DC2626",
  },

  webViewContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#000000",
  },

  webView: {
    flex: 1,
    backgroundColor: "#000000",
  },

  webLoading: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 30,
  },

  webLoadingTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  webLoadingText: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
});