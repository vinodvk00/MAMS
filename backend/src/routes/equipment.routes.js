import { Router } from "express";
import {
    createEquipmentType,
    deleteEquipmentType,
    getAllEquipmentTypes,
    getEquipmentTypeById,
    updateEquipmentType,
} from "../controllers/equipmentType.controller.js";
import { adminOnly, baseComanderOnly, officerOnly, verifyJWT } from "../middlewares/auth.middleware.js";
import { logApiRequest } from "../middlewares/apiLog.middleware.js";

const equipmentRouter = new Router();

/**
 * @swagger
 * tags:
 *   name: Equipment Types
 *   description: Equipment type management operations (Admin only) - Categories and specifications for military equipment
 */

/**
 * @swagger
 * /equipment/create:
 *   post:
 *     summary: Create equipment type
 *     description: |
 *       Creates a new equipment type category in the system.
 *
 *       **Required Role:** Admin only
 *
 *       **Equipment Categories:**
 *       - `WEAPON`: Firearms, missiles, explosive devices
 *       - `VEHICLE`: Military vehicles, aircraft, vessels
 *       - `AMMUNITION`: Bullets, shells, explosives
 *       - `EQUIPMENT`: Communications, medical, engineering equipment
 *       - `OTHER`: Miscellaneous military assets
 *
 *       **Validation:**
 *       - Name must be unique
 *       - Code must be unique and will be converted to uppercase
 *     tags: [Equipment Types]
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
 *               - name
 *               - category
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the equipment type
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "M4A1 Carbine"
 *               category:
 *                 type: string
 *                 enum: [WEAPON, VEHICLE, AMMUNITION, EQUIPMENT, OTHER]
 *                 description: Equipment category classification
 *                 example: "WEAPON"
 *               code:
 *                 type: string
 *                 description: Unique equipment code (auto-converted to uppercase)
 *                 minLength: 3
 *                 maxLength: 20
 *                 pattern: '^[A-Z0-9-_]+$'
 *                 example: "WPN-M4A1"
 *               description:
 *                 type: string
 *                 description: Detailed description of the equipment
 *                 maxLength: 500
 *                 example: "Standard issue assault rifle with 30-round magazine capacity"
 *           examples:
 *             weapon:
 *               summary: Create weapon equipment type
 *               value:
 *                 name: "M4A1 Carbine"
 *                 category: "WEAPON"
 *                 code: "WPN-M4A1"
 *                 description: "Standard issue assault rifle with selective fire capability"
 *             vehicle:
 *               summary: Create vehicle equipment type
 *               value:
 *                 name: "Humvee M1151"
 *                 category: "VEHICLE"
 *                 code: "VEH-HUMVEE"
 *                 description: "Armored tactical vehicle for personnel transport"
 *             ammunition:
 *               summary: Create ammunition equipment type
 *               value:
 *                 name: "5.56x45mm NATO"
 *                 category: "AMMUNITION"
 *                 code: "AMMO-556"
 *                 description: "Standard rifle ammunition for M4/M16 platforms"
 *     responses:
 *       201:
 *         description: Equipment type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment type created successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/EquipmentType'
 *             example:
 *               message: "Equipment type created successfully"
 *               status: "success"
 *               data:
 *                 _id: "507f1f77bcf86cd799439012"
 *                 name: "M4A1 Carbine"
 *                 category: "WEAPON"
 *                 code: "WPN-M4A1"
 *                 description: "Standard issue assault rifle"
 *                 isActive: true
 *                 createdAt: "2024-03-15T10:30:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   message: "name, category and code are required fields"
 *                   status: "error"
 *               duplicateName:
 *                 summary: Equipment name already exists
 *                 value:
 *                   message: "Equipment type name already exists"
 *                   status: "error"
 *               duplicateCode:
 *                 summary: Equipment code already exists
 *                 value:
 *                   message: "Equipment type code already exists"
 *                   status: "error"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
equipmentRouter.post(
    "/create",
    verifyJWT,
    adminOnly,
    logApiRequest("EQUIPMENT_CREATE"),
    createEquipmentType
);

/**
 * @swagger
 * /equipment/{id}:
 *   patch:
 *     summary: Update equipment type
 *     description: |
 *       Updates an existing equipment type. Only provided fields will be updated.
 *
 *       **Required Role:** Admin only
 *
 *       **Note:** Code will be automatically converted to uppercase if provided.
 *     tags: [Equipment Types]
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
 *         description: Equipment type ID
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Update equipment name
 *                 example: "M4A1 Carbine (Enhanced)"
 *               category:
 *                 type: string
 *                 enum: [WEAPON, VEHICLE, AMMUNITION, EQUIPMENT, OTHER]
 *                 description: Update equipment category
 *               code:
 *                 type: string
 *                 description: Update equipment code
 *                 example: "WPN-M4A1-ENH"
 *               description:
 *                 type: string
 *                 description: Update equipment description
 *                 example: "Enhanced version with improved optics mounting system"
 *           examples:
 *             updateDescription:
 *               summary: Update equipment description
 *               value:
 *                 description: "Updated specifications with latest modifications"
 *             updateCode:
 *               summary: Update equipment code
 *               value:
 *                 code: "WPN-M4A1-V2"
 *                 description: "Version 2 with updated specifications"
 *     responses:
 *       200:
 *         description: Equipment type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment type updated successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/EquipmentType'
 *       400:
 *         description: Equipment type ID is required or validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Equipment type not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Equipment type not found"
 *               status: "error"
 */
