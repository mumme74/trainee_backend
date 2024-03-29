import ModelDataLoader from "../modelDataLoader";
import {
  IGraphQl_UserCreateUsersInput,
  IGraphQl_UserCreateType,
  IGraphQl_UserType,
} from "../schema/users";
import { pictureLoader, transformPicture } from "./pictures";
import { IGraphQl_MutationResponse } from "../schema/index";
import { AuthRequest } from "../../types";
import { composeErrorResponse, rolesFilter } from "../helpers";
import { UserError } from "../../helpers/errorHelpers";
import { User } from "../../models/core_user";
import { Op, Transaction } from "sequelize";
import { Role, eRolesAvailable, rolesAvailableKeys, rolesAvailableNrs } from "../../models/core_role";
import { organizationLoader, transformOrganization } from "./organizations";
import { Organization, fetchOrganizationNr } from "../../models/core_organization";
import { Picture } from "../../models/core_picture";
import { OAuth } from "../../models/core_oauth";
import { getSequelize } from "../../models";


// -------------------------------------------------------------------------
// controllers
export default {
  // queries
  core_user_Users: rolesFilter(
    {
      anyOf: [
        eRolesAvailable.admin,
        eRolesAvailable.super,
        eRolesAvailable.teacher,
      ],
    },
    async (
      { ids }: { ids: number[] },
      req: AuthRequest,
    ): Promise<IGraphQl_UserType[]> => {
      try {
        // load all or fail
        let users = await userLoader.loadAll(ids);

        // if we are super user return unfiltered
        // else return only those belonging to my domain
        const reqUser = req.user.user;
        if (req.user.roles.indexOf(eRolesAvailable.super) === -1)
          users = users.filter(u=>u.organizationId===reqUser.organizationId);

        // transform to graphQl type
        return users.map((vlu: User) => {
          return transformUser(vlu);
        });

      } catch (err) {
        throw err;
      }
    },
  ),

  core_user_AvailableRoles: (): string[] => {
    return rolesAvailableKeys;
  },

  // mutations
  core_user_CreateStudents: rolesFilter({
    anyOf: [
      eRolesAvailable.teacher,
      eRolesAvailable.admin,
      eRolesAvailable.super
    ]},
    async (
      { bulkUsers }: { bulkUsers: IGraphQl_UserCreateUsersInput },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      try {
        return await getSequelize().transaction(
          async (transaction: Transaction)=>{
            // find optional organization from input.domain
            const orgId = bulkUsers.domain ?
              fetchOrganizationNr(bulkUsers.domain) : undefined;

            const ids = [];
            for (const newUser of bulkUsers.users) {
              const user = await createUserAndRoles(
                newUser, req, transaction);
              createUserAvatar(user, newUser, transaction);
              createOAuthEntry(user, newUser, transaction);
              ids.push(user.id);
            }

            return {
              success: true,
              nrAffected: ids.length,
              ids,
              __typename: "OkResponse",
            };
          }
        );
      } catch (err: any) {
        return composeErrorResponse(err);
      }
    },
  ),

  core_user_ChangeRoles: rolesFilter(
    { anyOf: [eRolesAvailable.admin, eRolesAvailable.super] },
    async (
      { id, roles }: { id: number; roles: string[] },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      try {
        // string role names to available Roles
        // using set here to ensure we only have one of each type
        const newRoles = [
          ...roles.map((role: string) => {
            const idx = rolesAvailableKeys.indexOf(role);
            if (idx < 0) throw new UserError("Role not valid");
            return idx;
          }),
        ];

        if (newRoles.indexOf(eRolesAvailable.super) > -1 &&
            req.user.roles.indexOf(eRolesAvailable.super) < 0)
        {
          throw new UserError(
            "Can't set super admin role when you are not super admin.\n"+
            "Insufficient credentials.");
        }

        if (!(await User.findByPk(id)))
          throw new UserError("Failed to match user");

        const myRoles = await Role.findAll({where:{userId:id}});

        // delete unwanted roles
        let cnt = myRoles.filter(r=>newRoles.indexOf(r.role)<0)
                              .map(r=>r.destroy()).length;
        // inserts new roles
        cnt += newRoles.filter(r=>!myRoles.find(o=>o.role===r))
                       .map(r=>Role.create({userId:id,role:r})).length;

        return {
          success: true,
          nrAffected: cnt,
          __typename: "OkResponse",
        };
      } catch (err: any) {
        return composeErrorResponse(err);
      }
    },
  ),

  core_user_MoveToDomain: rolesFilter(
    { anyOf: [eRolesAvailable.admin, eRolesAvailable.super] },
    async (
      { id, domain }: { id: number; domain?: string },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      try {
        let orgId;
        if (!domain) orgId = req.user.user.organizationId;
        else {
          // lookup organization, special case moving out to no domain
          const org = await Organization.findOne({where:{domain}});
          if (!org && domain)
            throw new UserError("Domain not found in any organization");
          orgId = org?.id || 0;
        }

        if (req.user.roles.indexOf(eRolesAvailable.super) < 0) {
          // not super admin
          if (orgId !== req.user.user.organizationId && domain !== "")
            throw new UserError(
              "You don't have privileges to move user to another domain than your own",
            );
        }

        const [res] = await User.update({
          organizationId:orgId
        }, {
          where:{id}
        });

        if (res < 1)
          throw new UserError("User not found!");

        return {
          success: true,
          nrAffected: res,
          ids: [id],
          __typename: "OkResponse",
        };
      } catch (err: any) {
        return composeErrorResponse(err);
      }
    },
  ),

  core_user_SetSuperUser: rolesFilter(
    { anyOf: eRolesAvailable.super },
    async ({ id }: { id: number }):
      Promise<IGraphQl_MutationResponse> =>
    {
      try {
        const user = await User.findByPk(id);
        if (!user) throw new UserError("User not found!");

        const [role, created] = await Role.findOrCreate({
          where:{[Op.and]:[{userId:id},{role:eRolesAvailable.super}]},
          defaults:{userId:user.id, role:eRolesAvailable.super}
        });

        return {
          success: true,
          nrAffected: +created,
          ids: [id],
          __typename: "OkResponse",
        };
      } catch (err: any) {
        return composeErrorResponse(err);
      }
    },
  ),

  core_user_DeleteUser: rolesFilter(
    { anyOf: [eRolesAvailable.admin, eRolesAvailable.super] },
    async (
      { id }: { id: number },
      req: AuthRequest,
    ): Promise<IGraphQl_MutationResponse> => {
      try {
        // filter out so we can't delete a user outside of our domain
        const organizationId = req.user.user.organizationId;
        const where = req.user.roles.indexOf(eRolesAvailable.super)<0 ?
            { where: {[Op.and]:[{id},{organizationId}]}} :
              { where: {id} };
        const res = await User.destroy(where);

        if (!res)
          throw new UserError("User not found, could not delete.");

        return {
          success: true,
          nrAffected: res,
          ids: [id],
          __typename: "OkResponse",
        };
      } catch (err: any) {
        return composeErrorResponse(err);
      }
    },
  ),
};

