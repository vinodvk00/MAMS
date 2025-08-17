import { useState, useEffect, useCallback } from "react";
import {
    transfersAPI,
    assetsAPI,
    basesAPI,
    equipmentTypesAPI,
} from "../services/api";
import { App } from "antd";
import { useAuth } from "../context/AuthContext";

export const useTransfers = () => {
    const [transfers, setTransfers] = useState([]);
    const [availableAssets, setAvailableAssets] = useState([]);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const { message: messageApi } = App.useApp();
    const { user } = useAuth();

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let transfersRes;
            if (user.role === "base_commander") {
                transfersRes = await transfersAPI.getByBase();
            } else {
                transfersRes = await transfersAPI.getAll();
            }

            let assetsRequest;
            if (user.role === "admin" || user.role === "logistics_officer") {
                assetsRequest = assetsAPI.getAll();
            } else if (user.role === "base_commander") {
                assetsRequest = assetsAPI.getByBase();
            } else {
                assetsRequest = Promise.resolve({ data: [] });
            }

            const [assetsRes, basesRes, equipmentTypesRes] = await Promise.all([
                assetsRequest,
                basesAPI.getAll(),
                equipmentTypesAPI.getAll(),
            ]);

            setTransfers(transfersRes.data || []);
            setBases(basesRes.data || []);
            setEquipmentTypes(equipmentTypesRes.data || []);
            setAvailableAssets(
                assetsRes.data.filter(
                    (asset) => asset.status === "AVAILABLE"
                ) || []
            );
        } catch (error) {
            messageApi.error(error.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, [user, messageApi]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        transfers,
        availableAssets,
        bases,
        equipmentTypes,
        loading,
        fetchData,
    };
};
