import { Asset } from "../models/asset.models.js";
import { Purchase } from "../models/purchase.models.js";
import { Transfer } from "../models/transfer.models.js";
import { Assignment } from "../models/assignment.models.js";
import { Expenditure } from "../models/expenditure.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const getCurrentQuarterDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    let quarterStart, quarterEnd;

    if (month >= 0 && month <= 2) {
        // Q1: Jan-Mar
        quarterStart = new Date(year, 0, 1);
        quarterEnd = new Date(year, 2, 31, 23, 59, 59);
    } else if (month >= 3 && month <= 5) {
        // Q2: Apr-Jun
        quarterStart = new Date(year, 3, 1);
        quarterEnd = new Date(year, 5, 30, 23, 59, 59);
    } else if (month >= 6 && month <= 8) {
        // Q3: Jul-Sep
        quarterStart = new Date(year, 6, 1);
        quarterEnd = new Date(year, 8, 30, 23, 59, 59);
    } else {
        // Q4: Oct-Dec
        quarterStart = new Date(year, 9, 1);
        quarterEnd = new Date(year, 11, 31, 23, 59, 59);
    }

    return { quarterStart, quarterEnd };
};

const buildBaseFilter = (user, baseId = null) => {
    let baseFilter = {};

    if (user.role === "base_commander") {
        baseFilter = { currentBase: user.assignedBase };
    } else if (baseId) {
        baseFilter = { currentBase: baseId };
    }

    return baseFilter;
};

