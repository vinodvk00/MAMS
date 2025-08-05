import mongoose, { Schema } from "mongoose";

const equipmentTypeSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        category: {
            type: String,
            enum: ["WEAPON", "VEHICLE", "AMMUNITION", "EQUIPMENT", "OTHER"],
            required: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        description: String,
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

equipmentTypeSchema.index({ category: 1, code: 1 });

export const EquipmentType = mongoose.model(
    "EquipmentType",
    equipmentTypeSchema
);
