import express from "express";
import {
  deleteCart,
  getCart,
  getLikes,
  getProfile,
} from "../controllers/userController";
import { protectorMiddleware } from "../middlewares";

const userRouter = express.Router();

userRouter.get("/cart", protectorMiddleware, getCart);
userRouter.get("/cart/delete", protectorMiddleware, deleteCart);
userRouter.get("/:id", protectorMiddleware, getProfile);
userRouter.get("/likes", protectorMiddleware, getLikes);

export default userRouter;
