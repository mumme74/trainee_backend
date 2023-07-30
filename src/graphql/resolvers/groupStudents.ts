import ModelDataLoader from "../modelDataLoader";
import { GroupStudent } from "../../models/core_group_student";


// -------------------------------------------------------------
// controller functions


// -------------------------------------------------------------
// exported stuff here

export const groupStudentLoader =
  new ModelDataLoader<GroupStudent>(GroupStudent);

export const groupStudentByGroupLoader =
  new ModelDataLoader<GroupStudent>(GroupStudent, 'groupId');


// -------------------------------------------------------------
// private stuff for this module here
