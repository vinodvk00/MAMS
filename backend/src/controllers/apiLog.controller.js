import { ApiLog } from "../models/apiLog.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const getApiLogs = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        userId,
        operationType,
        startDate,
        endDate,
    } = req.query;

    const filter = {};

    if (userId) {
        filter.userId = userId;
    }
    if (operationType) {
        filter["operation.type"] = operationType;
    }
    if (startDate && endDate) {
        filter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        };
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: [
            { path: "userId", select: "username fullname" },
            { path: "userBase", select: "name code" },
        ],
    };

    const logs = await ApiLog.paginate(filter, options);

    return res.status(200).json({
        message: "API logs retrieved successfully",
        status: "success",
        data: logs,
    });
});

// NOTE: for now its just manually paginated, later can use mongoose plugin 

export const getApiLogsManually = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        userId,
        operationType,
        startDate,
        endDate,
    } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    if (userId) {
        filter.userId = userId;
    }
    if (operationType) {
        filter["operation.type"] = operationType;
    }
    if (startDate && endDate) {
        filter.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        };
    }

    const logs = await ApiLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("userId", "username fullname")
        .populate("userBase", "name code");

    const totalDocuments = await ApiLog.countDocuments(filter);

    return res.status(200).json({
        message: "API logs retrieved successfully",
        status: "success",
        data: {
            docs: logs,
            totalDocs: totalDocuments,
            limit: parseInt(limit),
            totalPages: Math.ceil(totalDocuments / limit),
            page: parseInt(page),
            hasNextPage: page * limit < totalDocuments,
            hasPrevPage: page > 1,
        },
    });
});
