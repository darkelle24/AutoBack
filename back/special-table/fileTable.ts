import { ABDataType } from '../../_helpers/models/modelsType';
import { Model, ModelCtor } from "sequelize";
import express from 'express';
import * as crypto from "crypto";
import multer from 'multer'
import fs from 'fs'
import path from 'path';
import { realDataFileTable, saveTable, Table } from '../../_helpers/models/modelsTable';
import { getFileExtansion } from '../../_helpers/fn';
import { UserTableClass } from './userTable';
import { TableClass } from '../table';

export const fileTableDefine: Table = {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  hash: { type: ABDataType.STRING },
  name: { type: ABDataType.STRING },
  extansion: { type: ABDataType.STRING },
  role: { type: ABDataType.ARRAY, allowNull: true },
  mimetype: { type: ABDataType.STRING, allowNull: true },
  userId: {
    type: ABDataType.TABLE_LINK, allowNull: true, tableToLink: "User", columnsLink: 'id', rename: 'user', transformGetLinkedData: (value: any) => {
      delete value.email
      delete value.phone
  } },
}

export class FileTableClass<M extends Model> extends TableClass<M> {
  storage: multer.StorageEngine
  pathFolder: string

  constructor(name: string, table: saveTable, server: express.Application, filePath: string, originServerPath: string, originRoutePath?: string, userTable?: UserTableClass<any>) {
    super(name, table, server, originServerPath, undefined, originRoutePath, userTable, 'Table who contains all information about file.')

    const pathFolder = filePath

      this.storage = multer.diskStorage({
        destination: function (req, file, cb) {
          if (!fs.existsSync(path.join(pathFolder))){
            fs.mkdirSync(path.join(pathFolder), { recursive: true });
          }
          cb(null, path.join(pathFolder))
        },
        filename: (req, file, cb) => {
          this.sequelizeData.create({
            name: file.originalname,
            mimetype: file.mimetype,
            hash: ''
          }).then((result: any) => {
            if (!(<any>req).tableFilesInfo) {
              (<any>req).tableFilesInfo = [{ model: result, file: file }]
            } else {
              (<any>req).tableFilesInfo.push({ model: result, file: file })
            }
            // if (!(<any>result).extansion)
              cb(null, result.hash)
            /* else
              cb(null, (<any>result).hash + '.' + (<any>result).extansion) */
          })
        }
      })

      this.pathFolder = pathFolder
  }

  public getMulter(table: saveTable): multer.Multer {
    return multer({
      storage: this.storage,
      fileFilter: (req, file, callback) => {
        if (table[file.fieldname] && table[file.fieldname].type.isFile) {
          const field = (table[file.fieldname] as realDataFileTable)
          const ext = getFileExtansion(file.originalname)
          if (field.extAuthorize && field.extAuthorize.find(element => ext === element) === undefined) {
            callback(Error('Wrong extansion type'))
          }
          if (field.maxFileSize && file.size > field.maxFileSize) {
            callback(Error('File too big'))
          }
        } else {
          callback(null, false)
        }
        callback(null, true)
      }
    });
  }

  public setUpSequilize(sequelizeData: ModelCtor<M>): void {
    super.setUpSequilize(sequelizeData)
    sequelizeData.addHook('afterCreate', "init File", (file: any, options: any) => {
      this.createHash(file)
    })

    sequelizeData.addHook('beforeValidate', "update hash and ext", (file: any, options: any) => {
      if (options.fields.find((element: string) => element === "name")) {
        this.getExtansion(file)
      }
    })
  }

  protected getExtansion(file: any) {
    let splitedName = file.name.split('.')
    if (splitedName.length > 1) {
      file.extansion = splitedName.pop()
      file.name = splitedName.join('.')
    }
  }

  protected createHash(file: any) {
    file.hash = crypto.createHash('sha1').update(file.dataValues.id.toString()).digest('hex');
  }

  public async addFile(name: string, role?: string[], userId?: number): Promise<number | undefined> {
    let result = await this.sequelizeData.create({
      name: name,
      role: role,
      userId: userId
    })
    if (result)
      return (<any>result).id
    return undefined
  }

}