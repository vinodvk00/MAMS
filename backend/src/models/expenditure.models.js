import mongoose, { Schema } from "mongoose";

const expenditureSchema = new Schema(
    {
        equipmentType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EquipmentType",
            required: true,
            validate: {
                validator: async function (equipmentTypeId) {
                    if (!equipmentTypeId) return false;

                    const equipmentType = await mongoose
                        .model("EquipmentType")
                        .findById(equipmentTypeId);
                    return !!equipmentType;
                },
                message: "Equipment type not found",
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
                asset: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Asset",
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
            },
        ],
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "COMPLETED", "CANCELLED"],
            default: "PENDING",
        },
        authorizedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        approvedDate: {
            type: Date,
        },
        completedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        completedDate: {
            type: Date,
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
expenditureSchema.index({ status: 1, expenditureDate: -1 });

export const Expenditure = mongoose.model("Expenditure", expenditureSchema);
