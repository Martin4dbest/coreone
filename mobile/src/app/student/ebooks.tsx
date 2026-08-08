import * as FileSystem from "expo-file-system/legacy";

import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { 
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { getToken } from "../../storage/auth";

type Ebook = {
  id: number;
  title: string;
  author?: string | null;
  description?: string | null;
  file_url: string;
  category?: string | null;
  cover_image_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_type?: string | null;
  featured?: boolean;
  download_count?: number;
  view_count?: number;
};

export default function StudentEbooks() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
const [viewingId, setViewingId] = useState<number | null>(null);
const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<{
  id: number;
  action: "view" | "download";
} | null>(null);

  const getAbsoluteUrl = (
    url: string | null | undefined
  ): string => {
    if (!url) return "";

    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    const base =
      api.defaults.baseURL?.replace(
        /\/api\/v1\/?$/,
        ""
      ) || "";

    if (!base) return url;

    return `${base}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const loadEbooks = async () => {
    try {
      setLoading(true);

      const response = await api.get("/ebooks");

      setEbooks(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error: any) {
      console.error(
        "Failed to load ebooks:",
        error?.response?.data || error
      );

      Alert.alert(
        "Ebooks",
        "Unable to load ebooks right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEbooks();
  }, []);

  const formatFileSize = (
    size?: number | null
  ) => {
    if (!size) return "";

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  };

  const openEbookFile = async (
  ebook: Ebook,
  action: "view" | "download"
) => {
  try {
    if (action === "view") {
      setViewingId(ebook.id);

      try {
        // Record the view without blocking the reader.
        try {
          await api.post(`/ebooks/${ebook.id}/view`);
        } catch (error) {
          console.warn("Could not record ebook view:", error);
        }

        // Use the same private local directory as the Download action.
        const ebookDirectory =
          `${FileSystem.documentDirectory}ebooks`;

        await FileSystem.makeDirectoryAsync(
          ebookDirectory,
          { intermediates: true }
        );

        // Use the same filename/path as the Download action.
        const filename =
          (ebook.file_name || `ebook-${ebook.id}.pdf`)
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        const localUri =
          `${ebookDirectory}/${filename}`;

        // If the ebook is already stored locally,
        // do NOT make another network request.
        const existing =
          await FileSystem.getInfoAsync(localUri);

        if (!existing.exists) {
          const fileUrl =
            `${api.defaults.baseURL}/ebooks/${ebook.id}/file`;

          await FileSystem.downloadAsync(
            fileUrl,
            localUri,
            {
              headers: {
                Authorization:
                  `Bearer ${await getToken()}`,
              },
            }
          );
        }

        // Open the reader. The reader can now use the
        // locally stored ebook.
        router.push({
          pathname: "/student/ebook-reader",
          params: {
            ebookId: String(ebook.id),
            title: ebook.title,
            fileName:
              (ebook.file_name || `ebook-${ebook.id}.pdf`)
                .replace(/[^a-zA-Z0-9._-]/g, "_"),
          },
        });

        return;
      } catch (error: any) {
        console.error(
          "Unable to prepare ebook for reading:",
          error?.response?.data || error
        );

        Alert.alert(
          "Ebook",
          "This ebook is not downloaded yet. Please connect to the internet once to download it."
        );

        return;
      }
    }

    setDownloadingId(ebook.id);

    /*
     * Download means:
     *
     * - download securely through the authenticated API
     * - store it in the app's private document directory
     * - NEVER open Android's external PDF viewer
     * - NEVER place the file in the public Downloads folder
     *
     * The reader can then use this local copy offline.
     */

    const fileUrl = `${api.defaults.baseURL}/ebooks/${ebook.id}/file`;

    const filename =
      (ebook.file_name || `ebook-${ebook.id}.pdf`)
        .replace(/[^a-zA-Z0-9._-]/g, "_");

    const localUri =
      `${FileSystem.documentDirectory}ebooks/${filename}`;

    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}ebooks`,
      { intermediates: true }
    );

    const existing =
      await FileSystem.getInfoAsync(localUri);

    if (!existing.exists) {
      const result =
        await FileSystem.downloadAsync(
          fileUrl,
          localUri,
          {
            headers: {
              Authorization: `Bearer ${await getToken()}`,
            },
          }
        );

      console.log(
        "Offline ebook saved:",
        result.uri
      );
    }

    try {
      await api.post(`/ebooks/${ebook.id}/download`);
    } catch (error) {
      console.warn(
        "Could not record ebook download:",
        error
      );
    }

    Alert.alert(
      "Downloaded",
      `"${ebook.title}" is now available for offline reading inside the app.`
    );
  } catch (error: any) {
    console.error(
      "Ebook action failed:",
      error?.response?.data || error
    );

    Alert.alert(
      "Ebook",
      error?.response?.data?.detail ||
        "Unable to process this ebook."
    );
  } finally {
    setViewingId(null);
    setDownloadingId(null);
  }
};


