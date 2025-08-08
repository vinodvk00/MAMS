import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

// Enhanced Swagger definition with simplified auth
const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
        title: "Military Asset Management System (MAMS) API",
        version: "1.0.0",
        description: `
      # Military Asset Management System API
      
      A comprehensive API for managing military assets across multiple bases.
      This system enables commanders and logistics personnel to track, transfer, 
      assign and manage critical military assets including vehicles, weapons, and ammunition.
      
      ## Features
      - 🔐 Simple username/password authentication with JWT tokens
      - 📊 Real-time dashboard analytics with quarterly metrics
      - 🚛 Inter-base asset transfers with approval workflows
      - 👥 Personnel asset assignments and tracking
      - 💰 Purchase and expenditure management
      - 📈 Comprehensive asset inventory tracking
      
      ## Authentication
      This API supports two authentication methods for your convenience:
      
      ### Option 1: Direct Username/Password (Recommended for testing)
      1. Click the 🔒 **Authorize** button above
      2. Select **basicAuth** and enter your username and password directly
      3. Click **Authorize**
      
      ### Option 2: JWT Token Authentication
      1. **Login**: Use \`POST /user/login\` with your username and password
      2. **Get Token**: Copy the access token from the response
      3. **Authorize**: Click the 🔒 **Authorize** button above and select **bearerAuth**
      4. **Enter Token**: Paste the token in format: \`Bearer your_token_here\`
      
      Both methods will authenticate you for all protected endpoints.
      
      ### Example Login:
      \`\`\`json
      {
        "username": "john.doe",
        "password": "your_password"
      }
      \`\`\`
      
      ## User Roles & Permissions
      - **👑 Admin**: Full access to all operations and data
      - **🎖️ Base Commander**: Manage assets and operations for assigned base only
      - **📦 Logistics Officer**: Handle purchases, transfers, and logistics operations
      - **👤 User**: Basic access (limited functionality)
      
      ## API Response Format
      All API responses follow this standard format:
      \`\`\`json
      {
        "message": "Operation result message",
        "status": "success|error",
        "data": { /* response data */ }
      }
      \`\`\`
    `,
        contact: {
            name: "MAMS API Support",
            email: "support@mams.military.gov",
        },
        license: {
            name: "Military Use License",
            url: "https://example.com/license",
        },
    },
    servers: [
        {
            url: "http://localhost:3000/api/v1",
            description: "Development server",
        },
        {
            url: "https://api.mams.military.gov/v1",
            description: "Production server",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description:
                    "Enter your JWT token in the format: Bearer &lt;token&gt;",
            },
            basicAuth: {
                type: "http",
                scheme: "basic",
                description:
                    "Enter your username and password for direct authentication",
            },
        },
        schemas: {
            // Authentication schemas
            LoginRequest: {
                type: "object",
                required: ["username", "password"],
                properties: {
                    username: {
                        type: "string",
                        description: "User login username",
                        example: "john.doe",
                    },
                    password: {
                        type: "string",
                        format: "password",
                        description: "User password",
                        example: "securepassword123",
                    },
                },
            },
            LoginResponse: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        example: "Login successful",
                    },
                    status: {
                        type: "string",
                        example: "success",
                    },
                    user: {
                        type: "object",
                        properties: {
                            _id: { type: "string" },
                            username: { type: "string" },
                            fullname: { type: "string" },
                            role: {
                                type: "string",
                                enum: [
                                    "admin",
                                    "base_commander",
                                    "logistics_officer",
                                    "user",
                                ],
                            },
                            assignedBase: { type: "string", nullable: true },
                        },
                    },
                    accessToken: {
                        type: "string",
                        description: "JWT access token for API authentication",
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                },
            },

            // User schemas
            User: {
                type: "object",
                required: ["username", "fullname", "role"],
                properties: {
                    _id: {
                        type: "string",
                        format: "objectId",
                        description: "User unique identifier",
                        example: "507f1f77bcf86cd799439011",
                    },
                    username: {
                        type: "string",
                        description: "Unique username for login",
                        example: "john.doe",
                    },
                    fullname: {
                        type: "string",
                        description: "Full name of the user",
                        example: "John Doe",
                    },
                    role: {
                        type: "string",
                        enum: [
                            "admin",
                            "base_commander",
                            "logistics_officer",
                            "user",
                        ],
                        description: "User role determining access permissions",
                    },
                    assignedBase: {
                        type: "string",
                        format: "objectId",
                        description:
                            "Base assigned to user (required for base commanders)",
                        nullable: true,
                    },
                    isActive: {
                        type: "boolean",
                        default: true,
                        description: "Whether the user account is active",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },

            // Base schemas
            Base: {
                type: "object",
                required: ["name", "code", "location"],
                properties: {
                    _id: {
                        type: "string",
                        format: "objectId",
                        example: "507f1f77bcf86cd799439011",
                    },
                    name: {
                        type: "string",
                        description: "Name of the military base",
                        example: "Fort Liberty",
                    },
                    code: {
                        type: "string",
                        description: "Unique base code",
                        example: "FTL001",
                    },
                    location: {
                        type: "string",
                        description: "Geographic location of the base",
                        example: "North Carolina, USA",
                    },
                    commander: {
                        $ref: "#/components/schemas/User",
                    },
                    contactInfo: {
                        type: "string",
                        description: "Contact information for the base",
                        example: "+1-555-0123",
                    },
                    isActive: {
                        type: "boolean",
                        default: true,
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },

            // Equipment Type schemas
            EquipmentType: {
                type: "object",
                required: ["name", "category", "code"],
                properties: {
                    _id: {
                        type: "string",
                        format: "objectId",
                        example: "507f1f77bcf86cd799439012",
                    },
                    name: {
                        type: "string",
                        description: "Name of the equipment type",
                        example: "M4A1 Carbine",
                    },
                    category: {
                        type: "string",
                        enum: [
                            "WEAPON",
                            "VEHICLE",
                            "AMMUNITION",
                            "EQUIPMENT",
                            "OTHER",
                        ],
                        description: "Category classification",
                    },
                    code: {
                        type: "string",
                        description: "Unique equipment code",
                        example: "WPN-M4A1",
                    },
                    description: {
                        type: "string",
                        description: "Detailed description of the equipment",
                        example: "Standard issue assault rifle",
                    },
                    isActive: {
                        type: "boolean",
                        default: true,
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },

            // Asset schemas
            Asset: {
                type: "object",
                required: ["equipmentType", "currentBase"],
                properties: {
                    _id: {
                        type: "string",
                        format: "objectId",
                        example: "507f1f77bcf86cd799439013",
                    },
                    serialNumber: {
                        type: "string",
                        description:
                            "Unique serial number (auto-generated if not provided)",
                        example: "A001",
                    },
                    equipmentType: {
                        $ref: "#/components/schemas/EquipmentType",
                    },
                    currentBase: {
                        $ref: "#/components/schemas/Base",
                    },
                    status: {
                        type: "string",
                        enum: [
                            "AVAILABLE",
                            "ASSIGNED",
                            "IN_TRANSIT",
                            "MAINTENANCE",
                            "EXPENDED",
                        ],
                        default: "AVAILABLE",
                        description: "Current status of the asset",
                    },
                    condition: {
                        type: "string",
                        enum: ["NEW", "GOOD", "FAIR", "POOR", "UNSERVICEABLE"],
                        default: "NEW",
                        description: "Physical condition of the asset",
                    },
                    quantity: {
                        type: "number",
                        default: 1,
                        minimum: 0,
                        description: "Quantity of this asset",
                    },
                    purchaseId: {
                        type: "string",
                        format: "objectId",
                        description: "Reference to the purchase record",
                        nullable: true,
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },

            // Purchase schemas
            Purchase: {
                type: "object",
                required: ["base", "equipmentType", "quantity", "unitPrice"],
                properties: {
                    _id: {
                        type: "string",
                        format: "objectId",
                    },
                    base: {
                        $ref: "#/components/schemas/Base",
                    },
                    equipmentType: {
                        $ref: "#/components/schemas/EquipmentType",
                    },
                    quantity: {
                        type: "number",
                        minimum: 1,
                        description: "Number of items purchased",
                    },
                    unitPrice: {
                        type: "number",
                        minimum: 0,
                        description: "Price per unit",
                    },
                    totalAmount: {
                        type: "number",
                        description:
                            "Total purchase amount (calculated automatically)",
                    },
                    supplier: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            contact: { type: "string" },
                            address: { type: "string" },
                        },
                    },
                    purchaseDate: {
                        type: "string",
                        format: "date-time",
                        description: "Date of purchase",
                    },
                    deliveryDate: {
                        type: "string",
                        format: "date-time",
                        description: "Expected delivery date",
                        nullable: true,
                    },
                    status: {
                        type: "string",
                        enum: ["ORDERED", "DELIVERED", "CANCELLED"],
                        default: "ORDERED",
                    },
                    createdBy: {
                        $ref: "#/components/schemas/User",
                    },
                    assets: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Asset",
                        },
                    },
                    notes: {
                        type: "string",
                        description: "Additional notes",
                    },
                },
            },

            // Transfer schemas
            Transfer: {
                type: "object",
                required: [
                    "fromBase",
                    "toBase",
                    "equipmentType",
                    "totalQuantity",
                ],
                properties: {
                    _id: {
                        type: "string",
                        format: "objectId",
                    },
                    fromBase: {
                        $ref: "#/components/schemas/Base",
                    },
                    toBase: {
                        $ref: "#/components/schemas/Base",
                    },
                    equipmentType: {
                        $ref: "#/components/schemas/EquipmentType",
                    },
                    assets: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                asset: {
                                    $ref: "#/components/schemas/Asset",
                                },
                                quantity: {
                                    type: "number",
                                    default: 1,
                                },
                            },
                        },
                    },
                    totalQuantity: {
                        type: "number",
                        minimum: 1,
                        description: "Total quantity being transferred",
                    },
                    status: {
                        type: "string",
                        enum: [
                            "INITIATED",
                            "IN_TRANSIT",
                            "COMPLETED",
                            "CANCELLED",
                        ],
                        default: "INITIATED",
                    },
                    initiatedBy: {
                        $ref: "#/components/schemas/User",
                    },
                    approvedBy: {
                        $ref: "#/components/schemas/User",
                    },
                    transferDate: {
                        type: "string",
                        format: "date-time",
                    },
                    completionDate: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    transportDetails: {
                        type: "string",
                        description: "Transportation details and logistics",
                    },
                    notes: {
                        type: "string",
                    },
                },
            },

            // Assignment schemas
            Assignment: {
                type: "object",
                required: ["asset", "assignedTo", "base"],
                properties: {
                    _id: {
                        type: "string",
                        format: "objectId",
                    },
                    asset: {
                        $ref: "#/components/schemas/Asset",
                    },
                    assignedTo: {
                        $ref: "#/components/schemas/User",
                    },
                    base: {
                        $ref: "#/components/schemas/Base",
                    },
                    assignmentDate: {
                        type: "string",
                        format: "date-time",
                    },
                    expectedReturnDate: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    actualReturnDate: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                    },
                    status: {
                        type: "string",
                        enum: [
                            "ACTIVE",
                            "RETURNED",
                            "LOST",
                            "DAMAGED",
                            "EXPENDED",
                        ],
                        default: "ACTIVE",
                    },
                    assignedBy: {
                        $ref: "#/components/schemas/User",
                    },
                    purpose: {
                        type: "string",
                        description: "Purpose of assignment",
                    },
                    notes: {
                        type: "string",
                    },
                },
            },

            // Expenditure schemas
            Expenditure: {
                type: "object",
                required: ["equipmentType", "base", "quantity", "reason"],
                properties: {
                    _id: {
                        type: "string",
                        format: "objectId",
                    },
                    equipmentType: {
                        $ref: "#/components/schemas/EquipmentType",
                    },
                    base: {
                        $ref: "#/components/schemas/Base",
                    },
                    quantity: {
                        type: "number",
                        minimum: 1,
                    },
                    expenditureDate: {
                        type: "string",
                        format: "date-time",
                    },
                    reason: {
                        type: "string",
                        enum: [
                            "TRAINING",
                            "OPERATION",
                            "MAINTENANCE",
                            "DISPOSAL",
                            "OTHER",
                        ],
                        description: "Reason for expenditure",
                    },
                    assets: {
                        type: "array",
                        items: {
                            $ref: "#/components/schemas/Asset",
                        },
                    },
                    status: {
                        type: "string",
                        enum: ["PENDING", "APPROVED", "COMPLETED", "CANCELLED"],
                        default: "PENDING",
                    },
                    authorizedBy: {
                        $ref: "#/components/schemas/User",
                    },
                    approvedBy: {
                        $ref: "#/components/schemas/User",
                    },
                    completedBy: {
                        $ref: "#/components/schemas/User",
                    },
                    operationDetails: {
                        type: "object",
                        properties: {
                            operationName: { type: "string" },
                            operationId: { type: "string" },
                        },
                    },
                    notes: {
                        type: "string",
                    },
                },
            },

            // Dashboard schemas
            DashboardMetrics: {
                type: "object",
                properties: {
                    periodStart: {
                        type: "string",
                        format: "date-time",
                        description: "Start date of the reporting period",
                    },
                    periodEnd: {
                        type: "string",
                        format: "date-time",
                        description: "End date of the reporting period",
                    },
                    metrics: {
                        type: "object",
                        properties: {
                            openingBalance: {
                                type: "number",
                                description: "Total assets at period start",
                            },
                            closingBalance: {
                                type: "number",
                                description: "Total assets at period end",
                            },
                            netMovement: {
                                type: "number",
                                description:
                                    "Net change (Purchases + Transfers In - Transfers Out)",
                            },
                            assignedCount: {
                                type: "number",
                                description: "Currently assigned assets",
                            },
                            expendedCount: {
                                type: "number",
                                description: "Assets expended during period",
                            },
                        },
                    },
                    netMovementBreakdown: {
                        type: "object",
                        properties: {
                            purchases: {
                                type: "number",
                                description: "Assets purchased during period",
                            },
                            transfersIn: {
                                type: "number",
                                description:
                                    "Assets transferred in during period",
                            },
                            transfersOut: {
                                type: "number",
                                description:
                                    "Assets transferred out during period",
                            },
                        },
                    },
                },
            },

            // Pagination schema
            Pagination: {
                type: "object",
                properties: {
                    currentPage: {
                        type: "integer",
                        description: "Current page number",
                    },
                    totalPages: {
                        type: "integer",
                        description: "Total number of pages",
                    },
                    totalRecords: {
                        type: "integer",
                        description: "Total number of records",
                    },
                    hasNext: {
                        type: "boolean",
                        description: "Whether there is a next page",
                    },
                    hasPrev: {
                        type: "boolean",
                        description: "Whether there is a previous page",
                    },
                },
            },

            // Standard API Response
            ApiResponse: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        description: "Response message",
                    },
                    status: {
                        type: "string",
                        enum: ["success", "error"],
                        description: "Response status",
                    },
                    data: {
                        type: "object",
                        description:
                            "Response data (structure varies by endpoint)",
                    },
                },
            },

            // Error Response
            ErrorResponse: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        description: "Error message",
                    },
                    status: {
                        type: "string",
                        enum: ["error"],
                    },
                    error: {
                        type: "object",
                        description: "Detailed error information",
                    },
                },
            },
        },
        responses: {
            UnauthorizedError: {
                description: "Authentication token is missing or invalid",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/ErrorResponse",
                        },
                        example: {
                            message: "Access token is required",
                            status: "error",
                        },
                    },
                },
            },
            ForbiddenError: {
                description:
                    "User does not have permission to access this resource",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/ErrorResponse",
                        },
                        example: {
                            message: "Access denied. Insufficient permissions.",
                            status: "error",
                        },
                    },
                },
            },
            NotFoundError: {
                description: "The requested resource was not found",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/ErrorResponse",
                        },
                        example: {
                            message: "Resource not found",
                            status: "error",
                        },
                    },
                },
            },
            ValidationError: {
                description: "Request validation failed",
                content: {
                    "application/json": {
                        schema: {
                            $ref: "#/components/schemas/ErrorResponse",
                        },
                        example: {
                            message: "Validation failed",
                            status: "error",
                            error: {
                                details: "Required field is missing",
                            },
                        },
                    },
                },
            },
        },
    },
    security: [
        {
            basicAuth: [],
        },
        {
            bearerAuth: [],
        },
    ],
};

