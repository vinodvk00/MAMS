import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", verifyJWT, logoutUser);

export default userRouter;
