import { Router } from "express";
import {
    createBase,
    getAllBases,
    getBaseById,
    updateBase,
    deleteBase,
} from "../controllers/base.controller.js";
import { adminOnly, verifyJWT } from "../middlewares/auth.middleware.js";

const baseRouter = Router();

baseRouter.use(verifyJWT);

baseRouter.use(adminOnly);

baseRouter.get("/", getAllBases);
baseRouter.post("/create", createBase);
baseRouter.get("/:id", getBaseById);
baseRouter.patch("/:id", updateBase);
baseRouter.delete("/:id", deleteBase);

export default baseRouter;
