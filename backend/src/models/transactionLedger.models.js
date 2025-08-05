import mongoose, { Schema } from "mongoose";

const transactionLedgerSchema = new Schema(
    {
        transactionType: {
            type: String,
            enum: [
                "PURCHASE",
                "TRANSFER_IN",
                "TRANSFER_OUT",
                "ASSIGNMENT",
                "RETURN",
                "EXPENDITURE",
                "ADJUSTMENT",
            ],
            required: true,
        },

        referenceModel: {
            type: String,
            enum: ["Purchase", "Transfer", "Assignment", "Expenditure"],
            required: true,
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "referenceModel",
        },

        base: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Base",
            required: true,
        },
        equipmentType: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EquipmentType",
            required: true,
        },

        quantityChange: {
            type: Number,
            required: true, // positive for IN, negative for OUT
        },
        balanceAfter: {
            type: Number,
            required: true,
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

transactionLedgerSchema.index({ base: 1, equipmentType: 1, createdAt: -1 });

export const TransactionLedger = mongoose.model(
    "TransactionLedger",
    transactionLedgerSchema
);
