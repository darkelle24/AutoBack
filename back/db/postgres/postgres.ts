import { applyDefaultValueOnDataType, basicDataType, addType } from "../../../_helpers/fn"
import { realDataType } from "../../../_helpers/models/modelsType"
import { DBInterface } from "../../../_helpers/models/modelsDb"


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