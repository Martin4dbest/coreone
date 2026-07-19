import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
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
      }
    }

    return Promise.reject(error);
  }
);

export default api;
