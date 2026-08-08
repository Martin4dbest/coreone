import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, router } from "expo-router";

export default function EbookReader() {
  const params = useLocalSearchParams<{
    url?: string;
    title?: string;
  }>();

  const url = Array.isArray(params.url)
    ? params.url[0]
    : params.url;

  const title = Array.isArray(params.title)
    ? params.title[0]
    : params.title;

  /*
   * Android WebView does not render PDF files directly.
   *
   * Instead, we create a tiny HTML page inside the WebView
   * and use PDF.js to render the ACTUAL PDF.
   *
   * There is:
   * - NO Google viewer
   * - NO Google support page
   * - NO external browser
   * - NO Linking.openURL
   * - NO login redirect
   */
  const html = useMemo(() => {
    if (!url) return "";

    const safeUrl = encodeURIComponent(url);

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
      width: 100%;
      height: 100%;
      background: #525659;
      overflow: auto;
    }

    #loading {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      background: white;
      color: #475569;
      font-family: Arial, sans-serif;
      z-index: 10;
    }

    #loadingText {
      margin-top: 14px;
      font-size: 14px;
    }

    #error {
      display: none;
      position: fixed;
      inset: 0;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      background: white;
      color: #334155;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 30px;
    }

    #pages {
      width: 100%;
      padding: 10px 0 30px;
    }

    .page {
      display: block;
      margin: 0 auto 12px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,.25);
      max-width: 100%;
      height: auto;
    }
  </style>
</head>

<body>

  <div id="loading">
    <div style="
      width:30px;
      height:30px;
      border:3px solid #E2E8F0;
      border-top-color:#2563EB;
      border-radius:50%;
      animation:spin 1s linear infinite;
    "></div>

    <div id="loadingText">
      Opening e-book...
    </div>
  </div>

  <div id="error">
    <div style="
      font-size:18px;
      font-weight:bold;
      margin-bottom:10px;
    ">
      Unable to open e-book
    </div>

    <div>
      The PDF could not be loaded.
    </div>
  </div>

  <div id="pages"></div>

  <style>
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs"
          type="module"></script>

  <script type="module">

    import * as pdfjsLib from
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

    const pdfUrl = decodeURIComponent("${safeUrl}");

    const loading = document.getElementById("loading");
    const error = document.getElementById("error");
    const pages = document.getElementById("pages");

    async function openPdf() {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
        });

        const pdf = await loadingTask.promise;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          const page = await pdf.getPage(pageNumber);

          const containerWidth =
            document.documentElement.clientWidth - 16;

          const baseViewport = page.getViewport({
            scale: 1,
          });

          const scale =
            containerWidth / baseViewport.width;

          const viewport = page.getViewport({
            scale: Math.max(scale, 0.5),
          });

          const canvas = document.createElement("canvas");

          canvas.className = "page";

          const context =
            canvas.getContext("2d");

          const outputScale =
            window.devicePixelRatio || 1;

          canvas.width =
            Math.floor(
              viewport.width * outputScale
            );

          canvas.height =
            Math.floor(
              viewport.height * outputScale
            );

          canvas.style.width =
            Math.floor(viewport.width) + "px";

          canvas.style.height =
            Math.floor(viewport.height) + "px";

          pages.appendChild(canvas);

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            transform:
              outputScale !== 1
                ? [
                    outputScale,
                    0,
                    0,
                    outputScale,
                    0,
                    0,
                  ]
                : null,
          };

          await page.render(
            renderContext
          ).promise;
        }

        loading.style.display = "none";

      } catch (e) {
        console.error(
          "PDF ERROR:",
          e
        );

        loading.style.display = "none";
        error.style.display = "flex";
      }
    }

    openPdf();

  </script>

</body>
</html>
`;
  }, [url]);

  if (!url) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>
          E-book unavailable
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButtonIcon}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>
            ‹
          </Text>
        </Pressable>

        <Text
          style={styles.title}
          numberOfLines={1}
        >
          {title || "E-Book"}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <WebView
        source={{
          html,
          baseUrl: url,
        }}
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="always"
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color="#2563EB"
            />

            <Text style={styles.loadingText}>
              Opening e-book...
            </Text>
          </View>
        )}
        onError={(event) => {
          console.log(
            "EBOOK READER ERROR:",
            event.nativeEvent
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    height: 58,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  backButtonIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  backArrow: {
    fontSize: 38,
    lineHeight: 38,
    fontWeight: "300",
    color: "#0F172A",
  },

  title: {
    flex: 1,
    marginHorizontal: 8,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  headerSpacer: {
    width: 42,
  },

  webview: {
    flex: 1,
  },

  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 30,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 20,
  },

  backButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
