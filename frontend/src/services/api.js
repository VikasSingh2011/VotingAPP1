import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            originalRequest.url !== '/user/refresh' &&
            originalRequest.url !== '/user/login' &&
            originalRequest.url !== '/user/signup'
        ) {
            originalRequest._retry = true;

            try {
                await api.post('/user/refresh');
                return api(originalRequest);
            } catch (refreshError) {
                console.warn('Session expired or unauthorized.');
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
