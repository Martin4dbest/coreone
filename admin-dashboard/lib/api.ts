import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * GET cache
 */
const getCache = new Map<
  string,
  {
    data: unknown;
    timestamp: number;
  }
>();

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    /*
     * Use the same access token used by the admin login.
     * Keep a fallback for older sessions that may have used
     * a different key.
     */
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenant =
      localStorage.getItem("tenant_slug") ||
      localStorage.getItem("school_code") ||
      localStorage.getItem("tenant");

    if (tenant) {
      config.headers = config.headers || {};
      config.headers["X-Tenant"] = tenant;
    }
  }

  /*
   * Cache GET requests for 30 seconds.
   */
  if (config.method?.toLowerCase() === "get") {
    const key =
      config.url +
      JSON.stringify(config.params || {});

    const cached = getCache.get(key);

    if (
      cached &&
      Date.now() - cached.timestamp < 30000
    ) {
      config.adapter = async () => ({
        data: cached.data,
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (
      response.config.method?.toLowerCase() === "get"
    ) {
      const key =
        response.config.url +
        JSON.stringify(
          response.config.params || {}
        );

      getCache.set(key, {
        data: response.data,
        timestamp: Date.now(),
      });
    }

    return response;
  },

  (error) => {
    if (typeof window !== "undefined") {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "API Error Details:",
          error.response?.data || error
        );
      }

      if (
        error.response?.status === 401 &&
        !error.config?.url?.includes("/auth/login")
      ) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");

        const tenant =
          localStorage.getItem("tenant_slug") ||
          localStorage.getItem("school_code") ||
          localStorage.getItem("tenant");

        if (tenant) {
          window.location.href = `/${tenant}/login`;
        } else {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export function getAbsoluteUploadUrl(
  url: string | null | undefined
): string {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  const base =
    api.defaults.baseURL?.replace(/\/api\/v1\/?$/, "") ||
    "";

  if (!base) return url;

  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}
