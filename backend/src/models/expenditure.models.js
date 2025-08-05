import mongoose, { Schema } from "mongoose";

const expenditureSchema = new Schema(
    {
        equipmentType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EquipmentType",
            required: true,
        },
        base: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Base",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        expenditureDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        reason: {
            type: String,
            enum: ["TRAINING", "OPERATION", "MAINTENANCE", "DISPOSAL", "OTHER"],
            required: true,
        },
        assets: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Asset",
            },
        ],
        authorizedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        operationDetails: {
            operationName: String,
            operationId: String,
        },
        notes: String,
    },
    {
        timestamps: true,
    }
);

expenditureSchema.index({ base: 1, expenditureDate: -1 });
expenditureSchema.index({ equipmentType: 1, expenditureDate: -1 });

export const Expenditure = mongoose.model("Expenditure", expenditureSchema);
