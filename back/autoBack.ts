import { FileTableClass, fileTableDefine } from './special-table/fileTable';
import { TableClass } from './table';
import { PostgresDb } from './db/postgres/postgres';
import express from "express";
import { StatusCodes } from 'http-status-codes';
import { ModelAttributes, ModelCtor, Sequelize } from 'sequelize';
import { defaultSaveDataInfo, removeFile, addPath, formatDate, writeInFile, getPathTable } from '../_helpers/fn';
import * as _ from "lodash"
import { authConfigAutoBack, userTableConfig, userTableDefine } from '../_helpers/models/userTableModel';
import { UserTableClass } from './special-table/userTable';
import { applyValidator } from '../_helpers/validator';
import cors from 'cors'
import path from 'path';
import fs from 'fs'
import { filePathInfo } from '../_helpers/models/models';
import { ABDataType, realDataType, realDataTypeInfo } from '../_helpers/models/modelsType';
import { DBInterface, DB } from '../_helpers/models/modelsDb';
import { allTables, Table, tempSaveTable, saveDataTableInfo, saveTable, dataTableInfo, realDataLinkTable, dataLinkTable, DeleteAction, dataFileTable, realDataFileTable } from '../_helpers/models/modelsTable';
import morgan from 'morgan'
import compression from 'compression'
import http from 'http'
import { Server } from 'socket.io';
import { SocketConstructor, SocketInfo } from '_helpers/models/socketModels';
import nodemailer from "nodemailer"
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import Mail from 'nodemailer/lib/mailer';
import { TypeRoute } from '../_helpers/models/routeModels';

export class AutoBack {

  readonly server = express();
  readonly httpServer: http.Server
  private DB: DBInterface
  private startTime = Date.now()
  private sequelize: Sequelize
  tables: allTables = {}
  private defaultSaveDataInfo: any = defaultSaveDataInfo()
  private waitDestroyDb?: Promise<void>
  private _userTable?: UserTableClass<any> = undefined
  get userTable(): UserTableClass<any> | undefined {
    return this._userTable
  }
  private _fileTable?: FileTableClass<any> = undefined
  get fileTable(): FileTableClass<any> | undefined {
    return this._fileTable
  }
  readonly fileInfo: filePathInfo
  readonly serverPath: string
  readonly debug: boolean
  private debugInfo: any
  private port: number
  readonly name: string
  private linkTableToProcess: { tableSequelizeInfo: any, tempSaveTable: tempSaveTable, fileInfo: filePathInfo, nameTable: string, linkToProcess: { data: dataLinkTable, nameColumns: string }[] }[] = []
  private saveAuthConfig: authConfigAutoBack
  readonly socketIO?: Server
  accountToSendMail: { name: string, account: nodemailer.Transporter<SMTPTransport.SentMessageInfo> }[] = []

  constructor(connnectionStr: string, db: DB = DB.POSTGRES, activeHealthRoute: boolean = true, fileInfo?: filePathInfo, serverPath: string = "api/", activeLog: boolean = true, resetDb: boolean = false, debug: boolean = false, name: string = "AutoBack", socketActive: boolean = false) {
    this.server.use(compression());
    this.server.use(express.urlencoded({ extended: false }))
    this.server.use(express.json())
    this.server.use(cors());
    this.name = name

    if (!fileInfo) {
      fileInfo = {
        folderPath: 'uploads',
        virtualPath: 'uploads'
      }
    }
    if (fileInfo && !fileInfo.virtualPath) {
      fileInfo.virtualPath = 'uploads'
    }

    if (activeLog) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const rfs = require("rotating-file-stream");

      const generator = (time: Date, index?: number) => {
        if (!time) return "access.log";

        return [formatDate(time), index, 'access.log'].join('-');
      };

      morgan.token('auth', function (req: any) {
        if (!req.user) {
          return 'Is not authenticated'
        } else {
          return "id: " + req.user.id + " username: " + req.user.username + " role: " + req.user.role
        }
      })

      morgan.token('statusMessage', function (req: any, res: any) {
        return res.statusMessage
      })

      const accessLogStream = rfs.createStream(generator, {
        path: 'logs',
        maxFiles: 31,
        intervalBoundary: true,
        interval: "1d",
      })

      this.server.use(morgan(':remote-addr - :auth - [:date[web]] ":method :url HTTP/:http-version" :status ":statusMessage" :res[content-length] ":referrer" ":user-agent" - :response-time ms', { stream: accessLogStream }))
    }

