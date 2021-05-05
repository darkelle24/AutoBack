import { DataTypes } from "sequelize";
import { dataType, DBInterface } from "../../../_helpers/models";

export class PostgresDb implements DBInterface {
  readonly dbName: string = "Postgres"

  readonly dataType: dataType = {
    date: {
      sequelizeType: DataTypes.STRING,
    },
    int: {
      sequelizeType: DataTypes.INTEGER,
    },
    text: {
      sequelizeType: DataTypes.TEXT,
    },
    array: {
      sequelizeType: DataTypes.TEXT,
      JsonToDB: (data: any[]): any => { return JSON.stringify(data) },
      DBToJson: (data: any): any[] => { return JSON.parse(data) },
    },
    float: {
      sequelizeType: DataTypes.FLOAT,
    },
    boolean: {
      sequelizeType: DataTypes.BOOLEAN,
    },
    bigInt: {
      sequelizeType: DataTypes.BIGINT,
    },
    string: {
      sequelizeType: DataTypes.STRING,
    }
  }
}