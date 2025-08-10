import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000/api/v1",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        console.error("API Error:", error);

        if (error.response?.data) {
            const backendError = error.response.data;
            // Return the backend error message directly
            return Promise.reject(backendError);
        }

        if (error.code === "ERR_NETWORK" || !error.response) {
            return Promise.reject({
                message: "Cannot connect to backend server",
            });
        }

        // Default error
        return Promise.reject({
            message: error.message || "Unknown error occurred",
        });
    }
);

export const authAPI = {
    login: (credentials) => api.post("/user/login", credentials),
    logout: () => api.get("/user/logout"),
    getProfile: () => api.get("/user/profile"),
};

export const dashboardAPI = {
    getMetrics: (params) => api.get("/dashboard/metrics", { params }),
    getFilters: () => api.get("/dashboard/filters"),
};

export const assetsAPI = {
    getAll: () => api.get("/asset/"),
    getById: (id) => api.get(`/asset/${id}`),
    create: (data) => api.post("/asset/create", data),
    update: (id, data) => api.patch(`/asset/${id}`, data),
    delete: (id) => api.delete(`/asset/${id}`),
    getByBase: () => api.get("/asset/base"),
};

export const purchasesAPI = {
    getAll: () => api.get("/purchase/"),
    getById: (id) => api.get(`/purchase/${id}`),
    create: (data) => api.post("/purchase/create", data),
    update: (id, data) => api.patch(`/purchase/update/${id}`, data),
    delete: (id) => api.delete(`/purchase/${id}`),
};

export const transfersAPI = {
    getAll: () => api.get("/transfer/"),
    getById: (id) => api.get(`/transfer/${id}`),
    initiate: (data) => api.post("/transfer/initiate", data),
    approve: (id) => api.patch(`/transfer/approve/${id}`),
    complete: (id) => api.patch(`/transfer/complete/${id}`),
    cancel: (id) => api.patch(`/transfer/cancel/${id}`),
};

export const assignmentsAPI = {
    getAll: () => api.get("/assignment/"),
    getById: (id) => api.get(`/assignment/${id}`),
    create: (data) => api.post("/assignment/create", data),
    return: (id, data) => api.patch(`/assignment/return/${id}`, data),
};

export default api;
