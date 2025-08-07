import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import baseRouter from "./routes/base.routes.js";

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

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "Welcome to MAMS API (Military Asset Management System)",
        status: "success",
    });
});

export default app;