    this.fileInfo = fileInfo
    this.serverPath = serverPath

    if (!fs.existsSync(this.fileInfo.folderPath)) {
      fs.mkdirSync(this.fileInfo.folderPath);
    }

    /* if (fileInfo.virtualPath) {
      fileInfo.virtualPath = addPath('/', fileInfo.virtualPath)
      this.server.use(fileInfo.virtualPath, (req, res) => {
        const splitedUrl = req.originalUrl.split('/')
        const path = addPath(this.fileInfo.folderPath, splitedUrl.slice(2).join('/'))
        if (fs.existsSync(path))
          res.download(path)
        else {
          res.status(404).json({ message: "File not found" })
          res.statusMessage = "File not found"
        }
      });
    } */

    if (db === DB.POSTGRES) {
      this.DB = new PostgresDb();
    } else {
      this.DB = new PostgresDb();
    }
    this.sequelize = new Sequelize(connnectionStr, { logging: false });
    if (resetDb) {
      this.waitDestroyDb = this.resetDb()
    }
    if (activeHealthRoute)
      this.health()
    this.debug = debug
    if (debug) {
      this.debugRoute()
    }
    this.httpServer = require('http').Server(this.server)
    if (socketActive === true)
      this.socketIO = this.setUpIo()
    this.defineFileTable()
  }

  protected defineFileTable() {
    if (!this.fileTable) {
      const [tableSequelize, saveTableInfo] = this.defineStartTable("File", fileTableDefine)


      this.tables["File"] = new FileTableClass("File", saveTableInfo.saveTable, this.server, this.fileInfo.folderPath, this.serverPath, "/file", this.userTable)

      saveTableInfo.table = this.tables["File"]

      if (tableSequelize) {
        this.tables["File"].setUpSequilize(tableSequelize)
      }

      if (this.tables["File"]) {
        this._fileTable = (this.tables["File"] as FileTableClass<any>)
        return this.fileTable
      }
      return this.fileTable
    } else {
      return this.fileTable
    }
  }

  public addMailAccount(name: string, transport?: string | SMTPTransport | SMTPTransport.Options): number {
    return this.accountToSendMail.push({ name: name, account: nodemailer.createTransport(transport) })
  }

  public addTypes(newTypes: realDataType): void {
    this.DB.addTypes(newTypes)
  }

  private async resetDb() {
    await this.sequelize.drop()
    await this.sequelize.sync().then(() => console.log('All tables dropped'))
  }

  private async startFn(port: number = 8080) {
    await this.sequelize.sync().then(() => {
      console.log('Created all Tables')

      if (this.fileTable) {
        this.fileTable.basicRouting()
      }

      if (this.userTable && this.userTable.config.basicUser) {
        return this.userTable.sequelizeData.create(
          this.userTable.config.basicUser
        ).then(async (user) => {
          if (this.userTable.config.toDoOnCreatebasicUser)
            await Promise.resolve(this.userTable.config.toDoOnCreatebasicUser(user))
          console.log('Succefully create basic user')
        }).catch((err: any) => {
          if (err.errors !== undefined) {
            console.warn(err.name + ': ' + err.errors[0].message)
          } else {
            console.warn(err.toString())
          }
        })
      }
    })
    if (this.debug) {
      this.getInfoAutoBack()
    }
    if (!this.httpServer) {
      this.server.listen(port, () => {
        console.log('The Express server listening on port ' + port)
      });
    } else if (this.httpServer) {
      this.httpServer.listen(port, () => {
        console.log('The http server listening on port ' + port)
      })
    }
    this.error404()
  }

  /**
     * Call after you construct AutoBack class
  */

  public activeAuth(auth?: authConfigAutoBack | boolean, userDefine: Table = userTableDefine, userTableClass: typeof UserTableClass = UserTableClass, mergeUserDefine: boolean = true): void {
    if (auth) {
      if (auth === true)
        auth = {}
      if (!auth.config)
        auth.config = {}
      const userTable = this.defineUserTable(auth.config, userDefine, userTableClass, mergeUserDefine)
      if (userTable) {
        this._userTable = userTable
        this.userTable.userTable = this.userTable
      }

      if (this.fileTable) {
        this.fileTable.userTable = userTable
      }

      if (this.userTable)
        this.saveAuthConfig = auth
    }
  }

  /**
     * Call after you init all your routes and tables
  */

  async start(port: number = 8080): Promise<void> {
    this.port = port
    if (this.waitDestroyDb) {
      this.waitDestroyDb.finally(async () => {
        await this.startFn(port)
      })
    } else {
      await this.startFn(port)
    }
  }

  loadDb(db: DB, connnectionStr: string): void {
    if (db === DB.POSTGRES) {
      this.DB = new PostgresDb();
    }
    this.sequelize = new Sequelize(connnectionStr, { logging: false });
  }

  private health() {
    this.server.get(addPath('/', addPath(this.serverPath, '/health')), (req, res) => {
      const time = Date.now() - this.startTime
      res.status(StatusCodes.OK).json({
        uptime: {
          diff: time,
          ms: Math.floor(time % 1000),
          s: Math.floor(time / 1000 % 60),
          m: Math.floor(time / 60000 % 60),
          h: Math.floor(time / 3600000 % 24),
          d: Math.floor(time / 86400000)
        }
      })
    })
  }

  public getInfoAutoBack(path?: string): any {
    const toSend: any = {
      name: this.name,
      tables: {}
    }
    for (const [key, value] of Object.entries(this.tables)) {
      toSend.tables[key] = value.getTableInfo()
    }
    this.debugInfo = toSend
    console.log('Debug Mode init')
    if (path) {
      writeInFile(path, JSON.stringify(toSend))
    }
    return toSend
  }

  private whereToPostman(postman: any, object: any): any {
    if (object.where === 'Querry parameters') {
      postman.request.url.query.push({
        key: object.name,
        value: null,
        disabled: true,
        description: object.filter
      })
    } else if (object.where === 'Parameters') {
      postman.request.url.variable.push({
        key: object.name,
        value: null,
        description: object.filter
      })
    } else if (object.where === 'Header') {
      postman.request.header.push({
        key: object.name,
        value: '',
        disabled: true,
        description: object.filter
      })
    }
    return postman
  }

  public sendMail(accountName: string, mailOptions: Mail.Options): Promise<any> | undefined {
    let account = this.accountToSendMail.find(x => x.name === accountName)
    if (account)
      return this.accountToSendMail[0].account.sendMail(mailOptions)
    return undefined
  }

  private routeBodyToPostmn(postman: any, route: any): any {
    if (route.type === 'POST' || route.type === 'PUT') {
      postman.request.body = {
        mode: "raw",
        raw: "",
        options: {
          raw: {
            language: "json"
          }
        }
      }

      if (route.bodyDoc) {
        postman.request.body.raw = route.bodyDoc({})
      } else {
        postman.request.body.raw = {}
      }
      if (typeof postman.request.body.raw !== 'string') {
        postman.request.body.raw = JSON.stringify(postman.request.body.raw, null, 4)
      }
    }

    return postman
  }

  private routeInfoToPostman(route: any): any {
    const toReturn: any = {
      name: route.name,
      protocolProfileBehavior: {
        disableBodyPruning: true
      },
      event: [],
      request: {
        method: route.type,
        url: {
          protocol: '{{protocole}}',
          host: '{{domaine}}',
          path: route.route,
          query: [],
          variable: []
        },
        header: [],
      }
    }

    this.routeBodyToPostmn(toReturn, route)

    if (route.limit) {
      this.whereToPostman(toReturn, route.limit)
    }

    if (route.offset) {
      this.whereToPostman(toReturn, route.offset)
    }

    if (route.event) {
      if (route.event.afterResponse) {
        toReturn.event.push({
          listen: "test",
          script: {
            exec: route.event.afterResponse,
            type: "text/javascript"
          }
        })
      }
      if (route.event.preRequest) {
        toReturn.event.push({
          listen: "prerequest",
          script: {
            exec: route.event.preRequest,
            type: "text/javascript"
          }
        })
      }
    }

    if (route.filter) {
      for (const value of Object.values(route.filter)) {
        for (const filter of Object.values(value)) {
          this.whereToPostman(toReturn, filter)
        }
      }
    }

    if (typeof route.auth !== 'string') {
      toReturn.request.auth = {
        type: "bearer",
        bearer: [{
          key: "token",
          value: route.auth ? "{{role_token_" + route.auth[0] + "}}" : "",
          type: "string"
        }]
      }
    }
    return toReturn
  }

  /**
     * Call after you call start
  */

  public getAPIPostman(path?: string): any {
    if (!this.debug) {
      this.getInfoAutoBack()
    }
    const toReturn: any = {
      info: {
        _postman_id: this.name,
        name: this.name,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: [],
      variable: [{
        id: 'protocole',
        key: 'protocole',
        value: 'http',
        name: 'protocole',
        type: 'string'
      }, {
        id: 'domaine',
        key: 'domaine',
        value: 'localhost:' + this.port,
        name: 'domaine',
        type: 'string'
      }]
    }

    if (this._userTable) {
      for (const role of this._userTable.userTable.config.roles) {
        toReturn.variable.push({
          id: 'role_token_' + role,
          key: 'role_token_' + role,
          name: 'role_token_' + role,
          value: '',
          type: 'string'
        })
      }
    }

    for (const [key, value] of Object.entries(this.debugInfo.tables)) {
      const valueAny: any = value
      const table: any = {
        name: key,
        item: [],
        //eslint-disable-next-line
        description: (valueAny.description ? valueAny.description + '\n\n' : '') + 'Table columns:\n\`\`\`json\n' + JSON.stringify(valueAny.column, null, 4) + '\n\`\`\`'
      }
      if (valueAny.routes) {
        for (const [, value] of Object.entries(valueAny.routes)) {
          (<any>value).forEach((element: any) => {
            table.item.push(this.routeInfoToPostman(element))
          });
        }
      }
      toReturn.item.push(table)
    }
    if (path) {
      writeInFile(path, JSON.stringify(toReturn))
    }
    return toReturn
  }

  private debugRoute() {
    this.server.get(addPath('/', addPath(this.serverPath, '/debug')), (req, res) => {
      res.status(200).json(this.debugInfo)
    })
  }

  private error404() {
    this.server.use(function (req, res) {
      res.status(StatusCodes.NOT_FOUND).json({ message: "This route doesn't exist" })
      res.statusMessage = "This route doesn't exist"
    });
  }

  private defineUserTable(auth: userTableConfig, userDefine: Table = userTableDefine, userTableClass: typeof UserTableClass = UserTableClass, mergeUserDefine: boolean = true): UserTableClass<any> | undefined {
    if (!this.userTable) {
      if (mergeUserDefine)
        userDefine = _.merge(userTableDefine, userDefine)
      const [tableSequelize, saveTableInfo] = this.defineStartTable("User", userDefine)

      let mail: any = undefined
      if (auth.nameAccountMailRecupMDP) {
        mail = this.accountToSendMail.find((ele: any) => ele.name === auth.nameAccountMailRecupMDP)
        if (mail)
          mail = mail.account
      }

      this.tables["User"] = new userTableClass(auth, "User", saveTableInfo.saveTable, this.server, this.serverPath, this.fileTable, mail, '/auth')
      saveTableInfo.table = this.tables["User"]

      if (tableSequelize)
        saveTableInfo.table.setUpSequilize(tableSequelize)

      if (this.tables["User"]) {
        this._userTable = (this.tables["User"] as UserTableClass<any>)
        return this.userTable
      }
      return this.userTable
    } else {
      return this.userTable
    }
  }

  private defineStartTable(nameTable: string, table: Table): [ModelCtor<any> | undefined, tempSaveTable] {
    let tableSequelize = undefined
    const [tableSequelizeInfo, tempSaveTable, linkToProcess] = this.createTableSequelizeInfo(table, nameTable, this.fileInfo)

    if (this.sequelize && linkToProcess.length === 0)
      tableSequelize = this.sequelize.define(nameTable, tableSequelizeInfo)
    else if (linkToProcess.length !== 0) {
      this.linkTableToProcess.push({
        linkToProcess: linkToProcess,
        tableSequelizeInfo: tableSequelizeInfo,
        tempSaveTable: tempSaveTable,
        fileInfo: this.fileInfo,
        nameTable: nameTable
      })
    }
    return [tableSequelize, tempSaveTable]
  }

  defineTable(nameTable: string, table: Table, originRoutePath?: string, description?: string, socketInfo?: SocketInfo): TableClass<any> | undefined {
    const [tableSequelize, saveTableInfo] = this.defineStartTable(nameTable, table)

    if (this.socketIO) {
      let socket: any | undefined = undefined

      if (socketInfo) {
        socket = {}
        if (!socketInfo.path) {
          socketInfo.path = getPathTable(nameTable, this.serverPath, originRoutePath)
        }
        socket.path = socketInfo.path
        socket.auth = socketInfo.auth
        socket.io = this.socketIO
        socket.userTable = this.userTable
        socket.notif = socketInfo.notif
        socket.toDoOnSocketConnection = socketInfo.toDoOnSocketConnection
      }
      this.tables[nameTable] = new TableClass(nameTable, saveTableInfo.saveTable, this.server, this.serverPath, this.fileTable, originRoutePath, this.userTable, description, socket)
    } else {
      this.tables[nameTable] = new TableClass(nameTable, saveTableInfo.saveTable, this.server, this.serverPath, this.fileTable, originRoutePath, this.userTable, description)
    }
    saveTableInfo.table = this.tables[nameTable]

    if (tableSequelize) {
      this.tables[nameTable].setUpSequilize(tableSequelize)
    }
    return this.tables[nameTable]
  }

  private sequelizeClassicType(tempSaveTable: tempSaveTable, tableSequelizeInfo: any, key: string, type: realDataTypeInfo, saveTableInfo: saveDataTableInfo) {
    tableSequelizeInfo[key] = {
      type: type.sequelizeType,
      primaryKey: saveTableInfo.primaryKey,
      autoIncrement: saveTableInfo.autoIncrement,
      allowNull: saveTableInfo.allowNull,
      unique: saveTableInfo.unique,
      get() {
        let value = this.getDataValue(key)
        if (value !== undefined && value !== null) {
          if (type && type.DBToJson) {
            value = type.DBToJson(value)
          }
          if (saveTableInfo && saveTableInfo.transformGet && tempSaveTable.table) {
            value = saveTableInfo.transformGet(value, tempSaveTable.table)
          }
        }
        return value
      },
      set(value: any) {
        if (this._options.isNewRecord && (value === undefined || value === null)) {
          value = saveTableInfo.initValue
        }
        if (value !== undefined && value !== null) {
          if (saveTableInfo.validate !== undefined) {
            applyValidator(key, value, saveTableInfo.validate)
          }
          if (saveTableInfo && saveTableInfo.transformSet && tempSaveTable.table) {
            value = saveTableInfo.transformSet(value, tempSaveTable.table)
          }
          if (type && type.JsonToDB)
            value = type.JsonToDB(value)
        }
        this.setDataValue(key, value)
      }
    }
  }

  /**
     * Call after you define all your tables.
     * After you call this fonction you can add basic routes and customs route.
  */

  public setUpTables(): void {
    for (const tableToProcess of this.linkTableToProcess) {
      for (const columnsToProcess of tableToProcess.linkToProcess) {
        this.tableLink(columnsToProcess.data, tableToProcess.nameTable, columnsToProcess.nameColumns, tableToProcess.tableSequelizeInfo, tableToProcess.tempSaveTable.saveTable, tableToProcess.tempSaveTable, tableToProcess.fileInfo)
      }
      const tableSequelize = this.sequelize.define(tableToProcess.nameTable, tableToProcess.tableSequelizeInfo)

      this.tables[tableToProcess.nameTable].setUpSequilize(tableSequelize)
    }
    this.linkTableToProcess = []
    if (this.userTable)
      this.userTable.basicRouting(this.saveAuthConfig.getRoute, this.saveAuthConfig.postRoute, this.saveAuthConfig.putRoute, this.saveAuthConfig.deleteRoute)
  }

  private tableLink(data: dataLinkTable, nameTable: string, key: string, tableSequelizeInfo: any, saveTableInfo: saveTable, tempSaveTable: tempSaveTable, fileInfo: filePathInfo) {
    let subType: any = data.type
    const isFile: boolean = ('file' === (<any>data).type)

    if (isFile) {
      subType = ABDataType.TABLE_LINK
    }

    const type = this.getTableLinkDataType(data, isFile)

    const tabsInfo = (this.saveDataInfo(data, type) as realDataLinkTable)

    tabsInfo.subType = subType
    if (!data.onDelete) {
      tabsInfo.onDelete = DeleteAction.DELETE
    } else if (data.onDelete === DeleteAction.SET_DEFAULT && data.defaultValue === undefined) {
      throw TypeError('Can t set DeleteAction.SET_DEFAULT on table ' + nameTable + ' columns ' + key + ' because defaultValue === undefined')
    } else if (tabsInfo.subType !== ABDataType.MULTIPLE_LINK_TABLE && data.onDelete === DeleteAction.SET_NULL && (data.allowNull === undefined || data.allowNull === false)) {
      throw TypeError('Can t set DeleteAction.SET_NULL on table ' + nameTable + ' columns ' + key + ' because allowNull === undefined or allowNull === false')
    }

    if (!data.multipleResult) {
      tabsInfo.multipleResult = false
    }
    tabsInfo.tableToLink = this.tables[data.tableToLink]
    saveTableInfo[key] = tabsInfo

    this.sequelizeClassicType(tempSaveTable, tableSequelizeInfo, key, type, saveTableInfo[key])
  }

  private createTableSequelizeInfo(table: Table, nameTable: string, fileInfo: filePathInfo): [ModelAttributes<any>, tempSaveTable, any] {
    const tableSequelizeInfo: any = {}
    const saveTableInfo: saveTable = {}
    const tempSaveTable: tempSaveTable = {
      saveTable: {}
    }
    const linkToProcess: any[] = []

    Object.keys(table).forEach((key) => {
      const type = this.getDataType(table[key].type)

      if (table[key].type === ABDataType.TABLE_LINK || table[key].type === ABDataType.MULTIPLE_LINK_TABLE) {
        linkToProcess.push({ data: (table[key] as dataLinkTable), nameColumns: key })
      } else if (table[key].type === ABDataType.FILE) {
        let temp = (table[key] as dataLinkTable)
        temp.columnsLink = 'id'
        temp.tableToLink = 'File'
        linkToProcess.push({ data: temp, nameColumns: key })
      } else if (type) {
        saveTableInfo[key] = this.saveDataInfo(table[key], type)
        this.sequelizeClassicType(tempSaveTable, tableSequelizeInfo, key, type, saveTableInfo[key])
      }

    });
    tempSaveTable.saveTable = saveTableInfo
    return [tableSequelizeInfo, tempSaveTable, linkToProcess]
  }

  private saveDataInfo(dataInfo: dataTableInfo | dataLinkTable | dataFileTable, type: realDataTypeInfo): saveDataTableInfo {
    const temp = _.merge({}, this.defaultSaveDataInfo, dataInfo)
    temp.type = type

    if (temp.validate)
      temp.validate = _.merge({}, type.validate, temp.validate)
    else
      temp.validate = _.merge({}, type.validate)

    return temp
  }

  private getTableLinkDataType(link: dataLinkTable, isFile: boolean): realDataTypeInfo {
    if (!link.tableToLink) {
      throw Error('Wrong Table Link')
    }

    const tableToLink = this.tables[link.tableToLink]

    if (tableToLink) {
      const columns = tableToLink.table[link.columnsLink]
      let toReturn: any
      if (columns) {
        if (link.type === ABDataType.MULTIPLE_LINK_TABLE) {
          toReturn = _.clone(this.DB.dataType[ABDataType.ARRAY])
        } else {
          toReturn = _.clone(columns.type)
        }
        toReturn.isTableLink = true
        toReturn.isFile = isFile
        if (isFile) {
          toReturn.deleteOldFileOnPut = (<any>link).deleteOldFileOnPut !== undefined ? (<any>link).deleteOldFileOnPut : true
          toReturn.deleteOldFileOnDelete = (<any>link).deleteOldFileOnDelete !== undefined ? (<any>link).deleteOldFileOnDelete : true
        }
        return toReturn
      } else {
        throw Error('The table' + link.tableToLink + ' does not have a columns with the name ' + link.columnsLink + '.')
      }
    } else {
      throw Error(link.tableToLink + ' is not avaible in this autoback class.')
    }
  }

  private getDataType(data: ABDataType): realDataTypeInfo | undefined {
    const type = this.DB.dataType[data]

    if (data === ABDataType.TABLE_LINK || data === ABDataType.MULTIPLE_LINK_TABLE)
      return undefined
    if (type === undefined) {
      console.error(data + " type in " + this.DB.dbName + " is not supported")
    }
    return type
  }

  private setUpIo(): Server {
    const io = new Server(this.httpServer);

    io.use(async (_socket: any, next: (arg0: Error) => void) => {
      next(new Error('Cannot be connected outside namespace'));
    })
    return io
  }
}
