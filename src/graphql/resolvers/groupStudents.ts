import DataLoader from "dataloader";

import { Op, Sequelize} from "sequelize";
import { GroupStudent } from "../../models/groupStudent";


export const groupStudentLoader = new DataLoader(
  async (ids: readonly number[]): Promise<GroupStudent[]> => {
    const res = await GroupStudent.findAll({
      where: {id: {[Op.in]: ids}}
    });
    return res;
  }
);