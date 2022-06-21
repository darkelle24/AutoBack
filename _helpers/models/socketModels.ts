import { UserTableClass } from "back/special-table/userTable";
import { RemoteSocket, Server, Socket } from "socket.io";
import { access } from "./userTableModel";

export interface SocketNotifInfo {
  activate?: boolean,
  selectUserSendNotifs?: (userToSendNotif: (RemoteSocket<any>)[], req: any, dataChange: any, type: 'POST' | 'PUT' | 'DELETE') => (RemoteSocket<any>)[],
  toSendForNotif?: (packageToSend: { eventName: string, toSend: { data: any, type: 'POST' | 'PUT' | 'DELETE' } }, req: any) => { eventName: string, toSend: any }
}

export interface SocketInfo {
  path?: string,
  auth?: access,
  notif?: SocketNotifInfo,
  toDoOnSocketConnection?: (socket: Socket) => void,
  toDoOnSocketDeConnection?: (socket: Socket, reason: any) => void
}

export interface SocketConstructor {
  io: Server,
  path: string,
  auth?: access,
  notif?: SocketNotifInfo,
  userTable?: UserTableClass<any>,
  toDoOnSocketConnection?: (socket: Socket) => void,
  toDoOnSocketDeConnection?: (socket: Socket, reason: any) => void
}