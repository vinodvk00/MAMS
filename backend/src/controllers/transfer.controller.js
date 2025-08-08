import { Transfer } from "../models/transfer.models.js";
import { Asset } from "../models/asset.models.js";
import { Base } from "../models/base.models.js";
import { EquipmentType } from "../models/equipmentType.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const initiateTransfer = asyncHandler(async (req, res) => {
    const {
        fromBaseId,
        toBaseId,
        equipmentTypeId,
        assetIds,
        totalQuantity,
        transportDetails,
        notes,
    } = req.body;

    if (!fromBaseId || !toBaseId || !equipmentTypeId || !totalQuantity) {
        return res.status(400).json({
            message:
                "fromBaseId, toBaseId, equipmentTypeId and totalQuantity are required fields",
            status: "error",
        });
    }

    if (fromBaseId === toBaseId) {
        return res.status(400).json({
            message: "Source and destination bases cannot be the same",
            status: "error",
        });
    }

    const userBaseId = req.user.assignedBase?.toString();
    if (req.user.role === "base_commander") {
        if (fromBaseId !== userBaseId && toBaseId !== userBaseId) {
            return res.status(403).json({
                message:
                    "Base commanders can only initiate transfers for their assigned base",
                status: "error",
            });
        }
    }

    // IMPROVE: make these validations in schema only 
    const [fromBase, toBase, equipmentType] = await Promise.all([
        Base.findById(fromBaseId),
        Base.findById(toBaseId),
        EquipmentType.findById(equipmentTypeId),
    ]);

    if (!fromBase) {
        return res.status(404).json({
            message: "Source base not found",
            status: "error",
        });
    }

    if (!toBase) {
        return res.status(404).json({
            message: "Destination base not found",
            status: "error",
        });
    }

    if (!equipmentType) {
        return res.status(404).json({
            message: "Equipment type not found",
            status: "error",
        });
    }

    let transferAssets = [];
    let totalAvailableQuantity = 0;

    if (assetIds && assetIds.length > 0) {
        const assets = await Asset.find({
            _id: { $in: assetIds },
            currentBase: fromBaseId,
            equipmentType: equipmentTypeId,
            status: { $in: ["AVAILABLE", "GOOD"] },
        });

        if (assets.length !== assetIds.length) {
            return res.status(400).json({
                message:
                    "Some specified assets are not available for transfer from the source base",
                status: "error",
            });
        }

        transferAssets = assets.map((asset) => ({
            asset: asset._id,
            quantity: asset.quantity || 1,
        }));

        totalAvailableQuantity = transferAssets.reduce(
            (sum, item) => sum + item.quantity,
            0
        );
    } else {
        const availableAssets = await Asset.find({
            currentBase: fromBaseId,
            equipmentType: equipmentTypeId,
            status: { $in: ["AVAILABLE"] },
        }).sort({ createdAt: 1 });

        if (availableAssets.length === 0) {
            return res.status(400).json({
                message:
                    "No available assets of this equipment type at source base",
                status: "error",
            });
        }

        let remainingQuantity = totalQuantity;
        for (const asset of availableAssets) {
            if (remainingQuantity <= 0) break;

            const assetQty = asset.quantity || 1;
            const transferQty = Math.min(assetQty, remainingQuantity);

            transferAssets.push({
                asset: asset._id,
                quantity: transferQty,
            });

            totalAvailableQuantity += transferQty;
            remainingQuantity -= transferQty;
        }
    }

    if (totalAvailableQuantity < totalQuantity) {
        return res.status(400).json({
            message: `Insufficient assets available. Requested: ${totalQuantity}, Available: ${totalAvailableQuantity}`,
            status: "error",
        });
    }

    const newTransfer = await Transfer.create({
        fromBase: fromBaseId,
        toBase: toBaseId,
        equipmentType: equipmentTypeId,
        assets: transferAssets,
        totalQuantity,
        status: "INITIATED",
        initiatedBy: req.user._id,
        transportDetails: transportDetails || "No transport details provided",
        notes,
    });

    const assetIdsToUpdate = transferAssets.map((item) => item.asset);
    await Asset.updateMany(
        { _id: { $in: assetIdsToUpdate } },
        { status: "IN_TRANSIT" }
    );

    const populatedTransfer = await Transfer.findById(newTransfer._id)
        .populate("fromBase", "name code location")
        .populate("toBase", "name code location")
        .populate("equipmentType", "name category code")
        .populate("initiatedBy", "username fullname")
        .populate("assets.asset");

    return res.status(201).json({
        message: "Transfer initiated successfully",
        status: "success",
        data: populatedTransfer,
    });
});

