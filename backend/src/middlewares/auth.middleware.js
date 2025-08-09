import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = async (req, res, next) => {
    let user = null;
    let token = req.cookies?.accessToken;

    const authHeader = req.headers.authorization;

    if (authHeader) {
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);

            try {
                const decoded = jwt.verify(
                    token,
                    process.env.ACCESS_TOKEN_SECRET
                );
                user = await User.findById(decoded._id).select(
                    "-password -refreshToken"
                );

                if (!user) {
                    return res.status(403).json({
                        message: "User not found",
                        status: "error",
                    });
                }
            } catch (error) {
                return res.status(403).json({
                    message: "Invalid or expired access token",
                    status: "error",
                });
            }
        } else if (authHeader.startsWith("Basic ")) {
            try {
                const base64Credentials = authHeader.substring(6);
                const credentials = Buffer.from(
                    base64Credentials,
                    "base64"
                ).toString("ascii");
                const [username, password] = credentials.split(":");

                if (!username || !password) {
                    return res.status(401).json({
                        message: "Invalid credentials format",
                        status: "error",
                    });
                }

                const foundUser = await User.findOne({ username });
                if (!foundUser) {
                    return res.status(401).json({
                        message: "Invalid credentials",
                        status: "error",
                    });
                }

                if (!foundUser.isActive) {
                    return res.status(401).json({
                        message: "Account is deactivated",
                        status: "error",
                    });
                }

                const isPasswordCorrect =
                    await foundUser.isPasswordCorrect(password);
                if (!isPasswordCorrect) {
                    return res.status(401).json({
                        message: "Invalid credentials",
                        status: "error",
                    });
                }

                user = await User.findById(foundUser._id).select(
                    "-password -refreshToken"
                );
            } catch (error) {
                return res.status(500).json({
                    message: "Authentication error",
                    status: "error",
                });
            }
        } 
    }

    if (!user && token) {
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            user = await User.findById(decoded._id).select(
                "-password -refreshToken"
            );
        } catch (error) {
            console.log("Cookie token invalid:", error.message);
        }
    }

    if (!user) {
        return res.status(401).json({
            message: "Access token is required",
            status: "error",
        });
    }

    req.user = user;
    next();
};

export const adminOnly = async (req, res, next) => {
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

    next();
};

export const logisticsOfficerOnly = (req, res, next) => {
    if (req.user?.role !== "logistics_officer" && req.user?.role !== "admin") {
        return res.status(403).json({
            message: "Access denied. Logistics Officers only.",
            status: "error",
        });
    }

    next();
};
