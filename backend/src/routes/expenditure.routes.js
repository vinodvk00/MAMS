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

/**
 * @swagger
 * tags:
 *   name: Expenditures
 *   description: Asset expenditure operations - tracking consumed/expended assets with approval workflow
 */

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

/**
 * @swagger
 * /expenditure/create:
 *   post:
 *     summary: Create expenditure record
 *     description: |
 *       Creates a new expenditure record for consumed assets.
 *
 *       **Required Role:** Base Commander, Logistics Officer, or Admin
 *
 *       **Expenditure Workflow:**
 *       1. PENDING → 2. APPROVED → 3. COMPLETED
 *
 *       **Asset Selection:**
 *       - If assetIds provided: Uses specific assets
 *       - If not provided: Auto-selects available assets (FIFO)
 *     tags: [Expenditures]
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
 *               - base
 *               - quantity
 *               - reason
 *             properties:
 *               equipmentType:
 *                 type: string
 *                 format: objectId
 *                 description: Type of equipment being expended
 *                 example: "507f1f77bcf86cd799439012"
 *               base:
 *                 type: string
 *                 format: objectId
 *                 description: Base where expenditure occurs
 *                 example: "507f1f77bcf86cd799439011"
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Quantity to expend
 *                 example: 50
 *               expenditureDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of expenditure (defaults to current date)
 *                 example: "2024-03-15T10:30:00.000Z"
 *               reason:
 *                 type: string
 *                 enum: [TRAINING, OPERATION, MAINTENANCE, DISPOSAL, OTHER]
 *                 description: Reason for expenditure
 *                 example: "TRAINING"
 *               assetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *                 description: Specific asset IDs to expend (optional)
 *                 example: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
 *               operationDetails:
 *                 type: object
 *                 properties:
 *                   operationName:
 *                     type: string
 *                     example: "Operation Desert Storm"
 *                   operationId:
 *                     type: string
 *                     example: "OPS-2024-001"
 *                 description: Operation details (for operational expenditures)
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *                 example: "Ammunition expended during live fire training exercise"
 *           examples:
 *             trainingExpenditure:
 *               summary: Training expenditure
 *               value:
 *                 equipmentType: "507f1f77bcf86cd799439012"
 *                 base: "507f1f77bcf86cd799439011"
 *                 quantity: 100
 *                 reason: "TRAINING"
 *                 notes: "Live fire training exercise - Company A"
 *             operationalExpenditure:
 *               summary: Operational expenditure
 *               value:
 *                 equipmentType: "507f1f77bcf86cd799439012"
 *                 base: "507f1f77bcf86cd799439011"
 *                 quantity: 250
 *                 reason: "OPERATION"
 *                 operationDetails:
 *                   operationName: "Operation Freedom Shield"
 *                   operationId: "OPS-2024-007"
 *                 notes: "Combat operation expenditure"
 *     responses:
 *       201:
 *         description: Expenditure created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Expenditure created successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Expenditure'
 *       400:
 *         description: Validation error or insufficient assets
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               insufficientAssets:
 *                 summary: Not enough assets available
 *                 value:
 *                   message: "Insufficient assets available. Requested: 100, Available: 75"
 *                   status: "error"
 *               noAssets:
 *                 summary: No assets of type available
 *                 value:
 *                   message: "No assets of this equipment type available at the specified base"
 *                   status: "error"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Base or equipment type not found
 */
expenditureRouter.post("/create", baseCommanderOrLogistics, createExpenditure);

