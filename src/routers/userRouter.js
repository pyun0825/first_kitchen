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
userRouter.get("/likes", protectorMiddleware, getLikes);
userRouter.get("/:id", protectorMiddleware, getProfile);

export default userRouter;
