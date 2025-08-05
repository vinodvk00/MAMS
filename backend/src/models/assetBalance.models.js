import mongoose, { Schema } from "mongoose";

const assetBalanceSchema = new Schema(
    {
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
        date: {
            type: Date,
            required: true,
        },
        openingBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        purchases: {
            type: Number,
            default: 0,
            min: 0,
        },
        transfersIn: {
            type: Number,
            default: 0,
            min: 0,
        },
        transfersOut: {
            type: Number,
            default: 0,
            min: 0,
        },
        assigned: {
            type: Number,
            default: 0,
            min: 0,
        },
        expended: {
            type: Number,
            default: 0,
            min: 0,
        },
        closingBalance: {
            type: Number,
            default: 0,
            min: 0,
        },
        netMovement: {
            type: Number,
            default: 0,
        },
        transactions: {
            purchases: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Purchase",
                },
            ],
            transfersIn: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Transfer",
                },
            ],
            transfersOut: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Transfer",
                },
            ],
            assignments: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Assignment",
                },
            ],
            expenditures: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Expenditure",
                },
            ],
        },
    },
    {
        timestamps: true,
    }
);

assetBalanceSchema.index({ base: 1, equipmentType: 1, date: -1 });

assetBalanceSchema.pre("save", function (next) {
    this.netMovement = this.purchases + this.transfersIn - this.transfersOut;
    this.closingBalance =
        this.openingBalance + this.netMovement - this.expended;
    next();
});

export const AssetBalance = mongoose.model("AssetBalance", assetBalanceSchema);
