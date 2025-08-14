import { ApiLog } from "../models/apiLog.models.js";

export const logApiRequest = (operationType) => {
    return async (req, res, next) => {
        const start = Date.now();

        res.on("finish", async () => {
            const end = Date.now();
            const responseTime = end - start;

            if (res.statusCode >= 200 && res.statusCode < 300) {
                let affectedRecords = [];

                if (
                    res.locals.data &&
                    res.locals.data._id &&
                    res.locals.model
                ) {
                    affectedRecords.push({
                        model: res.locals.model,
                        id: res.locals.data._id,
                    });
                }

                const logData = {
                    method: req.method,
                    endpoint: req.originalUrl,
                    params: req.params,
                    query: req.query,
                    body: req.body ? { ...req.body, password: undefined } : {},
                    userId: req.user?._id,
                    userRole: req.user?.role,
                    userBase: req.user?.assignedBase,
                    statusCode: res.statusCode,
                    responseTime,
                    ip: req.ip,
                    userAgent: req.get("User-Agent"),
                    operation: {
                        type: operationType,
                        affectedRecords,
                    },
                };

                try {
                    await ApiLog.create(logData);
                } catch (error) {
                    console.error("Failed to log API request:", error);
                }
            }
        });

        next();
    };
};
