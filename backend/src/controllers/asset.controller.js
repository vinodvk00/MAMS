import { Asset } from "../models/asset.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const generateSerialNumber = async () => {
    const sequentialAssets = await Asset.find({
        serialNumber: { $regex: /^A\d+$/ },
    })
        .select("serialNumber")
        .sort({ serialNumber: -1 });

    if (!sequentialAssets || sequentialAssets.length === 0) {
        return "A001";
    }

    const numbers = sequentialAssets.map((asset) => {
        const num = parseInt(asset.serialNumber.substring(1));
        return isNaN(num) ? 0 : num;
    });

    const highestNumber = Math.max(...numbers);
    const nextNumber = highestNumber + 1;

    return `A${nextNumber.toString().padStart(3, "0")}`;
};

export const createAsset = asyncHandler(async (req, res) => {
    const {
        serialNumber,
        equipmentType,
        currentBase,
        status,
        condition,
        purchaseId,
        quantity,
    } = req.body;

    if (!equipmentType || !currentBase) {
        return res.status(400).json({
            message: "equipmentType and currentBase are required fields",
            status: "error",
        });
    }

    const finalSerialNumber = serialNumber || (await generateSerialNumber());

    const newAsset = await Asset.create({
        serialNumber: finalSerialNumber,
        equipmentType,
        currentBase,
        status,
        condition,
        purchaseId,
        quantity: quantity || 1,
    });

    const createdAsset = await Asset.findById(newAsset._id)
        .populate("equipmentType", "name category code")
        .populate("currentBase", "name code location")
        .populate("purchaseId");

    return res.status(201).json({
        message: "Asset created successfully",
        status: "success",
        data: createdAsset,
    });
});

export const getAllAssets = asyncHandler(async (req, res) => {
    const assets = await Asset.find()
        .populate("equipmentType", "name category code")
        .populate("currentBase", "name code location")
        .populate("purchaseId")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        message: "Assets retrieved successfully",
        status: "success",
        data: assets,
    });
});

export const getAssetById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid asset ID format",
            status: "error",
        });
    }

    const asset = await Asset.findById(id)
        .populate("equipmentType", "name category code")
        .populate("currentBase", "name code location")
        .populate("purchaseId");

    if (!asset) {
        return res.status(404).json({
            message: "Asset not found",
            status: "error",
        });
    }

    return res.status(200).json({
        message: "Asset retrieved successfully",
        status: "success",
        data: asset,
    });
});

export const getAssetsByBase = asyncHandler(async (req, res) => {
    const userBaseId = req.user.assignedBase;

    if (!userBaseId) {
        return res.status(400).json({
            message: "User has no assigned base",
            status: "error",
        });
    }

    const assets = await Asset.find({ currentBase: userBaseId })
        .populate("equipmentType", "name category code")
        .populate("currentBase", "name code location")
        .populate("purchaseId")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        message: "Base assets retrieved successfully",
        status: "success",
        data: assets,
    });
});

export const updateAsset = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid asset ID format",
            status: "error",
        });
    }

    const existingAsset = await Asset.findById(id);
    if (!existingAsset) {
        return res.status(404).json({
            message: "Asset not found",
            status: "error",
        });
    }

    const {
        serialNumber,
        equipmentType,
        currentBase,
        status,
        condition,
        purchaseId,
        quantity,
    } = req.body;

    const updateData = {};
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (equipmentType !== undefined) updateData.equipmentType = equipmentType;
    if (currentBase !== undefined) updateData.currentBase = currentBase;
    if (status !== undefined) updateData.status = status;
    if (condition !== undefined) updateData.condition = condition;
    if (purchaseId !== undefined) updateData.purchaseId = purchaseId;
    if (quantity !== undefined) updateData.quantity = quantity;

    const updatedAsset = await Asset.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    })
        .populate("equipmentType", "name category code")
        .populate("currentBase", "name code location")
        .populate("purchaseId");

    return res.status(200).json({
        message: "Asset updated successfully",
        status: "success",
        data: updatedAsset,
    });
});

export const deleteAsset = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid asset ID format",
            status: "error",
        });
    }

    const existingAsset = await Asset.findById(id);
    if (!existingAsset) {
        return res.status(404).json({
            message: "Asset not found",
            status: "error",
        });
    }

    await Asset.findByIdAndDelete(id);

    return res.status(200).json({
        message: "Asset deleted successfully",
        status: "success",
        data: {
            deletedId: id,
            deletedSerialNumber: existingAsset.serialNumber,
        },
    });
});
