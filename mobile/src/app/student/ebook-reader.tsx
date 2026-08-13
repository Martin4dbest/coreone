import React, { useEffect, useMemo, useState } from "react";
import {
ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system/legacy";
import { Asset } from "expo-asset";

const { width: screenWidth } = Dimensions.get("window");
const isDesktopWeb = Platform.OS === "web" && screenWidth >= 900;
const desktopMaxWidth = Math.min(
  Math.max(screenWidth - 48, 320),
  1180
);


import api from "../../services/api";

/*
 * PDF.js assets are loaded as TXT files to prevent Metro from
 * attempting to bundle or parse PDF.js as a React Native module.
 */
const PDF_JS_ASSET = require("../../../assets/pdfjs/pdfjs-runtime.txt");
const PDF_JS_WORKER_ASSET = require("../../../assets/pdfjs/pdfjs-worker.txt");

export default function EbookReader() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    ebookId?: string;
    title?: string;
    fileName?: string;
  }>();

  const ebookId = Array.isArray(params.ebookId)
    ? params.ebookId[0]
    : params.ebookId;

  const title = Array.isArray(params.title)
    ? params.title[0]
    : params.title;

  const fileName = Array.isArray(params.fileName)
    ? params.fileName[0]
    : params.fileName;

  const [pdfData, setPdfData] = useState<string | null>(null);
  const [pdfJsContent, setPdfJsContent] = useState<string | null>(null);
  const [pdfJsWorkerContent, setPdfJsWorkerContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEbook();
  }, [ebookId, fileName]);

  const loadEbook = async () => {
    if (!ebookId) {
      setError("Ebook not found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
       * Resolve and load bundled PDF.js runtime & worker assets.
       */
      const pdfJsAsset = Asset.fromModule(PDF_JS_ASSET);
      const pdfJsWorkerAsset = Asset.fromModule(PDF_JS_WORKER_ASSET);

      await Promise.all([
        pdfJsAsset.downloadAsync(),
        pdfJsWorkerAsset.downloadAsync(),
      ]);

      if (!pdfJsAsset.localUri || !pdfJsWorkerAsset.localUri) {
        throw new Error("Failed to resolve PDF reader assets.");
      }

      const jsText = await FileSystem.readAsStringAsync(
        pdfJsAsset.localUri
      );
      const workerText = await FileSystem.readAsStringAsync(
        pdfJsWorkerAsset.localUri
      );

      if (!jsText || jsText.length < 1000) {
        throw new Error("PDF.js runtime is empty or incomplete.");
      }
      if (!workerText || workerText.length < 1000) {
        throw new Error("PDF.js worker is empty or incomplete.");
      }

      setPdfJsContent(jsText);
      setPdfJsWorkerContent(workerText);

      /*
       * Local ebook storage directory.
       */
      const localDirectory = `${FileSystem.documentDirectory}ebooks`;

      const directoryInfo =
        await FileSystem.getInfoAsync(localDirectory);

      if (!directoryInfo.exists) {
        await FileSystem.makeDirectoryAsync(localDirectory, {
          intermediates: true,
        });
      }

      const safeFilename =
        fileName && fileName.toLowerCase().endsWith(".pdf")
          ? fileName
          : `ebook-${ebookId}.pdf`;

      const localUri = `${localDirectory}/${safeFilename}`;

      /*
       * Check for offline copy and verify it has a valid PDF header.
       */
      const local = await FileSystem.getInfoAsync(localUri);

      if (local.exists) {
        const header = await FileSystem.readAsStringAsync(localUri, {
          length: 10,
        });

        if (header.startsWith("%PDF")) {
          const base64 = await FileSystem.readAsStringAsync(localUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (base64) {
            setPdfData(base64);
            setOffline(true);
            return;
          }
        } else {
          // Delete corrupted/invalid cached JSON file
          await FileSystem.deleteAsync(localUri, { idempotent: true });
        }
      }

      /*
       * Query backend API for file or metadata.
       */
      let downloadPath = `/ebooks/${ebookId}/content`;
      const response = await api.get(downloadPath, {
        responseType: "arraybuffer",
      });

      const data = response.data;
      let bytes: Uint8Array = new Uint8Array(0);

      if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
      } else if (data?.buffer instanceof ArrayBuffer) {
        bytes = new Uint8Array(
          data.buffer,
          data.byteOffset || 0,
          data.byteLength
        );
      } else if (typeof data === "object" && data !== null) {
        if (data.file_url) {
          downloadPath = data.file_url;
        }
      }

      // Read initial response bytes to verify format
      let textSnippet = "";
      const checkLen = Math.min(bytes.length, 100);
      for (let i = 0; i < checkLen; i++) {
        textSnippet += String.fromCharCode(bytes[i]);
      }

      let pdfBase64 = "";

      // If response is JSON, extract file_url and download actual PDF binary
      if (textSnippet.trim().startsWith("{") || bytes.length === 0) {
        if (textSnippet.trim().startsWith("{")) {
          try {
            const jsonStr = String.fromCharCode(...bytes);
            const json = JSON.parse(jsonStr);
            if (json.file_url) {
              downloadPath = json.file_url;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }

        const baseURL = api.defaults.baseURL || "";
        let finalFileUrl = downloadPath;

        if (!finalFileUrl.startsWith("http")) {
          const hostBase = baseURL.replace(/\/api\/?$/, "").replace(/\/+$/, "");
          finalFileUrl = `${hostBase}/${downloadPath.replace(/^\/+/, "")}`;
        }

        const authHeader =
          (api.defaults.headers as any)?.common?.["Authorization"] ||
          (api.defaults.headers as any)?.["Authorization"];
        const headers: Record<string, string> = {};
        if (authHeader) {
          headers["Authorization"] = String(authHeader);
        }

        const downloadRes = await FileSystem.downloadAsync(
          finalFileUrl,
          localUri,
          { headers }
        );

        if (downloadRes.status !== 200) {
          throw new Error(`Failed to download ebook file (HTTP ${downloadRes.status})`);
        }

        pdfBase64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (textSnippet.startsWith("%PDF")) {
        // Direct PDF binary stream received
        let binary = "";
        const chunkSize = 0x8000;

        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(
            i,
            Math.min(i + chunkSize, bytes.length)
          );
          binary += String.fromCharCode(...chunk);
        }

        pdfBase64 = (globalThis as any).btoa(binary);

        await FileSystem.writeAsStringAsync(localUri, pdfBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        throw new Error("File downloaded is not a valid PDF document.");
      }

      if (!pdfBase64) {
        throw new Error("Ebook content is empty.");
      }

      setPdfData(pdfBase64);
      setOffline(false);
    } catch (err: any) {
      console.error(
        "EBOOK READER ERROR:",
        err?.response?.data || err
      );

      setError(
        "Unable to load this ebook. Please connect to the internet once to download it for offline reading."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Build complete WebView HTML document with PDF.js Web Worker.
   */
  const html = useMemo(() => {
    if (!pdfData || !pdfJsContent || !pdfJsWorkerContent) {
      return "";
    }

    const safePdfJs = pdfJsContent.replace(/<\/script/gi, "<\\/script");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
  />

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #f3f4f6;
      width: 100%;
      min-height: 100%;
      font-family: Arial, sans-serif;
    }

    #viewer {
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      padding: 18px 0 36px 0;
    }

    .page-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-bottom: 18px;
      padding: 0 18px;
      box-sizing: border-box;
    }

    canvas.page {
      display: block;
      max-width: min(100%, 980px);
      height: auto;
      background: #ffffff;
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.12);
    }

    #loading {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 15px;
    }

    #error {
      display: none;
      padding: 30px 20px;
      text-align: center;
      color: #b91c1c;
      font-size: 15px;
    }
  </style>
</head>

<body>

  <div id="loading">
    Opening e-book...
  </div>

  <div id="error"></div>

  <div id="viewer"></div>

  <script>
    ${safePdfJs}
  </script>

  <script>
    (async function () {
      try {
        const pdfjsLib = window.pdfjsLib;

        if (!pdfjsLib) {
          throw new Error(
            "PDF.js failed to initialize inside the WebView."
          );
        }

        const workerCode = ${JSON.stringify(pdfJsWorkerContent)};
        const workerBlob = new Blob([workerCode], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(workerBlob);

        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

        const base64 = ${JSON.stringify(pdfData)};

        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({
          data: bytes
        });

        const pdf = await loadingTask.promise;

        const viewer = document.getElementById("viewer");
        const loading = document.getElementById("loading");

        loading.style.display = "none";

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);

          const baseViewport = page.getViewport({ scale: 1 });

          const availableWidth =
            Math.min(
              window.innerWidth || 800,
              900
            ) - 20;

          const scale = availableWidth / baseViewport.width;

          const viewport = page.getViewport({
            scale: Math.max(scale, 0.5)
          });

          const wrapper = document.createElement("div");
          wrapper.className = "page-wrapper";

          const canvas = document.createElement("canvas");
          canvas.className = "page";

          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Unable to create PDF canvas.");
          }

          const outputScale = window.devicePixelRatio || 1;

          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);

          canvas.style.width = Math.floor(viewport.width) + "px";
          canvas.style.height = Math.floor(viewport.height) + "px";

          context.setTransform(
            outputScale,
            0,
            0,
            outputScale,
            0,
            0
          );

          wrapper.appendChild(canvas);
          viewer.appendChild(wrapper);

          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
        }

      } catch (err) {
        console.error("PDF VIEWER ERROR:", err);

        const loading = document.getElementById("loading");
        const error = document.getElementById("error");

        if (loading) loading.style.display = "none";

        if (error) {
          error.style.display = "block";
          error.textContent =
            "Unable to display this e-book. " +
            (err && err.message ? err.message : "Unknown PDF error.");
        }
      }
    })();
  </script>

</body>
</html>
`;
  }, [pdfData, pdfJsContent, pdfJsWorkerContent]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Opening e-book...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>E-book unavailable</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.back}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || "E-Book"}
          </Text>
          <Text style={styles.status}>
            {offline ? "Offline" : "Online"}
          </Text>
        </View>
      </View>

      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        startInLoadingState={false}
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  back: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 36,
    lineHeight: 40,
    color: "#111827",
    fontWeight: "300",
  },

  titleContainer: {
    flex: 1,
    marginLeft: 4,
  },

  title: {
    fontSize: isDesktopWeb ? 19 : 16,
    fontWeight: "600",
    color: "#111827",
  },

  status: {
    marginTop: 2,
    fontSize: isDesktopWeb ? 13 : 12,
    color: "#6B7280",
  },

  webview: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#FFFFFF",
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: "#6B7280",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  errorText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },

  backButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});