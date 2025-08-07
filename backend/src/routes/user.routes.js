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

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", verifyJWT, logoutUser);

userRouter.post("/register-commander", verifyJWT, adminOnly, registerCommander);
userRouter.get("/", verifyJWT, adminOnly, getAllUsers);
userRouter.get("/:id", verifyJWT, adminOnly, getUserById);
userRouter.get("/make-commander/:userId", verifyJWT, adminOnly, makeCommander);
userRouter.get(
    "/remove-commander/:userId",
    verifyJWT,
    adminOnly,
    removeCommander
);

userRouter.patch("/change-role/:userId", verifyJWT, adminOnly, changeRole);

export default userRouter;
