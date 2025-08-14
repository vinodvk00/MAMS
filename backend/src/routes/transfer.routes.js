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
import { logApiRequest } from "../middlewares/apiLog.middleware.js";

const transferRouter = Router();

transferRouter.use(verifyJWT);

/**
 * @swagger
 * tags:
 *   name: Transfers
 *   description: Inter-base asset transfer operations with multi-step approval workflow
 */

/**
 * @swagger
 * /transfer/initiate:
 *   post:
 *     summary: Initiate asset transfer
 *     description: |
 *       Initiates a transfer of assets between bases. Assets are automatically set to 'IN_TRANSIT' status.
 *
 *       **Required Role:** Base Commander or Admin
 *
 *       **Transfer Workflow:**
 *       1. INITIATED → 2. IN_TRANSIT → 3. COMPLETED
 *
 *       **Permissions:**
 *       - Base commanders can only initiate transfers from/to their assigned base
 *       - Admins can initiate transfers between any bases
 *     tags: [Transfers]
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
 *               - fromBaseId
 *               - toBaseId
 *               - equipmentTypeId
 *               - totalQuantity
 *             properties:
 *               fromBaseId:
 *                 type: string
 *                 format: objectId
 *                 description: Source base ID
 *                 example: "507f1f77bcf86cd799439011"
 *               toBaseId:
 *                 type: string
 *                 format: objectId
 *                 description: Destination base ID
 *                 example: "507f1f77bcf86cd799439015"
 *               equipmentTypeId:
 *                 type: string
 *                 format: objectId
 *                 description: Type of equipment being transferred
 *                 example: "507f1f77bcf86cd799439012"
 *               assetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *                 description: Specific asset IDs to transfer (optional - system will auto-select if not provided)
 *                 example: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
 *               totalQuantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Total quantity to transfer
 *                 example: 5
 *               transportDetails:
 *                 type: string
 *                 description: Transportation and logistics details
 *                 example: "Military convoy transport, ETA 3 days"
 *               notes:
 *                 type: string
 *                 description: Additional notes for the transfer
 *                 example: "Urgent transfer for Operation Alpha"
 *           examples:
 *             standardTransfer:
 *               summary: Standard equipment transfer
 *               value:
 *                 fromBaseId: "507f1f77bcf86cd799439011"
 *                 toBaseId: "507f1f77bcf86cd799439015"
 *                 equipmentTypeId: "507f1f77bcf86cd799439012"
 *                 totalQuantity: 10
 *                 transportDetails: "Military convoy transport, ETA 72 hours"
 *                 notes: "Standard resupply transfer"
 *             specificAssets:
 *               summary: Transfer specific assets
 *               value:
 *                 fromBaseId: "507f1f77bcf86cd799439011"
 *                 toBaseId: "507f1f77bcf86cd799439015"
 *                 equipmentTypeId: "507f1f77bcf86cd799439012"
 *                 assetIds: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
 *                 totalQuantity: 2
 *                 transportDetails: "Air transport"
 *     responses:
 *       201:
 *         description: Transfer initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transfer initiated successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Transfer'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Base or equipment type not found
 */
transferRouter.post(
    "/initiate",
    baseComanderOnly,
    logApiRequest("TRANSFER_INITIATE"),
    initiateTransfer
);

