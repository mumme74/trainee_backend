import Joi from 'joi';
import {Request, Response, NextFunction, RequestHandler} from "express"
import { AuthRequest, AuthResponse } from '../types';

export const validateBody = (schema: Joi.ObjectSchema) => {
        return (req: Request, res: Response, next: NextFunction) => {
            const result = schema.validate(req.body);
            if (result.error) {
                return res.status(400).json(result.error);
            }

            // req.value.body instead fo req.body
            let authReq = req as AuthRequest;
            if (!authReq.value) {
                authReq.value = {
                    body: result.value
                };
            } else {
                authReq.value.body = result.value;
            }

            next();
        }
    }

const password = Joi.string().pattern(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/).required();
const firstName = Joi.string().min(2).max(30).required();
const lastName = Joi.string().min(2).max(50).required();
const userName = Joi.string().pattern(/[^@]{3,}/).max(30).required();
const email = Joi.string().email().required();

export const schemas = {
        loginSchema: Joi.object().keys({
            login: [
                Joi.string().email().required(),
                Joi.string().min(3).max(30).required(),
            ],
            password: password
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
            picture: Joi.string().uri(),
        }),
        passwordSchema: Joi.object().keys({
            password: password
        }),
    }