// Options for the swagger docs
const options = {
    definition: swaggerDefinition,
    apis: ["./src/routes/*.js", "./src/controllers/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

// Enhanced Swagger UI options with auth
const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
        persistAuthorization: true, // Persist auth across browser sessions
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
    },
    customCss: `
    .swagger-ui .topbar { 
      background-color: #1a365d; 
      border-bottom: 3px solid #2c5282;
    }
    .swagger-ui .topbar .download-url-wrapper .select-label { 
      color: white; 
    }
    .swagger-ui .info .title { 
      color: #1a365d; 
      font-size: 2.5rem;
      font-weight: bold;
    }
    .swagger-ui .info .description p {
      color: #2d3748;
      font-size: 1rem;
      line-height: 1.6;
    }
    .swagger-ui .scheme-container {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .swagger-ui .auth-wrapper {
      border: 2px solid #4299e1;
      border-radius: 8px;
      padding: 10px;
      background: #ebf8ff;
    }
    .swagger-ui .authorization__btn {
      background-color: #4299e1;
      border-color: #3182ce;
    }
    .swagger-ui .authorization__btn:hover {
      background-color: #3182ce;
    }
  `,
    customSiteTitle: "MAMS API Documentation",
    customfavIcon: "/favicon.ico",
};

export { swaggerSpec, swaggerUi, swaggerUiOptions };
