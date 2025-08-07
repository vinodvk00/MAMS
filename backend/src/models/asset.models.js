import mongoose, { Schema } from "mongoose";

const assetSchema = new Schema(
    {
        serialNumber: {
            type: String,
            unique: true,
        },
        equipmentType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EquipmentType",
            required: true,
        },
        currentBase: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Base",
            required: true,
        },
        status: {
            type: String,
            enum: [
                "AVAILABLE",
                "ASSIGNED",
                "IN_TRANSIT",
                "MAINTENANCE",
                "EXPENDED",
            ],
            default: "AVAILABLE",
        },
        condition: {
            type: String,
            enum: ["NEW", "GOOD", "FAIR", "POOR", "UNSERVICEABLE"],
            default: "NEW",
        },
        purchaseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Purchase",
        },
        quantity: {
            type: Number,
            default: 1,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

assetSchema.index({ equipmentType: 1, currentBase: 1, status: 1 });

export const Asset = mongoose.model("Asset", assetSchema);
