import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000/api/v1",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// todo: cookie creation and handling
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

        if (
            error.response?.status === 403 &&
            error.response?.data?.message === "Invalid or expired access token"
        ) {
            localStorage.removeItem("token");
            window.location.href = "/login";

            return Promise.reject({
                message: "Invalid or expired token. Redirecting to login.",
            });
        }

        if (error.response?.data) {
            return Promise.reject(error.response.data);
        }
        if (error.code === "ERR_NETWORK" || !error.response) {
            return Promise.reject({
                message: "Cannot connect to backend server",
            });
        }

        return Promise.reject({
            message: error.message || "An unknown error occurred",
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
    getPurchasesDetail: (params) =>
        api.get("/dashboard/purchases-detail", { params }),
    getTransfersInDetail: (params) =>
        api.get("/dashboard/transfers-in-detail", { params }),
    getTransfersOutDetail: (params) =>
        api.get("/dashboard/transfers-out-detail", { params }),
};

export const assetsAPI = {
    getAll: () => api.get("/asset/"),
    getById: (id) => api.get(`/asset/${id}`),
    create: (data) => api.post("/asset/create", data),
    update: (id, data) => api.patch(`/asset/${id}`, data),
    delete: (id) => api.delete(`/asset/${id}`),
    getByBase: () => api.get("/asset/base"),
};

export const equipmentTypesAPI = {
    getAll: () => api.get("/equipment/getAll"),
    getById: (id) => api.get(`/equipment/${id}`),
    create: (data) => api.post("/equipment/create", data),
    update: (id, data) => api.patch(`/equipment/${id}`, data),
    delete: (id) => api.delete(`/equipment/${id}`),
};

export const basesAPI = {
    getAll: () => api.get("/base/"),
    getById: (id) => api.get(`/base/${id}`),
    getByCommander: (id) => api.get(`/base/commander/${id}`),
    create: (data) => api.post("/base/create", data),
    update: (id, data) => api.patch(`/base/${id}`, data),
    delete: (id) => api.delete(`/base/${id}`),
};

export const purchasesAPI = {
    getAll: () => api.get("/purchase/"),
    getById: (id) => api.get(`/purchase/${id}`),
    getByBase: () => api.get("/purchase/base"),
    create: (data) => api.post("/purchase/create", data),
    update: (id, data) => api.patch(`/purchase/update/${id}`, data),
    delete: (id) => api.delete(`/purchase/${id}`),
};

export const baseAPI = {
    getAll: () => api.get("/base"),
};

export const transfersAPI = {
    getAll: () => api.get("/transfer/"),
    getById: (id) => api.get(`/transfer/${id}`),
    getByBase: () => api.get("/transfer/base"),
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
    markAsLostOrDamaged: (id, data) =>
        api.patch(`/assignment/mark-lost-damaged/${id}`, data),
};

export const expendituresAPI = {
    getAll: () => api.get("/expenditure/"),
    create: (data) => api.post("/expenditure/create", data),
    approve: (id) => api.patch(`/expenditure/approve/${id}`),
    complete: (id) => api.patch(`/expenditure/complete/${id}`),
    cancel: (id, data) => api.patch(`/expenditure/cancel/${id}`, data),
};

export const userAPI = {
    getAll: () => api.get("/user"),
    getByBase: () => api.get("/user/base"),
    create: (data) => api.post("/user/register", data),
    update: (id, data) => api.patch(`/user/${id}`, data),
    delete: (id) => api.delete(`/user/${id}`),
    changeRole: (id, role) => api.patch(`/user/change-role/${id}`, { role }),
};

export const logsAPI = {
    getAll: (params) => api.get("/logs", { params }),
};

export default api;
