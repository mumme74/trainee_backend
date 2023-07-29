import ModelDataLoader from "../modelDataLoader";
import { Picture } from "../../models/core_picture";
import { Op } from "sequelize";
import { IGraphQl_PictureType } from "../schema/pictures";
import { transformUser, userLoader } from "./users";

export const pictureLoader = new ModelDataLoader<Picture>(Picture);

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