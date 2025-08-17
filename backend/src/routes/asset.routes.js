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
    officerOnly,
} from "../middlewares/auth.middleware.js";
import { logApiRequest } from "../middlewares/apiLog.middleware.js";

const assetRouter = Router();

assetRouter.use(verifyJWT);

/**
 * @swagger
 * tags:
 *   name: Assets
 *   description: Asset management operations - tracking military equipment, vehicles, weapons, and ammunition
 */

/**
 * @swagger
 * /asset/create:
 *   post:
 *     summary: Create a new asset
 *     description: |
 *       Creates a new asset in the system. Serial numbers are auto-generated if not provided.
 *
 *       **Required Role:** Logistics Officer or Admin
 *
 *       **Auto-generated Serial Numbers:**
 *       - Format: A001, A002, A003, etc.
 *       - Automatically increments from the highest existing number
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - equipmentType
 *               - currentBase
 *             properties:
 *               serialNumber:
 *                 type: string
 *                 description: Unique serial number (auto-generated if not provided)
 *                 example: "A001"
 *               equipmentType:
 *                 type: string
 *                 format: objectId
 *                 description: ID of the equipment type
 *                 example: "507f1f77bcf86cd799439012"
 *               currentBase:
 *                 type: string
 *                 format: objectId
 *                 description: ID of the base where asset is located
 *                 example: "507f1f77bcf86cd799439011"
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, ASSIGNED, IN_TRANSIT, MAINTENANCE, EXPENDED]
 *                 default: AVAILABLE
 *                 description: Current status of the asset
 *               condition:
 *                 type: string
 *                 enum: [NEW, GOOD, FAIR, POOR, UNSERVICEABLE]
 *                 default: NEW
 *                 description: Physical condition of the asset
 *               purchaseId:
 *                 type: string
 *                 format: objectId
 *                 description: Reference to the purchase record
 *                 example: "507f1f77bcf86cd799439014"
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 default: 1
 *                 description: Quantity of this asset
 *           examples:
 *             weapon:
 *               summary: Create a weapon asset
 *               value:
 *                 equipmentType: "507f1f77bcf86cd799439012"
 *                 currentBase: "507f1f77bcf86cd799439011"
 *                 condition: "NEW"
 *                 quantity: 1
 *             vehicle:
 *               summary: Create a vehicle asset
 *               value:
 *                 serialNumber: "V001"
 *                 equipmentType: "507f1f77bcf86cd799439013"
 *                 currentBase: "507f1f77bcf86cd799439011"
 *                 status: "AVAILABLE"
 *                 condition: "GOOD"
 *                 quantity: 1
 *     responses:
 *       201:
 *         description: Asset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Asset created successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
assetRouter.post(
    "/create",
    officerOnly,
    logApiRequest("ASSET_CREATE"),
    createAsset
);

/**
 * @swagger
 * /asset/:
 *   get:
 *     summary: Get all assets
 *     description: |
 *       Retrieves all assets in the system with populated equipment type, base, and purchase information.
 *
 *       **Required Role:** Logistics Officer or Admin
 *
 *       Returns assets sorted by creation date (newest first).
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Assets retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
 *             example:
 *               message: "Assets retrieved successfully"
 *               status: "success"
 *               data:
 *                 - _id: "507f1f77bcf86cd799439013"
 *                   serialNumber: "A001"
 *                   status: "AVAILABLE"
 *                   condition: "NEW"
 *                   quantity: 1
 *                   equipmentType:
 *                     _id: "507f1f77bcf86cd799439012"
 *                     name: "M4A1 Carbine"
 *                     category: "WEAPON"
 *                     code: "WPN-M4A1"
 *                   currentBase:
 *                     _id: "507f1f77bcf86cd799439011"
 *                     name: "Fort Liberty"
 *                     code: "FTL001"
 *                     location: "North Carolina, USA"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
assetRouter.get("/", logisticsOfficerOnly, getAllAssets);

/**
 * @swagger
 * /asset/base:
 *   get:
 *     summary: Get assets by user's assigned base
 *     description: |
 *       Retrieves all assets for the base assigned to the current user.
 *
 *       **Required Role:** Base Commander or Admin
 *
 *       Base commanders can only see assets from their assigned base.
 *       Admins see all assets but must specify a base in query parameters.
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Base assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Base assets retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asset'
 *       400:
 *         description: User has no assigned base
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "User has no assigned base"
 *               status: "error"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
assetRouter.get("/base", baseComanderOnly, getAssetsByBase);

/**
 * @swagger
 * /asset/{id}:
 *   get:
 *     summary: Get asset by ID
 *     description: |
 *       Retrieves a specific asset by its ID with full details including
 *       equipment type, base, and purchase information.
 *
 *       **Required Role:** Base Commander or Admin
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Asset ID
 *         example: "507f1f77bcf86cd799439013"
 *     responses:
 *       200:
 *         description: Asset retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Asset retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         description: Invalid asset ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
assetRouter.get("/:id", baseComanderOnly, getAssetById);

/**
 * @swagger
 * /asset/{id}:
 *   patch:
 *     summary: Update asset
 *     description: |
 *       Updates an existing asset. Only provided fields will be updated.
 *
 *       **Required Role:** Base Commander or Admin
 *
 *       **Note:** Total amount is automatically recalculated if quantity or unit price is updated.
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Asset ID
 *         example: "507f1f77bcf86cd799439013"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serialNumber:
 *                 type: string
 *                 description: Update serial number
 *               equipmentType:
 *                 type: string
 *                 format: objectId
 *                 description: Update equipment type
 *               currentBase:
 *                 type: string
 *                 format: objectId
 *                 description: Update current base
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, ASSIGNED, IN_TRANSIT, MAINTENANCE, EXPENDED]
 *                 description: Update asset status
 *               condition:
 *                 type: string
 *                 enum: [NEW, GOOD, FAIR, POOR, UNSERVICEABLE]
 *                 description: Update asset condition
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *                 description: Update quantity
 *               purchaseId:
 *                 type: string
 *                 format: objectId
 *                 description: Update purchase reference
 *           examples:
 *             statusUpdate:
 *               summary: Update asset status
 *               value:
 *                 status: "MAINTENANCE"
 *                 condition: "FAIR"
 *             locationUpdate:
 *               summary: Move asset to different base
 *               value:
 *                 currentBase: "507f1f77bcf86cd799439015"
 *                 status: "AVAILABLE"
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Asset updated successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Asset'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
assetRouter.patch(
    "/:id",
    officerOnly,
    logApiRequest("ASSET_UPDATE"),
    updateAsset
);

/**
 * @swagger
 * /asset/{id}:
 *   delete:
 *     summary: Delete asset
 *     description: |
 *       Permanently deletes an asset from the system.
 *
 *       **Required Role:** Admin only
 *
 *       **⚠️ Warning:** This action cannot be undone. Consider updating the asset status to 'EXPENDED' instead.
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Asset ID to delete
 *         example: "507f1f77bcf86cd799439013"
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Asset deleted successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedId:
 *                       type: string
 *                       description: ID of the deleted asset
 *                     deletedSerialNumber:
 *                       type: string
 *                       description: Serial number of the deleted asset
 *                   example:
 *                     deletedId: "507f1f77bcf86cd799439013"
 *                     deletedSerialNumber: "A001"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
assetRouter.delete(
    "/:id",
    adminOnly,
    logApiRequest("ASSET_DELETE"),
    deleteAsset
);

export default assetRouter;
