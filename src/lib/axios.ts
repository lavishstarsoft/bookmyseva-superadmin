import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// API URL configuration - Updated for v1 API
const getApiUrl = (): string => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    // Remove trailing slash if present
    const cleanUrl = envUrl.replace(/\/$/, "");
    // Always use /api/v1 for versioned API
    return `${cleanUrl}/api/v1`;
};

// Helper to get token from cookie (consistent with middleware)
const getTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    return match ? match[2] : null;
};

const api = axios.create({
    baseURL: getApiUrl(),
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000,
    withCredentials: true, // Important for cookie-based auth
});

// Request interceptor - attach token from cookie
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getTokenFromCookie();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.response?.status === 401) {
            // Clear token cookie
            if (typeof document !== 'undefined') {
                document.cookie = 'token=; Max-Age=0; path=/;';
            }
            // Redirect to login (client-side only)
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Export helper for getting base URL (for socket connections etc.)
export const getBaseUrl = (): string => {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
};

export default api;

