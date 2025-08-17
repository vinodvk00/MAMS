import { Purchase } from "../models/purchase.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const makePurchase = asyncHandler(async (req, res) => {
    const {
        base,
        equipmentType,
        quantity,
        unitPrice,
        supplier,
        purchaseDate,
        deliveryDate,
        status,
        notes,
    } = req.body;

    if (!base || !equipmentType || !quantity || !unitPrice) {
        return res.status(400).json({
            message:
                "base, equipmentType, quantity and unitPrice are required fields",
            status: "error",
        });
    }

    const newPurchase = await Purchase.create({
        base,
        equipmentType,
        quantity,
        unitPrice,
        supplier,
        purchaseDate,
        deliveryDate,
        status,
        notes,
        createdBy: req.user._id,
    });

    res.locals.data = newPurchase;
    res.locals.model = "Purchase";

    return res.status(201).json({
        message: "Purchase created successfully",
        status: "success",
        data: newPurchase,
    });
});

export const updatePurchase = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid purchase ID format",
            status: "error",
        });
    }

    const existingPurchase = await Purchase.findById(id);
    if (!existingPurchase) {
        return res.status(404).json({
            message: "Purchase not found",
            status: "error",
        });
    }

    const {
        base,
        equipmentType,
        quantity,
        unitPrice,
        supplier,
        purchaseDate,
        deliveryDate,
        status,
        notes,
        assets,
    } = req.body;

    const updateData = {};
    if (base !== undefined) updateData.base = base;
    if (equipmentType !== undefined) updateData.equipmentType = equipmentType;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (unitPrice !== undefined) updateData.unitPrice = unitPrice;
    if (supplier !== undefined) updateData.supplier = supplier;
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate;
    if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (assets !== undefined) updateData.assets = assets;

    if (quantity !== undefined || unitPrice !== undefined) {
        const newQuantity =
            quantity !== undefined ? quantity : existingPurchase.quantity;
        const newUnitPrice =
            unitPrice !== undefined ? unitPrice : existingPurchase.unitPrice;

        updateData.totalAmount = newQuantity * newUnitPrice;
    }

    const updatedPurchase = await Purchase.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    })
        .populate("base", "name code")
        .populate("equipmentType", "name category code")
        .populate("createdBy", "username fullname")
        .populate("assets");

    res.locals.data = updatedPurchase;
    res.locals.model = "Purchase";

    return res.status(200).json({
        message: "Purchase updated successfully",
        status: "success",
        data: updatedPurchase,
    });
});

export const deletePurchase = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid purchase ID format",
            status: "error",
        });
    }

    const existingPurchase = await Purchase.findById(id);
    if (!existingPurchase) {
        return res.status(404).json({
            message: "Purchase not found",
            status: "error",
        });
    }

    await Purchase.findByIdAndDelete(id);

    res.locals.data = existingPurchase;
    res.locals.model = "Purchase";

    return res.status(200).json({
        message: "Purchase deleted successfully",
        status: "success",
        data: {
            deletedId: id,
            deletedPurchase: existingPurchase,
        },
    });
});

export const getAllPurchases = asyncHandler(async (req, res) => {
    const purchases = await Purchase.find({})
        .populate("base", "name code location")
        .populate("equipmentType", "name category code")
        .populate("createdBy", "username fullname")
        .populate("assets")
        .sort({ purchaseDate: -1 });

    return res.status(200).json({
        message: "Purchases retrieved successfully",
        status: "success",
        data: purchases,
    });
});

export const getPurchaseById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid purchase ID format",
            status: "error",
        });
    }

    const purchase = await Purchase.findById(id)
        .populate("base", "name code location")
        .populate("equipmentType", "name category code")
        .populate("createdBy", "username fullname")
        .populate("assets");

    if (!purchase) {
        return res.status(404).json({
            message: "Purchase not found",
            status: "error",
        });
    }

    return res.status(200).json({
        message: "Purchase retrieved successfully",
        status: "success",
        data: purchase,
    });
});

export const getPurchasesByBase = asyncHandler(async (req, res) => {
    const userBaseId = req.user.assignedBase;

    if (!userBaseId) {
        return res.status(400).json({
            message: "User has no assigned base",
            status: "error",
        });
    }

    const purchases = await Purchase.find({ base: userBaseId })
        .populate("base", "name code location")
        .populate("equipmentType", "name category code")
        .sort({ purchaseDate: -1 });

    return res.status(200).json({
        message: "Base purchases retrieved successfully",
        status: "success",
        data: purchases,
    });
});