export const approveTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid transfer ID format",
            status: "error",
        });
    }

    const transfer = await Transfer.findById(id);
    if (!transfer) {
        return res.status(404).json({
            message: "Transfer not found",
            status: "error",
        });
    }

    if (transfer.status !== "INITIATED") {
        return res.status(400).json({
            message: `Transfer cannot be approved. Current status: ${transfer.status}`,
            status: "error",
        });
    }

    const updatedTransfer = await Transfer.findByIdAndUpdate(
        id,
        {
            status: "IN_TRANSIT",
            approvedBy: req.user._id,
        },
        { new: true }
    )
        .populate("fromBase", "name code location")
        .populate("toBase", "name code location")
        .populate("equipmentType", "name category code")
        .populate("initiatedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("assets.asset");

    return res.status(200).json({
        message: "Transfer approved successfully",
        status: "success",
        data: updatedTransfer,
    });
});

export const completeTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid transfer ID format",
            status: "error",
        });
    }

    const transfer = await Transfer.findById(id);
    if (!transfer) {
        return res.status(404).json({
            message: "Transfer not found",
            status: "error",
        });
    }

    if (transfer.status !== "IN_TRANSIT") {
        return res.status(400).json({
            message: `Transfer cannot be completed. Current status: ${transfer.status}`,
            status: "error",
        });
    }

    const userBaseId = req.user.assignedBase?.toString();
    if (req.user.role === "base_commander") {
        if (transfer.toBase.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Base commanders can only complete transfers to their assigned base",
                status: "error",
            });
        }
    }

    const assetIdsToUpdate = transfer.assets.map((item) => item.asset);
    await Asset.updateMany(
        { _id: { $in: assetIdsToUpdate } },
        {
            currentBase: transfer.toBase,
            status: "AVAILABLE",
        }
    );

    const updatedTransfer = await Transfer.findByIdAndUpdate(
        id,
        {
            status: "COMPLETED",
            completionDate: new Date(),
        },
        { new: true }
    )
        .populate("fromBase", "name code location")
        .populate("toBase", "name code location")
        .populate("equipmentType", "name category code")
        .populate("initiatedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("assets.asset");

    return res.status(200).json({
        message: "Transfer completed successfully",
        status: "success",
        data: updatedTransfer,
    });
});

export const cancelTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid transfer ID format",
            status: "error",
        });
    }

    const transfer = await Transfer.findById(id);
    if (!transfer) {
        return res.status(404).json({
            message: "Transfer not found",
            status: "error",
        });
    }

    if (transfer.status === "COMPLETED") {
        return res.status(400).json({
            message: "Cannot cancel a completed transfer",
            status: "error",
        });
    }

    if (
        req.user.role !== "logistics_officer" &&
        transfer.initiatedBy.toString() !== req.user._id.toString()
    ) {
        return res.status(403).json({
            message:
                "Only the initiator or logistics officer can cancel transfers",
            status: "error",
        });
    }

    if (transfer.status === "IN_TRANSIT") {
        const assetIdsToUpdate = transfer.assets.map((item) => item.asset);
        await Asset.updateMany(
            { _id: { $in: assetIdsToUpdate } },
            { status: "AVAILABLE" }
        );
    }

    const updatedTransfer = await Transfer.findByIdAndUpdate(
        id,
        { status: "CANCELLED" },
        { new: true }
    )
        .populate("fromBase", "name code location")
        .populate("toBase", "name code location")
        .populate("equipmentType", "name category code")
        .populate("initiatedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("assets.asset");

    return res.status(200).json({
        message: "Transfer cancelled successfully",
        status: "success",
        data: updatedTransfer,
    });
});

