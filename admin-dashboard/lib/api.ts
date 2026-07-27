import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});


/*
  SIMPLE GET CACHE
  Prevents repeated loading of the same dashboard data
  within 30 seconds.
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
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }


  // Cache GET requests
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
      }

    }


    return Promise.reject(error);

  }

);


export default api;
