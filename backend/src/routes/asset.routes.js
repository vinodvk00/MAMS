import { Router } from "express";
import {
    createAsset,
    getAllAssets,
    getAssetById,
    getAssetsByBase,
    updateAsset,
    deleteAsset,
} from "../controllers/asset.controller.js";
import {
    verifyJWT,
    adminOnly,
    logisticsOfficerOnly,
    baseComanderOnly,
} from "../middlewares/auth.middleware.js";

const assetRouter = Router();

assetRouter.use(verifyJWT);

// TODO: validate purchase fields with asset fields, basiclly it should make sence

assetRouter.post("/create", logisticsOfficerOnly, createAsset);
assetRouter.get("/", logisticsOfficerOnly, getAllAssets);
assetRouter.get("/base", baseComanderOnly, getAssetsByBase);
assetRouter.get("/:id", baseComanderOnly, getAssetById);
assetRouter.patch("/:id", baseComanderOnly, updateAsset);
assetRouter.delete("/:id", adminOnly, deleteAsset);

export default assetRouter;
