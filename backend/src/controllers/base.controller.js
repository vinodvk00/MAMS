/*

** base can be created by admin, then assigned a commander
** managed by base commander

*/

import { Base } from "../models/base.models.js";
import mongoose from "mongoose";

export const createBase = async (req, res) => {
    try {
        const { name, code, location, commander, contactInfo } = req.body;

        const newBase = await Base.create({
            name,
            code,
            location,
            commander,
            contactInfo,
        });

        return res.status(201).json({
            success: true,
            message: "Base created successfully",
            data: newBase,
        });
    } catch (error) {
        console.error("Error creating base:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create base",
            error: error.message,
        });
    }
};

export const getAllBases = async (req, res) => {
    try {
        const bases = await Base.find().populate(
            "commander",
            "username fullname"
        );
        return res.status(200).json({
            success: true,
            message: "Bases retrieved successfully",
            data: bases,
        });
    } catch (error) {
        console.error("Error retrieving bases:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve bases",
            error: error.message,
        });
    }
};

export const getBaseById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Retrieving base with ID:", id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid base ID format",
            });
        }

        const base = await Base.findById(id).populate(
            "commander",
            "username fullname"
        );
        if (!base) {
            return res.status(404).json({
                success: false,
                message: "Base not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Base retrieved successfully",
            data: base,
        });
    } catch (error) {
        console.error("Error retrieving base:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve base",
            error: error.message,
        });
    }
};

export const updateBase = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid base ID format",
            });
        }

        const { name, code, location, commander, contactInfo, isActive } =
            req.body;

        const updatedBase = await Base.findByIdAndUpdate(
            id,
            { name, code, location, commander, contactInfo, isActive },
            {
                new: true,
                runValidators: true,
            }
        ).populate("commander", "username fullname");

        if (!updatedBase) {
            return res.status(404).json({
                success: false,
                message: "Base not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Base updated successfully",
            data: updatedBase,
        });
    } catch (error) {
        console.error("Error updating base:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update base",
            error: error.message,
        });
    }
};

export const deleteBase = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid base ID format",
            });
        }

        const deletedBase = await Base.findByIdAndDelete(id);
        if (!deletedBase) {
            return res.status(404).json({
                success: false,
                message: "Base not found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Base deleted successfully",
            data: deletedBase,
        });
    } catch (error) {
        console.error("Error deleting base:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete base",
            error: error.message,
        });
    }
};
