import { useState, useEffect, useCallback } from "react";
import {
    expendituresAPI,
    basesAPI,
    equipmentTypesAPI,
    assetsAPI,
} from "../services/api";
import { message } from "antd";

export const useExpenditures = () => {
    const [expenditures, setExpenditures] = useState([]);
    const [bases, setBases] = useState([]);
    const [equipmentTypes, setEquipmentTypes] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [expendituresRes, basesRes, equipmentTypesRes, assetsRes] =
                await Promise.all([
                    expendituresAPI.getAll(),
                    basesAPI.getAll(),
                    equipmentTypesAPI.getAll(),
                    assetsAPI.getAll(),
                ]);
            setExpenditures(expendituresRes.data);
            setBases(basesRes.data);
            setEquipmentTypes(equipmentTypesRes.data);
            setAssets(assetsRes.data);
            setError(null);
        } catch (err) {
            setError(err);
            message.error(err.message || "Failed to fetch expenditure data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createExpenditure = async (expenditureData) => {
        try {
            setLoading(true);
            const response = await expendituresAPI.create(expenditureData);
            message.success(
                response.message || "Expenditure created successfully"
            );
            fetchData();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || "Failed to create expenditure");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const approveExpenditure = async (id) => {
        try {
            setLoading(true);
            const response = await expendituresAPI.approve(id);
            message.success(
                response.message || "Expenditure approved successfully"
            );
            fetchData();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || "Failed to approve expenditure");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const completeExpenditure = async (id) => {
        try {
            setLoading(true);
            const response = await expendituresAPI.complete(id);
            message.success(
                response.message || "Expenditure completed successfully"
            );
            fetchData();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || "Failed to complete expenditure");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const cancelExpenditure = async (id, reason) => {
        try {
            setLoading(true);
            const response = await expendituresAPI.cancel(id, { reason });
            message.success(
                response.message || "Expenditure cancelled successfully"
            );
            fetchData();
            return true;
        } catch (err) {
            setError(err);
            message.error(err.message || "Failed to cancel expenditure");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        expenditures,
        bases,
        equipmentTypes,
        assets,
        loading,
        error,
        createExpenditure,
        approveExpenditure,
        completeExpenditure,
        cancelExpenditure,
        refetch: fetchData,
    };
};
