import { QueryTypes } from "sequelize";
import { fromUtcDate, toUtcDate, withForeignKeysOff } from "../helpers/dbHelpers";
import { getSequelize } from "../models";
import { InvalidateToken } from "../models/core_invalidate_token";
import { User } from "../models/core_user";
import JWT from "jsonwebtoken";

/**
 * This module contains logic to invalidate a users token by issuing
 * by storing a dateTime where all tokens issued before this dateTime
 * Stored at user level.
 *
 * The very first entry in the database is used as a global reject
 * all token before this dateTime.
 * This is possible as when we set a global reject all before, we clear
 * the table and stores this global reject datTime as the first entry
 * in the table
 *
 * Inspired by: https://webjose.hashnode.dev/invalidating-json-web-tokens-jwt-the-right-way
 *
 * usage:
 *   import * as tokenService from './services/token.service.ts'
 */


/**
 * The method used to authenticate
 */
export enum eAuthenticationMethod {
  Password    = 'password',
  GoogleOAuth = 'googleOauth',
}

/* definition of JWT.Payload
type JwtPayload = {
  iss: string; // who issued it
  sub: number; // userId
  iat: number; // seconds since epoch
  exp: number; // expires seconds from iat
}*/

/**
 * The base interface
 * @interface {Object} SignBaseParams
 * @param {number} userId The user.id that is authenticated.
 * @param {eAuthenticationMethod} method The method used to authenticate
 * @param {number} [expiresInMinutes = 5] How long this token is valid
 */
interface SignBaseParams {
  userId: number,
  method: eAuthenticationMethod,
  expiresInMinutes?: number,
}

/**
 * Signs an authenticate Token to this user
 * @param {SignAuthOptions} params Options
 * @param {string[]} [params.roles]
 *   The roles for this user, if supplied saves a database fetch
 * @returns {string} The authentication token
 */
export async function signAuth({
  userId, method, expiresInMinutes = 5, roles
}:
  SignBaseParams & { roles?:string[]}
): Promise<string> {
  if (!roles)
    roles = await (await User.findByPk(userId))?.roles()
  return sign({
    userId, method, expiresInMinutes, payload: {roles},
    secret: process.env.JWT_AUTH_SECRET + "",
  });
};

/**
 * Signs a reset token to user
 * @param {SignBaseParams} params The parameters for function
 * @param {string} params.originalIss The original issuer, such as Google or other OAuth
 *
 */
export function signReset({
  userId, method, originalIss,
  expiresInMinutes = +(""+process.env.AUTO_LOGOUT_MINUTES) || 6
}: SignBaseParams & {
  originalIss: string,
}) {
  return sign({
    userId, method, expiresInMinutes,
    payload: {
      originalIss
    },
    secret: ""+process.env.JWT_RESET_SECRET
  });
}

/**
 * Signs a Token to this user
 * @param {SignOptions} params
 * @param {object<string, any>} [params.payload] A object to pad JWT with
 * @param {string} params.secret The secret to hash with when signing token
 * @returns {Promise<string>} The authentication token
 */
export async function sign({
  userId, method, expiresInMinutes = 5,
  payload = {}, secret
}:
  SignBaseParams & {
    payload:{[key:string]:any}
    secret: string
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    JWT.sign({
        iss: process.env.APP_NAME,
        sub: userId,
        iat: Math.floor(new Date().getTime() / 1000), // need to be seconds not milliseconds
        exp: Math.floor(
          new Date(new Date().getTime() + expiresInMinutes * 60000).getTime() /
            1000,
        ),
        method: ""+method,
        ...payload
      },
      secret,
      (err: Error | null, token: string | undefined) => {
        if (err || !token)reject(err);
        else resolve(token);
      }
    );
  });
}

/**
 * Validates AuthToken, such that is has'nt expired or been withdrawn
 * @param {string} token The token to validate
 * @returns {Promise<boolean>} True if it checks out
 */
export const validateAuth = (token: string) => {
  return validate(token, ""+process.env.JWT_AUTH_TOKEN);
}

/**
 * Validates AuthToken, such that is has'nt expired or been withdrawn
 * @param {string} token The token to validate
 * @returns {Promise<boolean>} True if it checks out
 */
export const validateReset = (token: string) => {
  return validate(token, ""+process.env.JWT_REFRESH_SECRET)
}

/**
 * Validates a Token, such that is has'nt expired or been withdrawn
 * @param {string} token The token to validate
 * @param {string} secret Use this secret to validate against
 * @returns {Promise<boolean>} True if it checks out
 */
