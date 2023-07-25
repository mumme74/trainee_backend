import DataLoader from "dataloader";
import { Picture } from "../../models/picture";
import { Op } from "sequelize";
import { IGraphQl_PictureType } from "../schema/pictures";
import { transformUser, userLoader } from "./users";

export const pictureLoader = new DataLoader(
  async (ids: readonly number[]):
    Promise<Picture[]> =>
  {
    const result = await Picture.findAll({
      where: { id:{ [Op.in]:[...ids] } },
    });
    return result;
  },
);

export const transformPicture = (pic: Picture):
  IGraphQl_PictureType =>
{
  return {
    id: pic.id,
    owner: async ()=> {
      const u = await userLoader.load(pic.ownerId);
      return transformUser(u);
    },
    blob: pic.blob,
    title: pic.title,
    mime: pic.mime,
    createdAt: pic.createdAt
  };
}