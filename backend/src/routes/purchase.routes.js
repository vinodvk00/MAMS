import { Router } from "express";
import {
    makePurchase,
    updatePurchase,
    deletePurchase,
    getAllPurchases,
    getPurchaseById,
} from "../controllers/purchase.controller.js";
import {
    verifyJWT,
    logisticsOfficerOnly,
} from "../middlewares/auth.middleware.js";


const purchaseRouter = Router();

purchaseRouter.use(verifyJWT);
purchaseRouter.use(logisticsOfficerOnly);

purchaseRouter.post("/create", makePurchase);
purchaseRouter.patch("/update/:id", updatePurchase);
purchaseRouter.delete("/:id", deletePurchase);

purchaseRouter.get("/", getAllPurchases);
purchaseRouter.get("/:id", getPurchaseById);

export default purchaseRouter;
