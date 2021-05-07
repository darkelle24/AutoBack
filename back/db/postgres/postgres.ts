import { realDataType } from './../../../_helpers/models/models';
import { DataTypes } from "sequelize";
import { applyDefaultValueOnDataType, basicDataType } from "../../../_helpers/fn";
import { dataType, DBInterface } from "../../../_helpers/models/models";

export class PostgresDb implements DBInterface {
  readonly dbName: string = "Postgres"

  readonly dataType: realDataType

  constructor() {
    this.dataType = applyDefaultValueOnDataType(basicDataType())
  }
}