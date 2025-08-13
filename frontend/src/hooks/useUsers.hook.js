import { useState, useEffect, useCallback } from "react";
import { userAPI, basesAPI } from "../services/api";
import { message } from "antd";

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [bases, setBases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await userAPI.getAll();
            setUsers(response.data || []);
            setError(null);
        } catch (err) {
            setError(err);
            message.error(err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBases = useCallback(async () => {
        try {
            const response = await basesAPI.getAll();
            setBases(response.data || []);
        } catch (err) {
            message.error(err.message || 'Failed to fetch bases');
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchBases();
    }, [fetchUsers, fetchBases]);

    const addUser = async (userData) => {
        try {
            setLoading(true);
            const response = await userAPI.create(userData);
            message.success(response.message || "User added successfully");
            fetchUsers();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || 'Failed to add user');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (id, userData) => {
        try {
            setLoading(true);
            const response = await userAPI.update(id, userData);
            message.success(response.message || "User updated successfully");
            fetchUsers();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || 'Failed to update user');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id) => {
        try {
            setLoading(true);
            await userAPI.delete(id);
            message.success("User deleted successfully");
            fetchUsers();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || 'Failed to delete user');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const changeUserRole = async (id, role) => {
        try {
            setLoading(true);
            const response = await userAPI.changeRole(id, role);
            message.success(response.message || "User role changed successfully");
            fetchUsers();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || 'Failed to change user role');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        users,
        bases,
        loading,
        error,
        addUser,
        updateUser,
        deleteUser,
        changeUserRole,
        refetch: fetchUsers,
    };
};
