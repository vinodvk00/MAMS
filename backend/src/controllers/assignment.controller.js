import { Assignment } from "../models/assignment.models.js";
import { Asset } from "../models/asset.models.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const createAssignment = asyncHandler(async (req, res) => {
    const { assetId, assignedToUserId, expectedReturnDate, purpose, notes } =
        req.body;

    if (!assetId || !assignedToUserId) {
        return res.status(400).json({
            message: "assetId and assignedToUserId are required fields",
            status: "error",
        });
    }

    const asset = await Asset.findById(assetId).populate(
        "currentBase equipmentType"
    );
    if (!asset) {
        return res.status(404).json({
            message: "Asset not found",
            status: "error",
        });
    }

    if (asset.status !== "AVAILABLE") {
        return res.status(400).json({
            message: `Asset is not available for assignment. Current status: ${asset.status}`,
            status: "error",
        });
    }

    const assignedUser = await User.findById(assignedToUserId).select(
        "-password -refreshToken"
    );
    if (!assignedUser) {
        return res.status(404).json({
            message: "User to be assigned not found",
            status: "error",
        });
    }

    if (req.user.role !== "admin") {
        if (
            asset.currentBase._id.toString() !==
            assignedUser.assignedBase?.toString()
        ) {
            return res.status(400).json({
                message: "User and asset must be from the same base",
                status: "error",
            });
        }
        const commanderBaseId = req.user.assignedBase?.toString();
        if (asset.currentBase._id.toString() !== commanderBaseId) {
            return res.status(403).json({
                message: "You can only assign assets from your assigned base",
                status: "error",
            });
        }
    }

    const existingActiveAssignment = await Assignment.findOne({
        asset: assetId,
        status: "ACTIVE",
    });

    if (existingActiveAssignment) {
        return res.status(400).json({
            message: "Asset is already assigned to someone else",
            status: "error",
        });
    }

    if (expectedReturnDate) {
        const returnDate = new Date(expectedReturnDate);
        const assignmentDate = new Date();

        if (returnDate <= assignmentDate) {
            return res.status(400).json({
                message: "Expected return date must be after assignment date",
                status: "error",
            });
        }
    }

    const newAssignment = await Assignment.create({
        asset: assetId,
        assignedTo: assignedToUserId,
        base: asset.currentBase._id,
        expectedReturnDate,
        purpose,
        notes,
        assignedBy: req.user._id,
    });

    await Asset.findByIdAndUpdate(assetId, { status: "ASSIGNED" });

    const createdAssignment = await Assignment.findById(newAssignment._id)
        .populate("asset", "serialNumber equipmentType status condition")
        .populate({
            path: "asset",
            populate: {
                path: "equipmentType",
                select: "name category code",
            },
        })
        .populate("assignedTo", "username fullname")
        .populate("base", "name code location")
        .populate("assignedBy", "username fullname");

    return res.status(201).json({
        message: "Asset assigned successfully",
        status: "success",
        data: createdAssignment,
    });
});

export const getAllAssignments = asyncHandler(async (req, res) => {
    const { status, startDate, endDate } = req.query;

    let filter = {};

    if (req.user.role === "base_commander") {
        filter.base = req.user.assignedBase;
    }

    if (status) {
        filter.status = status;
    }

    if (startDate || endDate) {
        filter.assignmentDate = {};
        if (startDate) {
            filter.assignmentDate.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.assignmentDate.$lte = new Date(endDate);
        }
    }

    const assignments = await Assignment.find(filter)
        .populate("asset", "serialNumber equipmentType status condition")
        .populate({
            path: "asset",
            populate: {
                path: "equipmentType",
                select: "name category code",
            },
        })
        .populate("assignedTo", "username fullname")
        .populate("base", "name code location")
        .populate("assignedBy", "username fullname")
        .sort({ assignmentDate: -1 });

    return res.status(200).json({
        message: "Assignments retrieved successfully",
        status: "success",
        data: assignments,
    });
});

export const getAssignmentsByBase = asyncHandler(async (req, res) => {
    const userBaseId = req.user.assignedBase;

    if (!userBaseId) {
        return res.status(400).json({
            message: "User has no assigned base",
            status: "error",
        });
    }

    const { status } = req.query;
    let filter = { base: userBaseId };

    if (status) {
        filter.status = status;
    }

    const assignments = await Assignment.find(filter)
        .populate("asset", "serialNumber equipmentType status condition")
        .populate({
            path: "asset",
            populate: {
                path: "equipmentType",
                select: "name category code",
            },
        })
        .populate("assignedTo", "username fullname")
        .populate("base", "name code location")
        .populate("assignedBy", "username fullname")
        .sort({ assignmentDate: -1 });

    return res.status(200).json({
        message: "Base assignments retrieved successfully",
        status: "success",
        data: assignments,
    });
});

export const getAssignmentById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid assignment ID format",
            status: "error",
        });
    }

    const assignment = await Assignment.findById(id)
        .populate("asset", "serialNumber equipmentType status condition")
        .populate({
            path: "asset",
            populate: {
                path: "equipmentType",
                select: "name category code",
            },
        })
        .populate("assignedTo", "username fullname")
        .populate("base", "name code location")
        .populate("assignedBy", "username fullname");

    if (!assignment) {
        return res.status(404).json({
            message: "Assignment not found",
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (assignment.base._id.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Access denied. You can only view assignments from your base",
                status: "error",
            });
        }
    }

    return res.status(200).json({
        message: "Assignment retrieved successfully",
        status: "success",
        data: assignment,
    });
});