export const validate = (token: string, secret: string) => {
  return new Promise((resolve)=>{
    JWT.verify(token, secret, async (err, decoded)=>{
      if (err || typeof decoded !== 'object')
        return resolve(false);

      decoded = decoded as JWT.JwtPayload;
      const userId = decoded.sub || 0,
            iat = decoded.iat || 0,
            exp = decoded.exp || 0;

      const result = await getSequelize().query(
        'SELECT minimumIat FROM core_InvalidateTokens WHERE userId=?;', {
          replacements:[decoded.sub],
          type: QueryTypes.SELECT
      });
      const minIat = new Date((result[0] as InvalidateToken)?.minimumIat);
      const userMinIat = +fromUtcDate(+minIat || 0);

      const expired = exp + iat < +new Date() / 1000,
            withdrawn = iat < Math.max(
              userMinIat, globalMinimumIat);

      const invalid = iat > ((+new Date()) / 1000);

      resolve(!expired && !withdrawn && !invalid);
    });
  });
}

/**
 * Caches the global minimumIat
 * Should be called during system startup
 */
export const initService = async () => {
  const result = await InvalidateToken.findOne();
  globalMinimumIat = (result
    ? fromUtcDate(result.minimumIat)
    : new Date(new Date().getTime() - 1000 * 60 *
      +(process.env.AUTO_LOGOUT_MINUTES || 60))
  ).getTime() / 1000;
}

/**
 * Reject all currently issued tokens,
 * ie force everybody to re-authenticate
 * @param {Date} [date = now] From this dateTime
 */
export const rejectGloballyBeforeIat = async (
  minimumIatDate: Date = new Date()
) => {
  validateDate(minimumIatDate);

  try {
    await withForeignKeysOff(async ()=>{
      // clear all and insert a new record as the very first
      await InvalidateToken.truncate({force:true});

      const res = await InvalidateToken.create({
        userId: 0, minimumIat: minimumIatDate
      });

      // update cache ms->s
      globalMinimumIat = fromUtcDate(minimumIatDate).getTime() / 1000;
    });
  } catch (err) {
    throw new Error(
      `Database error ${err}, failed to set global minimumIat to invalidate tokens.`)
  }
}

/**
 * Invalidates all tokens issued to user before minimumIat
 * @param {number} userId The user id that was compromized
 * @param {Date} [minimumIat = now] Reject all tokens to userId before
 *   this dateTime. Default to now
 * @throws {Error} To take down server rather tha leave at invalid state
 *   if a database error occurs
 */
export const rejectUserBeforeIat = async (
  userId: number, minimumIat: Date = new Date()
) => {
  validateDate(minimumIat);

  const [reject, res] = await InvalidateToken.upsert({userId, minimumIat});
  if (!reject)
    throw new Error(`Database error, failed to set minimumIat for user: ${userId}`)
}


/**
 * The return type for function rotateResetToken
 * @type RotateResetTokenReturn
 * @prop {User} user The user object for this grant
 * @prop {string} authToken The new auth token
 * @prop {string} refreshToken The new Reset token
 */
type RotateResetTokenReturn = {
  user: User,
  authToken: string;
  refreshToken: string;
}

/**
 * Rotate the tokens.
 *  ie: Issue new tokens and invalidate the old ones for this user
 * @param  {string} refreshToken The reset token for this user
 * @returns {Promise<RotateResetTokenReturn>}
 */
export async function rotateResetToken(
  refreshToken: string
): Promise<RotateResetTokenReturn> {
  if (!validate(refreshToken, ""+process.env.JWT_RESET_SECRET))
    throw new Error(`Invalid reset token`);

  const decoded = JWT.decode(refreshToken, {json:true});
  if (!decoded?.sub)
    throw new Error(`Invalid refreshToken, has no sub field`);

  const user = await User.findByPk(+(decoded?.sub) || 0);
  if (!user)
    throw new Error(`User not found, can't rotate refreshToken`);

  const minimumIat = +toUtcDate(new Date()) / 1000;
  const [invToken] = await InvalidateToken.upsert({
    userId:user.id, minimumIat});
  if (!invToken)
    throw new Error(`Database error, failed to rotate refreshToken`);

  return {
    user,
    authToken: await signAuth({
      userId:user.id, method: decoded.method, roles: await user.roles()
    }),
    refreshToken: await signReset({
      userId:user.id, method: decoded.method,
      originalIss: decoded.originalIss
    })
  }
}

// ---------------------------------------------------------------------
// private to this module down here

// cache the global reject date
let globalMinimumIat: number;

const validateDate = (minimumIatDate: Date) => {
  if (+minimumIatDate > +(new Date()))
    throw new Error(`Invalid minimumIat, it's set in the future: ${
      minimumIatDate.toISOString()
    }`);
  else if (+minimumIatDate < +new Date(new Date(
              1000 * 60 * +(process.env.AUTO_LOGOUT_MINUTES || 60))))
  {
    throw new Error(
      `Invalid minimumIat, it's set before now - AUTO_LOGOUT_MINUTES: ${
        minimumIatDate.toISOString()
      }`);
  }
}
