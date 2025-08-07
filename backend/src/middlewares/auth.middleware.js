import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = async (req, res, next) => {
    const token = req.cookies?.accessToken;

    if (!token) {
        return res.status(401).json({
            message: "Access token is required",
            status: "error",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded._id).select(
            "-password -refreshToken"
        );
        if (!user) {
            return res.status(403).json({
                message: "User not found",
                status: "error",
            });
        }

        req.user = user;
        
        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(403).json({
            message: "Invalid or expired access token",
            status: "error",
        });
    }
};

export const adminOnly = async (req, res, next) => {
    // console.log("Checking admin access for user:", req.user);

    const role = await User.findById(req.user._id).select("role");

    if (role.role !== "admin") {
        return res.status(403).json({
            message: "Access denied. Admins only.",
            status: "error",
        });
    }

    next();
};

export const baseComanderOnly = (req, res, next) => {
    if (req.user?.role !== "base_commander" && req.user?.role !== "admin") {
        return res.status(403).json({
            message: "Access denied. Base Commanders only.",
            status: "error",
        });
    }

    // can access the assigned base only
    // TODO: check the assigned base

    next();
};

export const logisticsOfficerOnly = (req, res, next) => {
    if (req.user?.role !== "logistics_officer" && req.user?.role !== "admin") {
        console.log(req.user.role);
        return res.status(403).json({
            message: "Access denied. Logistics Officers only.",
            status: "error",
        });
    }

    next();
};