export const returnAsset = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { returnCondition, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid assignment ID format",
            status: "error",
        });
    }

    const assignment = await Assignment.findById(id).populate("asset");
    if (!assignment) {
        return res.status(404).json({
            message: "Assignment not found",
            status: "error",
        });
    }

    if (assignment.status !== "ACTIVE") {
        return res.status(400).json({
            message: `Assignment is not active. Current status: ${assignment.status}`,
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (assignment.base.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Access denied. You can only return assets from your base",
                status: "error",
            });
        }
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
        id,
        {
            status: "RETURNED",
            actualReturnDate: new Date(),
            notes: notes || assignment.notes,
        },
        { new: true }
    )
        .populate("asset", "serialNumber equipmentType status condition")
        .populate({
            path: "asset",
            populate: {
                path: "equipmentType",
                select: "name category code",
            },
        })
        .populate("assignedTo", "username fullname")
        .populate("base", "name code location")
        .populate("assignedBy", "username fullname");

    const assetUpdate = { status: "AVAILABLE" };
    if (returnCondition) {
        assetUpdate.condition = returnCondition;
    }

    await Asset.findByIdAndUpdate(assignment.asset._id, assetUpdate);

    return res.status(200).json({
        message: "Asset returned successfully",
        status: "success",
        data: updatedAssignment,
    });
});

export const updateAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { expectedReturnDate, purpose, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid assignment ID format",
            status: "error",
        });
    }

    const existingAssignment = await Assignment.findById(id);
    if (!existingAssignment) {
        return res.status(404).json({
            message: "Assignment not found",
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (existingAssignment.base.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Access denied. You can only update assignments from your base",
                status: "error",
            });
        }
    }

    if (existingAssignment.status !== "ACTIVE") {
        return res.status(400).json({
            message: `Cannot update assignment with status: ${existingAssignment.status}`,
            status: "error",
        });
    }

    if (expectedReturnDate !== undefined) {
        const returnDate = new Date(expectedReturnDate);
        const assignmentDate = new Date(existingAssignment.assignmentDate);

        if (returnDate <= assignmentDate) {
            return res.status(400).json({
                message: "Expected return date must be after assignment date",
                status: "error",
            });
        }
    }

    const updateData = {};
    if (expectedReturnDate !== undefined)
        updateData.expectedReturnDate = expectedReturnDate;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (notes !== undefined) updateData.notes = notes;

    const updatedAssignment = await Assignment.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    )
        .populate("asset", "serialNumber equipmentType status condition")
        .populate({
            path: "asset",
            populate: {
                path: "equipmentType",
                select: "name category code",
            },
        })
        .populate("assignedTo", "username fullname")
        .populate("base", "name code location")
        .populate("assignedBy", "username fullname");

    return res.status(200).json({
        message: "Assignment updated successfully",
        status: "success",
        data: updatedAssignment,
    });
});

export const deleteAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid assignment ID format",
            status: "error",
        });
    }

    const existingAssignment = await Assignment.findById(id).populate("asset");
    if (!existingAssignment) {
        return res.status(404).json({
            message: "Assignment not found",
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (existingAssignment.base.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Access denied. You can only delete assignments from your base",
                status: "error",
            });
        }
    }

    if (existingAssignment.status === "ACTIVE") {
        await Asset.findByIdAndUpdate(existingAssignment.asset._id, {
            status: "AVAILABLE",
        });
    }

    await Assignment.findByIdAndDelete(id);

    return res.status(200).json({
        message: "Assignment deleted successfully",
        status: "success",
        data: {
            deletedId: id,
            deletedAssignment: existingAssignment,
        },
    });
});

// NOTE: thinking of updating asset status instead of the assignment

export const markAssetLostOrDamaged = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body; // status should be "LOST" or "DAMAGED"

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid assignment ID format",
            status: "error",
        });
    }

    if (!["LOST", "DAMAGED"].includes(status)) {
        return res.status(400).json({
            message: "Status must be either LOST or DAMAGED",
            status: "error",
        });
    }

    const assignment = await Assignment.findById(id).populate("asset");
    if (!assignment) {
        return res.status(404).json({
            message: "Assignment not found",
            status: "error",
        });
    }

    if (assignment.status !== "ACTIVE") {
        return res.status(400).json({
            message: `Assignment is not active. Current status: ${assignment.status}`,
            status: "error",
        });
    }

    if (req.user.role === "base_commander") {
        const userBaseId = req.user.assignedBase?.toString();
        if (assignment.base.toString() !== userBaseId) {
            return res.status(403).json({
                message:
                    "Access denied. You can only update assignments from your base",
                status: "error",
            });
        }
    }

    const updatedAssignment = await Assignment.findByIdAndUpdate(
        id,
        {
            status: status,
            actualReturnDate: new Date(),
            notes: notes || assignment.notes,
        },
        { new: true }
    )
        .populate("asset", "serialNumber equipmentType status condition")
        .populate({
            path: "asset",
            populate: {
                path: "equipmentType",
                select: "name category code",
            },
        })
        .populate("assignedTo", "username fullname")
        .populate("base", "name code location")
        .populate("assignedBy", "username fullname");

    const assetStatus = status === "LOST" ? "EXPENDED" : "MAINTENANCE";
    const assetCondition = status === "LOST" ? "UNSERVICEABLE" : "POOR";

    await Asset.findByIdAndUpdate(assignment.asset._id, {
        status: assetStatus,
        condition: assetCondition,
    });

    return res.status(200).json({
        message: `Asset marked as ${status.toLowerCase()} successfully`,
        status: "success",
        data: updatedAssignment,
    });
});
