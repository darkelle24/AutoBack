import { UserTableClass } from "back/special-table/userTable";
import { Server } from "socket.io";
import { access } from "./userTableModel";

export interface SocketConstructor {
  io: Server,
  path: string,
  auth?: access,
  userTable?: UserTableClass<any>
}