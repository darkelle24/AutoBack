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

## Documentation

### Class Autoback

Autoback est la classe principale du projet Autoback. Elle permet de centraliser toutes les tables créées et les routes liées a ces table.

#### Définition de Autoback

```ts
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

#### Paramétres de Autoback

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

### Méthode start de la classe AutoBack

La methode defineTable permet de démarrer le serveur Autoback.

```ts
autoback.start(8081)
```

#### Définition de start

```ts
async start(
  port: number = 8080
): Promise<void>
```

#### Paramétres de start

##### port

port doit contenir un nombre. Ce nombre permet de definir le port de connexion du serveur AutoBack.
Par defaut cette valeur est 8080

### Méthode defineTable de la classe AutoBack

La methode defineTable permet de definir des tables dans Autoback.

```ts
autoback.defineTable('testTable', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  status: { type: ABDataType.BOOLEAN, defaultValue: true, allowNull: true }
}, 'testRoute')
```

#### Définition de defineTable

```ts
defineTable(
  nameTable: string,
  table: Table,
  originRoutePath?: string
): TableClass<any> | undefined
```

#### Paramétres de defineTable

##### nameTable

nameTable doit contenir une string. Cette string permet de definir le nom de la table.

##### table

table doit contenir un objet Table. Cette objet permet de definir le template de la table.

##### originRoutePath

originRoutePath doit contenir une string ou undefined. Cette string permet de definir la suite de la route. Toutes les routes qui appartiennent a cette table auront avant leur path originRoutePath. Exemple `${serverPath}/${originRoutePath}/${path_des_routes_de_cette_table}`.
Par defaut cette valeur est le nom de la table.

### Méthode basicRouting de la classe TableClass

La methode basicRouting permet de definir les routes de base de la table. Les routes GET POST PUT DELETE

```ts
test.basicRouting({auth: {role: ["Admin"]}})
```

#### Définition de basicRouting

```ts
basicRouting(
  getRoute: basicRouteParams = {},
  postRoute: basicRouteParams = {},
  putRoute: basicRouteParams = {},
  deleteRoute: basicRouteParams = {}
): void
```

#### Paramétres de basicRouting

getRoute, postRoute, putRoute, deleteRoute doivent contenir un objet basicRouteParams ou undefined. L'objet basicRouteParams permet de definir si la route est activer et/ou definir les role d'utilisateur qui on le droit d'accéder a cette route.
Par defaut chaque paramétres  a pour valeur

```ts
{
  active: true,
  auth: undefined
}
```
