import DataLoader from "dataloader";
import { Op, ModelStatic } from "sequelize";
import { getClassName } from "../helpers/common";

/**
 * Custom DataLoader class, less boilerplate and have loadAll method
 */
export default class ModelDataLoader<V, K = number, C = K>
                  extends DataLoader<K, V, C>
{

  private model: ModelStatic<any>;

  /**
   * Create a new ModelDataLoader
   * @param {Model} model The sequelize model to use
   * @param {string} [field='id'] The field in model to match against
   * @param {DataLoader.BatchLoadFn} [batchLoadFn] Optional custom batchLoad function
   * @param {DataLoader.Options} [options] Optional DataLoader functions
   */
  constructor(
    model: ModelStatic<any>,
    field: string = 'id',
    batchLoadFn: DataLoader.BatchLoadFn<K, V> =
      ModelDataLoader.defaultBatchFn<K,V>(model, field),
    options?: DataLoader.Options<K, V, C>
  ) {
    super(batchLoadFn,options);
    this.model = model;
  }

  /**
   * Loads all records with id aas key
   * Throws if any of ids could not be loaded
   * @param {K[]} ids Array of keys, normally numbers
   * @returns {Promise<Model[]>}
   */
  loadAll(ids: readonly K[]): PromiseLike<V[]> {
    return Promise.all(ids.map((id:K)=>this.load(id)));
  }

  // LoadFunc, use on all our models
  static defaultBatchFn<K, V>(model: ModelStatic<any>, field: string):
    (ids: readonly K[]) => PromiseLike<ArrayLike<V | Error>>
  {
    return <K, V>(ids: readonly K[]) :
      PromiseLike<ArrayLike<V | Error>> =>
    {
      return model.findAll({
        where: {[field]: {[Op.in]: ids}}
      }).then((res: any[])=>{
        if (res.length === ids.length) return res;
        // where in(...) might not load all ids
        // scan for ids to make sure
        return ids.map((id:K)=>{
          return res.find(r=>r[field] === id) ||
            new Error(`model ${
              getClassName(model)
            }.${field}=${id} not found`)
        });
      }, reason=>{
        return [reason instanceof Error ? reason : new Error(reason)];
      })
    }
  }
}
