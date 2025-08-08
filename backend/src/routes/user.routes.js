import { Router } from "express";
import {
    changeRole,
    getAllUsers,
    getUserById,
    loginUser,
    logoutUser,
    makeCommander,
    registerCommander,
    registerUser,
    removeCommander,
} from "../controllers/user.controller.js";
import { adminOnly, verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and session management
 *   - name: Users
 *     description: User management operations (Admin only)
 */

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Register a new user
 *     description: |
 *       Creates a new user account with default 'user' role.
 *
 *       **Public endpoint** - No authentication required.
 *
 *       All new users are created with 'user' role by default.
 *       Admin can later upgrade roles using the role management endpoints.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - fullname
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username for login (3-50 characters)
 *                 minLength: 3
 *                 maxLength: 50
 *                 pattern: '^[a-zA-Z0-9._-]+$'
 *                 example: "john.doe"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password (minimum 6 characters)
 *                 minLength: 6
 *                 example: "securepassword123"
 *               fullname:
 *                 type: string
 *                 description: Full name of the user
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "John Doe"
 *           examples:
 *             newUser:
 *               summary: Register new user
 *               value:
 *                 username: "soldier.smith"
 *                 password: "militarypass123"
 *                 fullname: "Soldier John Smith"
 *             officer:
 *               summary: Register officer
 *               value:
 *                 username: "officer.jones"
 *                 password: "officerpass456"
 *                 fullname: "Officer Sarah Jones"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               message: "User registered successfully"
 *               status: "success"
 *               user:
 *                 _id: "507f1f77bcf86cd799439017"
 *                 username: "john.doe"
 *                 fullname: "John Doe"
 *                 role: "user"
 *                 isActive: true
 *                 createdAt: "2024-03-15T10:30:00.000Z"
 *       400:
 *         description: Validation error or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   message: "All fields are required"
 *                   status: "error"
 *               usernameExists:
 *                 summary: Username already taken
 *                 value:
 *                   message: "Username already exists"
 *                   status: "error"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
userRouter.post("/register", registerUser);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: User login
 *     description: |
 *       Authenticates user credentials and returns JWT tokens.
 *
 *       **Authentication Method:**
 *       - Sets secure httpOnly cookies with access and refresh tokens
 *       - Also returns tokens in response body for client-side storage
 *
 *       **Token Usage:**
 *       1. Use the returned `accessToken` in Authorization header: `Bearer <token>`
 *       2. Or let the browser automatically send the httpOnly cookie
 *
 *       **Copy the accessToken from the response to use in the "Authorize" button above! 🔑**
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *                 example: "john.doe"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: "securepassword123"
 *           examples:
 *             standardLogin:
 *               summary: Standard user login
 *               value:
 *                 username: "john.doe"
 *                 password: "securepassword123"
 *             commanderLogin:
 *               summary: Base commander login
 *               value:
 *                 username: "commander.smith"
 *                 password: "commanderpass123"
 *             adminLogin:
 *               summary: Admin login
 *               value:
 *                 username: "admin"
 *                 password: "adminpass123"
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: JWT tokens stored in secure httpOnly cookies
 *             schema:
 *               type: string
 *               example: accessToken=eyJhbGciOiJIUzI1NiIs...; HttpOnly; Secure; refreshToken=eyJhbGciOiJIUzI1NiIs...; HttpOnly; Secure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               message: "Login successful"
 *               status: "success"
 *               user:
 *                 _id: "507f1f77bcf86cd799439017"
 *                 username: "john.doe"
 *                 fullname: "John Doe"
 *                 role: "base_commander"
 *                 assignedBase: "507f1f77bcf86cd799439011"
 *               accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Invalid credentials"
 *               status: "error"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "User not found"
 *               status: "error"
 *       500:
 *         description: Internal server error
 */
userRouter.post("/login", loginUser);

/**
 * @swagger
 * /user/logout:
 *   get:
 *     summary: User logout
 *     description: |
 *       Logs out the current user by clearing authentication tokens.
 *
 *       **Actions performed:**
 *       - Clears refresh token from database
 *       - Clears httpOnly cookies
 *       - Invalidates current session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *                 status:
 *                   type: string
 *                   example: "success"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 */
userRouter.get("/logout", verifyJWT, logoutUser);

/**
 * @swagger
 * /user/register-commander:
 *   post:
 *     summary: Register a base commander
 *     description: |
 *       Creates a new user with base commander role and assigns them to a specific base.
 *
 *       **Required Role:** Admin only
 *
 *       **Validation:**
 *       - Base must exist and be valid
 *       - Username must be unique
 *       - Role is automatically set to 'base_commander'
 *     tags: [Users]
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
 *               - username
 *               - password
 *               - fullname
 *               - baseId
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username for the commander
 *                 example: "commander.smith"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Commander's password
 *                 example: "commanderpass123"
 *               fullname:
 *                 type: string
 *                 description: Full name of the commander
 *                 example: "Commander John Smith"
 *               baseId:
 *                 type: string
 *                 format: objectId
 *                 description: ID of the base to assign the commander to
 *                 example: "507f1f77bcf86cd799439011"
 *           examples:
 *             newCommander:
 *               summary: Register new base commander
 *               value:
 *                 username: "commander.alpha"
 *                 password: "alphacommand789"
 *                 fullname: "Commander Alpha Johnson"
 *                 baseId: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Base Commander registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Base Commander registered successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Base not found
 */
userRouter.post("/register-commander", verifyJWT, adminOnly, registerCommander);

/**
 * @swagger
 * /user/:
 *   get:
 *     summary: Get all users
 *     description: |
 *       Retrieves a list of all users in the system.
 *
 *       **Required Role:** Admin only
 *
 *       **Sensitive information excluded:**
 *       - Passwords (never returned)
 *       - Refresh tokens (for security)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Users retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *             example:
 *               message: "Users retrieved successfully"
 *               status: "success"
 *               data:
 *                 - _id: "507f1f77bcf86cd799439017"
 *                   username: "john.doe"
 *                   fullname: "John Doe"
 *                   role: "user"
 *                   isActive: true
 *                 - _id: "507f1f77bcf86cd799439018"
 *                   username: "commander.smith"
 *                   fullname: "Commander Smith"
 *                   role: "base_commander"
 *                   assignedBase: "507f1f77bcf86cd799439011"
 *                   isActive: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
userRouter.get("/", verifyJWT, adminOnly, getAllUsers);

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: |
 *       Retrieves a specific user by their ID.
 *
 *       **Required Role:** Admin only
 *
 *       Currently uses the logged-in user's ID (from JWT token) rather than the path parameter.
 *       This will be updated to use the actual path parameter in future versions.
 *     tags: [Users]
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
 *         description: User ID
 *         example: "507f1f77bcf86cd799439017"
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User retrieved successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
userRouter.get("/:id", verifyJWT, adminOnly, getUserById);

/**
 * @swagger
 * /user/change-role/{userId}:
 *   patch:
 *     summary: Change user role
 *     description: |
 *       Updates a user's role in the system.
 *
 *       **Required Role:** Admin only
 *
 *       **Available Roles:**
 *       - `admin`: Full system access
 *       - `base_commander`: Manage assigned base
 *       - `logistics_officer`: Handle logistics operations
 *       - `user`: Basic access
 *
 *       **Note:** When changing to base_commander, you may also need to assign a base.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID to update
 *         example: "507f1f77bcf86cd799439017"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, base_commander, logistics_officer, user]
 *                 description: New role for the user
 *                 example: "base_commander"
 *           examples:
 *             promoteToCommander:
 *               summary: Promote user to base commander
 *               value:
 *                 role: "base_commander"
 *             promoteToLogistics:
 *               summary: Promote user to logistics officer
 *               value:
 *                 role: "logistics_officer"
 *             demoteToUser:
 *               summary: Demote to regular user
 *               value:
 *                 role: "user"
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Role updated from user to base_commander successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid role or user already has this role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidRole:
 *                 summary: Invalid role specified
 *                 value:
 *                   message: "Invalid role. Allowed roles: admin, base_commander, logistics_officer, user"
 *                   status: "error"
 *               sameRole:
 *                 summary: User already has this role
 *                 value:
 *                   message: "User already has the role: base_commander"
 *                   status: "error"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
userRouter.patch("/change-role/:userId", verifyJWT, adminOnly, changeRole);

/**
 * @swagger
 * /user/make-commander/{userId}:
 *   get:
 *     summary: Make user a base commander (DEPRECATED)
 *     description: |
 *       **⚠️ DEPRECATED:** Use `PATCH /user/change-role/{userId}` instead.
 *
 *       Changes a user's role to base_commander.
 *
 *       **Required Role:** Admin only
 *     tags: [Users]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID to promote
 *     responses:
 *       200:
 *         description: Role updated to commander successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
userRouter.get("/make-commander/:userId", verifyJWT, adminOnly, makeCommander);

/**
 * @swagger
 * /user/remove-commander/{userId}:
 *   get:
 *     summary: Remove commander role (DEPRECATED)
 *     description: |
 *       **⚠️ DEPRECATED:** Use `PATCH /user/change-role/{userId}` instead.
 *
 *       Changes a user's role from base_commander to user.
 *
 *       **Required Role:** Admin only
 *     tags: [Users]
 *     deprecated: true
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: User ID to demote
 *     responses:
 *       200:
 *         description: Role changed from commander to user
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
userRouter.get(
    "/remove-commander/:userId",
    verifyJWT,
    adminOnly,
    removeCommander
);

export default userRouter;
