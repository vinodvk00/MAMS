import { useState, useEffect, useCallback } from "react";
import { purchasesAPI, basesAPI, equipmentTypesAPI } from "../services/api";
import { message } from "antd";
import { useAuth } from "../context/AuthContext";

export const usePurchases = () => {
    const [purchases, setPurchases] = useState([]);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    const fetchPurchases = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let response;
            if (user.role === "admin" || user.role === "logistics_officer") {
                response = await purchasesAPI.getAll();
            } else if (user.role === "base_commander") {
                response = await purchasesAPI.getByBase();
            } else {
                setPurchases([]);
                return;
            }
            setPurchases(response.data || []);
            setError(null);
        } catch (err) {
            setError(err);
            message.error(err.message || "Failed to fetch purchases");
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchDropdownData = useCallback(async () => {
        if (user?.role === "admin" || user?.role === "logistics_officer") {
            try {
                const [basesRes, equipmentTypesRes] = await Promise.all([
                    basesAPI.getAll(),
                    equipmentTypesAPI.getAll(),
                ]);
                setBases(basesRes.data);
                setEquipmentTypes(equipmentTypesRes.data);
            } catch (error) {
                message.error("Failed to fetch data for form");
            }
        }
    }, [user]);

    useEffect(() => {
        fetchPurchases();
        fetchDropdownData();
    }, [fetchPurchases, fetchDropdownData]);

    const addPurchase = async (purchaseData) => {
        try {
            setLoading(true);
            const response = await purchasesAPI.create(purchaseData);
            message.success(response.message || "Purchase added successfully");
            fetchPurchases();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || "Failed to add purchase");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updatePurchase = async (id, purchaseData) => {
        try {
            setLoading(true);
            const response = await purchasesAPI.update(id, purchaseData);
            message.success(
                response.message || "Purchase updated successfully"
            );
            fetchPurchases();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || "Failed to update purchase");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deletePurchase = async (id) => {
        try {
            setLoading(true);
            await purchasesAPI.delete(id);
            message.success("Purchase deleted successfully");
            fetchPurchases();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || "Failed to delete purchase");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        purchases,
        bases,
        equipmentTypes,
        loading,
        error,
        addPurchase,
        updatePurchase,
        deletePurchase,
        refetch: fetchPurchases,
    };
};
