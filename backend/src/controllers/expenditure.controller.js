import { Expenditure } from "../models/expenditure.models.js";
import { Asset } from "../models/asset.models.js";
import { Assignment } from "../models/assignment.models.js";
import { Base } from "../models/base.models.js";
import { EquipmentType } from "../models/equipmentType.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const createExpenditure = asyncHandler(async (req, res) => {
    const {
        equipmentType,
        base,
        quantity,
        expenditureDate,
        reason,
        assetIds,
        operationDetails,
        notes,
    } = req.body;

    if (!equipmentType || !base || !quantity || !reason) {
        return res.status(400).json({
            message:
                "equipmentType, base, quantity and reason are required fields",
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (base !== userBaseId) {
            return res.status(403).json({
                message:
                    "Base commanders can only create expenditures for their assigned base",
                status: "error",
            });
        }
    }

    const [baseDoc, equipmentTypeDoc] = await Promise.all([
        Base.findById(base),
        EquipmentType.findById(equipmentType),
    ]);

    if (!baseDoc) {
        return res.status(404).json({
            message: "Base not found",
            status: "error",
        });
    }

    if (!equipmentTypeDoc) {
        return res.status(404).json({
            message: "Equipment type not found",
            status: "error",
        });
    }

    let expenditureAssets = [];
    let totalAvailableQuantity = 0;

    if (assetIds && assetIds.length > 0) {
        const assets = await Asset.find({
            _id: { $in: assetIds },
            currentBase: base,
            equipmentType: equipmentType,
        });

        if (assets.length !== assetIds.length) {
            return res.status(400).json({
                message:
                    "Some specified assets are not found or not at the specified base",
                status: "error",
            });
        }

        expenditureAssets = assets.map((asset) => asset._id);
        totalAvailableQuantity = assets.reduce(
            (sum, asset) => sum + (asset.quantity || 1),
            0
        );
    } else {
        const availableAssets = await Asset.find({
            currentBase: base,
            equipmentType: equipmentType,
            status: { $in: ["AVAILABLE", "ASSIGNED"] },
        }).sort({ createdAt: 1 });

        if (availableAssets.length === 0) {
            return res.status(400).json({
                message:
                    "No assets of this equipment type available at the specified base",
                status: "error",
            });
        }

        let remainingQuantity = quantity;
        for (const asset of availableAssets) {
            if (remainingQuantity <= 0) break;

            const assetQty = asset.quantity || 1;
            const expendQty = Math.min(assetQty, remainingQuantity);

            expenditureAssets.push(asset._id);
            totalAvailableQuantity += expendQty;
            remainingQuantity -= expendQty;
        }
    }

    if (totalAvailableQuantity < quantity) {
        return res.status(400).json({
            message: `Insufficient assets available. Requested: ${quantity}, Available: ${totalAvailableQuantity}`,
            status: "error",
        });
    }

    const newExpenditure = await Expenditure.create({
        equipmentType,
        base,
        quantity,
        expenditureDate: expenditureDate || new Date(),
        reason,
        assets: expenditureAssets,
        status: "PENDING",
        authorizedBy: req.user._id,
        operationDetails,
        notes,
    });

    const populatedExpenditure = await Expenditure.findById(newExpenditure._id)
        .populate("equipmentType", "name category code")
        .populate("base", "name code location")
        .populate("authorizedBy", "username fullname")
        .populate("assets");

    return res.status(201).json({
        message: "Expenditure created successfully",
        status: "success",
        data: populatedExpenditure,
    });
});

export const getAllExpenditures = asyncHandler(async (req, res) => {
    const { status, startDate, endDate, reason } = req.query;

    let filter = {};

    if (req.user.role === "base_commander") {
        filter.base = req.user.assignedBase;
    }

    if (status) filter.status = status;
    if (reason) filter.reason = reason;

    if (startDate || endDate) {
        filter.expenditureDate = {};
        if (startDate) {
            filter.expenditureDate.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.expenditureDate.$lte = new Date(endDate);
        }
    }

    const expenditures = await Expenditure.find(filter)
        .populate("equipmentType", "name category code")
        .populate("base", "name code location")
        .populate("authorizedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("completedBy", "username fullname")
        .populate("assets")
        .sort({ expenditureDate: -1 });

    return res.status(200).json({
        message: "Expenditures retrieved successfully",
        status: "success",
        data: expenditures,
    });
});

export const getExpenditureById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid expenditure ID format",
            status: "error",
        });
    }

    const expenditure = await Expenditure.findById(id)
        .populate("equipmentType", "name category code")
        .populate("base", "name code location")
        .populate("authorizedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("completedBy", "username fullname")
        .populate("assets");

    if (!expenditure) {
        return res.status(404).json({
            message: "Expenditure not found",
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (expenditure.base._id.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Access denied. You can only view expenditures from your base",
                status: "error",
            });
        }
    }

    return res.status(200).json({
        message: "Expenditure retrieved successfully",
        status: "success",
        data: expenditure,
    });
});

