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
        currentBase: {
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
            unique: true,
            validate: {
                validator: async function (purchaseId) {
                    if (!purchaseId) return true; // Optional field

                    const purchase = await mongoose
                        .model("Purchase")
                        .findById(purchaseId);
                    return !!purchase;
                },
                message: "Purchase not found",
            },
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
