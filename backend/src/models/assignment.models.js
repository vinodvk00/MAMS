import mongoose, { Schema } from "mongoose";

const assignmentSchema = new Schema(
    {
        asset: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Asset",
            required: true,
        },
        assignedTo: {
            personnelId: String,
            name: String,
            rank: String,
            unit: String,
        },
        base: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Base",
            required: true,
        },
        assignmentDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expectedReturnDate: Date,
        actualReturnDate: Date,
        status: {
            type: String,
            enum: ["ACTIVE", "RETURNED", "LOST", "DAMAGED"],
            default: "ACTIVE",
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        purpose: String,
        notes: String,
    },
    {
        timestamps: true,
    }
);

assignmentSchema.index({ asset: 1, status: 1 });
assignmentSchema.index({ base: 1, assignmentDate: -1 });
assignmentSchema.index({ "assignedTo.personnelId": 1 });

export const Assignment = mongoose.model("Assignment", assignmentSchema);
