import {
  Request,
  Response,
  NextFunction,
  RequestHandler
} from "express";


import { comparePasswordHash } from "../helpers/password";
import { rolesAvailableKeys } from "../models/core_role";
import { User } from "../models/core_user";
import { Op } from "sequelize";

import type { IUserInfoResponse, AuthRequest } from "../types";
import { errorResponse } from "../helpers/errorHelpers";

interface IUsersController {
  myInfo: RequestHandler;
  saveMyUserInfo: RequestHandler;
  changeMyPassword: RequestHandler;
  deleteMyself: RequestHandler;
  rolesAvailable: RequestHandler;
  secret: RequestHandler;
}
export type { IUsersController };

const USER_NOT_FOUND = "User not found!";

export const userInfoResponse = async (user: User): Promise<IUserInfoResponse> => {
  return {
    id:        user.id,
    userName:  user.userName,
    email:     user.email,
    firstName: user.firstName,
    lastName:  user.lastName,
    phone:     user.phone,
    pictureId: user.pictureId,
    domain: await user.domain(),
    updatedBy: user.updatedBy,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// exports down here
const UsersController: IUsersController = {

  myInfo: async (req: Request, res: Response, next: NextFunction) => {
    const authObj = (req as AuthRequest).user;
    return res.status(200).json(await userInfoResponse(authObj.user));
  },

  saveMyUserInfo: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest,
          authObj = authReq.user;
    let user = await User.findByPk(authObj.user.id);
    if (!user)
      return res.status(404).json(errorResponse(USER_NOT_FOUND));

    if (authReq.body.firstName)
      user.firstName = authReq.body.firstName;
    if (authReq.body.lastName)
      user.lastName = authReq.body.lastName;
    if (authReq.body.email)
      user.email = authReq.body.email;
    if (authReq.body.phone)
      user.phone = authReq.body.phone;
    user.updatedBy = authReq.body.id;
    user = await user.save();

    if (user)
      return res.status(500).json(errorResponse('Error saving user to database'));

    return res.status(200).json(await userInfoResponse(user));
  },

  changeMyPassword: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest,
          authObj = authReq.user
    // we can't use findAndUpdate here as that doesn't hash the password
    let user = await User.findByPk(authObj.user.id);
    if (!user)
      return res.status(404).json(errorResponse(USER_NOT_FOUND));

    user.password = authReq.body.password;
    user.updatedBy = authObj.user.id;
    user = await user.save();
    if (!user)
      return res.status(500).json(errorResponse('Error saving password to database'))
    return res.status(200).json({ success: true });
  },

  secret: async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    //console.log("Accessing secret resource");
    return res.json({ secret: "Access granted to secret resource!" });
  },

  // we must send our firstName, lastName and email and password just as it is stored in the database
  deleteMyself: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest,
            authObj = authReq.user,
            user = authObj.user;
      console.log("Trying to delete user " + user.email);

      const passWdMatch = await comparePasswordHash(
        authReq.body.password + "",
        user.password + "",
      );

      if (passWdMatch) {
        const result = await User.destroy({
          where: {
            [Op.and]: [
              {id: user.id},
              {email: user.email},
              {userName: user.userName},
              {firstName: user.firstName},
              {lastName: user.lastName}
            ]
          }
        });
        if (result === 1) {
          console.log("Deleting user " + user.email);
          return res.status(200).json({ success: true });
        }
      }
      console.log("Failed to delete");
      return res.status(400).json(errorResponse("Mismatched info!"));
    } catch (err: any) {
      console.log("Failed to delete, error occurred");
      return res.status(500).json(errorResponse(err));
    }
  },

  rolesAvailable: (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ roles: rolesAvailableKeys });
  },
};

export default UsersController;
