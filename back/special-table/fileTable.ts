import { ABDataType } from '../../_helpers/models/modelsType';
import { Model, ModelCtor } from "sequelize";
import express from 'express';
import * as crypto from "crypto";
import multer from 'multer'
import fs from 'fs'
import path from 'path';
import { realDataFileTable, saveTable, Table } from '../../_helpers/models/modelsTable';
import { addPath, errorHandling, getFileExtansion, removeFile } from '../../_helpers/fn';
import { UserTableClass } from './userTable';
import { TableClass } from '../table';
import { basicRouteParams, InfoPlace, RoutePost, RoutePut, TypeRoute } from '../../_helpers/models/routeModels';
import { access } from '../../_helpers/models/userTableModel';
import { RoutePutClass } from '../route/routePut';
import { routeTableInfo } from '../../_helpers/models/models';

export const fileTableDefine: Table = {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  hash: { type: ABDataType.STRING },
  name: { type: ABDataType.STRING },
  extansion: { type: ABDataType.STRING },
  mimetype: { type: ABDataType.STRING, allowNull: true },
}

class RouteChangeFile<M extends Model> extends RoutePutClass<M> {
  pathfolder: string

  constructor(table: routeTableInfo, sequelizeData: ModelCtor<M>, server: express.Application, path: string, routeInfo: RoutePut, pathFolder: string, userTable?: UserTableClass<any>) {
    super(table, sequelizeData, server, path, routeInfo, userTable)

    this.pathfolder = pathFolder
  }

  protected createRoute() {
    let storage = multer.diskStorage({
      destination: (req, file, cb) => {
        if (!fs.existsSync(path.join(this.pathfolder))){
          fs.mkdirSync(path.join(this.pathfolder), { recursive: true });
        }
        cb(null, path.join(this.pathfolder))
      },
      filename: (req, file, cb) => {
        if ((<any>req).fileToChange) {
          (<any>req).fileToChange.update({
            name: file.originalname,
            mimetype: file.mimetype
          }).then((result: any) => {
            cb(null, this.getFileName(result.hash, result.extansion))
          })
        }
      }
    })

    let uploadMulter = multer({
      storage: storage,
      fileFilter: async (req, file, callback) => {
        try {
          (<any>req).fileToChange = await this.tableClass.sequelizeData.findOne({ where: { hash: req.params.hash } })
          if (!(<any>req).fileToChange) {
            callback(Error('Can\'t find file with hash'))
          } else {
            callback(null, true)
          }
        } catch (e: any) {
          callback(e)
        }
      }
    })

    let upload = uploadMulter.single("file")
    this.server.put(this.path, this.checkToken(this.routeInfo), (req: any, res: any, next: any) => {upload(req, res, (err: any) => {if (err) {errorHandling(err, res)} else next()})}, async (req: any, res: any) => {
      await Promise.resolve(this.toDo(req, res))
    })
  }

