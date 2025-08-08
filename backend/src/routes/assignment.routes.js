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

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Asset assignment operations - assigning assets to personnel and tracking returns
 */

/**
 * @swagger
 * /assignment/create:
 *   post:
 *     summary: Create asset assignment
 *     description: |
 *       Assigns an available asset to a user. Asset status is automatically updated to 'ASSIGNED'.
 *
 *       **Required Role:** Base Commander or Admin
 *
 *       **Requirements:**
 *       - Asset must be AVAILABLE
 *       - User and asset must be from the same base
 *       - No existing active assignment for the asset
 *
 *       **Automatic Actions:**
 *       - Asset status → ASSIGNED
 *       - Assignment status → ACTIVE
 *       - Assignment date → Current timestamp
 *     tags: [Assignments]
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
 *               - assetId
 *               - assignedToUserId
 *             properties:
 *               assetId:
 *                 type: string
 *                 format: objectId
 *                 description: ID of the asset to assign
 *                 example: "507f1f77bcf86cd799439013"
 *               assignedToUserId:
 *                 type: string
 *                 format: objectId
 *                 description: ID of the user receiving the asset
 *                 example: "507f1f77bcf86cd799439017"
 *               expectedReturnDate:
 *                 type: string
 *                 format: date-time
 *                 description: Expected return date (optional)
 *                 example: "2024-06-30T23:59:59.000Z"
 *               purpose:
 *                 type: string
 *                 description: Purpose of the assignment
 *                 example: "Training exercise Alpha-7"
 *               notes:
 *                 type: string
 *                 description: Additional assignment notes
 *                 example: "Handle with care, return after mission completion"
 *           examples:
 *             trainingAssignment:
 *               summary: Training assignment
 *               value:
 *                 assetId: "507f1f77bcf86cd799439013"
 *                 assignedToUserId: "507f1f77bcf86cd799439017"
 *                 expectedReturnDate: "2024-06-30T23:59:59.000Z"
 *                 purpose: "Combat training exercise"
 *                 notes: "Return immediately after training completion"
 *             missionAssignment:
 *               summary: Mission assignment
 *               value:
 *                 assetId: "507f1f77bcf86cd799439013"
 *                 assignedToUserId: "507f1f77bcf86cd799439017"
 *                 purpose: "Operation Desert Storm"
 *                 notes: "Mission-critical equipment"
 *     responses:
 *       201:
 *         description: Asset assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Asset assigned successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Assignment validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               assetNotAvailable:
 *                 summary: Asset not available
 *                 value:
 *                   message: "Asset is not available for assignment. Current status: ASSIGNED"
 *                   status: "error"
 *               differentBases:
 *                 summary: User and asset from different bases
 *                 value:
 *                   message: "User and asset must be from the same base"
 *                   status: "error"
 *               alreadyAssigned:
 *                 summary: Asset already assigned
 *                 value:
 *                   message: "Asset is already assigned to someone else"
 *                   status: "error"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Asset or user not found
 */
assignmentRouter.post("/create", createAssignment);

