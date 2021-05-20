import { applyDefaultValueOnDataType, basicDataType, addType } from "../../../_helpers/fn"
import { realDataType } from "../../../_helpers/models/modelsType"
import { DBInterface } from "../../../_helpers/models/modelsDb"
import pg from "pg"


export class PostgresDb implements DBInterface {
  readonly dbName: string = "Postgres"

  dataType: realDataType

  constructor() {
    this.dataType = applyDefaultValueOnDataType(basicDataType())
    pg.defaults.parseInt8 = true
  }

  addTypes(newTypes: realDataType): void {
    this.dataType = addType(this.dataType, newTypes)
  }
}