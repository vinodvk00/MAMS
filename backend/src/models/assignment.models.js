import mongoose, { Schema } from "mongoose";

const assignmentSchema = new Schema(
    {
        asset: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Asset",
            required: true,
            validate: {
                validator: async function (assetId) {
                    if (!assetId) return false;

                    const asset = await mongoose
                        .model("Asset")
                        .findById(assetId);
                    return !!asset;
                },
                message: "Asset not found",
            },
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            validate: {
                validator: async function (userId) {
                    if (!userId) return false;

                    const user = await mongoose.model("User").findById(userId);
                    return !!user;
                },
                message: "User not found",
            },
        },
        base: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Base",
            required: true,
            validate: {
                validator: async function (baseId) {
                    if (!baseId) return false;

                    const base = await mongoose.model("Base").findById(baseId);
                    return !!base;
                },
                message: "Base not found",
            },
        },
        assignmentDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expectedReturnDate: {
            type: Date,
            validate: [
                {
                    validator: function (expectedDate) {
                        if (!expectedDate) return true;
                        if (this.isNew) {
                            return expectedDate > this.assignmentDate;
                        }
                        //NOTE: for updates skiping this validation (handling in controller)
                        return true;
                    },
                    message:
                        "Expected return date must be after assignment date",
                },
            ],
        },
        actualReturnDate: {
            type: Date,
            validate: {
                validator: function (returnDate) {
                    if (!returnDate) return true;
                    return returnDate >= this.assignmentDate;
                },
                message: "Actual return date cannot be before assignment date",
            },
        },
        status: {
            type: String,
            enum: ["ACTIVE", "RETURNED", "LOST", "DAMAGED", "EXPENDED"],
            default: "ACTIVE",
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        purpose: {
            type: String,
            trim: true,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

assignmentSchema.index({ asset: 1, status: 1 });
assignmentSchema.index({ base: 1, assignmentDate: -1 });
assignmentSchema.index({ assignedTo: 1, status: 1 });
assignmentSchema.index({ status: 1, assignmentDate: -1 });

export const Assignment = mongoose.model("Assignment", assignmentSchema);
