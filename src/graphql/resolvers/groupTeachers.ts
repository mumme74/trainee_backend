import ModelDataLoader from "../modelDataLoader";
import { GroupTeacher } from "../../models/core_group_teacher";

// -------------------------------------------------------------
// controller functions


// -------------------------------------------------------------
// exported stuff here

export const groupTeacherLoader =
  new ModelDataLoader<GroupTeacher>(GroupTeacher);

export const groupTeacherByGroupLoader =
  new ModelDataLoader<GroupTeacher>(GroupTeacher, 'groupId');

// -------------------------------------------------------------
// private stuff for this module here
