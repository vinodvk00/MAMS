import jwt from "jsonwebtoken";

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
        req.user = decoded;

        console.log("JWT verified successfully:", req.user);

        next();
    } catch (error) {
        console.error("JWT verification failed:", error);
        return res.status(403).json({
            message: "Invalid or expired access token",
            status: "error",
        });
    }
};
