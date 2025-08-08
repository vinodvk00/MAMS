import { Router } from "express";
import {
    getDashboardMetrics,
    getNetMovementBreakdown,
    getPurchasesDetail,
    getTransfersInDetail,
    getTransfersOutDetail,
    getDashboardFilters,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const dashboardRouter = Router();

dashboardRouter.use(verifyJWT);

const dashboardAccess = (req, res, next) => {
    if (
        req.user?.role === "admin" ||
        req.user?.role === "base_commander" ||
        req.user?.role === "logistics_officer"
    ) {
        next();
    } else {
        return res.status(403).json({
            message:
                "Access denied. Dashboard access requires elevated permissions.",
            status: "error",
        });
    }
};

dashboardRouter.use(dashboardAccess);

/**
 * @swagger
 * /dashboard/metrics:
 *   get:
 *     summary: Get dashboard metrics
 *     description: |
 *       Retrieves key dashboard metrics including opening balance, closing balance,
 *       net movement, assigned count, and expended count for the specified period.
 *
 *       **Role Access:**
 *       - Admin: All bases
 *       - Base Commander: Only assigned base
 *       - Logistics Officer: All bases
 *
 *       **Default Period:** Current quarter if no dates specified
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for metrics calculation (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for metrics calculation (YYYY-MM-DD)
 *         example: "2024-03-31"
 *       - in: query
 *         name: baseId
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by specific base (ignored for base commanders)
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: equipmentTypeId
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by specific equipment type
 *         example: "507f1f77bcf86cd799439012"
 *       - in: query
 *         name: statusFilter
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [AVAILABLE, ASSIGNED, IN_TRANSIT, MAINTENANCE, EXPENDED]
 *         style: form
 *         explode: false
 *         description: Filter by asset status (comma-separated)
 *         example: "AVAILABLE,ASSIGNED"
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Dashboard metrics retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/DashboardMetrics'
 *             examples:
 *               quarterlyMetrics:
 *                 summary: Current quarter metrics
 *                 value:
 *                   message: "Dashboard metrics retrieved successfully"
 *                   status: "success"
 *                   data:
 *                     periodStart: "2024-01-01T00:00:00.000Z"
 *                     periodEnd: "2024-03-31T23:59:59.000Z"
 *                     metrics:
 *                       openingBalance: 150
 *                       closingBalance: 175
 *                       netMovement: 25
 *                       assignedCount: 45
 *                       expendedCount: 8
 *                     netMovementBreakdown:
 *                       purchases: 30
 *                       transfersIn: 15
 *                       transfersOut: 20
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
dashboardRouter.get("/metrics", getDashboardMetrics);

/**
 * @swagger
 * /dashboard/net-movement:
 *   get:
 *     summary: Get net movement breakdown
 *     description: |
 *       Provides detailed breakdown of net movement including purchases,
 *       transfers in, and transfers out with quantities and transaction counts.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for calculation
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for calculation
 *       - in: query
 *         name: baseId
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by specific base
 *       - in: query
 *         name: equipmentTypeId
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by specific equipment type
 *     responses:
 *       200:
 *         description: Net movement breakdown retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     periodStart:
 *                       type: string
 *                       format: date-time
 *                     periodEnd:
 *                       type: string
 *                       format: date-time
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         purchases:
 *                           type: object
 *                           properties:
 *                             quantity:
 *                               type: number
 *                             amount:
 *                               type: number
 *                             transactions:
 *                               type: number
 *                         transfersIn:
 *                           type: object
 *                           properties:
 *                             quantity:
 *                               type: number
 *                             transactions:
 *                               type: number
 *                         transfersOut:
 *                           type: object
 *                           properties:
 *                             quantity:
 *                               type: number
 *                             transactions:
 *                               type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
dashboardRouter.get("/net-movement", getNetMovementBreakdown);

/**
 * @swagger
 * /dashboard/purchases-detail:
 *   get:
 *     summary: Get detailed purchase records
 *     description: |
 *       Retrieves paginated list of purchase records for the specified period
 *       with full details including supplier and equipment information.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: baseId
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by base
 *       - in: query
 *         name: equipmentTypeId
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Filter by equipment type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Purchase details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     purchases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           unitPrice:
 *                             type: number
 *                           totalAmount:
 *                             type: number
 *                           purchaseDate:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                           base:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               code:
 *                                 type: string
 *                           equipmentType:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               category:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalRecords:
 *                           type: integer
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 */
dashboardRouter.get("/purchases-detail", getPurchasesDetail);

/**
 * @swagger
 * /dashboard/transfers-in-detail:
 *   get:
 *     summary: Get detailed incoming transfer records
 *     description: Retrieves paginated list of completed incoming transfers for the specified period
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: baseId
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: query
 *         name: equipmentTypeId
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Transfer in details retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
dashboardRouter.get("/transfers-in-detail", getTransfersInDetail);

/**
 * @swagger
 * /dashboard/transfers-out-detail:
 *   get:
 *     summary: Get detailed outgoing transfer records
 *     description: Retrieves paginated list of completed outgoing transfers for the specified period
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: baseId
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: query
 *         name: equipmentTypeId
 *         schema:
 *           type: string
 *           format: objectId
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Transfer out details retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
dashboardRouter.get("/transfers-out-detail", getTransfersOutDetail);

/**
 * @swagger
 * /dashboard/filters:
 *   get:
 *     summary: Get dashboard filter options
 *     description: |
 *       Retrieves available filter options for dashboard including bases,
 *       equipment types, and status options based on user permissions.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard filters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     bases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           code:
 *                             type: string
 *                     equipmentTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           category:
 *                             type: string
 *                           code:
 *                             type: string
 *                     statusOptions:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [AVAILABLE, ASSIGNED, IN_TRANSIT, MAINTENANCE, EXPENDED]
 *             example:
 *               message: "Dashboard filters retrieved successfully"
 *               status: "success"
 *               data:
 *                 bases:
 *                   - _id: "507f1f77bcf86cd799439011"
 *                     name: "Fort Liberty"
 *                     code: "FTL001"
 *                 equipmentTypes:
 *                   - _id: "507f1f77bcf86cd799439012"
 *                     name: "M4A1 Carbine"
 *                     category: "WEAPON"
 *                     code: "WPN-M4A1"
 *                 statusOptions:
 *                   - "AVAILABLE"
 *                   - "ASSIGNED"
 *                   - "IN_TRANSIT"
 *                   - "MAINTENANCE"
 *                   - "EXPENDED"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
dashboardRouter.get("/filters", getDashboardFilters);

export default dashboardRouter;
