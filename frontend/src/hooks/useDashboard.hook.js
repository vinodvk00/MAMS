import { useState, useEffect, useCallback, useMemo } from "react";
import { dashboardAPI } from "../services/api";

export const useDashboard = () => {
    const [metrics, setMetrics] = useState({});
    const [netMovementBreakdown, setNetMovementBreakdown] = useState({
        purchases: 0,
        transfersIn: 0,
        transfersOut: 0,
    });

    const [filterOptions, setFilterOptions] = useState({
        bases: [],
        equipmentTypes: [],
        statusOptions: [],
    });

    const [filters, setFilters] = useState({
        dateRange: [],
        baseId: "",
        equipmentTypeId: "",
    });

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [detailData, setDetailData] = useState({
        type: null,
        data: [],
        pagination: {},
        isLoading: false,
        error: null,
    });

    const fetchMetrics = useCallback(async (currentFilters) => {
        try {
            const params = {
                startDate: currentFilters.dateRange?.[0]?.format("YYYY-MM-DD"),
                endDate: currentFilters.dateRange?.[1]?.format("YYYY-MM-DD"),
                baseId: currentFilters.baseId || null,
                equipmentTypeId: currentFilters.equipmentTypeId || null,
            };

            const response = await dashboardAPI.getMetrics(params);
            if (response.data) {
                setMetrics(response.data.metrics || {});
                setNetMovementBreakdown(
                    response.data.netMovementBreakdown || {
                        purchases: 0,
                        transfersIn: 0,
                        transfersOut: 0,
                    }
                );
            }
        } catch (err) {
            setError(err.message || "Failed to fetch dashboard metrics.");
        }
    }, []);

    const fetchFilterOptions = useCallback(async () => {
        try {
            const response = await dashboardAPI.getFilters();
            if (response.data) {
                setFilterOptions(response.data);
            }
        } catch (err) {
            setError(err.message || "Could not load filter options.");
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            setError(null);
            await Promise.all([fetchFilterOptions(), fetchMetrics(filters)]);
            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const handler = setTimeout(() => {
            fetchMetrics(filters);
        }, 500);

        return () => clearTimeout(handler);
    }, [filters, fetchMetrics, isLoading]);

    const fetchDetailData = useCallback(
        async (type, page = 1) => {
            setDetailData({
                type,
                data: [],
                pagination: {},
                isLoading: true,
                error: null,
            });
            try {
                const params = {
                    startDate: filters.dateRange?.[0]?.format("YYYY-MM-DD"),
                    endDate: filters.dateRange?.[1]?.format("YYYY-MM-DD"),
                    baseId: filters.baseId || null,
                    equipmentTypeId: filters.equipmentTypeId || null,
                    page,
                    limit: 10,
                };
                let response;
                if (type === "purchases")
                    response = await dashboardAPI.getPurchasesDetail(params);
                else if (type === "transfersIn")
                    response = await dashboardAPI.getTransfersInDetail(params);
                else if (type === "transfersOut")
                    response = await dashboardAPI.getTransfersOutDetail(params);
                else throw new Error("Invalid detail type");

                setDetailData({
                    type,
                    data:
                        response.data.purchases ||
                        response.data.transfers ||
                        [],
                    pagination: response.data.pagination,
                    isLoading: false,
                    error: null,
                });
            } catch (err) {
                setDetailData({
                    type,
                    data: [],
                    pagination: {},
                    isLoading: false,
                    error: err.message,
                });
            }
        },
        [filters]
    );

    return useMemo(
        () => ({
            metrics,
            netMovementBreakdown,
            filterOptions,
            filters,
            setFilters,
            isLoading,
            error,
            detailData,
            fetchDetailData,
        }),
        [
            metrics,
            netMovementBreakdown,
            filterOptions,
            filters,
            isLoading,
            error,
            detailData,
            fetchDetailData,
        ]
    );
};
