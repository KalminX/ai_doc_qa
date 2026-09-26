import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});


// Helper function to extract clear, descriptive error strings from API responses
export const parseApiError = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data.error === "string") return data.error;
    if (typeof data.detail === "string") return data.detail;
    if (typeof data === "string") return data;
    // Handle field error objects e.g. { username: ["This field is required"] }
    if (typeof data === "object") {
      const keys = Object.keys(data);
      if (keys.length > 0) {
        const val = data[keys[0]];
        if (Array.isArray(val)) return `${keys[0]}: ${val[0]}`;
        if (typeof val === "string") return `${keys[0]}: ${val}`;
      }
    }
  }
  if (error.message === "Network Error") {
    return "Cannot connect to backend server. Please verify Django is running on port 8000.";
  }
  return error.message || "An unexpected error occurred.";
};

// Request Interceptor: log requests and attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response Interceptor: handle token refresh and log errors
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const formattedError = parseApiError(error);

    console.error(
      `[API Error] ${error.response?.status || "NET"} ${originalRequest?.url}:`,
      formattedError,
      error.response?.data
    );

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = res.data.access;
          localStorage.setItem("access_token", newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          console.error("[API Auth] Refresh token expired, redirecting to login.");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      } else {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
