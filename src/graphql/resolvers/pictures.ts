import ModelDataLoader from "../modelDataLoader";
import { Picture } from "../../models/core_picture";
import { Op } from "sequelize";
import { IGraphQl_PictureType } from "../schema/pictures";
import { transformUser, userLoader } from "./users";

// -------------------------------------------------------------
// controller functions


// -------------------------------------------------------------
// exported stuff here
export const pictureLoader = new ModelDataLoader<Picture>(Picture);

export const transformPicture = (pic: Picture):
  IGraphQl_PictureType =>
{
  return {
    id: pic.id,
    owner: async ()=> {
      if (!pic.ownerId) return;
      const u = await userLoader.load(pic.ownerId);
      return transformUser(u);
    },
    blob: pic.blob,
    title: pic.title,
    mime: pic.mime,
    createdAt: pic.createdAt
  };
}

// -------------------------------------------------------------
// private stuff for this module here
