import { Router } from "express";
import {
    getAllUsers,
    getUserById,
    loginUser,
    logoutUser,
    registerCommander,
    registerUser,
} from "../controllers/user.controller.js";
import { adminOnly, verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", verifyJWT, logoutUser);

userRouter.post("/register-commander", verifyJWT, adminOnly, registerCommander);
userRouter.get("/", verifyJWT, adminOnly, getAllUsers);
userRouter.get("/:id", verifyJWT, adminOnly, getUserById);

export default userRouter;
