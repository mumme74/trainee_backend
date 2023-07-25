import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import type { IFilterOptions } from "./userHelpers";
import { meetRoles } from "./userHelpers";
import { errorResponse } from "./errorHelpers";

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json(errorResponse("Empty request body!"));
    }

    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(400).json(errorResponse(result.error.message));
    }

    // req.value.body instead fo req.body
    const authReq = req as AuthRequest;
    if (!authReq.value) {
      authReq.value = {
        body: result.value,
      };
    } else {
      authReq.value.body = result.value;
    }

    next();
  };
};

const password = Joi.string()
  .pattern(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/)
  .required();
const firstName = Joi.string().min(2).max(30).required();
const lastName = Joi.string().min(2).max(50).required();
const userName = Joi.string()
  .pattern(/^[^@]{3,}$/)
  .max(30)
  .required();
const email = Joi.string().email().required();

export const schemas = {
  loginSchema: Joi.object().keys({
    login: [
      Joi.string().email().required(),
      Joi.string()
        .min(3)
        .max(30)
        .pattern(/^[^@]+$/)
        .required(),
    ],
    password: password,
  }),
  newUserSchema: Joi.object().keys({
    firstName: firstName,
    lastName: lastName,
    userName: userName,
    email: email,
    password: password,
  }),
  saveMyUserInfoSchema: Joi.object().keys({
    firstName: firstName,
    lastName: lastName,
    email: email,
    picture: Joi.string().uri().allow(""),
  }),
  passwordSchema: Joi.object().keys({
    password: password,
  }),
  deleteMySelfSchema: Joi.object().keys({
    userName: userName,
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: [Joi.string().max(0).allow(""), password],
  }),
};

/**
 * @brief middleware to stop request if user does not have every requiredRoles
 * @param filterOpt all these roles must be met to go through, see IFilterOpt
 * @returns the response of next function
 */
export const hasRoles = (filterOpt: IFilterOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const blockedStr = await meetRoles(filterOpt, req as AuthRequest);
    if (blockedStr) {
      return res.status(403).json(errorResponse(blockedStr));
    }
    return next();
  };
};
