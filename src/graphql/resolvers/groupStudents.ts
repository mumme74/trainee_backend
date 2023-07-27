import ModelDataLoader from "../modelDataLoader";
import { GroupStudent } from "../../models/groupStudent";


export const groupStudentLoader =
  new ModelDataLoader<GroupStudent>(GroupStudent);