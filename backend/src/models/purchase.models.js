import mongoose, { Schema } from "mongoose";

const purchaseSchema = new Schema(
    {
        base: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Base",
            required: true,
            validate: {
                validator: async function (baseId) {
                    if (!this.isModified("base")) return true;

                    const base = await mongoose.model("Base").findById(baseId);
                    return !!base;
                },
                message: "Base not found",
            },
        },
        equipmentType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EquipmentType",
            required: true,
            validate: {
                validator: async function (equipmentTypeId) {
                    if (!this.isModified("equipmentType")) return true;

                    const equipmentType = await mongoose
                        .model("EquipmentType")
                        .findById(equipmentTypeId);
                    return !!equipmentType;
                },
                message: "Equipment type not found",
            },
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
        },
        supplier: {
            name: String,
            contact: String,
            address: String,
        },
        purchaseDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        deliveryDate: Date,
        status: {
            type: String,
            enum: ["ORDERED", "DELIVERED", "CANCELLED"],
            default: "ORDERED",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assets: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Asset",
            },
        ],
        notes: String,
    },
    {
        timestamps: true,
    }
);

purchaseSchema.pre("save", function (next) {
    if (this.quantity && this.unitPrice) {
        this.totalAmount = this.quantity * this.unitPrice;
    }
    next();
});

// NOTE: totalamount to be handled for other operations than save

purchaseSchema.index({ base: 1, purchaseDate: -1 });
purchaseSchema.index({ equipmentType: 1, purchaseDate: -1 });

export const Purchase = mongoose.model("Purchase", purchaseSchema);

// ASSUME: purchase is one item at a time, so its not an array
// ASSUME: purchase is not a bulk order, so no need for bulk handling
// ASSUME: purchase is not a recurring order, so no need for recurrence handling
