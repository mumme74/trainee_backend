import Router from "express-promise-router";
import type {
  Express,
  Request,
  Response,
  NextFunction
} from "express";
import { passportJWT } from "../passport";

import {
  IPicturesController,
  PicturesController
} from "../controllers/picture.controller";

export default function pictureRoutes(
  app: Express,
  // pass in controller to ba able to mock when testing
  controller: IPicturesController = PicturesController,
) {
  const router = Router();
  app.use("/pictures/", router);

  router.route('/:path:').get(
    passportJWT,
    controller.getPicture);
}