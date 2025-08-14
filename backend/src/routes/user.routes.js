import { Router } from "express";
import {
    changeRole,
    getAllUsers,
    getOAuth2Token,
    getUserById,
    loginUser,
    logoutUser,
    makeCommander,
    registerCommander,
    registerUser,
    removeCommander,
    updateUser,
} from "../controllers/user.controller.js";
import { adminOnly, verifyJWT } from "../middlewares/auth.middleware.js";
import { logApiRequest } from "../middlewares/apiLog.middleware.js";

const userRouter = Router();

/**
 * @swagger
 * /user/token:
 *   post:
 *     summary: 🔗 OAuth2 Token Endpoint (For Swagger Authorization)
 *     description: |
 *       **This endpoint is specifically for Swagger UI's "Authorize" button.**
 *
 *       When you click "Authorize" and select "oauth2", Swagger automatically calls this endpoint
 *       to validate your credentials and get an access token.
 *
 *       **For regular application login, use POST /user/login instead.**
 *     tags: [1. 🔑 Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - grant_type
 *               - username
 *               - password
 *             properties:
 *               grant_type:
 *                 type: string
 *                 enum: [password]
 *                 description: OAuth2 grant type (always "password" for this flow)
 *                 example: password
 *               username:
 *                 type: string
 *                 description: Your username
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Your password
 *                 example: "yourpassword"
 *           examples:
 *             adminLogin:
 *               summary: Admin login
 *               value:
 *                 grant_type: password
 *                 username: admin
 *                 password: yourpassword
 *             commanderLogin:
 *               summary: Base commander login
 *               value:
 *                 grant_type: password
 *                 username: commander.smith
 *                 password: yourpassword
 *     responses:
 *       200:
 *         description: Authentication successful - Token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: JWT access token for API authentication
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 token_type:
 *                   type: string
 *                   example: "Bearer"
 *                   description: Token type (always Bearer for JWT)
 *                 expires_in:
 *                   type: number
 *                   example: 3600
 *                   description: Token expiration time in seconds
 *                 scope:
 *                   type: string
 *                   example: "read write"
 *                   description: Token permissions
 *                 user_info:
 *                   type: object
 *                   description: Basic user information
 *                   properties:
 *                     username:
 *                       type: string
 *                     role:
 *                       type: string
 *                     fullname:
 *                       type: string
 *             example:
 *               access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               token_type: "Bearer"
 *               expires_in: 3600
 *               scope: "read write"
 *               user_info:
 *                 username: "admin"
 *                 role: "admin"
 *                 fullname: "Administrator"
 *       400:
 *         description: Bad request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "invalid_request"
 *                 error_description:
 *                   type: string
 *                   example: "Username and password are required"
 *       401:
 *         description: Authentication failed - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "invalid_grant"
 *                 error_description:
 *                   type: string
 *                   example: "Invalid username or password"
 */
userRouter.post("/token", getOAuth2Token);

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
userRouter.post("/login", logApiRequest("LOGIN"), loginUser);

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
userRouter.get("/logout", verifyJWT, logApiRequest("LOGOUT"), logoutUser);

/**
 * @swagger
 * /user/{userId}:
 *   patch:
 *     summary: Update a user's details
 *     description: |
 *       Updates an existing user's information.
 *       **Required Role:** Admin only.
 *
 *       - If `username` is changed, it must be unique.
 *       - If `role` is not `"base_commander"`, `assignedBase` will be cleared automatically.
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
 *         description: The ID of the user to update
 *         example: "507f1f77bcf86cd799439017"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullname:
 *                 type: string
 *                 example: "John Updated Doe"
 *               username:
 *                 type: string
 *                 example: "john.updated"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "newSecurePass123"
 *               assignedBase:
 *                 type: string
 *                 format: objectId
 *                 example: "507f1f77bcf86cd799439011"
 *               role:
 *                 type: string
 *                 enum: [admin, base_commander, logistics_officer, user]
 *                 example: "logistics_officer"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User updated successfully"
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or duplicate username
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
userRouter.patch(
    "/:userId",
    verifyJWT,
    adminOnly,
    logApiRequest("USER_UPDATE"),
    updateUser
);

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
userRouter.patch(
    "/change-role/:userId",
    verifyJWT,
    adminOnly,
    logApiRequest("USER_CHANGE_ROLE"),
    changeRole
);

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
