import { DataTypes } from "sequelize";
import { basicDataType } from "../../../_helpers/fn";
import { dataType, DBInterface } from "../../../_helpers/models/models";

export class PostgresDb implements DBInterface {
  readonly dbName: string = "Postgres"

  readonly dataType: dataType = basicDataType()
}