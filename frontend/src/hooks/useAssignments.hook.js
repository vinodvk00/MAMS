import { useState, useEffect, useCallback } from "react";
import { assignmentsAPI, assetsAPI, userAPI } from "../services/api";
import { App } from "antd";
import { useAuth } from "../context/AuthContext";

export const useAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [assets, setAssets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { message: messageApi } = App.useApp();

    const canManageAssignments =
        user?.role === "admin" || user?.role === "base_commander";

    const fetchData = useCallback(async () => {
        if (!canManageAssignments) return;
        setLoading(true);
        try {
            const assignmentsRes = await assignmentsAPI.getAll();
            setAssignments(assignmentsRes.data);

            const assetsRes =
                user?.role === "admin"
                    ? await assetsAPI.getAll()
                    : await assetsAPI.getByBase();
            setAssets(
                assetsRes.data.filter((asset) => asset.status === "AVAILABLE")
            );

            const usersRes =
                user?.role === "admin"
                    ? await userAPI.getAll()
                    : await userAPI.getByBase();
            setUsers(usersRes.data);
        } catch (error) {
            messageApi.error(error.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, [user, canManageAssignments, messageApi]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createAssignment = async (data) => {
        try {
            await assignmentsAPI.create(data);
            messageApi.success("Assignment created successfully");
            fetchData();
            return true;
        } catch (error) {
            messageApi.error(error.message || "Failed to create assignment");
            return false;
        }
    };

    const returnAsset = async (id, data) => {
        try {
            await assignmentsAPI.return(id, data);
            messageApi.success("Asset returned successfully");
            fetchData();
            return true;
        } catch (error) {
            messageApi.error(error.message || "Failed to return asset");
            return false;
        }
    };

    const markAsLostOrDamaged = async (id, data) => {
        try {
            await assignmentsAPI.markAsLostOrDamaged(id, data);
            messageApi.success(
                `Asset marked as ${data.status.toLowerCase()} successfully`
            );
            fetchData();
            return true;
        } catch (error) {
            messageApi.error(error.message || "Failed to update asset status");
            return false;
        }
    };

    return {
        assignments,
        assets,
        users,
        loading,
        canManageAssignments,
        createAssignment,
        returnAsset,
        markAsLostOrDamaged,
    };
};
