import express from "express";
import {
  getMenu,
  getStore,
  getStoreReviews,
  postMenu,
  postStore,
} from "../controllers/storeController";
import { protectorMiddleware } from "../middlewares";

const storeRouter = express.Router();

storeRouter.get("/:id/:storeName/reviews", getStoreReviews);
storeRouter.route("/:id").get(getStore).post(protectorMiddleware, postStore);
storeRouter
  .route("/:id/:menu_id")
  .get(getMenu)
  .post(protectorMiddleware, postMenu);

export default storeRouter;
