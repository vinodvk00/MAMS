const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    console.error(`Error: ${err.message}`, err.stack);

    if (err.name === "CastError") {
        const message = "Resource not found";
        error = { message, statusCode: 404 };
    }
    if (err.code === 11000) {
        const message = "Duplicate field value entered";
        error = { message, statusCode: 400 };
    }

    if (err.name === "ValidationError") {
        const message = Object.values(err.errors)
            .map((val) => val.message)
            .join(", ");
        error = { message, statusCode: 400 };
    }

    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token";
        error = { message, statusCode: 401 };
    }

    if (err.name === "TokenExpiredError") {
        const message = "Token expired";
        error = { message, statusCode: 401 };
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === "dev" && {
                stack: err.stack,
                details: err,
            }),
        },
    });
};

export { errorHandler };
