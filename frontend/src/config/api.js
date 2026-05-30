import axios from 'axios';

export const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:5000' : '');

if (!API_BASE_URL) {
    throw new Error('VITE_API_URL must be set for production builds.');
}

const DEBUG_API = import.meta.env.VITE_DEBUG === "true" || import.meta.env.DEV;

export const apiUrl = (path = '') => {
    const base = API_BASE_URL.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${base}${normalizedPath}`;
};

if (DEBUG_API) {
    console.info('[API DEBUG] debug logging enabled', { API_BASE_URL });
}

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    config.headers = config.headers || {};

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization;
    }

    if (DEBUG_API) {
        console.debug('[API REQUEST]', {
            method: config.method,
            url: config.baseURL ? `${config.baseURL}${config.url}` : config.url,
            hasToken: Boolean(token),
            authorization: config.headers.Authorization ? '[REDACTED]' : null,
            headers: config.headers,
            data: config.data,
        });
    }

    return config;
});

api.interceptors.response.use(
    (response) => {
        if (DEBUG_API) {
            console.debug('[API RESPONSE]', {
                url: response.config?.url,
                status: response.status,
                data: response.data,
            });
        }
        return response;
    },
    (error) => {
        if (DEBUG_API) {
            console.error('[API ERROR]', {
                url: error.config?.url,
                method: error.config?.method,
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
        }

        return Promise.reject(error);
    }
);

export default api;
