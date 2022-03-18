import express from "express";
import {
  getMenu,
  getStore,
  postMenu,
  postStore,
} from "../controllers/storeController";
import { protectorMiddleware } from "../middlewares";

const storeRouter = express.Router();

storeRouter.route("/:id").get(getStore).post(protectorMiddleware, postStore);
storeRouter
  .route("/:id/:menu_id")
  .get(getMenu)
  .post(protectorMiddleware, postMenu);

export default storeRouter;
