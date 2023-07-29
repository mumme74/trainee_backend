import ModelDataLoader from "../modelDataLoader";
import { GroupTeacher } from "../../models/core_group_teacher";

export const groupTeacherLoader =
  new ModelDataLoader<GroupTeacher>(GroupTeacher);