export const getAllTransfers = asyncHandler(async (req, res) => {
    const { status, fromBase, toBase, equipmentType } = req.query;

    let filter = {};

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase;
        filter.$or = [{ fromBase: userBaseId }, { toBase: userBaseId }];
    }

    if (status) filter.status = status;
    if (fromBase) filter.fromBase = fromBase;
    if (toBase) filter.toBase = toBase;
    if (equipmentType) filter.equipmentType = equipmentType;

    const transfers = await Transfer.find(filter)
        .populate("fromBase", "name code location")
        .populate("toBase", "name code location")
        .populate("equipmentType", "name category code")
        .populate("initiatedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("assets.asset")
        .sort({ transferDate: -1 });

    return res.status(200).json({
        message: "Transfers retrieved successfully",
        status: "success",
        data: transfers,
    });
});

export const getTransferById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid transfer ID format",
            status: "error",
        });
    }

    const transfer = await Transfer.findById(id)
        .populate("fromBase", "name code location")
        .populate("toBase", "name code location")
        .populate("equipmentType", "name category code")
        .populate("initiatedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("assets.asset");

    if (!transfer) {
        return res.status(404).json({
            message: "Transfer not found",
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (
            transfer.fromBase._id.toString() !== userBaseId &&
            transfer.toBase._id.toString() !== userBaseId
        ) {
            return res.status(403).json({
                message:
                    "Access denied. You can only view transfers involving your base",
                status: "error",
            });
        }
    }

    return res.status(200).json({
        message: "Transfer retrieved successfully",
        status: "success",
        data: transfer,
    });
});

export const getTransfersByBase = asyncHandler(async (req, res) => {
    const { direction } = req.query; // "in", "out", or "all"
    const userBaseId = req.user.assignedBase;

    if (!userBaseId) {
        return res.status(400).json({
            message: "User has no assigned base",
            status: "error",
        });
    }

    let filter = {};

    if (direction === "in") {
        filter.toBase = userBaseId;
    } else if (direction === "out") {
        filter.fromBase = userBaseId;
    } else {
        // Default: show all transfers involving this base
        filter.$or = [{ fromBase: userBaseId }, { toBase: userBaseId }];
    }

    const transfers = await Transfer.find(filter)
        .populate("fromBase", "name code location")
        .populate("toBase", "name code location")
        .populate("equipmentType", "name category code")
        .populate("initiatedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("assets.asset")
        .sort({ transferDate: -1 });

    return res.status(200).json({
        message: "Base transfers retrieved successfully",
        status: "success",
        data: transfers,
    });
});

export const updateTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { transportDetails, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid transfer ID format",
            status: "error",
        });
    }

    const existingTransfer = await Transfer.findById(id);
    if (!existingTransfer) {
        return res.status(404).json({
            message: "Transfer not found",
            status: "error",
        });
    }

    if (
        existingTransfer.status === "COMPLETED" ||
        existingTransfer.status === "CANCELLED"
    ) {
        return res.status(400).json({
            message: "Cannot update completed or cancelled transfers",
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        const isInitiator =
            existingTransfer.initiatedBy.toString() === req.user._id.toString();
        const involvesUserBase =
            existingTransfer.fromBase.toString() === userBaseId ||
            existingTransfer.toBase.toString() === userBaseId;

        if (!isInitiator && !involvesUserBase) {
            return res.status(403).json({
                message:
                    "Access denied. You can only update transfers you initiated or involving your base",
                status: "error",
            });
        }
    }

    const updateData = {};
    if (transportDetails !== undefined)
        updateData.transportDetails = transportDetails;
    if (notes !== undefined) updateData.notes = notes;

    const updatedTransfer = await Transfer.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    })
        .populate("fromBase", "name code location")
        .populate("toBase", "name code location")
        .populate("equipmentType", "name category code")
        .populate("initiatedBy", "username fullname")
        .populate("approvedBy", "username fullname")
        .populate("assets.asset");

    return res.status(200).json({
        message: "Transfer updated successfully",
        status: "success",
        data: updatedTransfer,
    });
});
