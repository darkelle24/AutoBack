import { DataType, Table } from './models';

export let userTableDefine: Table = {
  id: { type: DataType.BIGINT, primaryKey: true, autoIncrement: true },
  username: { type: DataType.STRING },
  password: { type: DataType.STRING },
  email: { type: DataType.STRING },
  phone: { type: DataType.STRING }
}