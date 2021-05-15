import { realDataType } from './../../../_helpers/models/models';
import { DataTypes } from "sequelize";
import { addType, applyDefaultValueOnDataType, basicDataType } from "../../../_helpers/fn";
import { dataType, DBInterface } from "../../../_helpers/models/models";

export class PostgresDb implements DBInterface {
  readonly dbName: string = "Postgres"

  dataType: realDataType

  constructor() {
    this.dataType = applyDefaultValueOnDataType(basicDataType())
    require('pg').defaults.parseInt8 = true
  }

  addTypes(newTypes: realDataType) {
    this.dataType = addType(this.dataType, newTypes)
  }
}