  protected getFileName(name: string, extansion?: string): string {
    if (extansion) {
      return name + '.' + extansion
    }
    return name
  }
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
            result.hash = this.createHash(result.id)
            if (!(<any>req).tableFilesInfo) {
              (<any>req).tableFilesInfo = [{ model: result, file: file }]
            } else {
              (<any>req).tableFilesInfo.push({ model: result, file: file })
            }
            cb(null, this.getFileName(result.hash, result.extansion))
          })
        }
      })

    this.pathFolder = pathFolder

    server.use('/api/file/show', express.static('uploads'))
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

    sequelizeData.addHook('afterCreate', "init File", async (file: any, options: any) => {
      const hash = this.createHash(file.dataValues.id)
      await this.sequelizeData.update({hash: hash}, {where: {id: file.id}})
    })

    sequelizeData.addHook('beforeValidate', "update hash and ext", (file: any, options: any) => {
      if (options.fields.find((element: string) => element === "name")) {
        this.getExtansion(file)
      }
    })

    sequelizeData.addHook('afterDestroy', "delete file", (file: any) => {
      removeFile(path.join(this.pathFolder, this.getFileName(file.hash, file.extansion)))
    })
  }

  protected getExtansion(file: any) {
    let splitedName = file.name.split('.')
    if (splitedName.length > 1) {
      file.extansion = splitedName.pop()
      file.name = splitedName.join('.')
    }
  }

  protected createHash(id: number): string {
    return crypto.createHash('sha1').update(id.toString()).digest('hex');
  }

  public async addFile(name: string, role?: string[], userId?: number): Promise<number | undefined> {
    let result = await this.sequelizeData.create({
      name: name,
      role: role,
      userId: userId,
      hash: ''
    })
    if (result)
      return (<any>result).id
    return undefined
  }

  basicRouting(getRoute: basicRouteParams = {auth: {role: ['Admin', 'SuperAdmin']}}, postRoute: basicRouteParams = {}, putRoute: basicRouteParams = {}, deleteRoute: basicRouteParams = {}): void {
    super.basicRouting(getRoute, postRoute, putRoute, deleteRoute)
    this.changeFile()
    this.downloadFile()
    this.showFile()
  }

  protected changeFile() {
    let route = {
      path: 'changeFile/:hash',
      type: TypeRoute.PUT,
      columsAccept: {
        list: [""]
      },
      filters: {
        hash: {
          equal: {
            name: 'hash',
            where: InfoPlace.PARAMS,
          }
        }
      },
      name: 'Change upload File'
    }
    let routeClass = new RouteChangeFile({ classTable: this}, this.sequelizeData, this.server, addPath(this.routes.originRoutePath, route.path), (route as RoutePut), this.pathFolder, this.userTable)
    this.routes.post.push((<any>routeClass))
  }

  protected basicPut(accessRule?: access): void {
    super.addRoute({
      path: 'rename/:hash',
      type: TypeRoute.PUT,
      columsAccept: {
        list: ["name"]
      },
      filters: {
        hash: {
          equal: {
            name: 'hash',
            where: InfoPlace.PARAMS,
          }
        }
      },
      auth: accessRule,
      name: 'Rename File'
    })
  }

  protected basicDelete(accessRule?: access): void {
    super.addRoute({
      path: '/:hash',
      type: TypeRoute.DELETE,
      filters: {
        hash: {
          equal: {
            name: 'hash',
            where: InfoPlace.PARAMS,
          }
        }
      },
      auth: accessRule,
      name: 'Delete File'
    })
  }

  protected downloadFile(): void {
    super.addRoute({
      path: '/download/:hash',
      type: TypeRoute.GET,
      name: 'Download file',
      filters: {
        hash: { equal: { where: InfoPlace.PARAMS, name: 'hash' } }
      },
      doSomething: (req, res, route) => {
        this.sequelizeData.findOne({
          where: { hash: req.params.hash }
        }).then((result: any) => {
          if (!result) {
            errorHandling(Error('Can\'t find file with hash'), res)
          } else {
            res.download(path.join(this.pathFolder, this.getFileName(result.hash, result.extansion)), this.getFileName(result.name, result.extansion))
          }
        }).catch ((e: any) => {
          errorHandling(e, res)
        })
      }
    })
  }

  protected getFileName(name: string, extansion?: string): string {
    if (extansion) {
      return name + '.' + extansion
    }
    return name
  }

  public deleteFile(id: number): Promise<any> {
    return this.sequelizeData.findOne({ where: { id: id } }).then(async (result: M) => {
      await result.destroy()
    })
  }

  protected showFile(): void {
    super.addRoute({
      path: '/show/:hash',
      type: TypeRoute.GET,
      name: 'Show file',
      filters: {
        hash: { equal: { where: InfoPlace.PARAMS, name: 'hash' } }
      },
      doSomething: (req, res, route) => {
        this.sequelizeData.findOne({
          where: { hash: req.params.hash }
        }).then((result: any) => {
          if (!result) {
            errorHandling(Error('Can\'t find file with hash'), res)
          } else {
            res.sendFile(this.getFileName(result.hash, result.extansion), {root: path.resolve('uploads')})
          }
        }).catch ((e: any) => {
          errorHandling(e, res)
        })
      }
    })
  }

}