/**
 * @swagger
 * /transfer/approve/{id}:
 *   patch:
 *     summary: Approve transfer
 *     description: |
 *       Approves an initiated transfer, moving it to IN_TRANSIT status.
 *
 *       **Required Role:** Logistics Officer or Admin
 *
 *       Only transfers with 'INITIATED' status can be approved.
 *     tags: [Transfers]
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
 *         description: Transfer ID
 *         example: "507f1f77bcf86cd799439016"
 *     responses:
 *       200:
 *         description: Transfer approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transfer approved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Transfer'
 *       400:
 *         description: Transfer cannot be approved (invalid status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Transfer cannot be approved. Current status: COMPLETED"
 *               status: "error"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
transferRouter.patch(
    "/approve/:id",
    logisticsOfficerOnly,
    logApiRequest("TRANSFER_APPROVE"),
    approveTransfer
);

/**
 * @swagger
 * /transfer/complete/{id}:
 *   patch:
 *     summary: Complete transfer
 *     description: |
 *       Completes a transfer by updating asset locations and setting status to COMPLETED.
 *
 *       **Required Role:** Base Commander (destination base), Logistics Officer, or Admin
 *
 *       **Actions performed:**
 *       - Updates asset currentBase to destination base
 *       - Sets asset status to AVAILABLE
 *       - Sets transfer status to COMPLETED
 *       - Records completion date
 *     tags: [Transfers]
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
 *         description: Transfer ID
 *         example: "507f1f77bcf86cd799439016"
 *     responses:
 *       200:
 *         description: Transfer completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transfer completed successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Transfer'
 *       400:
 *         description: Transfer cannot be completed (invalid status)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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
    logApiRequest("TRANSFER_COMPLETE"),
    completeTransfer
);

/**
 * @swagger
 * /transfer/cancel/{id}:
 *   patch:
 *     summary: Cancel transfer
 *     description: |
 *       Cancels a transfer and reverts asset statuses if applicable.
 *
 *       **Required Role:** Logistics Officer, Admin, or Transfer Initiator
 *
 *       **Actions performed:**
 *       - Sets transfer status to CANCELLED
 *       - If transfer was IN_TRANSIT, reverts asset status to AVAILABLE
 *       - Completed transfers cannot be cancelled
 *     tags: [Transfers]
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
 *         description: Transfer ID
 *         example: "507f1f77bcf86cd799439016"
 *     responses:
 *       200:
 *         description: Transfer cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transfer cancelled successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Transfer'
 *       400:
 *         description: Cannot cancel completed transfer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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
    logApiRequest("TRANSFER_CANCEL"),
    cancelTransfer
);

/**
 * @swagger
 * /transfer/update/{id}:
 *   patch:
 *     summary: Update transfer details
 *     description: |
 *       Updates transfer transport details and notes. Cannot update completed or cancelled transfers.
 *
 *       **Required Role:** Base Commander, Logistics Officer, or Admin
 *     tags: [Transfers]
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
 *         description: Transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transportDetails:
 *                 type: string
 *                 description: Updated transport details
 *                 example: "Changed to air transport, ETA reduced to 24 hours"
 *               notes:
 *                 type: string
 *                 description: Updated notes
 *                 example: "Priority increased due to operational requirements"
 *     responses:
 *       200:
 *         description: Transfer updated successfully
 *       400:
 *         description: Cannot update completed or cancelled transfers
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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

/**
 * @swagger
 * /transfer/:
 *   get:
 *     summary: Get all transfers
 *     description: |
 *       Retrieves all transfers with filtering options.
 *
 *       **Role-based access:**
 *       - Base commanders: Only transfers involving their base
 *       - Logistics officers: All transfers
 *       - Admins: All transfers
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [INITIATED, IN_TRANSIT, COMPLETED, CANCELLED]
 *         description: Filter by transfer status
 *       - in: query
 *         name: fromBase
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by source base
 *       - in: query
 *         name: toBase
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by destination base
 *       - in: query
 *         name: equipmentType
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by equipment type
 *     responses:
 *       200:
 *         description: Transfers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transfers retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transfer'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
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

/**
 * @swagger
 * /transfer/base:
 *   get:
 *     summary: Get transfers by base
 *     description: |
 *       Retrieves transfers for the user's assigned base.
 *
 *       **Required Role:** Base Commander or Admin
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [in, out, all]
 *           default: all
 *         description: Filter transfer direction
 *     responses:
 *       200:
 *         description: Base transfers retrieved successfully
 *       400:
 *         description: User has no assigned base
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
transferRouter.get("/base", baseComanderOnly, getTransfersByBase);

/**
 * @swagger
 * /transfer/{id}:
 *   get:
 *     summary: Get transfer by ID
 *     description: |
 *       Retrieves a specific transfer by ID with full details.
 *
 *       **Role-based access:**
 *       - Base commanders: Only transfers involving their base
 *       - Logistics officers: All transfers
 *       - Admins: All transfers
 *     tags: [Transfers]
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
 *         description: Transfer ID
 *         example: "507f1f77bcf86cd799439016"
 *     responses:
 *       200:
 *         description: Transfer retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Transfer retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Transfer'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
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
