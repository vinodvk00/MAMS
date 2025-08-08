import { Router } from "express";
import {
    initiateTransfer,
    approveTransfer,
    completeTransfer,
    cancelTransfer,
    getAllTransfers,
    getTransferById,
    getTransfersByBase,
    updateTransfer,
} from "../controllers/transfer.controller.js";
import {
    verifyJWT,
    adminOnly,
    logisticsOfficerOnly,
    baseComanderOnly,
} from "../middlewares/auth.middleware.js";

const transferRouter = Router();

transferRouter.use(verifyJWT);

transferRouter.post("/initiate", baseComanderOnly, initiateTransfer);
transferRouter.patch("/approve/:id", logisticsOfficerOnly, approveTransfer);

// TODO: add the validation functions in auth middleware and user from there
transferRouter.patch(
    "/complete/:id",
    (req, res, next) => {
        if (
            req.user?.role === "base_commander" ||
            req.user?.role === "logistics_officer" ||
            req.user?.role === "admin"
        ) {
            next();
        } else {
            return res.status(403).json({
                message:
                    "Access denied. Base commanders, logistics officers, or admins only.",
                status: "error",
            });
        }
    },
    completeTransfer
);

transferRouter.patch(
    "/cancel/:id",
    (req, res, next) => {
        if (
            req.user?.role === "logistics_officer" ||
            req.user?.role === "admin"
        ) {
            next();
        } else if (req.user?.role === "base_commander") {
            next();
        } else {
            return res.status(403).json({
                message: "Access denied.",
                status: "error",
            });
        }
    },
    cancelTransfer
);

transferRouter.patch(
    "/update/:id",
    (req, res, next) => {
        if (
            req.user?.role === "base_commander" ||
            req.user?.role === "logistics_officer" ||
            req.user?.role === "admin"
        ) {
            next();
        } else {
            return res.status(403).json({
                message: "Access denied.",
                status: "error",
            });
        }
    },
    updateTransfer
);

transferRouter.get(
    "/",
    (req, res, next) => {
        if (
            req.user?.role === "logistics_officer" ||
            req.user?.role === "admin"
        ) {
            next();
        } else if (req.user?.role === "base_commander") {
            next();
        } else {
            return res.status(403).json({
                message: "Access denied.",
                status: "error",
            });
        }
    },
    getAllTransfers
);

transferRouter.get("/base", baseComanderOnly, getTransfersByBase);

transferRouter.get(
    "/:id",
    (req, res, next) => {
        if (
            req.user?.role === "logistics_officer" ||
            req.user?.role === "admin"
        ) {
            next();
        } else if (req.user?.role === "base_commander") {
            next();
        } else {
            return res.status(403).json({
                message: "Access denied.",
                status: "error",
            });
        }
    },
    getTransferById
);

export default transferRouter;
