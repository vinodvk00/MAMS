import { Router } from "express";
import {
    makePurchase,
    updatePurchase,
    deletePurchase,
    getAllPurchases,
    getPurchaseById,
} from "../controllers/purchase.controller.js";
import {
    verifyJWT,
    logisticsOfficerOnly,
} from "../middlewares/auth.middleware.js";

const purchaseRouter = Router();

purchaseRouter.use(verifyJWT);
purchaseRouter.use(logisticsOfficerOnly);

/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: Equipment purchase operations (Logistics Officer only) - Managing procurement and supplier relationships
 */

/**
 * @swagger
 * /purchase/create:
 *   post:
 *     summary: Create purchase record
 *     description: |
 *       Creates a new purchase record for equipment procurement.
 *
 *       **Required Role:** Logistics Officer or Admin
 *
 *       **Automatic Calculations:**
 *       - Total amount = quantity × unit price (calculated automatically)
 *       - Purchase date defaults to current date if not provided
 *
 *       **Purchase Status Workflow:**
 *       - `ORDERED`: Initial status when purchase is created
 *       - `DELIVERED`: When equipment arrives and is received
 *       - `CANCELLED`: If purchase is cancelled before delivery
 *     tags: [Purchases]
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
 *               - base
 *               - equipmentType
 *               - quantity
 *               - unitPrice
 *             properties:
 *               base:
 *                 type: string
 *                 format: objectId
 *                 description: Destination base for the equipment
 *                 example: "507f1f77bcf86cd799439011"
 *               equipmentType:
 *                 type: string
 *                 format: objectId
 *                 description: Type of equipment being purchased
 *                 example: "507f1f77bcf86cd799439012"
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Number of units to purchase
 *                 example: 50
 *               unitPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Price per unit in USD
 *                 example: 850.00
 *               supplier:
 *                 type: object
 *                 description: Supplier information (optional)
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Supplier company name
 *                     example: "Military Armaments Corp"
 *                   contact:
 *                     type: string
 *                     description: Supplier contact information
 *                     example: "John Smith, +1-555-0123, sales@militaryarms.com"
 *                   address:
 *                     type: string
 *                     description: Supplier address
 *                     example: "123 Defense Blvd, Arlington, VA 22201"
 *               purchaseDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date of purchase (defaults to current date)
 *                 example: "2024-03-15T10:30:00.000Z"
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Expected delivery date
 *                 example: "2024-04-15T12:00:00.000Z"
 *               status:
 *                 type: string
 *                 enum: [ORDERED, DELIVERED, CANCELLED]
 *                 default: ORDERED
 *                 description: Purchase status
 *               notes:
 *                 type: string
 *                 description: Additional purchase notes
 *                 maxLength: 1000
 *                 example: "Urgent procurement for training exercise"
 *           examples:
 *             standardPurchase:
 *               summary: Standard equipment purchase
 *               value:
 *                 base: "507f1f77bcf86cd799439011"
 *                 equipmentType: "507f1f77bcf86cd799439012"
 *                 quantity: 25
 *                 unitPrice: 1200.00
 *                 supplier:
 *                   name: "Defense Contractors Inc"
 *                   contact: "procurement@defensecontractors.com"
 *                   address: "456 Military Ave, Arlington, VA"
 *                 deliveryDate: "2024-04-01T10:00:00.000Z"
 *                 notes: "High priority order for upcoming deployment"
 *             bulkPurchase:
 *               summary: Bulk ammunition purchase
 *               value:
 *                 base: "507f1f77bcf86cd799439011"
 *                 equipmentType: "507f1f77bcf86cd799439014"
 *                 quantity: 10000
 *                 unitPrice: 0.85
 *                 supplier:
 *                   name: "Ammunition Supply Co"
 *                   contact: "orders@ammosupply.mil"
 *                 deliveryDate: "2024-03-30T14:00:00.000Z"
 *                 notes: "Bulk order for quarterly training allocation"
 *     responses:
 *       201:
 *         description: Purchase created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Purchase created successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Purchase'
 *             example:
 *               message: "Purchase created successfully"
 *               status: "success"
 *               data:
 *                 _id: "507f1f77bcf86cd799439020"
 *                 quantity: 25
 *                 unitPrice: 1200.00
 *                 totalAmount: 30000.00
 *                 status: "ORDERED"
 *                 purchaseDate: "2024-03-15T10:30:00.000Z"
 *                 createdBy:
 *                   _id: "507f1f77bcf86cd799439018"
 *                   username: "logistics.officer"
 *                   fullname: "Logistics Officer"
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
 *                   message: "base, equipmentType, quantity and unitPrice are required fields"
 *                   status: "error"
 *               invalidQuantity:
 *                 summary: Invalid quantity
 *                 value:
 *                   message: "Quantity must be at least 1"
 *                   status: "error"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Base or equipment type not found
 */
purchaseRouter.post("/create", makePurchase);

