import { Router } from "express";
import {
    createEquipmentType,
    deleteEquipmentType,
    getAllEquipmentTypes,
    getEquipmentTypeById,
    updateEquipmentType,
} from "../controllers/equipmentType.controller.js";
import { adminOnly, verifyJWT } from "../middlewares/auth.middleware.js";

const equipmentRouter = new Router();

equipmentRouter.post("/create", verifyJWT, adminOnly, createEquipmentType);
equipmentRouter.patch("/update/:id", verifyJWT, adminOnly, updateEquipmentType);
equipmentRouter.get("/getAll", verifyJWT, adminOnly, getAllEquipmentTypes);
equipmentRouter.get("/:id", verifyJWT, adminOnly, getEquipmentTypeById);
equipmentRouter.delete("/:id", verifyJWT, adminOnly, deleteEquipmentType);

export default equipmentRouter;
