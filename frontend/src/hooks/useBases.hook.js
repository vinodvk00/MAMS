import { useState, useEffect, useCallback } from "react";
import { basesAPI, userAPI } from "../services/api";
import { message } from "antd";

export const useBases = () => {
    const [bases, setBases] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBases = useCallback(async () => {
        try {
            setLoading(true);
            const response = await basesAPI.getAll();
            setBases(response.data || []);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await userAPI.getAll();
            const commanders = response.data.filter(
                (user) =>
                    user.role === "base_commander" || user.role === "admin"
            );
            setUsers(commanders);
        } catch (err) {
            setError(err);
        }
    }, []);

    useEffect(() => {
        fetchBases();
        fetchUsers();
    }, [fetchBases, fetchUsers]);

    const addBase = async (baseData) => {
        try {
            setLoading(true);
            const response = await basesAPI.create(baseData);
            setBases((prev) => [...prev, response.data]);
            message.success(response.message || "Base added successfully");
            return true;
        } catch (err) {
            setError(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateBase = async (id, baseData) => {
        try {
            setLoading(true);
            const response = await basesAPI.update(id, baseData);
            setBases((prev) =>
                prev.map((e) => (e._id === id ? response.data : e))
            );
            message.success(response.message || "Base updated successfully");
            return true;
        } catch (err) {
            setError(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteBase = async (id) => {
        try {
            setLoading(true);
            await basesAPI.delete(id);
            setBases((prev) => prev.filter((e) => e._id !== id));
            message.success("Base deleted successfully");
            return true;
        } catch (err) {
            setError(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        bases,
        loading,
        error,
        addBase,
        updateBase,
        deleteBase,
        users,
        refetch: fetchBases,
    };
};
