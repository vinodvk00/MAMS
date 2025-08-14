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
            enum: [
                "admin",
                "base_commander",
                "logistics_officer",
                "user",
                null,
            ],
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
                    "PURCHASE_UPDATE",
                    "PURCHASE_DELETE",
                    "TRANSFER_INITIATE",
                    "TRANSFER_APPROVE",
                    "TRANSFER_COMPLETE",
                    "TRANSFER_CANCEL",
                    "TRANSFER_UPDATE",
                    "ASSIGNMENT_CREATE",
                    "ASSIGNMENT_RETURN",
                    "ASSIGNMENT_UPDATE",
                    "ASSIGNMENT_DELETE",
                    "ASSIGNMENT_MARK_LOST_DAMAGED",
                    "EXPENDITURE_CREATE",
                    "EXPENDITURE_APPROVE",
                    "EXPENDITURE_COMPLETE",
                    "EXPENDITURE_CANCEL",
                    "EXPENDITURE_UPDATE",
                    "EXPENDITURE_DELETE",
                    "USER_UPDATE",
                    "USER_DELETE",
                    "USER_CHANGE_ROLE",
                    "LOGIN",
                    "LOGOUT",
                ],
            },
            affectedRecords: [
                {
                    model: String,
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

// Auto-delete logs after 90 days
apiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); 

export const ApiLog = mongoose.model("ApiLog", apiLogSchema);
