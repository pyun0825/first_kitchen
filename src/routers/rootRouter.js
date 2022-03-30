import express from "express";
import {
  home,
  getLogin,
  getJoin,
  postJoin,
  postLogin,
  logout,
  postDummy,
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
rootRouter.post("/dummy", postDummy);

export default rootRouter;
