import express from "express";
import {
  deleteCart,
  getCart,
  getCurrentDelivery,
  getLikes,
  getPrevDelivery,
  getProfile,
  postCart,
  postStatus,
} from "../controllers/userController";
import { protectorMiddleware } from "../middlewares";

const userRouter = express.Router();

userRouter.route("/cart").all(protectorMiddleware).get(getCart).post(postCart);
userRouter.get("/cart/delete", protectorMiddleware, deleteCart);
userRouter.get("/likes", protectorMiddleware, getLikes);
userRouter.post("/status", postStatus);
userRouter.get("/currentdelivery", protectorMiddleware, getCurrentDelivery);
userRouter.get("/prevDelivery", protectorMiddleware, getPrevDelivery);
// uri를 id를 query로 하여 설정했는데 handler에서는 session id를 쓰기 때문에 쓸모 없음.. query로 id 찾아서 하면 다른 유저 profile들어갈 수도 있음
userRouter.get("/:id", protectorMiddleware, getProfile);

export default userRouter;