equipmentRouter.patch(
    "/:id",
    verifyJWT,
    adminOnly,
    logApiRequest("EQUIPMENT_UPDATE"),
    updateEquipmentType
);

/**
 * @swagger
 * /equipment/getAll:
 *   get:
 *     summary: Get all equipment types
 *     description: |
 *       Retrieves all equipment types in the system.
 *
 *       **Required Role:** Admin only
 *
 *       Returns all equipment types including inactive ones.
 *       Use the `isActive` field to filter active equipment types.
 *     tags: [Equipment Types]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Equipment types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment types retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EquipmentType'
 *             example:
 *               message: "Equipment types retrieved successfully"
 *               status: "success"
 *               data:
 *                 - _id: "507f1f77bcf86cd799439012"
 *                   name: "M4A1 Carbine"
 *                   category: "WEAPON"
 *                   code: "WPN-M4A1"
 *                   description: "Standard issue assault rifle"
 *                   isActive: true
 *                 - _id: "507f1f77bcf86cd799439013"
 *                   name: "Humvee M1151"
 *                   category: "VEHICLE"
 *                   code: "VEH-HUMVEE"
 *                   description: "Armored tactical vehicle"
 *                   isActive: true
 *                 - _id: "507f1f77bcf86cd799439014"
 *                   name: "5.56x45mm NATO"
 *                   category: "AMMUNITION"
 *                   code: "AMMO-556"
 *                   description: "Standard rifle ammunition"
 *                   isActive: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
equipmentRouter.get("/getAll", verifyJWT, officerOnly, getAllEquipmentTypes);

/**
 * @swagger
 * /equipment/{id}:
 *   get:
 *     summary: Get equipment type by ID
 *     description: |
 *       Retrieves a specific equipment type by its ID.
 *
 *       **Required Role:** Admin only
 *     tags: [Equipment Types]
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
 *         description: Equipment type ID
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Equipment type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment type retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/EquipmentType'
 *             example:
 *               message: "Equipment type retrieved successfully"
 *               status: "success"
 *               data:
 *                 _id: "507f1f77bcf86cd799439012"
 *                 name: "M4A1 Carbine"
 *                 category: "WEAPON"
 *                 code: "WPN-M4A1"
 *                 description: "Standard issue assault rifle with selective fire capability"
 *                 isActive: true
 *                 createdAt: "2024-01-15T08:00:00.000Z"
 *                 updatedAt: "2024-01-15T08:00:00.000Z"
 *       400:
 *         description: Equipment type ID is required
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Equipment type not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Equipment type not found"
 *               status: "error"
 */
equipmentRouter.get("/:id", verifyJWT, adminOnly, getEquipmentTypeById);

/**
 * @swagger
 * /equipment/{id}:
 *   delete:
 *     summary: Delete equipment type
 *     description: |
 *       Permanently deletes an equipment type from the system.
 *
 *       **Required Role:** Admin only
 *
 *       **⚠️ Warning:** This action cannot be undone and will affect:
 *       - All assets of this equipment type
 *       - All purchases for this equipment type
 *       - All transfers involving this equipment type
 *       - All expenditures of this equipment type
 *
 *       **Recommendation:** Consider deactivating the equipment type instead by setting `isActive: false`.
 *     tags: [Equipment Types]
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
 *         description: Equipment type ID to delete
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Equipment type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment type deleted successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedId:
 *                       type: string
 *                       description: ID of the deleted equipment type
 *                       example: "507f1f77bcf86cd799439012"
 *                     deletedName:
 *                       type: string
 *                       description: Name of the deleted equipment type
 *                       example: "M4A1 Carbine"
 *       400:
 *         description: Equipment type ID is required
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Equipment type not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Equipment type not found"
 *               status: "error"
 */
equipmentRouter.delete(
    "/:id",
    verifyJWT,
    adminOnly,
    logApiRequest("EQUIPMENT_DELETE"),
    deleteEquipmentType
);

export default equipmentRouter;
