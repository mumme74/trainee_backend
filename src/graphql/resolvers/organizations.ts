import DataLoader from "dataloader";
import { Organization } from "../../models/organization";
import { Op } from "sequelize";
import { IGraphQL_OrganizationType } from "../schema/organizations";
import { pictureLoader, transformPicture } from "./pictures";
import { transformUser, userLoader } from "./users";

export const organizationLoader = new DataLoader(
  async (ids: readonly number[]):
    Promise<Organization[]> =>
  {
    const result = await Organization.findAll({
      where: { id: { [Op.in]:[...ids] } },
    });
    return result;
  }
);

export const transformOrganization = (org: Organization):
  IGraphQL_OrganizationType =>
{
  return {
    id: org.id,
    name: org.name,
    domain: org.name,
    picture: async () => {
      const pic = await pictureLoader.load(org.pictureId);
      return transformPicture(pic);
    },
    description: org.description,
    updatedBy: async ()=> {
      const u = await userLoader.load(org.updatedBy);
      return transformUser(u);
    },
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  }
}