export const getExpendituresByBase = asyncHandler(async (req, res) => {
    const userBaseId = req.user.assignedBase;

    if (!userBaseId) {
        return res.status(400).json({
            message: "User has no assigned base",
            status: "error",
        });
    }

    const { status, reason } = req.query;
    let filter = { base: userBaseId };

    if (status) filter.status = status;
    if (reason) filter.reason = reason;

    const expenditures = await Expenditure.find(filter)
        .populate("equipmentType", "name category code")
        .populate("base", "name code location")
        .populate("authorizedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("completedBy", "username fullname")
        .populate("assets")
        .sort({ expenditureDate: -1 });

    return res.status(200).json({
        message: "Base expenditures retrieved successfully",
        status: "success",
        data: expenditures,
    });
});

export const approveExpenditure = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid expenditure ID format",
            status: "error",
        });
    }

    const expenditure = await Expenditure.findById(id);
    if (!expenditure) {
        return res.status(404).json({
            message: "Expenditure not found",
            status: "error",
        });
    }

    if (expenditure.status !== "PENDING") {
        return res.status(400).json({
            message: `Expenditure cannot be approved. Current status: ${expenditure.status}`,
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (expenditure.base.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Access denied. You can only approve expenditures from your base",
                status: "error",
            });
        }
    }

    const updatedExpenditure = await Expenditure.findByIdAndUpdate(
        id,
        {
            status: "APPROVED",
            approvedBy: req.user._id,
            approvedDate: new Date(),
        },
        { new: true }
    )
        .populate("equipmentType", "name category code")
        .populate("base", "name code location")
        .populate("authorizedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("assets");

    return res.status(200).json({
        message: "Expenditure approved successfully",
        status: "success",
        data: updatedExpenditure,
    });
});

export const completeExpenditure = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid expenditure ID format",
            status: "error",
        });
    }

    const expenditure = await Expenditure.findById(id).populate("assets");
    if (!expenditure) {
        return res.status(404).json({
            message: "Expenditure not found",
            status: "error",
        });
    }

    if (expenditure.status !== "APPROVED") {
        return res.status(400).json({
            message: `Expenditure cannot be completed. Current status: ${expenditure.status}`,
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (expenditure.base.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Access denied. You can only complete expenditures from your base",
                status: "error",
            });
        }
    }

    const assetIdsToUpdate = expenditure.assets.map((asset) => asset._id);
    await Asset.updateMany(
        { _id: { $in: assetIdsToUpdate } },
        { status: "EXPENDED", condition: "UNSERVICEABLE" }
    );

    await Assignment.updateMany(
        {
            asset: { $in: assetIdsToUpdate },
            status: "ACTIVE",
        },
        {
            status: "EXPENDED", // todo: have to test, as just added expended enum
            actualReturnDate: new Date(),
            notes: `Asset expended - Expenditure ID: ${id}`,
        }
    );

    const updatedExpenditure = await Expenditure.findByIdAndUpdate(
        id,
        {
            status: "COMPLETED",
            completedBy: req.user._id,
            completedDate: new Date(),
        },
        { new: true }
    )
        .populate("equipmentType", "name category code")
        .populate("base", "name code location")
        .populate("authorizedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("completedBy", "username fullname")
        .populate("assets");

    return res.status(200).json({
        message: "Expenditure completed successfully",
        status: "success",
        data: updatedExpenditure,
    });
});

export const cancelExpenditure = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid expenditure ID format",
            status: "error",
        });
    }

    const expenditure = await Expenditure.findById(id);
    if (!expenditure) {
        return res.status(404).json({
            message: "Expenditure not found",
            status: "error",
        });
    }

    if (expenditure.status === "COMPLETED") {
        return res.status(400).json({
            message: "Cannot cancel a completed expenditure",
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (expenditure.base.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Access denied. You can only cancel expenditures from your base",
                status: "error",
            });
        }
    }

    const updatedExpenditure = await Expenditure.findByIdAndUpdate(
        id,
        {
            status: "CANCELLED",
            notes: reason
                ? `${expenditure.notes || ""}\nCancellation reason: ${reason}`.trim()
                : expenditure.notes,
        },
        { new: true }
    )
        .populate("equipmentType", "name category code")
        .populate("base", "name code location")
        .populate("authorizedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("completedBy", "username fullname")
        .populate("assets");

    return res.status(200).json({
        message: "Expenditure cancelled successfully",
        status: "success",
        data: updatedExpenditure,
    });
});

export const updateExpenditure = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, reason, operationDetails, notes, expenditureDate } =
        req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid expenditure ID format",
            status: "error",
        });
    }

    const existingExpenditure = await Expenditure.findById(id);
    if (!existingExpenditure) {
        return res.status(404).json({
            message: "Expenditure not found",
            status: "error",
        });
    }

    if (existingExpenditure.status === "COMPLETED") {
        return res.status(400).json({
            message: "Cannot update completed expenditures",
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (existingExpenditure.base.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Access denied. You can only update expenditures from your base",
                status: "error",
            });
        }
    }

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = quantity;
    if (reason !== undefined) updateData.reason = reason;
    if (operationDetails !== undefined)
        updateData.operationDetails = operationDetails;
    if (notes !== undefined) updateData.notes = notes;
    if (expenditureDate !== undefined)
        updateData.expenditureDate = expenditureDate;

    const updatedExpenditure = await Expenditure.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    )
        .populate("equipmentType", "name category code")
        .populate("base", "name code location")
        .populate("authorizedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("completedBy", "username fullname")
        .populate("assets");

    return res.status(200).json({
        message: "Expenditure updated successfully",
        status: "success",
        data: updatedExpenditure,
    });
});

export const deleteExpenditure = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid expenditure ID format",
            status: "error",
        });
    }

    const existingExpenditure = await Expenditure.findById(id);
    if (!existingExpenditure) {
        return res.status(404).json({
            message: "Expenditure not found",
            status: "error",
        });
    }

    if (existingExpenditure.status === "COMPLETED") {
        return res.status(400).json({
            message: "Cannot delete completed expenditures",
            status: "error",
        });
    }

    await Expenditure.findByIdAndDelete(id);

    return res.status(200).json({
        message: "Expenditure deleted successfully",
        status: "success",
        data: {
            deletedId: id,
            deletedExpenditure: existingExpenditure,
        },
    });
});
