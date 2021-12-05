import { access } from './../_helpers/models/userTableModel';
import { Namespace, RemoteSocket, Socket } from 'socket.io';
import { SocketConstructor, SocketNotifInfo } from '_helpers/models/socketModels';
import { UserTableClass } from './special-table/userTable';

export class SocketAutobackClass {
  readonly namespace: Namespace
  readonly auth?: access
  readonly userTable?: UserTableClass<any>
  readonly notif: SocketNotifInfo
  toDoOnSocketConnection?: (socket: Socket) => void
  selectUserSendNotifs: (userToSendNotif: (RemoteSocket<any>)[], req: any, dataChange: any, type: 'POST' | 'PUT' | 'DELETE' ) => (RemoteSocket<any>)[]
  toSendForNotif: (packageToSend: {eventName: string, toSend: {data: any, type: 'POST' | 'PUT' | 'DELETE' }}, req: any) => {eventName: string, toSend: any}

  constructor(params: SocketConstructor) {
    this.namespace = params.io.of(params.path)

    if (params.notif) {
      this.notif = params.notif
      if (this.notif.activate === undefined) {
        this.notif.activate = true
      }
      if (this.notif.selectUserSendNotifs === undefined) {
        this.notif.selectUserSendNotifs = (user: any[]) => {return user}
      }

      if (this.notif.toSendForNotif === undefined) {
        this.notif.toSendForNotif = (packageToSend: any) => {return packageToSend}
      }
    } else {
      this.notif = { activate: true, selectUserSendNotifs: (user: any[]) => {return user}, toSendForNotif: (packageToSend: any) => {return packageToSend} }
    }

    this.selectUserSendNotifs = this.notif.selectUserSendNotifs
    this.toSendForNotif = this.notif.toSendForNotif

    if (params.userTable) {
      this.userTable = params.userTable

      if (params.auth) {
        this.auth = params.auth

        this.setUpAuth()
      }

    }

    params.toDoOnSocketConnection = this.toDoOnSocketConnection

    this.namespace.on('connection', async (socket: Socket) => {

      if (this.notif.activate) {
        socket.on('getNotifs', () => {
          socket.join('notification')
        })

        socket.on('stopNotif', () => {
          socket.leave('notification')
        })
      }

      if (this.toDoOnSocketConnection) {
        this.toDoOnSocketConnection(socket)
      }

    })
  }

  async sendNotif(req: any, data: any, type: 'POST' | 'PUT' | 'DELETE', routeSocketNotifInfo: SocketNotifInfo) {
    if (this.notif.activate && routeSocketNotifInfo.activate === true) {
      let sockets = await this.namespace.in("notification").fetchSockets()

      if (routeSocketNotifInfo.selectUserSendNotifs === undefined) {
        sockets = this.selectUserSendNotifs(sockets, req, data, type)
      } else {
        sockets = routeSocketNotifInfo.selectUserSendNotifs(sockets, req, data, type)
      }
      if (sockets.length !== 0) {
        let toSend: { eventName: string, toSend: { data: any, type: 'POST' | 'PUT' | 'DELETE' } } = { eventName: 'notif', toSend: { data: data, type: type } }

        if (routeSocketNotifInfo.toSendForNotif === undefined) {
          toSend = this.toSendForNotif(toSend, req)
        } else {
          toSend = routeSocketNotifInfo.toSendForNotif(toSend, req)
        }

        let userRoomName = sockets.map((element: RemoteSocket<any>) => element.id)

        this.namespace.to(userRoomName).emit(toSend.eventName, toSend.toSend)
      }
    }
  }

  protected setUpAuth() {
    this.namespace.use(async (socket, next) => {
      if ((socket.handshake.auth && socket.handshake.auth.token) || socket.handshake.headers.token) {
        await this.userTable.checkToken((socket.handshake.auth && socket.handshake.auth.token) ? socket.handshake.auth.token : socket.handshake.headers.token, this.auth.role, this.auth.inverse)
          .catch((err) => {
            next(new Error(err.toString()));
          }).then((user: any) => {
            if (user !== undefined) {
              socket.data = { socket: socket, user: user }
              next()
            }
          })
      } else {
        next(new Error('Need to be authentified'));
      }
    })
  }
}