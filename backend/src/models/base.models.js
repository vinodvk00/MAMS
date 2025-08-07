import mongoose, { Schema } from "mongoose";
import { roles } from "./user.models.js";

const baseSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Base name is required"],
            trim: true,
        },
        code: {
            type: String,
            required: [true, "Base code is required"],
            unique: true,
            trim: true,
            uppercase: true,
        },
        location: {
            type: String,
            required: [true, "Base location is required"],
            trim: true,
        },
        commander: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            validate: {
                validator: async function (commanderId) {
                    if (!commanderId) return true;

                    if (!mongoose.Types.ObjectId.isValid(commanderId)) {
                        throw new Error("Invalid commander ID format");
                    }

                    try {
                        const User = mongoose.model("User");
                        const commander = await User.findById(commanderId);

                        if (!commander) {
                            throw new Error("Commander not found in system");
                        }

                        if (
                            commander.role !== roles.BASE_COMMANDER &&
                            commander.role !== roles.ADMIN
                        ) {
                            throw new Error(
                                "Selected user does not have commander privileges"
                            );
                        }

                        return true;
                    } catch (error) {
                        if (
                            error.message === "Commander not found in system" ||
                            error.message ===
                                "Selected user does not have commander privileges"
                        ) {
                            throw error;
                        }

                        console.error("Error validating commander:", error);
                        throw new Error("Error validating commander");
                    }
                },
                message: "Commander validation failed",
            },
        },
        contactInfo: {
            type: String,
            default: "No contact info provided",
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        validateBeforeSave: true,
    }
);

export const Base = mongoose.model("Base", baseSchema);
