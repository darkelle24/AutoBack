# Autoback

```ts
import { DB } from "../_helpers/models/modelsDb"
import { AutoBack } from "./autoBack"

const autoback = new AutoBack("postgres://postgres:password@localhost:5432/test", DB.POSTGRES)

autoback.activeAuth({
  config: {
    basicUser: {
      username: 'admin',
      password: 'adminTest24',
      email: 'darkelle24@gmail.com',
      role: 'Admin'
    }
}})

const test = autoback.defineTable('testTable', {
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  status: { type: ABDataType.BOOLEAN, defaultValue: true, allowNull: true }
})

autoback.setUpTables()

test.basicRouting({auth: {role: ["Admin"]}})

autoback.start(8081)
```

## Index

1. [Installation](#Installation)
2. [Ordre](#Ordre)
2. [Documentation des Classes](#Documentation-des-Classes)
3. [Documentation des Interfaces](#Documentation-des-Interfaces)

## Installation <a name="Installation"></a>

Il s'agit d'un module Node.js disponible via le registre npm.

S'il s'agit d'un tout nouveau projet, assurez-vous de créer d'abord un ```package.json``` avec la commande ```npm init```.

L'installation se fait à l'aide de la commande ```npm install``` :

```
npm install autoback
```

## Ordre <a name="Ordre"></a>

[Création de la classe Autoback](#Classe-Autoback) -> [Définition des tables](#Méthode-defineTable) et/ou [Activer l'authentification](#Méthode-activeAuth) -> [Appelle de setUpTables](#Méthode-setUpTables) -> [Définition des customs route](#Méthode-addRoute) et/ou [Définition des basics route](#Méthode-basicRouting) -> [Allumage du serveur](#Méthode-start)

## Documentation des Classes <a name="Documentation-des-Classes"></a>

### Index des Classes

1. [Classe Autoback](#Classe-Autoback)
   * [Définition de Autoback](#Définition-de-Autoback)
   * [Paramétres de Autoback](#Paramétres-de-Autoback)
   * [Méthode start](#Méthode-start)
   * [Méthode defineTable](#Méthode-defineTable)
   * [Méthode setUpTables](#Méthode-setUpTables)
   * [Méthode activeAuth](#Méthode-activeAuth)
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

#### Méthode setUpTables <a name="Méthode-setUpTables"></a>

La methode setUpTables permet de finaliser la création des tables dans Autoback.
Aprés l'appelle de cette fonction vous pourrez definir des routes mais plus définir des tables

```js
autoback.setUpTables()
```

#### Méthode activeAuth <a name="Méthode-activeAuth"></a>

La methode activeAuth permet de definir des tables dans Autoback.

```js
autoback.activeAuth({
  config: {
    basicUser: {
      username: 'admin',
      password: 'adminTest24',
      email: 'zoulou@gmail.com',
      role: 'Admin'
    }
}})
```

##### Définition de activeAuth

```js
activeAuth(
  auth?: authConfigAutoBack | boolean,
  userDefine: Table = userTableDefine,
  userTableClass: typeof UserTableClass = UserTableClass,
  mergeUserDefine: boolean = true
): void
```

##### Paramétres de activeAuth

###### *auth*

auth doit contenir un objet [authConfigAutoBack](#Interface-authConfigAutoBack), un boolean ou juste undefined.

Elle permet de utiliser la table user predefinie et grace a [authConfigAutoBack](#Interface-authConfigAutoBack) on peut definir le premier utilisateur de la table user.
Par defaut cette valeur est false.

###### *userDefine*

userDefine doit contenir un objet [Table](#Interface-Table) ou juste undefined.

Elle permet de pouvoir définir les colonnes de la table User.
Par defaut cette valeur est
```js
{
  id: { type: ABDataType.BIGINT, primaryKey: true, autoIncrement: true },
  username: { type: ABDataType.STRING, unique: true },
  password: { type: ABDataType.STRING, validate: { isStrongPassword: { minLength: 6, maxLength: 20, minLowercase: 1, minUppercase: 0, minNumbers: 1, minSymbols: 0 }}, transformSet: (value: string, table: UserTableClass<any>) => { return table.getHash().update(value).digest('hex') } },
  email: { type: ABDataType.STRING, validate: {isEmail: true} },
  phone: { type: ABDataType.STRING, allowNull: true },
  role: {type: ABDataType.STRING, validate: { equals: {comparaison: ["Admin", "SuperAdmin"]}}}
}
```
Chaque valeur manquante sera remplacer par celle par défaut grace à [loadash merge](https://lodash.com/docs/#merge).

###### *userTableClass*

userDefine doit contenir une classe non construite de type UserTableClass ou juste undefined.

Permet de définir le comportement de la table User.
Par defaut cette valeur est UserTableClass.

###### *mergeUserDefine*

userDefine doit contenir un boolean ou juste undefined.

Permet de définir si le `userDefine` va merge avec les valeurs par defauts.
Par defaut cette valeur est `true`.

### Classe TableClass <a name="Classe-TableClass"></a>

TableCLass est la classe des tables créer grace à la [méthode defineTable](#Méthode-defineTable) de la [classe Autoback](#Classe-Autoback) du projet Autoback. Elle permet de créer et centraliser toutes les routes lier a cette table.

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

L'objet [basicRouteParams](#Interface-basicRouteParams) permet de definir si la route est activer et/ou definir les role d'utilisateur qui on le droit d'accéder a cette route.
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
   * [Définition de Table](#Définition-de-Table)
3. [Interface dataTableInfo](#Interface-dataTableInfo)
   * [Définition de dataTableInfo](#Définition-de-dataTableInfo)
   * [Paramétres de dataTableInfo](#Paramétres-de-dataTableInfo)
4. [Interface dataLinkTable](#Interface-dataLinkTable)
   * [Définition de dataLinkTable](#Définition-de-dataLinkTable)
   * [Paramétres de dataLinkTable](#Paramétres-de-dataLinkTable)
5. [Interface basicRouteParams](#Interface-basicRouteParams)
   * [Définition de basicRouteParams](#Définition-de-basicRouteParams)
   * [Paramétres de basicRouteParams](#Paramétres-de-basicRouteParams)
6. [Interface access](#Interface-access)
   * [Définition de access](#Définition-de-access)
   * [Paramétres de access](#Paramétres-de-access)
7. [Interface authConfigAutoBack](#Interface-authConfigAutoBack)
   * [Définition de authConfigAutoBack](#Définition-de-authConfigAutoBack)
   * [Paramétres de authConfigAutoBack](#Paramétres-de-authConfigAutoBack)
8. [Interface userTableConfig](#Interface-userTableConfig)
   * [Définition de userTableConfig](#Définition-de-userTableConfig)
   * [Paramétres de userTableConfig](#Paramétres-de-userTableConfig)
9. [Interface acceptData](#Interface-acceptData)
   * [Définition de acceptData](#Définition-de-acceptData)
   * [Paramétres de acceptData](#Paramétres-de-acceptData)
10. [Interface ListFilter](#Interface-ListFilter)
    * [Définition de ListFilter](#Définition-de-ListFilter)
11. [Interface FilterInfo](#Interface-FilterInfo)
    * [Définition de FilterInfo](#Définition-de-FilterInfo)
    * [Paramétres de FilterInfo](#Paramétres-de-FilterInfo)
12. [Interface ListValueInfo](#Interface-ListValueInfo)
    * [Définition de ListValueInfo](#Définition-de-ListValueInfo)
13. [Interface ValueInfo](#Interface-ValueInfo)
    * [Définition de ValueInfo](#Définition-de-ValueInfo)
    * [Paramétres de ValueInfo](#Paramétres-de-ValueInfo)

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

Il y a 4 types possibles de route: GET, POST, PUT, DELETE. Mais ils ont tous en commun l'interface [RouteBasic](#Définition-de-RouteBasic).

#### Définition de RouteBasic <a name="Définition-de-RouteBasic"></a>

```ts
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

auth doit contenir un [access](#Interface-access) ou undefined.

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

limit doit contenir un [FilterInfo](#Interface-FilterInfo) ou undefined.

Permet de définir le moyen de récuperer la valeur pour avoir définir le nombre d'objet maximum a retourner.
Si limit est undefined alors l'utilisateur n'as pas de moyen de définir le nombre d'objet maximum a retourner.

##### *offset*

offset doit contenir un [FilterInfo](#Interface-FilterInfo) ou undefined.

Permet de définir le moyen de récuperer la valeur pour avoir le début de sélection des objets a retourner.
Si offset est undefined alors l'utilisateur n'as pas de moyen de définir le début de sélection des objets a retourner.

##### *returnColumns*

returnColumns doit contenir un [acceptData](#Interface-acceptData) ou undefined.

Permet de définir les colonnes de la table a retourné pour chaque data.
Si returnColumns est undefined alors toutes les colonnes de la table sont retournés.

##### *filters*

filters doit contenir un [ListFilter](#Interface-ListFilter) ou undefined.

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

columsAccept doit contenir un [acceptData](#Interface-acceptData) ou undefined.

Permet de définir les donnée pris en compte par le serveur.
Si columsAccept est undefined alors toutes les donnée seront pris en compte.

##### *returnColumns*

returnColumns doit contenir un [acceptData](#Interface-acceptData) ou undefined.

Permet de définir les colonnes de la table a retourné pour chaque data.
Si returnColumns est undefined alors toutes les colonnes de la table sont retournés.

##### *dataAs*

dataAs doit contenir un [ListValueInfo](#Interface-ListValueInfo) ou undefined.

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

columsAccept doit contenir un [acceptData](#Interface-acceptData) ou undefined.

Permet de définir les donnée pris en compte par le serveur.
Si columsAccept est undefined alors toutes les donnée seront pris en compte.

##### *returnColumns*

returnColumns doit contenir un [acceptData](#Interface-acceptData) ou undefined.

Permet de définir les colonnes de la table a retourné pour chaque data.
Si returnColumns est undefined alors toutes les colonnes de la table sont retournés.

##### *dataAs*

dataAs doit contenir un [ListValueInfo](#Interface-ListValueInfo) ou undefined.

Permet de chercher des informations ailleurs que dans le body et les mettre dans le body.

##### *filters*

filters doit contenir un [ListFilter](#Interface-ListFilter) ou undefined.

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

filters doit contenir un [ListFilter](#Interface-ListFilter) ou undefined.

Permet de définir les filtres activés.
Si filters est undefined alors juste les filtres de base des types sont activés.

##### *beforeDelete*

beforeSetValue doit contenir une fonction ou undefined.

Permet de pouvoir executée une fonction juste avant de supprimé les données.

### Interface Table <a name="Interface-Table"></a>

#### Définition de Table <a name="Définition-de-Table"></a>

```ts
interface Table {
  [key: string]: dataTableInfo | dataLinkTable
}
```

C'est un dictionnaire js qui va contenir des string en key et en value des [dataTableInfo](#Interface-dataTableInfo) ou [dataLinkTable](#Interface-dataLinkTable)

### Interface dataTableInfo <a name="Interface-dataTableInfo"></a>

#### Définition de dataTableInfo <a name="Définition-de-dataTableInfo"></a>

```ts
interface dataTableInfo {
  type: ABDataType,
  primaryKey?: boolean,
  autoIncrement?: boolean,
  allowNull?: boolean,
  initValue?: any,
  defaultValue?: any,
  neverShow?: boolean,
  unique?: boolean,
  keepOldValue?: boolean,
  transformSet?(value: any, table: TableClass<any>): any
  transformGet?(value: any, table: TableClass<any>): any,
  validate?: ModelValidator
}
```

#### Paramétres de dataTableInfo <a name="Paramétres-de-dataTableInfo"></a>

##### *type*

type doit contenir un ABDataType.

Permet de pouvoir définir le type de donnée enregistrer dans cette colonne.

##### *primaryKey*

primaryKey doit contenir un boolean ou undefined.

Permet de définir si cette colonne est la primary key de la table.
Si undefined alors primaryKey est égale a false.

##### *autoIncrement*

autoIncrement doit contenir un boolean ou undefined.

Permet de définir si cette colonne doit s'auto incrementé pour chaque valeur ajouter. Fonctionne que si le type de la collonne est de type nombre.
Si undefined alors autoIncrement est égale a false.

##### *allowNull*

allowNull doit contenir un boolean ou undefined.

Permet de définir si l'utilisateur peut ne rien envoyer ou envoyer null pour cette colonne.
Si undefined alors allowNull est égale a false.

##### *initValue*

initValue doit contenir une valeur ou undefined.

Permet de définir si l'utilisateur créer une nouvelle entrer de mettre des valeur initial si l'utilisateur n'as pas défini encore une valeur.
Par defaut initValue est égale à undefined.

##### *defaultValue*

defaultValue doit contenir une valeur ou undefined.

Permet de définir si l'utilisateur envoie null ou undefined pour cette colonne de mettre une valeur.
Par defaut defaultValue est égale à undefined.

##### *neverShow*

neverShow doit contenir un boolean ou undefined.

Permet de définir si la valeur ne sera jamais dans les reponses en recursives et normal.
Par defaut neverShow est égale à false.

##### *unique*

unique doit contenir une boolean ou undefined.

Permet de définir si l'utilisateur peut envoyer plusieurs fois la meme valeur.
Par defaut unique est égale à false.

##### *keepOldValue*

keepOldValue doit contenir une boolean ou undefined.

Permet de définir si l'utilisateur envoye null a pour cette colonne de garder l'ancienne valeur.
Par defaut keepOldValue est égale à true.

##### *transformSet*

transformSet doit contenir une fonction ou undefined.

Permet de définir d'executer une fonction avant l'execution de la fonction dataTypeInfo.JsonToDB mais aprés validate.
Par defaut transformSet est égale à undefined.

##### *transformGet*

transformGet doit contenir une fonction ou undefined.

Permet de définir d'executer une fonction aprés l'execution de la fonction dataTypeInfo.DBToJson.
Par defaut transformGet est égale à undefined.

##### *validate*

validate doit contenir une [ModelValidator](#Interface-ModelValidator) ou undefined.

Permet de définir de défénir des contrainte sur les données entrente dans cette colonne en plus de celle imposer par les ABDataType.
Par defaut validate est égale à .

### Interface dataLinkTable <a name="Interface-dataLinkTable"></a>

#### Définition de dataLinkTable <a name="Définition-de-dataLinkTable"></a>

```ts
type dataLinkTable = {
  tableToLink: string,
  columnsLink: string,
  type: ABDataType.TABLE_LINK | ABDataType.MULTIPLE_LINK_TABLE ,
  onDelete?: DeleteAction,
  rename?: string,
  multipleResult?: boolean
} & dataTableInfo
```

dataLinkTable herite de [dataTableInfo](#Interface-dataTableInfo)

#### Paramétres de dataLinkTable <a name="Paramétres-de-dataLinkTable"></a>

##### *tableToLink*

tableToLink doit contenir un string. tableToLink doit etre le nom d'une table.

Permet de définir la table qui sera lier a cette colonne.

##### *columnsLink*

columnsLink doit contenir un string.

Permet de définir la colonne qui sera utiliser pour trouver les comparée les donnée dans la table lier.

Par exemple `columnsLink = 'id'` permettera de chercher grace a l'id les donnée que l'utilisateur a stocker dans la table lier.

##### *type*

columnsLink doit contenir un `ABDataType.TABLE_LINK` ou `ABDataType.MULTIPLE_LINK_TABLE`.

Permet de définir si il y a plusieur lien a une meme table grace a `ABDataType.MULTIPLE_LINK_TABLE` ou si type est egale a `ABDataType.TABLE_LINK` alors il y a qu un seul lien dans l'autre table.

##### *onDelete*

onDelete doit contenir soit `DELETE`, `SET_DEFAULT`, `SET_NULL`.

`DELETE` si la / les lignes liées sont détruite alors le lien sera supprimer seront supprimer.
`SET_DEFAULT` si la / les lignes liées sont détruite alors le lien sera remis a la valeur par defaut.
`SET_NULL` si la / les lignes liées sont détruite alors le lien sera egale a null.

Par default onDelete est egale a DELETE.

##### *rename*

rename doit contenir une string ou undefined.

Permet de renommer la colonne quandd la ligne est renvoyer a l'utilisateur.
Par defaut rename est égale à undefined.

##### *multipleResult*

multipleResult doit contenir une boolean ou undefined.

Permet de de definir si quand la ligne est renvoyer a l'utilisateur d'afficher plusieur resultat sous la forme d'une array.
Par defaut rename est égale à true.

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

active doit contenir un [access](#Interface-access) ou undefined.

Permet de pouvoir définir le processus d'authenfication sur cette basic route.

### Interface access <a name="Interface-access"></a>

#### Définition de access <a name="Définition-de-access"></a>

```ts
export interface access {
  role?: string[],
  inverse?: boolean
}
```

#### Paramétres de access <a name="Paramétres-de-access"></a>

##### *role*

role doit contenir un string[] ou undefined.

Permet de défénir les role qui auront accés a la route.
Si undefined alors tous les roles sont acceptée.
Par défaut la valeur est undefined.

##### *inverse*

inverse doit contenir un boolean ou undefined.

Permet d'inverser la séléction des roles.
Par exemple, si role est undefined alors tous les roles sont refusée.
Par défaut la value est false.

### Interface authConfigAutoBack <a name="Interface-authConfigAutoBack"></a>

#### Définition de authConfigAutoBack <a name="Définition-de-authConfigAutoBack"></a>

```ts
interface authConfigAutoBack {
  config?: userTableConfig,
  getRoute?: basicRouteParams,
  postRoute?: basicRouteParams,
  putRoute?: basicRouteParams,
  deleteRoute?: basicRouteParams
}
```

#### Paramétres de authConfigAutoBack <a name="Paramétres-de-authConfigAutoBack"></a>

##### *config*

config doit contenir un [userTableConfig](#Interface-userTableConfig) ou undefined.

Permet de définir la configuration des compte. Voir plus dans le chapitre lié a [userTableConfig](#Interface-userTableConfig).
Par défaut la valeur de config est

```js
  tokenSecret: "wVmNfh6YPJMHtwtbj0Wa43wSh3cvJpoKqoQzZK8QbwjTGEVBNYO8xllNQC2G0U7lfKcVMK5lsn1Tshwl",
  passwordSecret: "pBvhLoQrwTKyk9amfwSabc0zwh5EuV7DDTYpbGG4K52vV9WGftSDhmlz90hMvASJlHk1azg24Uvdturqomx819kz10NS9S",
  expiresIn: "7 days",
  roles: ["SuperAdmin", "Admin", "User"],
  basicUser: auth.basicUser
```

##### *getRoute*

getRoute doivent contenir un objet [basicRouteParams](#Interface-basicRouteParams) ou undefined.

L'objet [basicRouteParams](#Interface-basicRouteParams) permet de definir si la route est activer et/ou definir les role d'utilisateur qui on le droit d'accéder a cette route.

##### *postRoute*

postRoute doivent contenir un objet [basicRouteParams](#Interface-basicRouteParams) ou undefined.

L'objet [basicRouteParams](#Interface-basicRouteParams) permet de definir si la route est activer et/ou definir les role d'utilisateur qui on le droit d'accéder a cette route.

##### *putRoute*

putRoute doivent contenir un objet [basicRouteParams](#Interface-basicRouteParams) ou undefined.

L'objet [basicRouteParams](#Interface-basicRouteParams) permet de definir si la route est activer et/ou definir les role d'utilisateur qui on le droit d'accéder a cette route.

##### *deleteRoute*

deleteRoute doivent contenir un objet [basicRouteParams](#Interface-basicRouteParams) ou undefined.

L'objet [basicRouteParams](#Interface-basicRouteParams) permet de definir si la route est activer et/ou definir les role d'utilisateur qui on le droit d'accéder a cette route.

### Interface userTableConfig <a name="Interface-userTableConfig"></a>

#### Définition de userTableConfig <a name="Définition-de-userTableConfig"></a>

```ts
interface userTableConfig {
  readonly tokenSecret?: string,
  readonly passwordSecret?: string,
  expiresIn?: string,
  roles?: string[],
  basicUser?: {
    username: string,
    password: string,
    email: string,
    phone?: number,
    role: string
  }
}
```

#### Paramétres de userTableConfig <a name="Paramétres-de-userTableConfig"></a>

##### *tokenSecret*

tokenSecret doit contenir un string ou undefined.

Permet de définir le secret dans laquel les token seront crypter.

##### *passwordSecret*

passwordSecret doit contenir un string ou undefined.

Permet de définir le secret dans laquel les password seront crypter.

##### *expiresIn*

passwordSecret doit contenir un string ou undefined.

Permet de définir la durée de vie du token.

##### *roles*

roles doit contenir un string[] ou undefined.

Permet de définir les role possible.

##### *basicUser*

basicUser doit contenir un objet ou undefined.

Permet de créer un utilisateur a la création de la data base.

### Interface acceptData <a name="Interface-acceptData"></a>

#### Définition de acceptData <a name="Définition-de-acceptData"></a>

```ts
interface acceptData {
    list?: string[] | null,
    inverse?: boolean
}
```

#### Paramétres de acceptData <a name="Paramétres-de-acceptData"></a>

##### *list*

list doit contenir un string[] ou undefined ou null.

Permet de défénir la liste des donnée qui sont accepter.
Si undefined alors tous les donnée sont acceptée a l'exception de la primaryKey.
Si null alors tous les donnée sont acceptée a l'exception de la primaryKey.

##### *inverse*

inverse doit contenir un boolean ou undefined.

Permet d'inverser la liste.
Par défaut la value est false.

### Interface ListFilter <a name="Interface-ListFilter"></a>

#### Définition de ListFilter <a name="Définition-de-ListFilter"></a>

```ts
interface ListFilter {
  [columnsName: string]: FilterOperators
}
```

C'est un dictionnaire js qui va contenir des string en key qui corresponde au nom des colonne de la [Table](#Interface-Table) et en value des FilterOperators

### Interface FilterInfo <a name="Interface-FilterInfo"></a>

#### Définition de FilterInfo <a name="Définition-de-FilterInfo"></a>

```ts
interface FilterInfo {
  name?: string
  where?: InfoPlace,
  transformValue?(value: any): any
}
```

#### Paramétres de FilterInfo <a name="Paramétres-de-FilterInfo"></a>

##### *name*

name doit contenir un string ou undefined.

Permet de définir le nom de la donnée qui sera sélectionner.
Par défaut la value est `{nom_de_la_colonne}_{name_du_filtre}`.

##### *where*

where doit contenir un InfoPlace ou undefined.

Permet de définir l'endroit ou est stocker la donnée.
Par défaut la value est `InfoPlace.QUERYPARAMS`.

##### *transformValue*

transformValue doit contenir un fonction ou undefined.

Permet d'executer une fonction quand la donnée sera recupérer.
Par défaut la value est `transform` de `dataTypeInfo` si `transformValue` est égale undefined et `dataTypeInfo.transform` est différent de undefined.

### Interface ListValueInfo <a name="Interface-ListValueInfo"></a>

#### Définition de ListValueInfo <a name="Définition-de-ListValueInfo"></a>

```ts
interface ListValueInfo {
   [columnsName: string]: ValueInfo
}
```

C'est un dictionnaire js qui va contenir des string en key qui corresponde au nom des colonne de la [Table](#Interface-Table) et en value des [ValueInfo](#Interface-ValueInfo)