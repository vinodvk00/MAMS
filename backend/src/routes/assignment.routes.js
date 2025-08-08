import { Router } from "express";
import {
    createAssignment,
    getAllAssignments,
    getAssignmentsByBase,
    getAssignmentById,
    returnAsset,
    updateAssignment,
    deleteAssignment,
    markAssetLostOrDamaged,
} from "../controllers/assignment.controller.js";
import {
    verifyJWT,
    adminOnly,
    baseComanderOnly,
} from "../middlewares/auth.middleware.js";

const assignmentRouter = Router();

assignmentRouter.use(verifyJWT);
assignmentRouter.use(baseComanderOnly);

assignmentRouter.post("/create", createAssignment);

// todo: seperate all and filter option endpoint as get all should be adminonly
assignmentRouter.get("/", getAllAssignments);

assignmentRouter.get("/base", getAssignmentsByBase);

assignmentRouter.patch("/return/:id", returnAsset);

assignmentRouter.patch("/mark-lost-damaged/:id", markAssetLostOrDamaged);

assignmentRouter.patch("/update/:id", updateAssignment);

assignmentRouter.get("/:id", getAssignmentById);

assignmentRouter.delete("/:id", baseComanderOnly, deleteAssignment);

export default assignmentRouter;