// --------------------------------------------------------------------
// exported stuff here
export const userLoader = new ModelDataLoader<User>(User);

export const transformUser = (user: User):
  IGraphQl_UserType =>
{
  return {
    id: user.id,
    fullName: user.fullName(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    picture: async () => {
      if (!user.pictureId) return;
      const pic = await pictureLoader.load(user.pictureId);
      return transformPicture(pic);
    },
    organization: async ()=>{
      if (!user.organizationId) return;
      const org = await organizationLoader.load(user.organizationId);
      return transformOrganization(org);
    },
    roles: async ()=> {
      return await user.roles();
    },
    updatedAt: user.updatedAt,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    updater: async () => {
      if (!user.updatedBy) return;
      const u = await userLoader.load(user.updatedBy);
      return transformUser(u);
    },
  };
};

// -------------------------------------------------------------
// private stuff for this module here


const createUserAndRoles = async (
  newUser: IGraphQl_UserCreateType,
  req: AuthRequest,
  transaction: Transaction
): Promise<User> => {
  console.log('createUserAndRoles', 'before User.create')
  const user = await User.create({
    userName: newUser.userName,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    phone: newUser.phone,
    email: newUser.email,
    updatedBy: req.user.user.id,
  },{transaction});

  console.log('createUserAndRoles', 'after User.create')

  if (!user)
    throw new UserError(`Failed to create ${newUser.userName}`);

  // create roles
  const highestRole = (await req.user.user.getRoles())
                        .map(r=>r.role)
                        .reduce((p, v)=>(p<v?v:p))
  for (const roleStr of (newUser?.roles || [])) {
    const roleNr = +eRolesAvailable[roleStr as any];

    // make sure we only add with lower privileges than our selfs
    if (roleNr >= highestRole) continue;

    const r = await Role.create({
      userId: user.id, role:roleNr
    },{transaction});
    if (!r) throw new UserError(
              `Failed to create roles for ${newUser.userName}`);
  }

  return user;
}

/**
 * Create a avatar picture for user
 */
const createUserAvatar = async (
  user: User,
  newUser: IGraphQl_UserCreateType,
  transaction: Transaction
) => {
  if (newUser.picture) {
    let pic = await Picture.create({
      userId: user.id,
      blob: Buffer.from(newUser.picture),
      mime: "remote"
    },{transaction});

    const err = new UserError(
      `Failed to create user avatar picture for ${newUser.userName}`);
    if (!pic) throw err;

    user.pictureId = pic.id;
    if (!user.save()) throw err;
  }
}


/**
 * Create a oauth entry for user
 */
const createOAuthEntry = async (
  user: User,
  newUser: IGraphQl_UserCreateType,
  transaction: Transaction
) => {
  if (newUser.oauthId && newUser.oauthProvider) {
    const oauth = await OAuth.create({
      userId: user.id,
      provider: newUser.oauthProvider,
      idString: newUser.oauthId
    },{transaction});
    if (!oauth)
      throw new UserError(
        `Failed to create OAuth entry for ${newUser.userName}`);
  }
}
