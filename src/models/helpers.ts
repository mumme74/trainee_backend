import { QueryInterface, ModelStatic, SyncOptions } from "sequelize";

/**
 * Workaround multiple unique indexes beeing created every time Sequelize re-syncs
 * @param queryInterface
 * @param model
 * @param options
 * @returns
 */
export async function cleanUpUniqueIndex(
  queryInterface: QueryInterface,
  model:ModelStatic<any>,
  options: SyncOptions
): Promise<void> {
  const existingIndexes = await queryInterface
    .showIndex(model.tableName, options) as Array<{[key:string]:any}>;
  // filter in only unique indexes with duplicates of name
  // such as name_2, name_3, but keep name
  const duplicateIdxMap = existingIndexes
    .filter(idx=>idx.name!=='PRIMARY' && idx.unique)
    .reduce((p, v)=>{
      const name = v.name.replace(/^(.*)_\d*/,"$1");
      if (!p[name]) p[name] = [];
      else p[name].push(v.name);
      return p;
    },{});
  for (const idx of Object.values(duplicateIdxMap)) {
    for (const duplicate of idx) {
      await queryInterface.removeIndex(model.tableName, duplicate, options);
    }
  }
}