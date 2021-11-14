import { access } from './../_helpers/models/userTableModel';
import { Namespace } from 'socket.io';
import { SocketConstructor } from '_helpers/models/socketModels';
import { UserTableClass } from './special-table/userTable';

export class SocketAutobackClass {
  readonly namespace: Namespace
  readonly auth?: access
  readonly userTable?: UserTableClass<any>

  constructor(params: SocketConstructor) {
    this.namespace = params.io.of(params.path)

    if (params.userTable) {
      this.userTable = this.userTable

      if (params.auth) {
        this.auth = params.auth

        this.setUpAuth()
      }

    }
  }

  protected setUpAuth() {
    this.namespace.use(async (socket, next) => {
      if ((socket.handshake.auth && socket.handshake.auth.token) || socket.handshake.headers.token) {
        await this.userTable.checkToken(socket.handshake.auth.token ? socket.handshake.auth.token : socket.handshake.headers.token, this.auth.role, this.auth.inverse)
          .catch((err) => {
            next(new Error(err.toString()));
          }).then((user: any) => {
            socket.data = { socket: socket, user: user }
            next()
          })
      } else {
        next(new Error('Need to be authentified'));
      }
    })
  }
}