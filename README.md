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

## Index

1. [Installation](#Installation)
2. [Documentation des Classes](#Documentation-des-Classes)
3. [Documentation des Interfaces](#Documentation-des-Interfaces)

## Documentation des Classes <a name="Documentation-des-Classes"></a>

### Index des Classes

1. [Classe Autoback](#Classe-Autoback)
   * [Définition de Autoback](#Définition-de-Autoback)
   * [Paramétres de Autoback](#Paramétres-de-Autoback)
   * [Méthode start](#Méthode-start)
   * [Méthode defineTable](#Méthode-defineTable)
2. [Classe TableClass](#Classe-TableClass)
   * [Méthode basicRouting](#Méthode-basicRouting)
   * [Méthode addRoute](#Méthode-addRoute)

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

##### *connnectionStr*

connectionStr doit contenir la string de connexion a la base de donnée.

##### *db*

db doit contenir la classe correspondant au nom de la base donnée utilisée.
Par defaut cette valeur est `DB.POSTGRES`.

##### *auth*

auth doit contenir un objet authConfigAutoBack, un boolean ou juste undefined.

Elle permet de utiliser la table user predefinie et grace a authConfigAutoBack on peut definir le premier utilisateur de la table user.
Par defaut cette valeur est false.

##### *activeHealthRoute*

activeHealthRoute doit contenir un boolean.

Il permet d'activer la route `GET ${serverPath}/health`. Cette route permet de savoir si le serveur est en ligne et depuis combien de temps.
Par defaut cette valeur est true.

##### *fileInfo*

fileInfo doit contenir un objet filePathInfo ou undefined.

L'objet permet de definir le path du dossier sur la machine contenant les fichiers et le path virtuel du dossier.
Par defaut cette valeur est

```js
{
  folderPath: 'uploads',
  virtualPath: 'uploads'
}
```

##### *serverPath*

serverPath doit contenir une string.

Cette string permet de definir le debut de toutes les routes de l'autoback.
Par defaut cette valeur est `api/`

##### *activeLog*

serverPath doit contenir un boolean.

Ce boolean permet de definir si oui ou non l'autoback devra etre logger. Les logs se trouveront dans le dossier logs.
Par defaut cette valeur est true

#### Méthode start <a name="Méthode-start"></a>

La methode start permet de démarrer le serveur Autoback.

```js
autoback.start(8081)
```

##### Définition de start

```js
async start(
  port: number = 8080
): Promise<void>
```

##### Paramétres de start

###### *port*

port doit contenir un nombre.

Ce nombre permet de definir le port de connexion du serveur AutoBack.
Par defaut cette valeur est 8080

#### Méthode defineTable <a name="Méthode-defineTable"></a>

La methode defineTable permet de definir des tables dans Autoback.

```js
autoback.defineTable('testTable', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  status: { type: ABDataType.BOOLEAN, defaultValue: true, allowNull: true }
}, 'testRoute')
```

##### Définition de defineTable

```js
defineTable(
  nameTable: string,
  table: Table,
  originRoutePath?: string
): TableClass<any> | undefined
```

##### Paramétres de defineTable

###### *nameTable*

nameTable doit contenir une string.

Cette string permet de definir le nom de la table.

###### *table*

table doit contenir un objet [Table](#Interface-Table).

Cette objet permet de definir le template de la table.

###### *originRoutePath*

originRoutePath doit contenir une string ou undefined.

Cette string permet de definir la suite de la route. Toutes les routes qui appartiennent a cette table auront avant leur path originRoutePath. Exemple `${serverPath}/${originRoutePath}/${path_des_routes_de_cette_table}`.
Par defaut cette valeur est le nom de la table.

### Classe TableClass <a name="Classe-TableClass"></a>

TableCLass est la classe des tables créer grace à la méthode `defineTable` de la class `AutoBack` du projet Autoback. Elle permet de créer et centraliser toutes les routes lier a cette table.

#### Méthode basicRouting <a name="Méthode-basicRouting"></a>

La methode basicRouting permet de definir les routes de base de la table. Les routes GET POST PUT DELETE

```js
test.basicRouting({auth: {role: ["Admin"]}})
```

##### Définition de basicRouting

```js
basicRouting(
  getRoute: basicRouteParams = {},
  postRoute: basicRouteParams = {},
  putRoute: basicRouteParams = {},
  deleteRoute: basicRouteParams = {}
): void
```

##### Paramétres de basicRouting

getRoute, postRoute, putRoute, deleteRoute doivent contenir un objet [basicRouteParams](#Interface-basicRouteParams) ou undefined.

L'objet basicRouteParams permet de definir si la route est activer et/ou definir les role d'utilisateur qui on le droit d'accéder a cette route.
Par defaut chaque paramétres a pour valeur

```js
{
  active: true,
  auth: undefined
}
```

#### Méthode addRoute <a name="Méthode-addRoute"></a>

La methode addRoute permet de créer une route.

```js
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

```js
addRoute(
  route: Route
): RouteClass | undefined
```

##### Paramétres de addRoute

###### *route*

route doit contenir un objet [Route](#Interface-Route).

Cette objet permet de definir le comportement de la route créer.

## Documentation des Interfaces <a name="Documentation-des-Interfaces"></a>

### Index des Interfaces

1. [Interface Route](#Interface-Route)
   * [RouteBasic](#Définition-de-RouteBasic)
      * [Définition de RouteBasic](#Définition-de-RouteBasic)
      * [Paramétres de RouteBasic](#Paramétres-de-RouteBasic)
   * [Route de type GET](#Définition-de-Route-Get)
      * [Définition de Route de type GET](#Définition-de-Route-Get)
      * [Paramétres de Route de type GET](#Paramétres-de-Route-Get)
   * [Route de type POST](#Définition-de-Route-Post)
      * [Définition de Route de type POST](#Définition-de-Route-Post)
      * [Paramétres de Route de type POST](#Paramétres-de-Route-Post)
   * [Route de type PUT](#Définition-de-Route-Put)
      * [Définition de Route de type PUT](#Définition-de-Route-Put)
      * [Paramétres de Route de type PUT](#Paramétres-de-Route-Put)
   * [Route de type DELETE](#Définition-de-Route-Delete)
      * [Définition de Route de type DELETE](#Définition-de-Route-Delete)
      * [Paramétres de Route de type DELETE](#Paramétres-de-Route-Delete)
2. [Interface Table](#Interface-Table)
3. [Interface basicRouteParams](#Interface-basicRouteParams)
    * [Définition de basicRouteParams](#Définition-de-basicRouteParams)
    * [Paramétres de basicRouteParams](#Paramétres-de-basicRouteParams)

### Interface Route <a name="Interface-Route"></a>

Cette interface permet de définir une route.

```js
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

#### Définition de RouteBasic <a name="Définition-de-RouteBasic"></a>

```js
interface RouteBasic {
   path: string,
   auth?: access,
   doSomething?(req: any, res: any, route: RouteClass): any
}
```

#### Paramétres de RouteBasic <a name="Paramétres-de-RouteBasic"></a>

##### *path*

path doit contenir une string.

Cette string permet de definir le path de la route.

Il peut etre formatter comme sur Express. Le debut du path va etre le path du serveur + le path de la table lier.

Exemple `${serverPath}/${originRoutePath}/${path_des_routes_de_cette_table}`

##### *auth*

auth doit contenir un access ou undefined.

auth ne marchera que si la table user de l'Autoback est crée et activée.

Si l'auth est égale a undefined, l'utilisateur n'as pas besoin d'étre authentifier pour avoir acces a la route.

##### *doSomething*

doSomething doit contenir une fonction ou undefined.

Si doSomething n'est pas égale a undefined alors toutes les autres function du code a l'exception de JsonToDB, DBToJson, checkError, transformSet seront passées.

#### Définition de Route de type GET <a name="Définition-de-Route-Get"></a>

```js
type RouteGet = {
   readonly type: TypeRoute.GET,
   limit?: FilterInfo,
   offset?: FilterInfo,
   returnColumns?: acceptData,
   filters?: ListFilter,
   fileReturnWithHost?: boolean,
   beforeSend?(request: any, respond: any, routeClass: RouteGetClass<any>, datas: any[]): void,
} & RouteBasic
```

#### Paramétres de Route de type GET <a name="Paramétres-de-Route-Get"></a>

##### *type*

type doit contenir un TypeRoute.

Permet de définir le type de route.

##### *limit*

limit doit contenir un FilterInfo ou undefined.

Permet de définir le moyen de récuperer la valeur pour avoir définir le nombre d'objet maximum a retourner.
Si limit est undefined alors l'utilisateur n'as pas de moyen de définir le nombre d'objet maximum a retourner.

##### *offset*

offset doit contenir un FilterInfo ou undefined.

Permet de définir le moyen de récuperer la valeur pour avoir le début de sélection des objets a retourner.
Si offset est undefined alors l'utilisateur n'as pas de moyen de définir le début de sélection des objets a retourner.

##### *returnColumns*

returnColumns doit contenir un acceptData ou undefined.

Permet de définir les colonnes de la table a retourné pour chaque data.
Si returnColumns est undefined alors toutes les colonnes de la table sont retournés.

##### *filters*

filters doit contenir un ListFilter ou undefined.

Permet de définir les filtres activés.
Si filters est undefined alors juste les filtres de base des types sont activés.

##### *fileReturnWithHost*

fileReturnWithHost doit contenir un boolean ou undefined.

Si true ou undefined alors le path des fichier sera renvoyer avec l'hostname du serveur.

##### *beforeSend*

beforeSend doit contenir une fonction ou undefined.

Permet de pouvoir executée une fonction juste avant d'envoyer les données.

#### Définition de Route de type POST <a name="Définition-de-Route-Post"></a>

```js
type RoutePost = {
   readonly type: TypeRoute.POST,
   columsAccept?: acceptData,
   returnColumns?: acceptData,
   dataAs?: ListValueInfo,
   fileReturnWithHost?: boolean,
   beforeSetValue?(request: any, respond: any, routeClass: RoutePostClass<any>): void,
   beforeSend?(request: any, respond: any, routeClass: RoutePostClass<any>, data: any): void,
} & RouteBasic
```

#### Paramétres de Route de type POST <a name="Paramétres-de-Route-Post"></a>

##### *type*

type doit contenir un TypeRoute.

Permet de définir le type de route.

##### *columsAccept*

columsAccept doit contenir un acceptData ou undefined.

Permet de définir les donnée pris en compte par le serveur.
Si columsAccept est undefined alors toutes les donnée seront pris en compte.

##### *returnColumns*

returnColumns doit contenir un acceptData ou undefined.

Permet de définir les colonnes de la table a retourné pour chaque data.
Si returnColumns est undefined alors toutes les colonnes de la table sont retournés.

##### *dataAs*

dataAs doit contenir un ListValueInfo ou undefined.

Permet de chercher des informations ailleurs que dans le body et les mettre dans le body.

##### *fileReturnWithHost*

fileReturnWithHost doit contenir un boolean ou undefined.

Si true ou undefined alors le path des fichier sera renvoyer avec l'hostname du serveur.

##### *beforeSetValue*

beforeSetValue doit contenir une fonction ou undefined.

Permet de pouvoir executée une fonction juste avant d'enregistrer les données.

##### *beforeSend*

beforeSend doit contenir une fonction ou undefined.

Permet de pouvoir executée une fonction juste avant d'envoyer les données.

#### Définition de Route de type PUT <a name="Définition-de-Route-Put"></a>

```js
type RoutePut = {
   readonly type: TypeRoute.PUT,
   columsAccept?: acceptData,
   returnColumns?: acceptData,
   dataAs?: ListValueInfo,
   filters?: ListFilter,
   fileReturnWithHost?: boolean,
   beforeSetValue?(request: any, respond: any, routeClass: RoutePutClass<any>): void,
   beforeSend?(request: any, respond: any, routeClass: RoutePutClass<any>, data: any): void,
} & RouteBasic
```

#### Paramétres de Route de type PUT <a name="Paramétres-de-Route-Put"></a>

##### *type*

type doit contenir un TypeRoute.

Permet de définir le type de route.

##### *columsAccept*

columsAccept doit contenir un acceptData ou undefined.

Permet de définir les donnée pris en compte par le serveur.
Si columsAccept est undefined alors toutes les donnée seront pris en compte.

##### *returnColumns*

returnColumns doit contenir un acceptData ou undefined.

Permet de définir les colonnes de la table a retourné pour chaque data.
Si returnColumns est undefined alors toutes les colonnes de la table sont retournés.

##### *dataAs*

dataAs doit contenir un ListValueInfo ou undefined.

Permet de chercher des informations ailleurs que dans le body et les mettre dans le body.

##### *filters*

filters doit contenir un ListFilter ou undefined.

Permet de définir les filtres activés.
Si filters est undefined alors juste les filtres de base des types sont activés.

##### *fileReturnWithHost*

fileReturnWithHost doit contenir un boolean ou undefined.

Si true ou undefined alors le path des fichier sera renvoyer avec l'hostname du serveur.

##### *beforeSetValue*

beforeSetValue doit contenir une fonction ou undefined.

Permet de pouvoir executée une fonction juste avant d'enregistrer les données.

##### *beforeSend*

beforeSend doit contenir une fonction ou undefined.

Permet de pouvoir executée une fonction juste avant d'envoyer les données.

#### Définition de Route de type DELETE <a name="Définition-de-Route-Delete"></a>

```js
type RouteDelete = {
   readonly type: TypeRoute.DELETE,
   filters?: ListFilter,
   beforeDelete?(request: any, respond: any, routeClass: RouteDeleteClass<any>): void
} & RouteBasic
```

#### Paramétres de Route de type DELETE <a name="Paramétres-de-Route-Delete"></a>

##### *type*

type doit contenir un TypeRoute.

Permet de définir le type de route.

##### *filters*

filters doit contenir un ListFilter ou undefined.

Permet de définir les filtres activés.
Si filters est undefined alors juste les filtres de base des types sont activés.

##### *beforeDelete*

beforeSetValue doit contenir une fonction ou undefined.

Permet de pouvoir executée une fonction juste avant de supprimé les données.

### Interface Table <a name="Interface-Table"></a>

### Interface basicRouteParams <a name="Interface-basicRouteParams"></a>

#### Définition de basicRouteParams <a name="Définition-de-basicRouteParams"></a>

```ts
interface basicRouteParams {
   active?: boolean,
   auth?: access
}
```

#### Paramétres de basicRouteParams <a name="Paramétres-de-basicRouteParams"></a>

##### *active*

active doit contenir un boolean ou undefined.

Permet de pouvoir activer ou non une basic route.
Par défaut la value est true.

##### *auth*

active doit contenir un access ou undefined.

Permet de pouvoir définir le processus d'authenfication sur cette basic route.

