import { json } from "express";
import { roles, User } from "../models/user.models.js";
import { COOKIE_OPTIONS } from "../constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const registerUser = async (req, res) => {
    try {
        const { username, password, fullname, role, assignedBase } = req.body;

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
            role: role || "user",
            assignedBase: assignedBase,
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
            data: createdUser,
        });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({
            message: "Internal server error",
            status: "error",
        });
    }
};

export const updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { fullname, username, isActive, password, assignedBase, role } =
        req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res
            .status(400)
            .json({ message: "Invalid user ID", status: "error" });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res
            .status(404)
            .json({ message: "User not found", status: "error" });
    }

    if (username && username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "Username already exists", status: "error" });
        }
        user.username = username;
    }

    if (fullname) user.fullname = fullname;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password; // pre-save hook will hash it
    if (role) user.role = role;
    if (assignedBase) user.assignedBase = assignedBase;
    if (role !== "base_commander") {
        user.assignedBase = null;
    }

    const updatedUser = await user.save();
    const userToReturn = updatedUser.toObject();
    delete userToReturn.password;
    delete userToReturn.refreshToken;

    res.status(200).json({
        message: "User updated successfully",
        status: "success",
        data: userToReturn,
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res
            .status(400)
            .json({ message: "Invalid user ID", status: "error" });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
        return res
            .status(404)
            .json({ message: "User not found", status: "error" });
    }

    res.status(200).json({
        message: "User deleted successfully",
        status: "success",
        data: { deletedId: userId },
    });
});

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

export const getOAuth2Token = async (req, res) => {
    try {
        const { grant_type, username, password } = req.body;

        if (!grant_type || grant_type !== "password") {
            return res.status(400).json({
                error: "unsupported_grant_type",
                error_description: "Only 'password' grant type is supported",
            });
        }

        if (!username || !password) {
            return res.status(400).json({
                error: "invalid_request",
                error_description: "Username and password are required",
            });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                error: "invalid_grant",
                error_description: "Invalid username or password",
            });
        }

        if (!user.isActive) {
            console.log("❌ OAuth2: User account deactivated:", username);
            return res.status(401).json({
                error: "invalid_grant",
                error_description: "Account is deactivated",
            });
        }

        const isPasswordCorrect = await user.isPasswordCorrect(password);
        if (!isPasswordCorrect) {
            console.log("❌ OAuth2: Invalid password for:", username);
            return res.status(401).json({
                error: "invalid_grant",
                error_description: "Invalid username or password",
            });
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        console.log(
            "✅ OAuth2 token issued for:",
            user.username,
            "Role:",
            user.role
        );

        return res.status(200).json({
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: 3600,
            scope: "read write",
            refresh_token: refreshToken,
            user_info: {
                username: user.username,
                role: user.role,
                fullname: user.fullname,
                assignedBase: user.assignedBase?.toString() || null,
            },
        });
    } catch (error) {
        return res.status(500).json({
            error: "server_error",
            message: "Internal server error occurred",
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

export const changeRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId) {
        return res.status(400).json({
            message: "User ID is required",
            status: "error",
        });
    }

    if (!role) {
        return res.status(400).json({
            message: "Role is required",
            status: "error",
        });
    }

    const validRoles = Object.values(roles);
    if (!validRoles.includes(role)) {
        return res.status(400).json({
            message: `Invalid role. Allowed roles: ${validRoles.join(", ")}`,
            status: "error",
        });
    }

    const existingUser = await User.findById(userId).select("role");
    if (!existingUser) {
        return res.status(404).json({
            message: "User not found",
            status: "error",
        });
    }

    if (existingUser.role === role) {
        return res.status(400).json({
            message: `User already has the role: ${role}`,
            status: "error",
        });
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { role: role } },
        {
            new: true,
            runValidators: true,
            select: "-password -refreshToken",
        }
    );

    if (!updatedUser) {
        return res.status(500).json({
            message: "Failed to update user role",
            status: "error",
        });
    }

    return res.status(200).json({
        message: `Role updated from ${existingUser.role} to ${role} successfully`,
        status: "success",
        data: updatedUser,
    });
});

export const getAllUsers = async (req, res) => {
    const users = await User.find()
        .select("-password -refreshToken")
        .populate("assignedBase", "name");

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

export const getUsersByBase = asyncHandler(async (req, res) => {
    let filter = {};

    if (req.user.role === "base_commander") {
        filter.assignedBase = req.user.assignedBase;
    }

    const users = await User.find(filter)
        .select("-password -refreshToken")
        .populate("assignedBase", "name");

    return res.status(200).json({
        message: "Users retrieved successfully",
        status: "success",
        data: users,
    });
});

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

        res.locals.data = user;
        res.locals.model = "User";

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
