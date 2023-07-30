import ModelDataLoader from "../modelDataLoader";
import { GroupStudent } from "../../models/core_group_student";


export const groupStudentLoader =
  new ModelDataLoader<GroupStudent>(GroupStudent);

export const groupStudentByGroupLoader =
  new ModelDataLoader<GroupStudent>(GroupStudent, 'groupId');