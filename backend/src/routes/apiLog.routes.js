import { Router } from "express";
import { getApiLogsManually as getApiLogs } from "../controllers/apiLog.controller.js";
import { verifyJWT, adminOnly } from "../middlewares/auth.middleware.js";

const apiLogRouter = Router();

// Secure this entire router to be admin-only
apiLogRouter.use(verifyJWT, adminOnly);

/**
 * @swagger
 * tags:
 *   - name: Audit Logs
 *     description: View API transaction and event logs (Admin only)
 */

/**
 * @swagger
 * /logs:
 *   get:
 *     summary: Retrieve API audit logs
 *     description: Fetches a paginated list of API logs, with options for filtering.
 *     tags:
 *       - Audit Logs
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number to retrieve.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: The number of logs to retrieve per page.
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter logs by a specific user ID.
 *       - in: query
 *         name: operationType
 *         schema:
 *           type: string
 *         description: Filter logs by the type of operation (e.g., 'PURCHASE_CREATE').
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: The start date for the log query.
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: The end date for the log query.
 *     responses:
 *       200:
 *         description: A list of API logs.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
apiLogRouter.get("/", getApiLogs);

export default apiLogRouter;
