import { Expenditure } from "../models/expenditure.models.js";
import { Asset } from "../models/asset.models.js";
import { Assignment } from "../models/assignment.models.js";
import { Base } from "../models/base.models.js";
import { EquipmentType } from "../models/equipmentType.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const createExpenditure = asyncHandler(async (req, res) => {
    const {
        assetId,
        base,
        quantity,
        expenditureDate,
        reason,
        operationDetails,
        notes,
    } = req.body;

    if (!assetId || !base || !quantity || !reason) {
        return res.status(400).json({
            message: "assetId, base, quantity and reason are required fields",
            status: "error",
        });
    }

    const userBaseId = req.user.assignedBase?.toString();
    if (req.user.role === "base_commander" && base !== userBaseId) {
        return res.status(403).json({
            message: "Base commanders can only create expenditures for their assigned base",
            status: "error",
        });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
        return res.status(404).json({ message: "Asset not found", status: "error" });
    }

    if (asset.currentBase.toString() !== base) {
        return res.status(400).json({ message: "Asset does not belong to the specified base", status: "error" });
    }
    
    if (asset.status !== "AVAILABLE") {
        return res.status(400).json({ message: "Asset is not available for expenditure", status: "error" });
    }

    if (asset.quantity < quantity) {
        return res.status(400).json({
            message: `Insufficient quantity. Available: ${asset.quantity}, Requested: ${quantity}`,
            status: "error",
        });
    }

    asset.quantity -= quantity;
    if (asset.quantity === 0) {
        asset.status = "EXPENDED";
    }
    await asset.save();

    const newExpenditure = await Expenditure.create({
        equipmentType: asset.equipmentType,
        base,
        quantity,
        expenditureDate: expenditureDate || new Date(),
        reason,
        assets: [{ asset: asset._id, quantity }],
        status: "PENDING",
        authorizedBy: req.user._id,
        operationDetails,
        notes,
    });
    
    const populatedExpenditure = await Expenditure.findById(newExpenditure._id)
        .populate("equipmentType", "name category code")
        .populate("base", "name code location")
        .populate("authorizedBy", "username fullname")
        .populate("assets.asset");

    res.locals.data = populatedExpenditure;
    res.locals.model = "Expenditure";

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
        .populate("assets.asset")
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
        .populate("assets.asset");

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
        .populate("assets.asset")
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
        .populate("assets.asset");

    res.locals.data = updatedExpenditure;
    res.locals.model = "Expenditure";

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

    const expenditure = await Expenditure.findById(id).populate("assets.asset");
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

    for (const item of expenditure.assets) {
        const assetId = item.asset._id;
        const expendedQuantity = item.quantity;

        const updatedAsset = await Asset.findByIdAndUpdate(
            assetId,
            { $inc: { quantity: -expendedQuantity } },
            { new: true }
        );

        if (updatedAsset && updatedAsset.quantity <= 0) {
            await Asset.findByIdAndUpdate(assetId, {
                status: "EXPENDED",
                condition: "UNSERVICEABLE",
                quantity: 0,
            });
        }
    }

    const assetIdsToExpend = expenditure.assets.map((item) => item.asset._id);
    await Assignment.updateMany(
        {
            asset: { $in: assetIdsToExpend },
            status: "ACTIVE",
        },
        {
            status: "EXPENDED",
            actualReturnDate: new Date(),
            notes: `Portion of asset expended - Expenditure ID: ${id}`,
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
        .populate("assets.asset");

    res.locals.data = updatedExpenditure;
    res.locals.model = "Expenditure";

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
        .populate("assets.asset");

    res.locals.data = updatedExpenditure;
    res.locals.model = "Expenditure";

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
        .populate("assets.asset");

    res.locals.data = updatedExpenditure;
    res.locals.model = "Expenditure";

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

    res.locals.data = existingExpenditure;
    res.locals.model = "Expenditure";

    return res.status(200).json({
        message: "Expenditure deleted successfully",
        status: "success",
        data: {
            deletedId: id,
            deletedExpenditure: existingExpenditure,
        },
    });
});
