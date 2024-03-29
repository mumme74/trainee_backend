import PromiseRouter from "express-promise-router";
import { Express } from "express";
import userRoutes from "./user.routes";

export default function initApi(app: Express) {
  const router = PromiseRouter();

  app.use("/api/v1", router);

  userRoutes(router);
}