export const getDashboardMetrics = asyncHandler(async (req, res) => {
    const { startDate, endDate, baseId, equipmentTypeId, statusFilter } =
        req.query;

    let periodStart, periodEnd;
    if (startDate && endDate) {
        periodStart = new Date(startDate);
        periodEnd = new Date(endDate);
    } else {
        const { quarterStart, quarterEnd } = getCurrentQuarterDates();
        periodStart = quarterStart;
        periodEnd = quarterEnd;
    }

    const baseFilter = buildBaseFilter(req.user, baseId);

    let assetFilter = { ...baseFilter };
    if (equipmentTypeId) {
        assetFilter.equipmentType = equipmentTypeId;
    }
    if (statusFilter && statusFilter.length > 0) {
        const statusArray = Array.isArray(statusFilter)
            ? statusFilter
            : [statusFilter];
        assetFilter.status = { $in: statusArray };
    }

    try {
        const openingBalanceAssets = await Asset.find({
            ...assetFilter,
            createdAt: { $lte: periodStart },
        });
        const openingBalance = openingBalanceAssets.reduce(
            (sum, asset) => sum + (asset.quantity || 1),
            0
        );

        // Closing Balance: Assets that exist at period end (or now if period end is future)
        const endDate = periodEnd > new Date() ? new Date() : periodEnd;
        const closingBalanceAssets = await Asset.find({
            ...assetFilter,
            createdAt: { $lte: endDate },
        });
        const closingBalance = closingBalanceAssets.reduce(
            (sum, asset) => sum + (asset.quantity || 1),
            0
        );

        let purchaseFilter = {
            purchaseDate: { $gte: periodStart, $lte: periodEnd },
        };
        if (req.user.role === "base_commander") {
            purchaseFilter.base = req.user.assignedBase;
        } else if (baseId) {
            purchaseFilter.base = baseId;
        }
        if (equipmentTypeId) {
            purchaseFilter.equipmentType = equipmentTypeId;
        }

        const purchases = await Purchase.find(purchaseFilter);
        const totalPurchases = purchases.reduce(
            (sum, purchase) => sum + purchase.quantity,
            0
        );

        let transferInFilter = {
            transferDate: { $gte: periodStart, $lte: periodEnd },
            status: { $in: ["COMPLETED"] },
        };
        if (req.user.role === "base_commander") {
            transferInFilter.toBase = req.user.assignedBase;
        } else if (baseId) {
            transferInFilter.toBase = baseId;
        }
        if (equipmentTypeId) {
            transferInFilter.equipmentType = equipmentTypeId;
        }

        const transfersIn = await Transfer.find(transferInFilter);
        const totalTransfersIn = transfersIn.reduce(
            (sum, transfer) => sum + transfer.totalQuantity,
            0
        );

        let transferOutFilter = {
            transferDate: { $gte: periodStart, $lte: periodEnd },
            status: { $in: ["COMPLETED"] },
        };
        if (req.user.role === "base_commander") {
            transferOutFilter.fromBase = req.user.assignedBase;
        } else if (baseId) {
            transferOutFilter.fromBase = baseId;
        }
        if (equipmentTypeId) {
            transferOutFilter.equipmentType = equipmentTypeId;
        }

        const transfersOut = await Transfer.find(transferOutFilter);
        const totalTransfersOut = transfersOut.reduce(
            (sum, transfer) => sum + transfer.totalQuantity,
            0
        );

        const netMovement =
            totalPurchases + totalTransfersIn - totalTransfersOut;

        let assignmentFilter = {
            status: "ACTIVE",
        };
        if (req.user.role === "base_commander") {
            assignmentFilter.base = req.user.assignedBase;
        } else if (baseId) {
            assignmentFilter.base = baseId;
        }

        const activeAssignments =
            await Assignment.find(assignmentFilter).populate("asset");
        let assignedCount = 0;
        if (equipmentTypeId) {
            assignedCount = activeAssignments.filter(
                (assignment) =>
                    assignment.asset &&
                    assignment.asset.equipmentType.toString() ===
                        equipmentTypeId
            ).length;
        } else {
            assignedCount = activeAssignments.length;
        }

        let expenditureFilter = {
            expenditureDate: { $gte: periodStart, $lte: periodEnd },
            status: "COMPLETED",
        };
        if (req.user.role === "base_commander") {
            expenditureFilter.base = req.user.assignedBase;
        } else if (baseId) {
            expenditureFilter.base = baseId;
        }
        if (equipmentTypeId) {
            expenditureFilter.equipmentType = equipmentTypeId;
        }

        const expenditures = await Expenditure.find(expenditureFilter);
        const totalExpended = expenditures.reduce(
            (sum, exp) => sum + exp.quantity,
            0
        );

        return res.status(200).json({
            message: "Dashboard metrics retrieved successfully",
            status: "success",
            data: {
                periodStart,
                periodEnd,
                metrics: {
                    openingBalance,
                    closingBalance,
                    netMovement,
                    assignedCount,
                    expendedCount: totalExpended,
                },
                netMovementBreakdown: {
                    purchases: totalPurchases,
                    transfersIn: totalTransfersIn,
                    transfersOut: totalTransfersOut,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving dashboard metrics",
            status: "error",
            error: error.message,
        });
    }
});

export const getNetMovementBreakdown = asyncHandler(async (req, res) => {
    const { startDate, endDate, baseId, equipmentTypeId } = req.query;

    let periodStart, periodEnd;
    if (startDate && endDate) {
        periodStart = new Date(startDate);
        periodEnd = new Date(endDate);
    } else {
        const { quarterStart, quarterEnd } = getCurrentQuarterDates();
        periodStart = quarterStart;
        periodEnd = quarterEnd;
    }

    try {
        let purchaseFilter = {
            purchaseDate: { $gte: periodStart, $lte: periodEnd },
        };
        if (req.user.role === "base_commander") {
            purchaseFilter.base = req.user.assignedBase;
        } else if (baseId) {
            purchaseFilter.base = baseId;
        }
        if (equipmentTypeId) {
            purchaseFilter.equipmentType = equipmentTypeId;
        }

        const purchasesSummary = await Purchase.aggregate([
            { $match: purchaseFilter },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$quantity" },
                    totalAmount: { $sum: "$totalAmount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        let transferInFilter = {
            transferDate: { $gte: periodStart, $lte: periodEnd },
            status: "COMPLETED",
        };
        if (req.user.role === "base_commander") {
            transferInFilter.toBase = req.user.assignedBase;
        } else if (baseId) {
            transferInFilter.toBase = baseId;
        }
        if (equipmentTypeId) {
            transferInFilter.equipmentType = equipmentTypeId;
        }

        const transfersInSummary = await Transfer.aggregate([
            { $match: transferInFilter },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$totalQuantity" },
                    count: { $sum: 1 },
                },
            },
        ]);

        let transferOutFilter = {
            transferDate: { $gte: periodStart, $lte: periodEnd },
            status: "COMPLETED",
        };
        if (req.user.role === "base_commander") {
            transferOutFilter.fromBase = req.user.assignedBase;
        } else if (baseId) {
            transferOutFilter.fromBase = baseId;
        }
        if (equipmentTypeId) {
            transferOutFilter.equipmentType = equipmentTypeId;
        }

        const transfersOutSummary = await Transfer.aggregate([
            { $match: transferOutFilter },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$totalQuantity" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const purchases = purchasesSummary[0] || {
            totalQuantity: 0,
            totalAmount: 0,
            count: 0,
        };
        const transfersIn = transfersInSummary[0] || {
            totalQuantity: 0,
            count: 0,
        };
        const transfersOut = transfersOutSummary[0] || {
            totalQuantity: 0,
            count: 0,
        };

        return res.status(200).json({
            message: "Net movement breakdown retrieved successfully",
            status: "success",
            data: {
                periodStart,
                periodEnd,
                breakdown: {
                    purchases: {
                        quantity: purchases.totalQuantity,
                        amount: purchases.totalAmount,
                        transactions: purchases.count,
                    },
                    transfersIn: {
                        quantity: transfersIn.totalQuantity,
                        transactions: transfersIn.count,
                    },
                    transfersOut: {
                        quantity: transfersOut.totalQuantity,
                        transactions: transfersOut.count,
                    },
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving net movement breakdown",
            status: "error",
            error: error.message,
        });
    }
});

export const getPurchasesDetail = asyncHandler(async (req, res) => {
    const {
        startDate,
        endDate,
        baseId,
        equipmentTypeId,
        page = 1,
        limit = 10,
    } = req.query;

    let periodStart, periodEnd;
    if (startDate && endDate) {
        periodStart = new Date(startDate);
        periodEnd = new Date(endDate);
    } else {
        const { quarterStart, quarterEnd } = getCurrentQuarterDates();
        periodStart = quarterStart;
        periodEnd = quarterEnd;
    }

    let filter = {
        purchaseDate: { $gte: periodStart, $lte: periodEnd },
    };

    if (req.user.role === "base_commander") {
        filter.base = req.user.assignedBase;
    } else if (baseId) {
        filter.base = baseId;
    }
    if (equipmentTypeId) {
        filter.equipmentType = equipmentTypeId;
    }

    try {
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const purchases = await Purchase.find(filter)
            .populate("base", "name code location")
            .populate("equipmentType", "name category code")
            .populate("createdBy", "username fullname")
            .sort({ purchaseDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Purchase.countDocuments(filter);

        return res.status(200).json({
            message: "Purchase details retrieved successfully",
            status: "success",
            data: {
                purchases,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalRecords: total,
                    hasNext: skip + purchases.length < total,
                    hasPrev: parseInt(page) > 1,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving purchase details",
            status: "error",
            error: error.message,
        });
    }
});

export const getTransfersInDetail = asyncHandler(async (req, res) => {
    const {
        startDate,
        endDate,
        baseId,
        equipmentTypeId,
        page = 1,
        limit = 10,
    } = req.query;

    let periodStart, periodEnd;
    if (startDate && endDate) {
        periodStart = new Date(startDate);
        periodEnd = new Date(endDate);
    } else {
        const { quarterStart, quarterEnd } = getCurrentQuarterDates();
        periodStart = quarterStart;
        periodEnd = quarterEnd;
    }

    let filter = {
        transferDate: { $gte: periodStart, $lte: periodEnd },
        status: "COMPLETED",
    };

    if (req.user.role === "base_commander") {
        filter.toBase = req.user.assignedBase;
    } else if (baseId) {
        filter.toBase = baseId;
    }
    if (equipmentTypeId) {
        filter.equipmentType = equipmentTypeId;
    }

    try {
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const transfers = await Transfer.find(filter)
            .populate("fromBase", "name code location")
            .populate("toBase", "name code location")
            .populate("equipmentType", "name category code")
            .populate("initiatedBy", "username fullname")
            .populate("approvedBy", "username fullname")
            .sort({ transferDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Transfer.countDocuments(filter);

        return res.status(200).json({
            message: "Transfer in details retrieved successfully",
            status: "success",
            data: {
                transfers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalRecords: total,
                    hasNext: skip + transfers.length < total,
                    hasPrev: parseInt(page) > 1,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving transfer in details",
            status: "error",
            error: error.message,
        });
    }
});

export const getTransfersOutDetail = asyncHandler(async (req, res) => {
    const {
        startDate,
        endDate,
        baseId,
        equipmentTypeId,
        page = 1,
        limit = 10,
    } = req.query;

    let periodStart, periodEnd;
    if (startDate && endDate) {
        periodStart = new Date(startDate);
        periodEnd = new Date(endDate);
    } else {
        const { quarterStart, quarterEnd } = getCurrentQuarterDates();
        periodStart = quarterStart;
        periodEnd = quarterEnd;
    }

    let filter = {
        transferDate: { $gte: periodStart, $lte: periodEnd },
        status: "COMPLETED",
    };

    if (req.user.role === "base_commander") {
        filter.fromBase = req.user.assignedBase;
    } else if (baseId) {
        filter.fromBase = baseId;
    }
    if (equipmentTypeId) {
        filter.equipmentType = equipmentTypeId;
    }

    try {
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const transfers = await Transfer.find(filter)
            .populate("fromBase", "name code location")
            .populate("toBase", "name code location")
            .populate("equipmentType", "name category code")
            .populate("initiatedBy", "username fullname")
            .populate("approvedBy", "username fullname")
            .sort({ transferDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Transfer.countDocuments(filter);

        return res.status(200).json({
            message: "Transfer out details retrieved successfully",
            status: "success",
            data: {
                transfers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalRecords: total,
                    hasNext: skip + transfers.length < total,
                    hasPrev: parseInt(page) > 1,
                },
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving transfer out details",
            status: "error",
            error: error.message,
        });
    }
});

export const getDashboardFilters = asyncHandler(async (req, res) => {
    try {
        let baseFilter = {};

        if (req.user.role === "base_commander") {
            baseFilter._id = req.user.assignedBase;
        }

        const [bases, equipmentTypes] = await Promise.all([
            mongoose.model("Base").find(baseFilter).select("_id name code"),
            mongoose
                .model("EquipmentType")
                .find({ isActive: true })
                .select("_id name category code"),
        ]);

        return res.status(200).json({
            message: "Dashboard filters retrieved successfully",
            status: "success",
            data: {
                bases,
                equipmentTypes,
                statusOptions: [
                    "AVAILABLE",
                    "ASSIGNED",
                    "IN_TRANSIT",
                    "MAINTENANCE",
                    "EXPENDED",
                ],
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving dashboard filters",
            status: "error",
            error: error.message,
        });
    }
});
