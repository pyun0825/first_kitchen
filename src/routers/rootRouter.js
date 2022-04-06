import express from "express";
import {
  home,
  getLogin,
  getJoin,
  postJoin,
  postLogin,
  logout,
  postSubscribe,
} from "../controllers/userController";
import { protectorMiddleware, publicOnlyMiddleware } from "../middlewares";

const rootRouter = express.Router();

rootRouter.get("/", home);
rootRouter
  .route("/login")
  .all(publicOnlyMiddleware)
  .get(getLogin)
  .post(postLogin);
rootRouter.route("/join").all(publicOnlyMiddleware).get(getJoin).post(postJoin);
rootRouter.get("/logout", protectorMiddleware, logout);
rootRouter.post("/subscribe", protectorMiddleware, postSubscribe);

export default rootRouter;
