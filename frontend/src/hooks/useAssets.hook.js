import { useState, useEffect, useCallback } from "react";
import {
    assetsAPI,
    basesAPI,
    equipmentTypesAPI,
    purchasesAPI,
} from "../services/api";
import { message } from "antd";
import { useAuth } from "../context/AuthContext";

export const useAssets = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [formLoading, setFormLoading] = useState(false);

    const { user } = useAuth();

    const fetchAssets = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            let response;
            if (user.role === "admin" || user.role === "logistics_officer") {
                response = await assetsAPI.getAll();
            } else if (user.role === "base_commander") {
                response = await assetsAPI.getByBase();
            } else {
                setAssets([]);
                return;
            }
            setAssets(response.data || []);
            setError(null);
        } catch (err) {
            setError(err);
            message.error(err.message || "Failed to fetch assets");
        } finally {
            setLoading(false);
        }
    }, [user]);

    const fetchFormData = useCallback(async () => {
        if (!user) return;

        setFormLoading(true);
        try {
            const equipmentTypesRes = await equipmentTypesAPI.getAll();
            setEquipmentTypes(
                Array.isArray(equipmentTypesRes.data)
                    ? equipmentTypesRes.data
                    : []
            );

            if (user.role === "admin" || user.role === "logistics_officer") {
                const [basesRes, purchasesRes] = await Promise.all([
                    basesAPI.getAll(),
                    purchasesAPI.getAll(),
                ]);
                setBases(Array.isArray(basesRes.data) ? basesRes.data : []);
                setPurchases(
                    Array.isArray(purchasesRes.data) ? purchasesRes.data : []
                );
            } else if (user.role === "base_commander" && user.assignedBase) {
                console.log("Fetching data for base commander:", user);
                const [commanderBaseRes, purchasesForBaseRes] =
                    await Promise.all([
                        basesAPI.getByCommander(user._id),
                        purchasesAPI.getByBase(),
                    ]);

                console.log("Commander Base Data:", commanderBaseRes.data);
                console.log("Purchases for Base:", purchasesForBaseRes.data);
                setBases(commanderBaseRes.data ? [commanderBaseRes.data] : []);
                setPurchases(
                    Array.isArray(purchasesForBaseRes.data)
                        ? purchasesForBaseRes.data
                        : []
                );
            }
        } catch (error) {
            if (error.response?.status !== 403) {
                message.error(error.message || "Failed to load form data");
            }
        } finally {
            setFormLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchAssets();
        fetchFormData();
    }, [fetchAssets, fetchFormData]);

    const addAsset = async (assetData) => {
        try {
            if (user.role === "base_commander") {
                assetData.currentBase = user.assignedBase;
            }
            await assetsAPI.create(assetData);
            message.success("Asset created successfully");
            await fetchAssets();
            return true;
        } catch (error) {
            message.error(error.message || "Failed to create asset");
            return false;
        }
    };

    const updateAsset = async (id, assetData) => {
        try {
            await assetsAPI.update(id, assetData);
            message.success("Asset updated successfully");
            fetchAssets();
            return true;
        } catch (error) {
            message.error(error.message || "Failed to update asset");
            return false;
        }
    };

    const deleteAsset = async (id) => {
        try {
            await assetsAPI.delete(id);
            message.success("Asset deleted successfully");
            fetchAssets();
            return true;
        } catch (error) {
            message.error(error.message || "Failed to delete asset");
            return false;
        }
    };

    return {
        assets,
        loading,
        error,
        bases,
        equipmentTypes,
        purchases,
        formLoading,
        addAsset,
        updateAsset,
        deleteAsset,
        refetch: fetchAssets,
    };
};
