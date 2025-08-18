# **Military Asset Management System (MAMS)**

## **Overview**

The Military Asset Management System (MAMS) is a full-stack web application designed to provide a robust framework for managing the movement, assignment, and expenditure of critical military assets across multiple bases. It offers a secure, role-based solution to streamline logistics, ensure accountability, and provide commanders with transparent, real-time data.

## **Live Demo**

* **Frontend**: https://mams.beyondlocalhost.space/  
* **Backend**: https://mams-oekz.onrender.com/

### **Demo Credentials**

To access the deployed application, please use the following administrator credentials:

* **Username**: admin  
* **Password**: admin

## **Features**

* **📊 Interactive Dashboard**: Displays key metrics like Opening/Closing Balances, Net Movement, Assigned, and Expended assets with filters for Date, Base, and Equipment Type.  
* **🛒 Purchases Management**: Record and view historical purchases for assets, with filtering capabilities.  
* **🚚 Asset Transfers**: Facilitates the transfer of assets between bases with a clear, timestamped history of all movements.  
* **📋 Assignments & Expenditures**: Assign assets to personnel and track when assets are expended.  
* **🔐 Role-Based Access Control (RBAC)**:  
  * **Admin**: Full access to all data and operations.  
  * **Base Commander**: Full access to data and operations for their assigned base.  
  * **Logistics Officer**: Limited access focused on purchases and transfers.  
* **📝 API Transaction Logging**: All critical operations (purchases, transfers, etc.) are logged for auditing purposes.

## **Tech Stack**

| Category | Technology |
| :---- | :---- |
| **Frontend** | React, Vite, Ant Design (AntD), React Router |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose |
| **Auth** | JSON Web Tokens (JWT) |

## **Architecture**

MAMS is built on a modern, decoupled full-stack architecture. The **React frontend** acts as a standalone Single-Page Application (SPA), providing a dynamic and responsive user experience. It communicates with a **Node.js/Express.js backend** via a RESTful API. This separation of concerns allows for independent development, scaling, and maintenance of the client and server.

## **Getting Started**

Follow these instructions to set up and run the project locally.

### **Prerequisites**

* Node.js (v18.x or higher)  
* npm (or yarn)  
* MongoDB (local instance or a cloud service like MongoDB Atlas)

### **Backend Setup**

1. **Navigate to the backend directory**:  
   cd backend

2. **Install dependencies**:  
   npm install

3. **Create an environment file**:  
   * Rename .env.sample to .env.  
   * Fill in the required environment variables, especially your MONGODB\_URI and JWT secrets.  
4. **Run the development server**:  
   npm run dev

   The backend server will start, typically on http://localhost:3000.

### **Frontend Setup**

1. **Navigate to the frontend directory**:  
   cd frontend

2. **Install dependencies**:  
   npm install

3. **Create an environment file**:  
   * Rename .env.sample to .env.local.  
   * Set VITE\_API\_BASE\_URL to your backend's address (e.g., http://localhost:3000/api/v1).  
4. **Run the development server**:  
   npm run dev

   The frontend application will be available in your browser, typically at http://localhost:5173.

## **Documentation**

### **API Documentation**

The REST API is self-documented using **Swagger/OpenAPI**. Once the backend server is running, you can access the interactive API documentation at:

* [**api-docs**](https://mams-oekz.onrender.com/api-docs/)

### **Full Project Documentation**

For a more in-depth understanding of the project's architecture, data models, RBAC implementation, and known limitations, please refer to the full project documentation.

* [**document**](https://docs.google.com/document/d/1wiLwDgHJyngZR-OPIboPvIhZbhBbX2P5/edit?usp=sharing&ouid=104777554106003459655&rtpof=true&sd=true)