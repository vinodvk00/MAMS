import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import baseRouter from "./routes/base.routes.js";
import equipmentRouter from "./routes/equipment.routes.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import purchaseRouter from "./routes/purchase.routes.js";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/user/", userRouter);

app.use("/api/v1/base/", baseRouter);

app.use("/api/v1/equipment", equipmentRouter);

app.use("/api/v1/purchase", purchaseRouter);

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "Welcome to MAMS API (Military Asset Management System)",
        status: "success",
    });
});

app.use(errorHandler);

export default app;
