import { Router } from "express";
import {
    createExpenditure,
    getAllExpenditures,
    getExpenditureById,
    getExpendituresByBase,
    approveExpenditure,
    completeExpenditure,
    cancelExpenditure,
    updateExpenditure,
    deleteExpenditure,
} from "../controllers/expenditure.controller.js";
import {
    verifyJWT,
    adminOnly,
    logisticsOfficerOnly,
    baseComanderOnly,
} from "../middlewares/auth.middleware.js";

const expenditureRouter = Router();

expenditureRouter.use(verifyJWT);

// todo: after testing move to auth middleware
const baseCommanderOrLogistics = (req, res, next) => {
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
};

expenditureRouter.post("/create", baseCommanderOrLogistics, createExpenditure);

expenditureRouter.patch(
    "/approve/:id",
    baseCommanderOrLogistics,
    approveExpenditure
);

expenditureRouter.patch(
    "/complete/:id",
    baseCommanderOrLogistics,
    completeExpenditure
);

expenditureRouter.patch(
    "/cancel/:id",
    baseCommanderOrLogistics,
    cancelExpenditure
);

expenditureRouter.patch(
    "/update/:id",
    baseCommanderOrLogistics,
    updateExpenditure
);

expenditureRouter.get("/", baseCommanderOrLogistics, getAllExpenditures);

expenditureRouter.get("/base", baseComanderOnly, getExpendituresByBase);

expenditureRouter.get("/:id", baseCommanderOrLogistics, getExpenditureById);

// DELETE - Admin only (for safety, since expenditures affect asset inventory)
expenditureRouter.delete("/:id", adminOnly, deleteExpenditure);

export default expenditureRouter;
