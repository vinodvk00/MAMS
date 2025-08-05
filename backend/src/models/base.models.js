import mongoose, { Schema } from "mongoose";

const baseSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        location: {
            type: String,
            default: "unknown",
            required: true,
        },
        commander: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        contactInfo: {
            type: String,
            default: "No contact info provided",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

baseSchema.index({ code: 1 });

export const Base = mongoose.model("Base", baseSchema);
