import DataLoader from "dataloader";

import { Op, Sequelize} from "sequelize";
import { GroupTeacher } from "../../models/groupTeacher";


export const groupTeacherLoader = new DataLoader(
  async (ids: readonly number[]): Promise<GroupTeacher[]> => {
    const res = await GroupTeacher.findAll({
      where: {id: {[Op.in]: ids}}
    });
    return res;
  }
);