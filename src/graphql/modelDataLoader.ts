import DataLoader from "dataloader";
import { Op, ModelStatic } from "sequelize";

/**
 * Custom DataLoader class, less boilarplate and have loadAll method
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
   * @param {K[]} ids Array of keys, normaly numbers
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
        return ids.map((id:K)=>{
          return res.find(r=>r.id === id) ||
            new Error(`model ${
              model.toString().match(/^class\s+([a-z_0-9]+)/i)?.at(1)
            }.id=${id} not found`)
        });
      })
    }
  }
}
