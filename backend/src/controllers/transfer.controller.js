import { Transfer } from "../models/transfer.models.js";
import { Asset } from "../models/asset.models.js";
import { Base } from "../models/base.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const initiateTransfer = asyncHandler(async (req, res) => {
    const { fromBaseId, toBaseId, assetId, quantity, transportDetails, notes } =
        req.body;

    if (!fromBaseId || !toBaseId || !assetId || !quantity) {
        return res.status(400).json({
            message: "fromBaseId, toBaseId, assetId and quantity are required",
            status: "error",
        });
    }

    const sourceAsset = await Asset.findById(assetId);
    if (!sourceAsset) {
        return res
            .status(404)
            .json({ message: "Source asset not found", status: "error" });
    }

    if (sourceAsset.status !== "AVAILABLE") {
        return res.status(400).json({
            message: "Asset is not available for transfer",
            status: "error",
        });
    }

    if (sourceAsset.quantity < quantity) {
        return res.status(400).json({
            message: `Insufficient quantity. Available: ${sourceAsset.quantity}, Requested: ${quantity}`,
            status: "error",
        });
    }

    // Decrement quantity from the source asset
    sourceAsset.quantity -= quantity;
    if (sourceAsset.quantity === 0) {
        // Optionally delete the asset if its quantity becomes zero
        await Asset.findByIdAndDelete(assetId);
    } else {
        await sourceAsset.save();
    }

    // Create a new temporary asset for the transfer
    const inTransitAsset = await Asset.create({
        equipmentType: sourceAsset.equipmentType,
        currentBase: fromBaseId,
        status: "IN_TRANSIT",
        condition: sourceAsset.condition,
        quantity: quantity,
        serialNumber: `transfer-${new mongoose.Types.ObjectId().toString().slice(-6)}`,
    });

    const newTransfer = await Transfer.create({
        fromBase: fromBaseId,
        toBase: toBaseId,
        equipmentType: sourceAsset.equipmentType,
        sourceAssetId: sourceAsset._id,
        assets: [{ asset: inTransitAsset._id, quantity: quantity }],
        totalQuantity: quantity,
        status: "INITIATED",
        initiatedBy: req.user._id,
        transportDetails,
        notes,
    });

    const populatedTransfer = await Transfer.findById(newTransfer._id)
        .populate("fromBase", "name code")
        .populate("toBase", "name code")
        .populate("equipmentType", "name code")
        .populate("initiatedBy", "username fullname")
        .populate({
            path: "assets.asset",
            select: "serialNumber quantity status",
        });

    res.locals.data = populatedTransfer;
    res.locals.model = "Transfer";

    return res.status(201).json({
        message: "Transfer initiated successfully",
        status: "success",
        data: populatedTransfer,
    });
});

export const completeTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const transfer = await Transfer.findById(id).populate("assets.asset");

    if (!transfer) {
        return res
            .status(404)
            .json({ message: "Transfer not found", status: "error" });
    }
    if (transfer.status !== "IN_TRANSIT") {
        return res.status(400).json({
            message: `Transfer cannot be completed. Current status: ${transfer.status}`,
            status: "error",
        });
    }

    const assetToUpdate = transfer.assets[0].asset;

    await Asset.findByIdAndUpdate(assetToUpdate._id, {
        currentBase: transfer.toBase,
        status: "AVAILABLE",
    });

    const updatedTransfer = await Transfer.findByIdAndUpdate(
        id,
        {
            status: "COMPLETED",
            completionDate: new Date(),
        },
        { new: true }
    ).populate(/* your populate fields */);

    res.locals.data = updatedTransfer;
    res.locals.model = "Transfer";

    return res.status(200).json({
        message: "Transfer completed successfully",
        status: "success",
        data: updatedTransfer,
    });
});

export const cancelTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const transfer = await Transfer.findById(id).populate("assets.asset");

    if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
    }

    if (transfer.status === "COMPLETED" || transfer.status === "CANCELLED") {
        return res.status(400).json({
            message: `Cannot cancel a ${transfer.status.toLowerCase()} transfer`,
        });
    }

    const inTransitAsset = transfer.assets[0].asset;

    if (inTransitAsset) {
        const originalAsset = await Asset.findById(transfer.sourceAssetId);

        if (originalAsset) {
            originalAsset.quantity += inTransitAsset.quantity;

            if (originalAsset.status === "IN_TRANSIT") {
                originalAsset.status = "AVAILABLE";
            }
            await originalAsset.save();
        }

        await Asset.findByIdAndDelete(inTransitAsset._id);
    }

    const updatedTransfer = await Transfer.findByIdAndUpdate(
        id,
        { status: "CANCELLED" },
        { new: true }
    );

    res.locals.data = updatedTransfer;
    res.locals.model = "Transfer";

    return res.status(200).json({
        message: "Transfer cancelled successfully",
        status: "success",
        data: updatedTransfer,
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

    res.locals.data = updatedTransfer;
    res.locals.model = "Transfer";

    return res.status(200).json({
        message: "Transfer approved successfully",
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

    res.locals.data = updatedTransfer;
    res.locals.model = "Transfer";

    return res.status(200).json({
        message: "Transfer updated successfully",
        status: "success",
        data: updatedTransfer,
    });
});
