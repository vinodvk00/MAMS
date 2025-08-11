import { useState, useEffect, useCallback } from "react";
import { equipmentTypesAPI } from "../services/api";
import { message } from "antd";

export const useEquipments = () => {
    const [equipments, setEquipments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchEquipments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await equipmentTypesAPI.getAll();
            setEquipments(response.data || []);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEquipments();
    }, [fetchEquipments]);

    const addEquipment = async (equipmentData) => {
        try {
            setLoading(true);
            const response = await equipmentTypesAPI.create(equipmentData);
            setEquipments((prev) => [...prev, response.data]);
            message.success(response.message || "Equipment added successfully");
            return true;
        } catch (err) {
            setError(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateEquipment = async (id, equipmentData) => {
        try {
            setLoading(true);
            const response = await equipmentTypesAPI.update(id, equipmentData);
            setEquipments((prev) =>
                prev.map((e) => (e._id === id ? response.data : e))
            );
            message.success(response.message || "Equipment updated successfully");
            return true;
        } catch (err) {
            setError(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteEquipment = async (id) => {
        try {
            setLoading(true);
            await equipmentTypesAPI.delete(id);
            setEquipments((prev) => prev.filter((e) => e._id !== id));
            message.success("Equipment deleted successfully");
            return true;
        } catch (err) {
            setError(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        equipments,
        loading,
        error,
        addEquipment,
        updateEquipment,
        deleteEquipment,
        refetch: fetchEquipments,
    };
};
