# Autoback

```ts
import { DB } from "../_helpers/models/modelsDb"
import { AutoBack } from "./autoBack"

const autoback = new AutoBack("postgres://postgres:password@localhost:5432/test", DB.POSTGRES, {
  config: {
    basicUser: {
      username: 'admin',
      password: 'adminTest24',
      email: 'exemple@gmail.com',
      role: 'Admin'
    }
}})

const test = autoback.defineTable('testTable', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  status: { type: ABDataType.BOOLEAN, defaultValue: true, allowNull: true }
})


test.basicRouting({auth: {role: ["Admin"]}})

autoback.start(8081)
```

## Documentation des Classes

### Index des Classes

1. [Classe Autoback](#Classe-Autoback)
   * [Définition de Autoback](#Définition-de-Autoback)
   * [Paramétres de Autoback](#Paramétres-de-Autoback)
   * [Méthode start](#Méthode-start)
   * [Méthode defineTable](#Méthode-defineTable)
2. [Classe TableClass](#Classe-TableClass)

### Classe Autoback <a name="Classe-Autoback"></a>

Autoback est la classe principale du projet Autoback. Elle permet de centraliser toutes les tables créées et les routes liées a ces table.

#### Définition de Autoback <a name="Définition-de-Autoback"></a>

```js
AutoBack(
  connnectionStr: string,
  db: DB = DB.POSTGRES,
  auth?: authConfigAutoBack | boolean,
  activeHealthRoute: boolean = true,
  fileInfo?: filePathInfo,
  serverPath: string = "api/",
  activeLog: boolean = true
)
```

#### Paramétres de Autoback <a name="Paramétres-de-Autoback"></a>

##### connnectionStr

connectionStr doit contenir la string de connexion a la base de donnée.

##### db

db doit contenir la classe correspondant au nom de la base donnée utilisée.
Par defaut cette valeur est `DB.POSTGRES`.

##### auth

auth doit contenir un objet authConfigAutoBack, un boolean ou juste undefined.
Elle permet de utiliser la table user predefinie et grace a authConfigAutoBack on peut definir le premier utilisateur de la table user.
Par defaut cette valeur est false.

##### activeHealthRoute

activeHealthRoute doit contenir un boolean.
Il permet d'activer la route `GET ${serverPath}/health`. Cette route permet de savoir si le serveur est en ligne et depuis combien de temps.
Par defaut cette valeur est true.

##### fileInfo

fileInfo doit contenir un objet filePathInfo ou undefined.
L'objet permet de definir le path du dossier sur la machine contenant les fichiers et le path virtuel du dossier.
Par defaut cette valeur est

```js
{
  folderPath: 'uploads',
  virtualPath: 'uploads'
}
```

##### serverPath

serverPath doit contenir une string. Cette string permet de definir le debut de toutes les routes de l'autoback.
Par defaut cette valeur est `api/`

##### activeLog

serverPath doit contenir un boolean. Ce boolean permet de definir si oui ou non l'autoback devra etre logger. Les logs se trouveront dans le dossier logs.
Par defaut cette valeur est true

#### Méthode start <a name="Méthode-start"></a>

La methode defineTable permet de démarrer le serveur Autoback.

```ts
autoback.start(8081)
```

##### Définition de start

```ts
async start(
  port: number = 8080
): Promise<void>
```

##### Paramétres de start

###### port

port doit contenir un nombre. Ce nombre permet de definir le port de connexion du serveur AutoBack.
Par defaut cette valeur est 8080

#### Méthode defineTable <a name="Méthode-defineTable"></a>

La methode defineTable permet de definir des tables dans Autoback.

```ts
autoback.defineTable('testTable', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  status: { type: ABDataType.BOOLEAN, defaultValue: true, allowNull: true }
}, 'testRoute')
```

##### Définition de defineTable

```ts
defineTable(
  nameTable: string,
  table: Table,
  originRoutePath?: string
): TableClass<any> | undefined
```

##### Paramétres de defineTable

###### nameTable

nameTable doit contenir une string. Cette string permet de definir le nom de la table.

###### table

table doit contenir un objet Table. Cette objet permet de definir le template de la table.

###### originRoutePath

originRoutePath doit contenir une string ou undefined. Cette string permet de definir la suite de la route. Toutes les routes qui appartiennent a cette table auront avant leur path originRoutePath. Exemple `${serverPath}/${originRoutePath}/${path_des_routes_de_cette_table}`.
Par defaut cette valeur est le nom de la table.

### Classe TableClass <a name="Classe-TableClass"></a>

#### Méthode basicRouting de la classe TableClass

La methode basicRouting permet de definir les routes de base de la table. Les routes GET POST PUT DELETE

```ts
test.basicRouting({auth: {role: ["Admin"]}})
```

##### Définition de basicRouting

```ts
basicRouting(
  getRoute: basicRouteParams = {},
  postRoute: basicRouteParams = {},
  putRoute: basicRouteParams = {},
  deleteRoute: basicRouteParams = {}
): void
```

##### Paramétres de basicRouting

getRoute, postRoute, putRoute, deleteRoute doivent contenir un objet basicRouteParams ou undefined. L'objet basicRouteParams permet de definir si la route est activer et/ou definir les role d'utilisateur qui on le droit d'accéder a cette route.
Par defaut chaque paramétres  a pour valeur

```ts
{
  active: true,
  auth: undefined
}
```

#### Méthode addRoute

La methode addRoute permet de créer une route.

```ts
test.addRoute({
    type: TypeRoute.POST,
    path: '/postTest',
    columsAccept: {
      inverse: true,
      list: ["id"]
    },
    dataAs: {
      comment: {
        where: InfoPlace.QUERYPARAMS,
        force: false
      }
    },
    auth: {
      role: ['User', 'Admin']
    }
  })
```

##### Définition de addRoute

```ts
addRoute(
  route: Route
): RouteClass | undefined
```

##### Paramétres de addRoute

###### route

route doit contenir un objet Route. Cette objet permet de definir le comportement de la route créer.

## Documentation des Interfaces

### Index des Interfaces

1. [Classe Autoback](#Classe-Autoback)
   * [Définition de Autoback](#Définition-de-Autoback)
   * [Paramétres de Autoback](#Paramétres-de-Autoback)
   * [Méthode start](#Méthode-start)
   * [Méthode defineTable](#Méthode-defineTable)
2. [Classe Autoback](#Classe-TableClass)

### Interface Route

Cette interface permet de définir une route.

```ts
let route = {
  type: TypeRoute.POST,
  path: '/postTest',
  columsAccept: {
    inverse: true,
    list: ["id"]
  },
  dataAs: {
    comment: {
      where: InfoPlace.QUERYPARAMS,
      force: false
    }
  },
  auth: {
    role: ['User', 'Admin']
  }
}
```

il a différent interface route en fonction du type de route que vous-soulez créer.

Il y a 4 types possibles de route: GET, POST, PUT, DELETE. Mais ils ont tous en commun l'interface RouteBasic.

#### Définition de RouteBasic

```ts
export interface RouteBasic {
   path: string,
   auth?: access,
   doSomething?(req: any, res: any, route: RouteClass): any
}
```

#### Paramétres de Route

##### path

path doit contenir le path de la route. Il peut etre formatter comme sur Express. Le debut du path va etre le path du serveur + le path de la table lier.

Exemple `${serverPath}/${originRoutePath}/${path_des_routes_de_cette_table}`

##### auth

auth doit contenir un access ou undefined. auth ne marchera que si la table user de l'Autoback est crée et activée.

Si l'auth est égale a undefined, l'utilisateur n'as pas besoin d'étre authentifier pour avoir acces a la route.

##### doSomething

doSomething doit contenir une fonction ou undefined.

Si doSomething n'est pas égale a undefined alors toutes les autres function du code a l'exception de JsonToDB, DBToJson, checkError, transformSet seront passées

#### Définition de Route de type GET

```ts
export type RouteGet = {
   readonly type: TypeRoute.GET,
   limit?: FilterInfo,
   offset?: FilterInfo,
   returnColumns?: acceptData,
   filters?: ListFilter,
   fileReturnWithHost?: boolean,
   beforeSend?(request: any, respond: any, routeClass: RouteGetClass<any>, datas: any[]): void,
} & RouteBasic
```

#### Paramétres de Route


### Interface Table <a name="Interface-Table"></a>