const renderEbook = ({
    item,
  }: {
    item: Ebook;
  }) => {
    const coverUrl = getAbsoluteUrl(
      item.cover_image_url
    );

    const isViewing =
      viewingId === item.id;

    const isDownloading =
      downloadingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.coverContainer}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={styles.cover}
              resizeMode="cover"
            />
          ) : (
            <View
              style={styles.coverPlaceholder}
            >
              <Ionicons
                name="book"
                size={42}
                color="#94A3B8"
              />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={styles.title}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            {item.featured ? (
              <View
                style={styles.featuredBadge}
              >
                <Ionicons
                  name="star"
                  size={11}
                  color="#92400E"
                />

                <Text
                  style={styles.featuredText}
                >
                  Featured
                </Text>
              </View>
            ) : null}
          </View>

          {item.author ? (
            <Text
              style={styles.author}
              numberOfLines={1}
            >
              {item.author}
            </Text>
          ) : null}

          {item.description ? (
            <Text
              style={styles.description}
              numberOfLines={3}
            >
              {item.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            {item.category ? (
              <View style={styles.metaItem}>
                <Ionicons
                  name="pricetag-outline"
                  size={13}
                  color="#64748B"
                />

                <Text
                  style={styles.metaText}
                >
                  {item.category}
                </Text>
              </View>
            ) : null}

            {item.file_size ? (
              <View style={styles.metaItem}>
                <Ionicons
                  name="document-outline"
                  size={13}
                  color="#64748B"
                />

                <Text
                  style={styles.metaText}
                >
                  {formatFileSize(
                    item.file_size
                  )}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              style={[
                styles.readButton,
                isViewing &&
                  styles.readButtonDisabled,
              ]}
              onPress={() =>
                openEbookFile(
                  item,
                  "view"
                )
              }
              disabled={!!activeAction}
            >
              {isViewing ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="book-outline"
                    size={17}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.readButtonText
                    }
                  >
                    Read Ebook
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.downloadButton,
                isDownloading &&
                  styles.downloadButtonDisabled,
              ]}
              onPress={() =>
                openEbookFile(
                  item,
                  "download"
                )
              }
              disabled={!!activeAction}
            >
              {isDownloading ? (
                <ActivityIndicator
                  size="small"
                  color="#334155"
                />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={18}
                  color="#334155"
                />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading ebooks...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Ebooks Library
          </Text>

          <Text style={styles.headerSubtitle}>
            Read your school's digital learning
            materials
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="library"
            size={24}
            color="#2563EB"
          />
        </View>
      </View>

      {ebooks.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="library-outline"
              size={42}
              color="#94A3B8"
            />
          </View>

          <Text style={styles.emptyTitle}>
            No ebooks available
          </Text>

          <Text style={styles.emptyText}>
            Your school has not added any
            digital learning materials yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={ebooks}
          keyExtractor={(item) =>
            String(item.id)
          }
          renderItem={renderEbook}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadEbooks}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748B",
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },

  list: {
    padding: 16,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 16,
    padding: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  coverContainer: {
    width: 92,
    height: 126,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },

  cover: {
    width: "100%",
    height: "100%",
  },

  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
    marginLeft: 13,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    color: "#0F172A",
  },

  author: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },

  description: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 17,
    color: "#475569",
  },

  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: "#FEF3C7",
  },

  featuredText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#92400E",
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 10,
    color: "#64748B",
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },

  readButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  readButtonDisabled: {
    opacity: 0.7,
  },

  readButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  downloadButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  downloadButtonDisabled: {
    opacity: 0.6,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#64748B",
  },
});