/**
 * @swagger
 * /expenditure/approve/{id}:
 *   patch:
 *     summary: Approve expenditure
 *     description: |
 *       Approves a pending expenditure, moving it to APPROVED status.
 *
 *       **Required Role:** Base Commander, Logistics Officer, or Admin
 *
 *       Only expenditures with 'PENDING' status can be approved.
 *     tags: [Expenditures]
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
 *         description: Expenditure ID
 *         example: "507f1f77bcf86cd799439019"
 *     responses:
 *       200:
 *         description: Expenditure approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Expenditure approved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Expenditure'
 *       400:
 *         description: Expenditure cannot be approved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Expenditure cannot be approved. Current status: COMPLETED"
 *               status: "error"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
expenditureRouter.patch(
    "/approve/:id",
    baseCommanderOrLogistics,
    approveExpenditure
);

/**
 * @swagger
 * /expenditure/complete/{id}:
 *   patch:
 *     summary: Complete expenditure
 *     description: |
 *       Completes an approved expenditure by updating asset statuses.
 *
 *       **Required Role:** Base Commander, Logistics Officer, or Admin
 *
 *       **Automatic Actions:**
 *       - Assets status → EXPENDED
 *       - Assets condition → UNSERVICEABLE
 *       - Active assignments → EXPENDED status
 *       - Expenditure status → COMPLETED
 *     tags: [Expenditures]
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
 *         description: Expenditure ID
 *     responses:
 *       200:
 *         description: Expenditure completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Expenditure completed successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Expenditure'
 *       400:
 *         description: Expenditure cannot be completed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
expenditureRouter.patch(
    "/complete/:id",
    baseCommanderOrLogistics,
    completeExpenditure
);

/**
 * @swagger
 * /expenditure/cancel/{id}:
 *   patch:
 *     summary: Cancel expenditure
 *     description: |
 *       Cancels a pending or approved expenditure.
 *
 *       **Required Role:** Base Commander, Logistics Officer, or Admin
 *
 *       Completed expenditures cannot be cancelled.
 *     tags: [Expenditures]
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
 *         description: Expenditure ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 example: "Operation cancelled, assets no longer needed"
 *     responses:
 *       200:
 *         description: Expenditure cancelled successfully
 *       400:
 *         description: Cannot cancel completed expenditure
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
expenditureRouter.patch(
    "/cancel/:id",
    baseCommanderOrLogistics,
    cancelExpenditure
);

/**
 * @swagger
 * /expenditure/update/{id}:
 *   patch:
 *     summary: Update expenditure details
 *     description: |
 *       Updates expenditure details. Completed expenditures cannot be updated.
 *
 *       **Required Role:** Base Commander, Logistics Officer, or Admin
 *     tags: [Expenditures]
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
 *         description: Expenditure ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Update quantity
 *               reason:
 *                 type: string
 *                 enum: [TRAINING, OPERATION, MAINTENANCE, DISPOSAL, OTHER]
 *                 description: Update reason
 *               operationDetails:
 *                 type: object
 *                 properties:
 *                   operationName:
 *                     type: string
 *                   operationId:
 *                     type: string
 *                 description: Update operation details
 *               notes:
 *                 type: string
 *                 description: Update notes
 *               expenditureDate:
 *                 type: string
 *                 format: date-time
 *                 description: Update expenditure date
 *     responses:
 *       200:
 *         description: Expenditure updated successfully
 *       400:
 *         description: Cannot update completed expenditures
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
expenditureRouter.patch(
    "/update/:id",
    baseCommanderOrLogistics,
    updateExpenditure
);

/**
 * @swagger
 * /expenditure/:
 *   get:
 *     summary: Get all expenditures
 *     description: |
 *       Retrieves expenditures with filtering options.
 *
 *       **Required Role:** Base Commander, Logistics Officer, or Admin
 *
 *       **Role-based filtering:**
 *       - Base commanders: Only expenditures from their base
 *       - Others: All expenditures (can filter by base)
 *     tags: [Expenditures]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, COMPLETED, CANCELLED]
 *         description: Filter by expenditure status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter expenditures from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter expenditures until this date
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           enum: [TRAINING, OPERATION, MAINTENANCE, DISPOSAL, OTHER]
 *         description: Filter by expenditure reason
 *     responses:
 *       200:
 *         description: Expenditures retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Expenditures retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expenditure'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
expenditureRouter.get("/", baseCommanderOrLogistics, getAllExpenditures);

/**
 * @swagger
 * /expenditure/base:
 *   get:
 *     summary: Get expenditures by base
 *     description: |
 *       Retrieves expenditures for the user's assigned base.
 *
 *       **Required Role:** Base Commander or Admin
 *     tags: [Expenditures]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, COMPLETED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           enum: [TRAINING, OPERATION, MAINTENANCE, DISPOSAL, OTHER]
 *         description: Filter by reason
 *     responses:
 *       200:
 *         description: Base expenditures retrieved successfully
 *       400:
 *         description: User has no assigned base
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
expenditureRouter.get("/base", baseComanderOnly, getExpendituresByBase);

/**
 * @swagger
 * /expenditure/{id}:
 *   get:
 *     summary: Get expenditure by ID
 *     description: |
 *       Retrieves a specific expenditure by ID with full details.
 *
 *       **Required Role:** Base Commander, Logistics Officer, or Admin
 *
 *       **Role-based access:**
 *       - Base commanders: Only expenditures from their base
 *       - Others: All expenditures
 *     tags: [Expenditures]
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
 *         description: Expenditure ID
 *         example: "507f1f77bcf86cd799439019"
 *     responses:
 *       200:
 *         description: Expenditure retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Expenditure retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Expenditure'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
expenditureRouter.get("/:id", baseCommanderOrLogistics, getExpenditureById);

/**
 * @swagger
 * /expenditure/{id}:
 *   delete:
 *     summary: Delete expenditure
 *     description: |
 *       Permanently deletes an expenditure record.
 *
 *       **Required Role:** Admin only
 *
 *       **⚠️ Warning:** Completed expenditures cannot be deleted for audit trail purposes.
 *     tags: [Expenditures]
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
 *         description: Expenditure ID to delete
 *     responses:
 *       200:
 *         description: Expenditure deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Expenditure deleted successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedId:
 *                       type: string
 *                     deletedExpenditure:
 *                       $ref: '#/components/schemas/Expenditure'
 *       400:
 *         description: Cannot delete completed expenditures
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
expenditureRouter.delete("/:id", adminOnly, deleteExpenditure);

export default expenditureRouter;
