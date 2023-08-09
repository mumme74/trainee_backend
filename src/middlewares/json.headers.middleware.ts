import { Request, Response, NextFunction } from "express";


export const jsonHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
};