import { EquipmentType } from "../models/equipmentType.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createEquipmentType = asyncHandler(async (req, res) => {
    const { name, category, code, description } = req.body;

    if (!name || !category || !code) {
        return res.status(400).json({
            message: "name, category and code are required fields",
            status: "error",
        });
    }

    const newEquipment = await EquipmentType.create({
        name,
        category,
        code,
        description,
    });

    return res.status(201).json({
        message: "Equipment type created successfully",
        status: "success",
        data: newEquipment,
    });
});

export const updateEquipmentType = asyncHandler(async (req, res) => {
    const { name, category, code, description, isActive } = req.body;
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "Equipment type ID is required",
            status: "error",
        });
    }

    const existingEquipment = await EquipmentType.findById(id);

    if (!existingEquipment) {
        return res.status(404).json({
            message: "Equipment type not found",
            status: "error",
        });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedEquipment = await EquipmentType.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    );

    return res.status(200).json({
        message: "Equipment type updated successfully",
        status: "success",
        data: updatedEquipment,
    });
});

export const deleteEquipmentType = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "Equipment type ID is required",
            status: "error",
        });
    }

    const existingEquipment = await EquipmentType.findById(id);

    if (!existingEquipment) {
        return res.status(404).json({
            message: "Equipment type not found",
            status: "error",
        });
    }

    await EquipmentType.findByIdAndDelete(id);

    return res.status(200).json({
        message: "Equipment type deleted successfully",
        status: "success",
        data: {
            deletedId: id,
            deletedName: existingEquipment.name,
        },
    });
});

export const getAllEquipmentTypes = asyncHandler(async (req, res) => {
    const equipmentTypes = await EquipmentType.find({});

    return res.status(200).json({
        message: "Equipment types retrieved successfully",
        status: "success",
        data: equipmentTypes,
    });
});

export const getEquipmentTypeById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({
            message: "Equipment type ID is required",
            status: "error",
        });
    }

    const equipmentType = await EquipmentType.findById(id);

    if (!equipmentType) {
        return res.status(404).json({
            message: "Equipment type not found",
            status: "error",
        });
    }

    return res.status(200).json({
        message: "Equipment type retrieved successfully",
        status: "success",
        data: equipmentType,
    });
});
