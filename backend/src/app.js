import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import baseRouter from "./routes/base.routes.js";
import equipmentRouter from "./routes/equipment.routes.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import purchaseRouter from "./routes/purchase.routes.js";
import assetRouter from "./routes/asset.routes.js";
import transferRouter from "./routes/transfer.routes.js";
import assignmentRouter from "./routes/assignment.routes.js";
import expenditureRouter from "./routes/expenditure.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import {
    swaggerSpec,
    swaggerUi,
    swaggerUiOptions,
} from "./config/swagger.config.js";

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

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

app.use("/api/v1/user/", userRouter);

app.use("/api/v1/base/", baseRouter);

app.use("/api/v1/equipment", equipmentRouter);

app.use("/api/v1/purchase", purchaseRouter);

app.use("/api/v1/asset/", assetRouter);

app.use("/api/v1/transfer/", transferRouter);

app.use("/api/v1/assignment/", assignmentRouter);

app.use("/api/v1/expenditure/", expenditureRouter);

app.use("/api/v1/dashboard/", dashboardRouter);

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "Welcome to MAMS API (Military Asset Management System)",
        status: "success",
    });
});

app.use(errorHandler);

export default app;
