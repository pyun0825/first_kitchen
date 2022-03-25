import express from "express";
import {
  deleteCart,
  getCart,
  getLikes,
  getProfile,
  postCart,
} from "../controllers/userController";
import { protectorMiddleware } from "../middlewares";

const userRouter = express.Router();

userRouter.route("/cart").all(protectorMiddleware).get(getCart).post(postCart);
userRouter.get("/cart/delete", protectorMiddleware, deleteCart);
userRouter.get("/likes", protectorMiddleware, getLikes);
userRouter.get("/:id", protectorMiddleware, getProfile);

export default userRouter;
