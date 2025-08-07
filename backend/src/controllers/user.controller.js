import { json } from "express";
import { roles, User } from "../models/user.models.js";
import { COOKIE_OPTIONS } from "../constants.js";

export const registerUser = async (req, res) => {
    try {
        const { username, password, fullname } = req.body;

        if (!username || !password || !fullname) {
            return res.status(400).json({
                message: "All fields are required",
                status: "error",
            });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                message: "Username already exists",
                status: "error",
            });
        }

        const newUser = await User.create({
            username,
            password,
            fullname,
            role: "user", // Default role for new users
        });

        const createdUser = await User.findById(newUser._id).select(
            "-password -refreshToken"
        );

        if (!createdUser) {
            return res.status(404).json({
                message: "User not found after creation",
                status: "error",
            });
        }

        return res.status(201).json({
            message: "User registered successfully",
            status: "success",
            user: createdUser,
        });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: "error",
        });
    }
};

export const registerCommander = async (req, res) => {
    try {
        const { username, password, fullname, baseId } = req.body;
        if (!username || !password || !fullname || !baseId) {
            return res.status(400).json({
                message:
                    "username, password, fullname, baseId fields are required",
                status: "error",
            });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                message: "Username already exists",
                status: "error",
            });
        }

        const newCommander = await User.create({
            username,
            password,
            fullname,
            role: "base_commander",
            assignedBase: baseId,
        });

        const createdCommander = await User.findById(newCommander._id).select(
            "-password -refreshToken"
        );

        if (!createdCommander) {
            return res.status(404).json({
                message: "Commander not found after creation",
                status: "error",
            });
        }

        return res.status(201).json({
            message: "Base Commander registered successfully",
            status: "success",
            user: createdCommander,
        });
    } catch (error) {
        console.error("Error registering base commander:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: "error",
        });
    }
};

export const makeCommander = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
                status: "error",
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { role: roles.BASE_COMMANDER } },
            {
                new: true,
                runValidators: true,
                select: "-password -refreshToken",
            }
        );

        if (!updatedUser) {
            return res.json({
                message: "user not found",
                status: "error",
            });
        }

        return res.json({
            message: "role updated to commander successfully",
            status: "success",
            data: updatedUser,
        });
    } catch (error) {
        return res.json({
            message: "error occurred while makind user base commander",
            status: "error",
            error: error.message,
        });
    }
};

export const removeCommander = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
                status: "error",
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { role: roles.USER } },
            {
                new: true,
                runValidators: true,
                select: "-password -refreshToken",
            }
        );

        if (!updatedUser) {
            return res.json({
                message: "user not found",
                status: "error",
            });
        }

        return res.json({
            message: "role changed from commander to user",
            status: "success",
            data: updatedUser,
        });
    } catch (error) {
        return res.json({
            message: "error occurred while makind user base commander",
            status: "error",
            error: error.message,
        });
    }
};

export const getAllUsers = async (req, res) => {
    const users = await User.find().select("-password -refreshToken");

    return res.status(200).json({
        message: "Users retrieved successfully",
        status: "success",
        data: users,
    });
};

export const getUserById = async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        return res.status(400).json({
            message: "User ID is required",
            status: "error",
        });
    }

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
        return res.status(404).json({
            message: "User not found",
            status: "error",
        });
    }

    return res.status(200).json({
        message: "User retrieved successfully",
        status: "success",
        data: user,
    });
};

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // console.log(`Generating tokens for user ID: ${userId}`);
        const user = await User.findById(userId);
        // console.log(`Generating tokens for user: ${user}`);

        if (!user) {
            return json({
                message: "User not found",
                status: "error",
            });
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save();

        return { accessToken, refreshToken };
    } catch (error) {
        console.error(`Error generating tokens for user ${userId}:`, error);
        return json({
            message: "Error generating tokens",
            status: "error",
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required",
                status: "error",
            });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: "error",
            });
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid credentials",
                status: "error",
            });
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, COOKIE_OPTIONS)
            .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
            .json({
                message: "Login successful",
                status: "success",
                user: {
                    _id: user._id,
                    username: user.username,
                    fullname: user.fullname,
                    role: user.role,
                    assignedBase: user.assignedBase
                        ? user.assignedBase.toString()
                        : null,
                },
                accessToken,
                refreshToken,
            });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: "error",
        });
    }
};

export const logoutUser = async (req, res) => {
    try {
        const userId = req.user?._id;
        console.log(`Logging out user with ID: ${userId}`);

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
                status: "error",
            });
        }

        const loggingOutUser = await User.findByIdAndUpdate(
            userId,
            { refreshToken: null },
            { new: true }
        );

        if (!loggingOutUser) {
            return res.status(404).json({
                message: "User not found",
                status: "error",
            });
        }

        return res
            .status(200)
            .clearCookie("accessToken", COOKIE_OPTIONS)
            .clearCookie("refreshToken", COOKIE_OPTIONS)
            .json({
                message: "Logout successful",
                status: "success",
            });
    } catch (error) {
        console.error("Error logging out user:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: "error",
        });
    }
};
