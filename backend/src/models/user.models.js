/*  Role-Based Access Control (RBAC):
    Admin: Full access to all data and operations.
    Base Commander: Access to data and operations for their assigned base.
    Logistics Officer: Limited access to purchases and transfers.
*/

import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        fullname: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
            enum: ["admin", "base_commander", "logistics_officer", "user"],
            default: "user",
        },
        assignedBase: {
            type: Schema.Types.ObjectId,
            ref: "Base",
            required: function () {
                return this.role === "base_commander";
            },
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const roles = {
    ADMIN: "admin",
    BASE_COMMANDER: "base_commander",
    LOGISTICS_OFFICER: "logistics_officer",
    USER: "user",
};

export const isAdmin = (user) => user.role === roles.ADMIN;

export const isBaseCommander = (user) => user.role === roles.BASE_COMMANDER;

export const isLogisticsOfficer = (user) =>
    user.role === roles.LOGISTICS_OFFICER;

export const User = mongoose.model("User", userSchema);