/**
 * @swagger
 * /assignment/:
 *   get:
 *     summary: Get all assignments
 *     description: |
 *       Retrieves assignments with filtering options.
 *
 *       **Required Role:** Base Commander or Admin
 *
 *       **Role-based filtering:**
 *       - Base commanders: Only assignments from their base
 *       - Admins: All assignments (can filter by base)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, RETURNED, LOST, DAMAGED, EXPENDED]
 *         description: Filter by assignment status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter assignments from this date
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter assignments until this date
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Assignments retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assignment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
assignmentRouter.get("/", getAllAssignments);

/**
 * @swagger
 * /assignment/base:
 *   get:
 *     summary: Get assignments by base
 *     description: |
 *       Retrieves all assignments for the user's assigned base.
 *
 *       **Required Role:** Base Commander or Admin
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, RETURNED, LOST, DAMAGED, EXPENDED]
 *         description: Filter by assignment status
 *     responses:
 *       200:
 *         description: Base assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Base assignments retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: User has no assigned base
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
assignmentRouter.get("/base", getAssignmentsByBase);

/**
 * @swagger
 * /assignment/return/{id}:
 *   patch:
 *     summary: Return assigned asset
 *     description: |
 *       Processes the return of an assigned asset.
 *
 *       **Required Role:** Base Commander or Admin
 *
 *       **Automatic Actions:**
 *       - Assignment status → RETURNED
 *       - Asset status → AVAILABLE
 *       - Actual return date → Current timestamp
 *       - Asset condition updated if provided
 *     tags: [Assignments]
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
 *         description: Assignment ID
 *         example: "507f1f77bcf86cd799439018"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               returnCondition:
 *                 type: string
 *                 enum: [NEW, GOOD, FAIR, POOR, UNSERVICEABLE]
 *                 description: Condition of asset upon return
 *                 example: "GOOD"
 *               notes:
 *                 type: string
 *                 description: Additional return notes
 *                 example: "Returned in good condition after training exercise"
 *           examples:
 *             goodCondition:
 *               summary: Asset returned in good condition
 *               value:
 *                 returnCondition: "GOOD"
 *                 notes: "No issues, asset fully functional"
 *             needsMaintenance:
 *               summary: Asset needs maintenance
 *               value:
 *                 returnCondition: "FAIR"
 *                 notes: "Minor wear, schedule for maintenance check"
 *     responses:
 *       200:
 *         description: Asset returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Asset returned successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Assignment is not active or cannot be returned
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
assignmentRouter.patch("/return/:id", returnAsset);

/**
 * @swagger
 * /assignment/mark-lost-damaged/{id}:
 *   patch:
 *     summary: Mark asset as lost or damaged
 *     description: |
 *       Marks an assigned asset as lost or damaged.
 *
 *       **Required Role:** Base Commander or Admin
 *
 *       **Automatic Actions:**
 *       - Assignment status → LOST or DAMAGED
 *       - Asset status → EXPENDED (if lost) or MAINTENANCE (if damaged)
 *       - Asset condition → UNSERVICEABLE (if lost) or POOR (if damaged)
 *       - Actual return date → Current timestamp
 *     tags: [Assignments]
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
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [LOST, DAMAGED]
 *                 description: Mark asset as lost or damaged
 *               notes:
 *                 type: string
 *                 description: Details about the incident
 *                 example: "Asset lost during combat operation"
 *           examples:
 *             lostAsset:
 *               summary: Asset lost
 *               value:
 *                 status: "LOST"
 *                 notes: "Asset lost during field training exercise, unable to recover"
 *             damagedAsset:
 *               summary: Asset damaged
 *               value:
 *                 status: "DAMAGED"
 *                 notes: "Asset damaged in transport, needs repair assessment"
 *     responses:
 *       200:
 *         description: Asset marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Asset marked as lost successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Invalid status or assignment not active
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
assignmentRouter.patch("/mark-lost-damaged/:id", markAssetLostOrDamaged);

/**
 * @swagger
 * /assignment/update/{id}:
 *   patch:
 *     summary: Update assignment details
 *     description: |
 *       Updates assignment details. Only active assignments can be updated.
 *
 *       **Required Role:** Base Commander or Admin
 *     tags: [Assignments]
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
 *         description: Assignment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expectedReturnDate:
 *                 type: string
 *                 format: date-time
 *                 description: Update expected return date
 *               purpose:
 *                 type: string
 *                 description: Update assignment purpose
 *               notes:
 *                 type: string
 *                 description: Update assignment notes
 *           examples:
 *             extendDeadline:
 *               summary: Extend return deadline
 *               value:
 *                 expectedReturnDate: "2024-07-31T23:59:59.000Z"
 *                 notes: "Extended for additional training requirements"
 *             updatePurpose:
 *               summary: Update assignment purpose
 *               value:
 *                 purpose: "Operation Desert Shield - Extended Mission"
 *                 notes: "Mission parameters changed, extended deployment required"
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       400:
 *         description: Cannot update non-active assignments or invalid date
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
assignmentRouter.patch("/update/:id", updateAssignment);

/**
 * @swagger
 * /assignment/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     description: |
 *       Retrieves a specific assignment by ID with full details.
 *
 *       **Required Role:** Base Commander or Admin
 *
 *       **Role-based access:**
 *       - Base commanders: Only assignments from their base
 *       - Admins: All assignments
 *     tags: [Assignments]
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
 *         description: Assignment ID
 *         example: "507f1f77bcf86cd799439018"
 *     responses:
 *       200:
 *         description: Assignment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Assignment retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
assignmentRouter.get("/:id", getAssignmentById);

/**
 * @swagger
 * /assignment/{id}:
 *   delete:
 *     summary: Delete assignment
 *     description: |
 *       Deletes an assignment record. If assignment is active, asset status is reverted to AVAILABLE.
 *
 *       **Required Role:** Base Commander or Admin
 *
 *       **⚠️ Warning:** This permanently deletes the assignment record.
 *     tags: [Assignments]
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
 *         description: Assignment ID to delete
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Assignment deleted successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedId:
 *                       type: string
 *                     deletedAssignment:
 *                       $ref: '#/components/schemas/Assignment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
assignmentRouter.delete("/:id", baseComanderOnly, deleteAssignment);

export default assignmentRouter;
