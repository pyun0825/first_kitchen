import express from "express";
import {
  getMenu,
  getStore,
  postMenu,
  postStore,
} from "../controllers/storeController";

const storeRouter = express.Router();

storeRouter.route("/:id").get(getStore).post(postStore);
storeRouter.route("/:id/:menu_id").get(getMenu).post(postMenu);

export default storeRouter;
