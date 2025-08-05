import mongoose, { Schema } from "mongoose";

const apiLogSchema = new Schema(
    {
        method: {
            type: String,
            required: true,
            enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        },
        endpoint: {
            type: String,
            required: true,
        },
        params: Schema.Types.Mixed,
        query: Schema.Types.Mixed,
        body: Schema.Types.Mixed,

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        userRole: {
            type: String,
            enum: ["admin", "base_commander", "logistics_officer", null],
        },
        userBase: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Base",
        },

        statusCode: {
            type: Number,
            required: true,
        },
        responseTime: {
            type: Number,
            required: true,
        },
        errorMessage: String,

        ip: String,
        userAgent: String,

        operation: {
            type: {
                type: String,
                enum: [
                    "ASSET_CREATE",
                    "ASSET_UPDATE",
                    "ASSET_DELETE",
                    "PURCHASE_CREATE",
                    "TRANSFER_INITIATE",
                    "TRANSFER_COMPLETE",
                    "ASSIGNMENT_CREATE",
                    "ASSIGNMENT_RETURN",
                    "EXPENDITURE_CREATE",
                    "LOGIN",
                    "LOGOUT",
                ],
            },
            affectedRecords: [
                {
                    model: String, // "Asset", "Purchase", etc.
                    id: mongoose.Schema.Types.ObjectId,
                },
            ],
        },
    },
    {
        timestamps: true,
    }
);

apiLogSchema.index({ userId: 1, createdAt: -1 });
apiLogSchema.index({ endpoint: 1, createdAt: -1 });
apiLogSchema.index({ statusCode: 1 });
apiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export const ApiLog = mongoose.model("ApiLog", apiLogSchema);
