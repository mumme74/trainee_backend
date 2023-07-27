import ModelDataLoader from "../modelDataLoader";
import { GroupTeacher } from "../../models/groupTeacher";

export const groupTeacherLoader =
  new ModelDataLoader<GroupTeacher>(GroupTeacher);