import mongoose, { Schema } from "mongoose";

const transferSchema = new mongoose.Schema(
    {
        fromBase: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Base",
            required: true,
        },
        toBase: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Base",
            required: true,
        },
        equipmentType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EquipmentType",
            required: true,
        },
        assets: [
            {
                asset: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Asset",
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
            },
        ],
        totalQuantity: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            enum: ["INITIATED", "IN_TRANSIT", "COMPLETED", "CANCELLED"],
            default: "INITIATED",
        },
        initiatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        transferDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        completionDate: Date,
        transportDetails: {
            type: String,
            default: "No transport details provided",
        },
        notes: String,
    },
    {
        timestamps: true,
    }
);

transferSchema.index({ fromBase: 1, transferDate: -1 });
transferSchema.index({ toBase: 1, transferDate: -1 });
transferSchema.index({ status: 1, transferDate: -1 });


export const Transfer = mongoose.model("Transfer", transferSchema);
