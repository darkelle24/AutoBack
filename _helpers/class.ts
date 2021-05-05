import { Model, ModelCtor } from "sequelize";
import { saveTable } from "./models";

export class TableClass<M extends Model> {
  readonly name: string
  sequelizeData: ModelCtor<M>
  table: saveTable

  constructor(name: string, table: saveTable, sequelizeData: ModelCtor<M>) {
    this.sequelizeData = sequelizeData
    this.table = table
    this.name = name
  }
}