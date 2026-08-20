import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { getToken, getTenant } from "@/storage/auth";
import api from "./api";


export async function getStudentProfile(){
    const response = await api.get(
        "/students/me"
    );

    return response.data;
}


export async function getStudentOverview(){
    const response = await api.get(
        "/students/dashboard"
    );

    return response.data;
}


export async function getStudentAttendance() {
  const response = await api.get(
    "/mobile/student/attendance"
  );

  return response.data;
}


export async function getStudentResults(){
    const response = await api.get(
        "/mobile/student/results"
    );

    return response.data;
}



export async function downloadStudentResultsPdf() {
  const apiRoot =
    process.env.EXPO_PUBLIC_API_URL ||
    "https://coreone.onrender.com";

  const url =
    `${apiRoot}/api/v1/mobile/student/results/pdf`;

  const token = await getToken();
  const tenant = await getTenant();

  if (!token) {
    throw new Error("Your login session has expired.");
  }

  const tenantCode =
    tenant?.school_code ||
    tenant?.code ||
    tenant?.schoolCode ||
    "";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (tenantCode) {
    headers["X-Tenant"] =
      String(tenantCode).trim().toUpperCase();
  }

  // Desktop web: download the returned PDF blob directly.
  if (Platform.OS === "web") {
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      let detail = `Unable to download report PDF (${response.status}).`;

      try {
        const data = await response.json();
        detail =
          data?.detail ||
          data?.message ||
          detail;
      } catch {
        // Keep fallback message.
      }

      throw new Error(detail);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = "CoreOne_Report_Card.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);

    return {
      mode: "web",
      success: true,
    };
  }

  // Android / native:
  // download the exact server-generated PDF to app storage,
  // then open the native share/download sheet.
  if (!FileSystem.documentDirectory) {
    throw new Error(
      "Device document storage is unavailable."
    );
  }

  const destination =
    `${FileSystem.documentDirectory}CoreOne_Report_Card.pdf`;

  const result = await FileSystem.downloadAsync(
    url,
    destination,
    {
      headers,
    }
  );

  if (result.status !== 200) {
    throw new Error(
      `Unable to download report PDF (${result.status}).`
    );
  }

  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(
      result.uri,
      {
        mimeType: "application/pdf",
        dialogTitle: "Student Report Card",
        UTI: "com.adobe.pdf",
      }
    );
  }

  return {
    mode: "native",
    success: true,
    uri: result.uri,
  };
}

export async function getStudentAssignments(){
    const response = await api.get(
        "/assignments/student"
    );

    return response.data;
}


export async function getStudentCBT(){
    const response = await api.get(
        "/cbt/student"
    );

    return response.data;
}


export async function getStudentEbooks(){
    const response = await api.get(
        "/ebooks"
    );

    return response.data;
}