/**
 * @swagger
 * /purchase/update/{id}:
 *   patch:
 *     summary: Update purchase record
 *     description: |
 *       Updates an existing purchase record. Only provided fields will be updated.
 *
 *       **Required Role:** Logistics Officer or Admin
 *
 *       **Automatic Recalculation:**
 *       - Total amount is recalculated if quantity or unit price is updated
 *       - Cannot be modified once purchase is delivered
 *     tags: [Purchases]
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
 *         description: Purchase ID
 *         example: "507f1f77bcf86cd799439020"
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base:
 *                 type: string
 *                 format: objectId
 *                 description: Update destination base
 *               equipmentType:
 *                 type: string
 *                 format: objectId
 *                 description: Update equipment type
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 description: Update quantity (will recalculate total)
 *               unitPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Update unit price (will recalculate total)
 *               supplier:
 *                 type: object
 *                 description: Update supplier information
 *                 properties:
 *                   name:
 *                     type: string
 *                   contact:
 *                     type: string
 *                   address:
 *                     type: string
 *               purchaseDate:
 *                 type: string
 *                 format: date-time
 *                 description: Update purchase date
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Update expected delivery date
 *               status:
 *                 type: string
 *                 enum: [ORDERED, DELIVERED, CANCELLED]
 *                 description: Update purchase status
 *               notes:
 *                 type: string
 *                 description: Update notes
 *               assets:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *                 description: Link created assets to this purchase
 *           examples:
 *             updateStatus:
 *               summary: Mark purchase as delivered
 *               value:
 *                 status: "DELIVERED"
 *                 deliveryDate: "2024-03-20T14:30:00.000Z"
 *                 notes: "Equipment delivered and inspected - all items in good condition"
 *             updateQuantity:
 *               summary: Update order quantity
 *               value:
 *                 quantity: 30
 *                 notes: "Increased order quantity due to additional requirements"
 *             cancelPurchase:
 *               summary: Cancel purchase order
 *               value:
 *                 status: "CANCELLED"
 *                 notes: "Purchase cancelled - supplier unable to meet delivery timeline"
 *     responses:
 *       200:
 *         description: Purchase updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Purchase updated successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Purchase'
 *       400:
 *         description: Invalid purchase ID format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Purchase not found
 */
purchaseRouter.patch("/update/:id", updatePurchase);

/**
 * @swagger
 * /purchase/:
 *   get:
 *     summary: Get all purchases
 *     description: |
 *       Retrieves all purchase records in the system.
 *
 *       **Required Role:** Logistics Officer or Admin
 *
 *       Returns purchases sorted by purchase date (newest first) with populated
 *       base, equipment type, and user information.
 *     tags: [Purchases]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Purchases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Purchases retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Purchase'
 *             example:
 *               message: "Purchases retrieved successfully"
 *               status: "success"
 *               data:
 *                 - _id: "507f1f77bcf86cd799439020"
 *                   quantity: 25
 *                   unitPrice: 1200.00
 *                   totalAmount: 30000.00
 *                   status: "DELIVERED"
 *                   purchaseDate: "2024-03-15T10:30:00.000Z"
 *                   deliveryDate: "2024-03-20T14:30:00.000Z"
 *                   base:
 *                     _id: "507f1f77bcf86cd799439011"
 *                     name: "Fort Liberty"
 *                     code: "FTL001"
 *                   equipmentType:
 *                     _id: "507f1f77bcf86cd799439012"
 *                     name: "M4A1 Carbine"
 *                     category: "WEAPON"
 *                     code: "WPN-M4A1"
 *                   createdBy:
 *                     _id: "507f1f77bcf86cd799439018"
 *                     username: "logistics.officer"
 *                     fullname: "Logistics Officer"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
purchaseRouter.get("/", getAllPurchases);

/**
 * @swagger
 * /purchase/{id}:
 *   get:
 *     summary: Get purchase by ID
 *     description: |
 *       Retrieves a specific purchase record by its ID.
 *
 *       **Required Role:** Logistics Officer or Admin
 *
 *       Returns complete purchase details with populated references.
 *     tags: [Purchases]
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
 *         description: Purchase ID
 *         example: "507f1f77bcf86cd799439020"
 *     responses:
 *       200:
 *         description: Purchase retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Purchase retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Purchase'
 *       400:
 *         description: Invalid purchase ID format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Purchase not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Purchase not found"
 *               status: "error"
 */
purchaseRouter.get("/:id", getPurchaseById);

/**
 * @swagger
 * /purchase/{id}:
 *   delete:
 *     summary: Delete purchase record
 *     description: |
 *       Permanently deletes a purchase record from the system.
 *
 *       **Required Role:** Logistics Officer or Admin
 *
 *       **⚠️ Warning:** This action cannot be undone and will affect:
 *       - Any assets linked to this purchase
 *       - Purchase history and audit trails
 *       - Financial reporting data
 *
 *       **Recommendation:** Consider canceling the purchase instead of deleting it.
 *     tags: [Purchases]
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
 *         description: Purchase ID to delete
 *         example: "507f1f77bcf86cd799439020"
 *     responses:
 *       200:
 *         description: Purchase deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Purchase deleted successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedId:
 *                       type: string
 *                       description: ID of the deleted purchase
 *                       example: "507f1f77bcf86cd799439020"
 *                     deletedPurchase:
 *                       $ref: '#/components/schemas/Purchase'
 *                       description: Details of the deleted purchase
 *       400:
 *         description: Invalid purchase ID format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Purchase not found
 */
purchaseRouter.delete("/:id", deletePurchase);

export default purchaseRouter;
