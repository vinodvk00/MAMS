import { Router } from "express";
import {
    createBase,
    getAllBases,
    getBaseById,
    updateBase,
    deleteBase,
} from "../controllers/base.controller.js";
import { adminOnly, verifyJWT } from "../middlewares/auth.middleware.js";
import { logApiRequest } from "../middlewares/apiLog.middleware.js";

const baseRouter = Router();

baseRouter.use(verifyJWT);
baseRouter.use(adminOnly);

/**
 * @swagger
 * tags:
 *   name: Bases
 *   description: Military base management operations (Admin only)
 */

/**
 * @swagger
 * /base/:
 *   get:
 *     summary: Get all military bases
 *     description: |
 *       Retrieves all military bases in the system with commander information.
 *
 *       **Required Role:** Admin only
 *
 *       Returns bases with populated commander details (username and fullname).
 *     tags: [Bases]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Bases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Bases retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Base'
 *                       - type: object
 *                         properties:
 *                           commander:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               username:
 *                                 type: string
 *                               fullname:
 *                                 type: string
 *             example:
 *               success: true
 *               message: "Bases retrieved successfully"
 *               data:
 *                 - _id: "507f1f77bcf86cd799439011"
 *                   name: "Fort Liberty"
 *                   code: "FTL001"
 *                   location: "North Carolina, USA"
 *                   commander:
 *                     _id: "507f1f77bcf86cd799439018"
 *                     username: "commander.smith"
 *                     fullname: "Commander John Smith"
 *                   contactInfo: "+1-555-0123"
 *                   isActive: true
 *                   createdAt: "2024-01-15T08:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Failed to retrieve bases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve bases"
 *                 error:
 *                   type: string
 */
baseRouter.get("/", getAllBases);

/**
 * @swagger
 * /base/create:
 *   post:
 *     summary: Create a new military base
 *     description: |
 *       Creates a new military base in the system.
 *
 *       **Required Role:** Admin only
 *
 *       **Validation:**
 *       - Base code must be unique
 *       - Commander (if provided) must have appropriate role
 *       - Commander validation is performed automatically
 *     tags: [Bases]
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
 *               - code
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the military base
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Fort Liberty"
 *               code:
 *                 type: string
 *                 description: Unique base code (will be converted to uppercase)
 *                 minLength: 3
 *                 maxLength: 10
 *                 pattern: '^[A-Z0-9]+$'
 *                 example: "FTL001"
 *               location:
 *                 type: string
 *                 description: Geographic location of the base
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: "North Carolina, USA"
 *               commander:
 *                 type: string
 *                 format: objectId
 *                 description: User ID of the base commander (optional)
 *                 example: "507f1f77bcf86cd799439018"
 *               contactInfo:
 *                 type: string
 *                 description: Contact information for the base
 *                 maxLength: 500
 *                 example: "Phone: +1-555-0123, Email: ftliberty@military.gov"
 *           examples:
 *             newBase:
 *               summary: Create new base without commander
 *               value:
 *                 name: "Fort Mountain View"
 *                 code: "FMV001"
 *                 location: "Colorado, USA"
 *                 contactInfo: "Phone: +1-555-0456"
 *             baseWithCommander:
 *               summary: Create base with assigned commander
 *               value:
 *                 name: "Naval Base Pacific"
 *                 code: "NBP001"
 *                 location: "California, USA"
 *                 commander: "507f1f77bcf86cd799439018"
 *                 contactInfo: "Phone: +1-555-0789, Fax: +1-555-0790"
 *     responses:
 *       201:
 *         description: Base created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Base created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Base'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation failed"
 *                 error:
 *                   type: string
 *             examples:
 *               duplicateCode:
 *                 summary: Duplicate base code
 *                 value:
 *                   success: false
 *                   message: "Base code already exists"
 *                   error: "Duplicate field value entered"
 *               invalidCommander:
 *                 summary: Invalid commander assignment
 *                 value:
 *                   success: false
 *                   message: "Commander validation failed"
 *                   error: "Selected user does not have commander privileges"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Failed to create base
 */
baseRouter.post("/create", logApiRequest("BASE_CREATE"), createBase);

/**
 * @swagger
 * /base/{id}:
 *   get:
 *     summary: Get base by ID
 *     description: |
 *       Retrieves a specific military base by its ID.
 *
 *       **Required Role:** Admin only
 *
 *       Returns base details with populated commander information.
 *     tags: [Bases]
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
 *         description: Base ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Base retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Base retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Base'
 *       400:
 *         description: Invalid base ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid base ID format"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Base not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Base not found"
 *       500:
 *         description: Failed to retrieve base
 */
baseRouter.get("/:id", getBaseById);

/**
 * @swagger
 * /base/{id}:
 *   patch:
 *     summary: Update military base
 *     description: |
 *       Updates an existing military base. Only provided fields will be updated.
 *
 *       **Required Role:** Admin only
 *
 *       **Commander Assignment:**
 *       - Commander must have base_commander or admin role
 *       - Validation is performed automatically
 *       - Set commander to null to remove assignment
 *     tags: [Bases]
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
 *         description: Base ID to update
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Update base name
 *                 example: "Fort Liberty Expanded"
 *               code:
 *                 type: string
 *                 description: Update base code
 *                 example: "FTL002"
 *               location:
 *                 type: string
 *                 description: Update base location
 *                 example: "North Carolina, USA - Sector B"
 *               commander:
 *                 type: string
 *                 format: objectId
 *                 nullable: true
 *                 description: Update or remove commander assignment
 *                 example: "507f1f77bcf86cd799439019"
 *               contactInfo:
 *                 type: string
 *                 description: Update contact information
 *                 example: "Phone: +1-555-0123, Email: ftliberty.new@military.gov"
 *               isActive:
 *                 type: boolean
 *                 description: Update base active status
 *                 example: false
 *           examples:
 *             updateCommander:
 *               summary: Update base commander
 *               value:
 *                 commander: "507f1f77bcf86cd799439019"
 *                 contactInfo: "New commander assigned - Contact: +1-555-0999"
 *             deactivateBase:
 *               summary: Deactivate base
 *               value:
 *                 isActive: false
 *                 notes: "Base temporarily deactivated for maintenance"
 *             removeCommander:
 *               summary: Remove base commander
 *               value:
 *                 commander: null
 *                 contactInfo: "No commander currently assigned"
 *     responses:
 *       200:
 *         description: Base updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Base updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Base'
 *       400:
 *         description: Invalid base ID or validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Base not found
 *       500:
 *         description: Failed to update base
 */
baseRouter.patch("/:id", logApiRequest("BASE_UPDATE"), updateBase);

/**
 * @swagger
 * /base/{id}:
 *   delete:
 *     summary: Delete military base
 *     description: |
 *       Permanently deletes a military base from the system.
 *
 *       **Required Role:** Admin only
 *
 *       **⚠️ Warning:** This action cannot be undone and will affect:
 *       - All assets assigned to this base
 *       - All users assigned to this base
 *       - All transfers involving this base
 *       - All assignments and expenditures at this base
 *
 *       **Recommendation:** Consider deactivating the base instead using the update endpoint.
 *     tags: [Bases]
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
 *         description: Base ID to delete
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Base deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Base deleted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Base'
 *                   description: Details of the deleted base
 *       400:
 *         description: Invalid base ID format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Base not found
 *       500:
 *         description: Failed to delete base
 */
baseRouter.delete("/:id", logApiRequest("BASE_DELETE"), deleteBase);

export default baseRouter;
