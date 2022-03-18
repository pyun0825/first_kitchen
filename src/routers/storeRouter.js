import express from "express";
import { getMenu, getStore, postMenu } from "../controllers/storeController";

const storeRouter = express.Router();

storeRouter.get("/:id", getStore);
storeRouter.route("/:id/:menu_id").get(getMenu).post(postMenu);

export default storeRouter;
