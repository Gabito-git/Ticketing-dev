# Ticketing

- Luego de instalar los paquetes iniciales,  se crea el archivo tsconfig.json con la instruccion tsc --init

- Se crea el directorio src el cual contendrá todo el código

El script start del package.json, en este caso del modulo auth debe ir asi

```
"start": "ts-node-dev --poll src/index.ts"
```

ts-node-dev se emplea para poder ejecutar módulos de es6 y el --poll se usa para que no haya problemas con el refresh luego de guardar (como nodemon)

- Nota: La idea general es crear un servicio, en este caso el auth, que tenga un solo endpoint GET que devuelva un mensaje. Esto con el fin de usarlo para probar todo el andamiaje de kubernetes. Para eso, seguidamente creamos el archivo de deployment, el archivo ingress ( estos dos dentro de infra/k8s) y finalmente el archivo skaffold en la raiz del proyecto. De esta manera ejecutamos skaffold para que cree toda la estructura y podamos probar desde el navegador ese endpoint de prueba. Asi continuamos


## GOOGLE CLOUD

Se usa debido a que skkafold es desarrollado por google. La idea es tener un lugar en la nube para desarrollo de kubernetes, liberando el espacio que esto ocupa en el PC y el gasto computacional

## Como se manejan los cambios ( Synced file)

Un archivo sincronizado se refiere a los archivos que se tienen en cuenta en el campo sync del archivo skaffold.yaml

```
artifacts:
    - image: gabito83/auth
      context: auth
      docker:
        dockerfile: Dockerfile
      sync: 
        manual:
          - src: 'src/**/*.ts'
            dest: .
```

Como se observa, en este caso se refiere a todos los archivos .ts dentro del directorio src. Esto es asi por que el Google Cloud se usará para el proyecto ticketing el cual, se escribe en typescript. Este directorio SRC se encuentra dentro del directorio auth.

-  Al realizar un cambio en estos archivos sincronizados, skaffold lo actualizará dentro del pod en Google Cloud ( ver imagen GCloud/synced-file-change). Para esto, se debe realizar una configuración adicional en el archivo de configuración de skaffold, se verá más adelante

## Como se manejan los cambios ( NOT Synced file)

Al hacer este tipo de cambios, como por ejemplo instalar un paquete, lo cual actualiza el package.json, skaffold se comunicará con un servicio de GCloud llamad Google Cloud BUild. De esta manera, skaffold subirá todo el codigo fuente y el dockerfile y este servicio hará el re build de la imagen y actualizará el deployment. Esto libera poder computacional de nuestra máquina ( ver imagen GCloud/notsynced-file-change )

## Pasos a seguir para la configuración de GCloud

Para emplear GCloud en un proyecto de kubernetes se hace lo siguiente:

- Creación del proyecto:

Estando en la consola de GCloud, luego de abrir una cuenta gratuita. Damos click en la parte izquierda superior en donde se puede seleccionar el proyecto y luego, en la ventana que se abre damos en Proyecto Nuevo y se ingresa el nombre del proyecto y se le da en crear

- Creación del cluster Kubernetes

1. En el menú lateral, se busca Kubernetes Engine y luego Clusteres. Seguidamente, la primera vez, se da en habilitar. Esta acción tomará unos minutos

2. Al finalizar la habilitación, se da click en crear y luego en GKE Standar

3. Se introduce el nombre, en el caso del proyecto actual, fue el mismo nombre del proyecto ( ticketing-dev).

4. En el campo Location Type, se deja zonal y se escoje la región más cercana

5. En version de plano de control se escoje versión estática y para la versión se escogió al menos la versión 1.15

6. En el menú lateral se busca Grupo de Nodos, click en default-pool ( en donde aparece la cantidad de nodos, por defecto es 3, para el proyecto se dejó en 3) y luego click en Nodos.

7. En la sección de configuración de máquina se escoje e2-small

8. Click en Crear en la parte inferior.

## Contexto

El contexto le indica a la instrucción kubectl en qué cluster trabajar. Para nuestro caso, debemos agregar uno nuevo, GCloud ( ver archivo GCloud/kubectl-context). Para esto, se debe instalar el Google Cloud SDK

```
https://cloud.google.com/sdk/docs/quickstart-windows
```

1. Se busca el link, se descarga y se instala. Demarcar al final run gcloud init
2. En la terminal ejecutar gcloud auth login. En la ventana que se abre, escoger la cuenta de google con la que se abrió la cuenta en GCloud
3. Ejecutar ahora gcloud init y escoger la opción 1. Re initialize this configuration, escoger la cuenta de gmail nuevanemente 
4. Se pedirá escoger el proyecto de GCloud. Este será el id, no el nombre. Para ver el Id de nuestro proyecto, vamos a la consola de GCloud y damos clic en el selector de proyectos de la parte izquierda superior y ahi se verá los nombres y los id de nuestros proyectos. Seleccionamos pues en la lista de la terminal el que necesitemos
5. Dar yes en la opcíon de configurar manual zona y región ( si no aparece, ejecutar de nuevo gcloud init) y escoger la misma región escogida en la creción del cluster en GCLoud


## Seguir con Docker en local o no?

Despues de este proceso, se debe escoger si se quiere volver a ejecutar docker en local en alguna oportunidad o si por el contrario, se decide seguir con GCloud para siempre.

- Si no se quiere volver a usar docker en local nunca más se corren los siguientes:

```
gcloud components install kubectl
gcloud container clusters get-credentials <cluster name> (sin los <>)
```

- Si se quiere poder usar docker en local en el futuro, se ejecuta solo el último

## Seleccionar contexto

A partir de este punto, si se da click derecho en el icono del docker desktop en la barra de tareas, se puede ir a kubernetes y ahí se verá un nuevo contexto. Uno apunta al docker desktop y el otro a Gcloud

## Pasos a seguir

A partir de este momento se deben seguir los pasos descritos en GCloud/steps

## Habilitar Gcloud build

En el menu lateral se busca Cloud Build y se ingresa. Luego, en el nuevo menú lateral se ingresa a configuración y se busca el servicio Cloud Build y se cambia a habilitado.

Finalmente se debe ejecutar el siguiente comando para autenticar en ese sevicio:

```
gcloud auth application-default login
```

## Actualizar Skaffold para usar GCloud

```
apiVersion: skaffold/v2alpha3
kind: Config
deploy:
  kubectl:
    manifests:
      - ./infra/k8s/*
build:
  #local:
  #  push: false
  googleCloudBuild:                                       <------------
    projectId: ticketing-dev-331815                       <------------
  artifacts:
    - image: us.gcr.io/ticketing-dev-331815/auth          <------------
      context: auth
      docker:
        dockerfile: Dockerfile
      sync: 
        manual:
          - src: 'src/**/*.ts'
            dest: .
```

Se agregan las lineas marcadas. El project Id es el Id del proyecto. Arriba se dice en donde se obtiene. Tener en cuenta que este archivo está configurando un solo servicio, el auth, los demás se van poniendo dentro de artifacts.

La sección de local se elimina ya que solo se puede tener o local o en la nube, por eso aparece como comentada 

El archivo deployment del servicio tambien debe actualizarse con el nuevo nombre de la imagen, el cual lo da Google Build. Siempre lleva el prefijo us.gcr.io/ID DEL PROJECTO/NOMBRE IMAGEN

## Setting Ingress-Nginx

Teniendo seleccionado el contexto de GCloud ejecutamos lo siguiente

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.0.4/deploy/static/provider/cloud/deploy.yaml
```

Esto crea un ingress-controller y un load balancer. Este ultimo es un servicio de GCloud el cual corre por fuera del cluster

## Actualizar el host file

Tenemos que modificar este archivo para que al ingresar al host descrito en el archivo ingress-srv.yaml, esta acción nos dirija a la ip del load balancer de GCloud, el cual es nuestro punto de entrada al cluster. (ver imagen GCloud/cloud-arch)
 
Para conocer esta ip, vamos a la consola de GCloud, en el menu lateral vamos a Herramientas de Redes - Servicios de Red - Balanceo de cargas. Allí podremos ver la info del balanceador al darle click en el id ( ignorar el msj de warning en el campo backends).

La linea quedaria asi

```
35.199.114.100 ticketing.dev
```

## Ejecutar Skaffold

Ahora, teniendo el contexto de GCloud seleccionado, nos posicionamos en la carpeta del proyecto en donde está el archivo skaffold y ejecutamos skaffold dev


## Error Handling en microservicios

Se debe tener en cuenta, que en un servicio pueden existir diversas fuentes de error, por ejemplo, al validar un e-mail que no tiene el formato correcto, al validar si el e-mail ya existe o puede ser registrado, al grabar en la base de datos; sin mencionar que estos errores pueden ser producidos desde diferentes lenguajes o frameworks, pues cada servicio podría estar codificado en diferentes lenguajes. Todas estas fuentes de error deben tener la misma estructura para que pueda ser manejada por el front end.

- Asi maneja express los errores:

1. Para un route handler sincrono, es decir, en donde no existan callbacks o promesas o asyn/await dentro de su código, al ser emitido un error (throw new Error()), express lo captura y lo envía a un middleware que hayamos programado.

2. Para un route handler asincrono, se captura el error, ya sea tomandolo como parámetro del callback o mediante un bloque try/catch, y se llama la función next que cuenta por defecto cada route handler con este error, lo cual lo envía al middleware

Para un códgio de ejemplo ver Error handling/err-handling.png

- Estructura del middleware manejador de errores

Esta función debe tener cuatro parámetros err, req, res, next, de esta manera, al tener cuatro parámetros, express entenderá que este middleware se emplea para manejo de errores y de esta manera, tendremos el error en el parametro err.

```
import { NextFunction, Request, Response } from "express";

export const errorHandler = (
    err: Error, 
    req: Request, 
    res: Response, 
    next: NextFunction) => {
        console.log('Something went wrong', err);
        
        res.status(400).send({
            message: 'Something went wrong'
        })
}
```

Al realizar throw new Error('bla bla bla'), solo le podriamos pasar al middleware el mensaje 'bla bla bla' via err.message. Ya que la idea es mostrar al usuario un mensaje más completo que uno de error genérico (ver imagen  Error handling/error-structure-needs.png), se crea una carpeta errors en donde se crean los archivos que contienen clases extendidas de la clase Error. De esta manera, se pueden agregar nuevas propiedades al error, las cuales pasan al middleware y pueden ser enviadas al front-end ( ver imagen Error handling/err-flow.png).

Estas clases buscan generar un mensaje de error con una estructura determinada e igual para todas, por esto, se crea una clase abstracta que dicte dicha estructura. (ver imagen Error handling/abstract-class-philosophy). Se podría implementar una interfaz, pero la clase abstracta me da la oportunidad de que pueda ser evaluada en el middleware via instance of, de esta manera, podemos saber si el error es generico o proviene de una de nuestras clases.

De esta manera, se realiza:

```
throw new <Subclase de Error> 
```

## Paquete 'express-async-errors'

Express maneja los errores en funciones sincronas de la manera que se ha visto, al lanzar un error y lo redirijirá al middleware manejador de error ( lo reconoce por la cantidad de parámetros: 4). Sin embargo, en una función asincrona, el error debe ser lanzado a través de la función next() la cual está disponible en los route handlers por defeccto ademas del req y res. Se haría asi next( new DatabaseConnectionError() ).

Para que el manejo de errores sea el mismo en ambos casos ( a traves de un throw new Database...()), se instala el paquete express-async-errors y se importa en el index 

```
import 'express-async-errors'
```

## Mongo

En el caso del proyeto Ticketing, se va a crear una instacia de la BD mongo para cada servicio. Cada instancia corresponde a un contenedor, ya que para crear un contenedor se hace mediante un deployment, entonces, se crea el archivo deployment, en este caso auth-mongo-depl.yaml el cual contiene a su vez la creación del servicio Cluster IP

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-mongo-depl
spec:
  replicas: 1
  selector:
    matchLabels:
      app: auth-mongo
  template:
    metadata:
      labels:
        app: auth-mongo
    spec:
      containers:
        - name: auth-mongo
          image: mongo
---
apiVersion: v1
kind: Service
metadata: 
  name: auth-mongo-srv
spec:
  selector: 
    app: auth-mongo
  ports:
    - name: db
      protocol: TCP
      port: 27017
      targetPort: 27017
```

- Conectar servicio auth a Mongo:

Para realizar esto, simplemente se tiene que tener en cuenta el cambio en la cadena de conexión:

```
await mongoose.connect('mongodb://auth-mongo-srv:27017/auth'); 
```
En donde auth-mongo-srv corresponde al servicio clusterIP de nuestra instancia de Mongo (ver el código completo en el arichivo index.ts del servicio auth del proyecto ticketing)

## Mongoose + Typescript

Typescript no se maneja bien con mongoose. Se presentan principalmente dos inconvenientes:

1. Al definir un modelo de la manera tradicional, no hay manera de que typescript pueda verificar los parámetros que se pasan al crear un nuevo documento basado en ese modelo. Es decir, un modelo usuario puede contener los campos email y password pero, se podrían pasar como parámetros a lainstrucción new User() eMail y paword.

2. No hay manera, al seguir la forma tradicional, de que trypescript sepa que el nuevo usuario se crea con email y password, pero puede contener otros campos adicionales, como por ejemplo createdAt y updatedAt los cuales son creados automáticamente por mongoose

- Para resolver esto se realiza el código que se encuentra en Auth/src/models/user.ts


## Hashing password

Para esto se crea una clase con dos métodos estáticos, uno para hashear y otro para comparar al momento de hacer Signin:

```
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
 
const scryptAsync = promisify(scrypt);

export class Password{
    static async toHash(password: string){
        const salt = randomBytes(8).toString('hex');
        const buf = (await scryptAsync( password, salt, 64 )) as Buffer;

        return `${buf.toString('hex')}.${salt}`
    }

    static async compare(storedPassword: string, suppliedPassword: string){
        const [hashedPassword, salt] = storedPassword.split('.');
        const buf = (await scryptAsync( suppliedPassword, salt, 64 )) as Buffer;

        return buf.toString('hex') === hashedPassword;
    }
}

```

Se están empleando acá métodos incluidos en Node en sus librerias crypto y util

- Lo novedoso es que el hashing se implementa automáticamente al crear un usuario y previo a su almacenado en Mongo, esto mediante la implementación de un middleware dentro del modelo user:

```
userSchema.pre('save', async function(done){
    if(this.isModified('password')){                 // Mongoose considera al password modificado, asi se esté creando el usuaio por primera vez
        const hashed = await Password.toHash(this.get('password'));
        this.set('password', hashed)
    }
    done();
})

```

Esto se hace posterior a la creación del schema ( schema = new Schema....). Este código se ejecuta previo ( .pre) al guardado en Mongo

## Autenticación

Para realizar el proceso de verificación de token se seguirá un modelo en el que cada servicio tendrá la lógica para hacerlo. Aunque se repetería el codigo, esto se soluciona cargango este código desde una libreria que proximamente se va a hacer. El contra que tiene este modelo, es que si, por ejemplo, un usuario es baneado en tiempo real, la base de datos de usuarios se actualizaría poniendo por ejemplo una bandera en false que indique que el usario ya no tiene acceso, pero ese cambio no sería conocido por los demás servicios hasta que el usuario se vuelva a loguear y el propio servicio de auth lo rechace. 

Por esta razón, a pesar de estar baneado, el usuario en ese momento podria hacer lo que quisiera mientras mantuviera la sesión activa, ya que los demás servicios no tienen conexion directa con la base de datos de usuarios.

## JWT y Server Side Rendering

Una app de React "normal" se carga asi:

1. Se hace una solicitud GET desde el navegador, la cual devolvera una especie de esqueleto HTML el cual incluye etiquetas de Scripts JS.
2. Una vez cargada esa info, el navegador hace una nueva solicitud pidiendo esos archivos js para poder ser ejecutados
3. Por último, la app ya cargada, hace una petición al backend via estos archivos JS solicitando la data requerida para ser mostrada en el navegador. Es en este punto en donde es enviado el JWT para ser evaluado por el backend y asi devolver o no la data requerida

Ver diagrama auth/normal-react-app-flow

En el caso de una app React renderizada en el servidor ( Next JS) toda esta información es devuelta con la primera solicitud GET del navegador, por lo tanto, no hay espacio para que los archivos js sean ejecutados por el navegador para asi adjuntar un JWT en una solicitud al backend. (ver diagrama auth/server-side-react-app-flow).

Para solucionar esto, se debe emplear un mecanismo mediante el cual, el navegador envíe este JWT automaticamente durante esa primera peticion GET. Ese mecanismo consiste en usar una cookie, la cual es manejada automaticamente por el navegador, para enviar el JWT ( ver diagrama auth/cookie-jwt-transport ), este mecanismo es conocido como Cookie Based Authentication

## Cookie-session

Se trata del paquete que se emplea para manejar las cookies.
Cookie-session tiene una caracteristica que permite el ecryptamiento de la información que se almacena en la cookie, esto puede traernos un problema si pretendemos que el sistema de autenticación sea transparente para diferentes lenguajes (ver auth/auth-requirements.png), ya que habria que ver si cada lenguaje posee la implementación neceseria para hacer esta desencriptación. 
Ya que los JWT son info ya encriptada, no se usa entonces esta caracteristica del paquete

- Instalación

```
npm i cookie-session @types/cookie-session
```

Se debe implementar via middleware:

```
const app = express();

app.use(express.json());
app.set('trust proxy',true);                                                    <----------------
app.use(cookieSession({                                                         <----------------
    signed: false,                                                              <----------------
    secure: true               // Only will be used if visited through https(provided by nginx)    <----------------
}))
```
Mediante la línea app.set, se busca que express sea conciente que está detras de un proxy (nginx) y que confie en el trafico https que viene de ese proxy

Este middleware integra la propiedad session al objeto req

## Almacenamiento JWt en Cookie

```
req.session.jwt = token    // para javascript

req.session = {            // para typescript, ya que la interfaz de session no espera una propiedad jwt
  jwt: token
}
```

## Envío de la cookie al cliente

Una vez la información ha sido almacenada, solo es necesario que el cliente haga la petición usando el protocolo HTTPS (se configura asi al configurar el middleware en el campo "secure"), de esta manera, si observamos en Postman, tendremos en el campo cookie la información. NO es necesario hacer el envío manual, se hace automaticamente

## JWT secret key sharing with pods (Secret)

El proceso de creación de un token JWT requiere de una clave secreta. Kubernetes tiene un objeto denominado Secret en el cual podemos almacenar esta información, la cual es expuesta a los pods mediante variables de entorno ( ver diagrama auth/jwt-sharing-kubernetes-secret.png )

## Creando el secreto

Se debe ejecutar el siguiente comando, este contiene la clave valor para el JWT secret key

```
kubectl create secret <TIPO_DE_SECRETO> <NOMBRE_DEL_SECRETO>--from-literal=<LLAVE>=<VALOR>

```
Este se ejecuta en la raiz del proyecto

Un ejemplo:

```
kubectl create secret generic jwt-secret --from-literal=JWT_KEY=asdf
```

## Uso del servicio Secret en Pods

La información almacenada en el secreto, se accede mediante variables de entorno en cada pod. Para esto, se debe modificar el archivo de deployment de nuestro pod para que al realizar el deplyoment del contenedor, se cree la variable y esta acceda al valor a través del Secret, en el ejemplo auth-depl.yaml:

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-depl
spec:
  replicas: 1
  selector:
    matchLabels:
      app: auth
  template:
    metadata:
      labels:
        app: auth
    spec:
      containers:
        - name: auth
          image: us.gcr.io/ticketing-dev-331815/auth
          env:                                        <-----------------
            - name: JWT_KEY                           <-----------------   
              valueFrom:                              <-----------------
                secretKeyRef:                         <-----------------   
                  name: jwt-secret                    <----------------- // Nombre del servicio Secret
                  key: JWT_KEY                        <----------------- // Nombre de la llave
```

## Modificar el retorno de USER ( sin password,etc)

La idea general es modificar la forma en que se convierte el objeto user a json. En Javascript, este comportamiento se puede modificar al agregar una función toJSON al objeto asi:

```
const person = {nombre: "luis", toJSON(){return 1;}}
```

En este ejemplo, se tendría lo siguiente:

```
JSON.stringify(person)
>> "1"
```

Asi, javascript ejecutará la función y retornará el 1

Para nuestro caso, se debe proceder de manera un poco diferente. En el modelo se debe realizar lo siguiente:

```
const userSchema = new Schema({
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    }
}, {                                        <------------
    toJSON:{                                <------------
        transform(doc, ret){                <------------
            ret.id = ret._id;               <------------
            delete ret._id;                 <------------
            delete ret.password;            <------------
            delete ret.__v;                 <------------
        }
    }
})
```

En este caso, se está eliminando el password, el __v y se está cambiando el _id por id

## Función de la ruta currentUser

En algún punto, nuestra app de React necesitará saber si el usuario está o no logueado en nuestra aplicación. Debido a que la app no puede mirar directamente dentro de la cookie y revizar el token.

Para subsanar este problema, la app hará una petición a la ruta de current user, la cual se encargará de indicar si el usuario está logueado o no ( ver imagen Auth/current-user-route-handler)

- Nota: Al realizar la prueba con Postman o con ThunderClient, hay que entender que al hacer el Signin el servidor envía la cookie automaticamente, esta cookie es almacenada y enviada por estos programas hacia el servidor tambien automaticamente en la ruta de currentUser

## La ruta SignOut

La idea de esta ruta, es enviar al navegador un header que elimine las cookies, de esta manera, al enviar una posterior petición a current user, este devolvera null

## Agregar currentUser al objeto req (Typescript issue)

Una vez se hace el logueo de un usuario, se debe agregar al objeto req el atributo currentUser el cual almacenará el payload del usuario, esto para que pueda ser usado por los demás servicios. En Javascript esta asignación se haría de manera directa req.currentUser, pero en Typescript no se puede pues no lo reconocerá como una propiedad de req.

Para poderlo hacer, se debe agregar esta propiedad a la definición de tipos del objeto req asi:

```
declare global{
    namespace Express{
        interface Request{
            currentUser?: UserPayload;
        }
    }
}
```

En este caso, currentUser será de tipo UserPayload pues es la interfaz del payload (ver código completo en middlewares/current-user.ts)

## TESTING

La idea general es probar los servicios aisladamente. Para esto, se empleará la librería jest y la librería supertest la cual se encarga de realizar peticiones falsas al servidor express.

Supertest, se encarga de buscar un puerto aleaotrio que no esté en uso en nuestra maquina y ejecutar el servidor escuchando este puerto, esto con el fin de permitir pruebas simultaneas de diferentes servicios sin que se crucen los puertos. Por esta razón, se debe refactorizar el código del servidor express para que no escuche en ningún puerto en particular. 

La refactorizacion entonces, consiste en crear un archivo app.ts en el cual se creará la app de express, se le conectarán las diferentes rutas y middlewares globales y se exportará. Esta será importada por el index.ts y la pondrá a escuchar en un puerto en particulas para el caso de desarrollo o producción. La app.ts se empleará para que supertest la ejecute a través de un puerto escogido por la librería. ( ver diagrama test/test-code-refactor.png)

- Instalaciones necesarias:
```
npm i -D jest ts-jest supertest @types/jest @types/supertest mongodb-memory-server
```
mongodb-memory-server se encarga de instalar una copia de Mongo DB exclusiva para testing. 

Ya que estos son paquetes empleados unicamente en desarrollo y debido a que el de mongo tiene un peso de unos 80Mb, no queremos que sean reinstalados por skaffold cada que necesitemos hacer re build de la imagen. Para esto, se modifica el Dockerfile asi:

```
FROM node:alpine

WORKDIR /app

COPY package.json .
 
RUN npm install --only=prod      <------------

COPY . .

CMD ["npm", "start"]
```

- Configuración del ambiente:

Se modifica el archivo package.json asi: 

```
"scripts": {
    "start": "NODE_ENV=dev ts-node-dev --poll src/index.ts",           <---------
    "test": "set NODE_ENV=test&& jest --watchAll --no-cache"          <---------
  },    
  "jest": {                                       <---------
    "preset": "ts-jest",                          <---------
    "testEnvironment": "node",                    <---------
    "setupFilesAfterEnv": [                       <---------
      "./src/test/setup.ts"                       <---------
    ]
  },
```
- Nota: Se está seteando la variable de entorno en start mediante la sintaxis de linux ya que ese start se da dentro del pod y en test mediante la sintaxis de windows (esto lo hice yo, pienso que está bien por que la variable NODE_ENV no aparecía seteada). Se hace debido a un inconveniente al realizar la prueba de revisar si al enviar unas credenciales validas se adjunta un header de tipo Set-Cookie, es decir, la cookie. Ya que supertest no envia la peticion via HTTPS sino via HTTP entonces la cookie no es adjuntada. En este caso, tambien se debe cambiar la configuración del middleware cookiesession asi:

```
app.use(cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test'      <-----        // true if environment is dev or prod, false if it is test
}))  
```

De esta manera, si estamos en pruebas dará false y la prueba pasará


Se crea la carpeta test dentro de src y dentro, el archivo setup.ts con todas las configuraciones para las pruebas. Ver archivo 

- Ejecución de una prueba

En el caso del ejemplo, se prueba el archivo signup.ts. Para esto, se crea un directorio __test__ dentro del mismo directorio del archivo signup y dentro de el se crea el archivo de prueba sigunup.test.ts (ver prueba en el archivo en cuestion)

Para ejecutar la prueba, en la consola dentro de la carpeta del servicio, en este caso auth, se corre npm run test

## NEXT JS

Mediante el método que emplea una app en React para renderizar una página web, inicialmente el cliente hace una solicitud GET al servidor, la cual irá a nuestra app en React, esta devolverá un esquema HTML muy básico. Seguidamente, el cliente pedirá los archivos Js necesarios para renderizar el resto y la app los enviará, si estos archivos contienen algún fetch de data, el cliente hará está nueva request para pedir la data y finalizar el renderizado. (ver imagen nextjs/traditional-react-rendering.png)

Mediante el Server Side Rendering que proporciona NextJs, el cliente hará una petición al servidor, la cual irá a nuestra app Next y está internamente hará las peticiones necesarias para devolver la página renderizada al completo con esta primera petición ( ver imagen nextjs/ssr-approach )

- Configuración:

1. Crear la carpeta client en el root del proyecto ticketing
2. Crear el archivo package.json mediante npm init -y
3. Instalar las siguientes dependencias

```
npm i react react-dom next
```

4. crear un script en el package.json para arrancar el proyecto:

```
"dev": "next"
```

- Nota: El enrutamiento que hace NextJs es bastante particular. Si creamos una carpeta pages en el root del proyecto y dentro creamos archivos js con componentes exportados por defecto, Nextjs tomará el nombre de estos archivos como rutas. De esta manera, el index.js seria el landing page y, por ejemplo, banana.js se accedería mediante http://localhost:3000/banana

- Imagen

Seguidamente, se debe configurar la imagen correspondiente creando los archivos Dockerfile y .dockerignore

Dockerfile:

```
FROM node:alpine

WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

CMD ["npm", "run", "dev"]
```

.dockerignore

```
node_modules
.next
```

- Push de la imagen

Luego de esto se debe hacer el build de la imagen y el posterior push a docker hub
```
docker build -t gabito83/client .     // Esto se corre dentro del folder client
```

```
docker push
```
- Archivo depl

Se crea el archivo client-depl.yaml dentro de la carpeta infra/k8s

```
apiVersion: apps/v1
kind: Deployment
metadata:
  name: client-depl
spec:
  replicas: 1
  selector:
    matchLabels:
      app: client
  template:
    metadata:
      labels:
        app: client
    spec:
      containers: 
        - name: client
          image: gabito83/client
---
apiVersion: v1
kind: Service
metadata: 
  name: client-srv
spec:
  selector:   ## how the service is going to find the pod
    app: client
  ports:
    - name: client  ## just for reporting proposes
      protocol: TCP
      port: 3000
      targetPort: 3000
```
- Skaffold configuration

Se debe agregar la configuración para que skaffold haga el seguimiento a los cambios que se vayan haciendo dentro de client

skaffold.yaml

```
artifacts:
    - image: gabito83/auth
      context: auth
      docker:
        dockerfile: Dockerfile
      sync: 
        manual:
          - src: 'src/**/*.ts'
            dest: .
    - image: gabito83/client        <----------
      context: client               <----------
      docker:                       <----------
        dockerfile: Dockerfile      <----------
      sync:                         <----------
        manual:                     <----------
          - src: '**/*.js'          <----------
            dest: .                 <----------
```

- Agregar ruta a ingress

```
paths:
  - path: /api/users/?(.*)
    pathType: Prefix
    backend: 
      service:
        name: auth-srv
        port: 
          number: 3000
  - path: /?(.*)                   <----------   
    pathType: Prefix               <----------
    backend:                       <----------
      service:                     <----------
        name: client-srv           <----------
        port:                      <----------
          number: 3000             <----------

```

- Nota: Los paths que recibe ingres desde el cliente son consultados en esta lista en orden de arriba a abajo. El path que se acaba de agregar indica que todo lo que reciba lo envíe al cliente, como el de api está primero lo evaluará primero y si no hace match, enviará el trafico al path de abajo. Si estuviera al revés, todo el trafico iria siempre al cliente

- Nota: Next js en ocasiones tiene problemas para actualizarse cuando hay un cambio de código si se esta corriendo dentro de un contenedor. Para asegurar el cambio, se crea un archivo next.config.js en la raiz del cliente:

```
module.exports = {
    webpackDevMiddleware: config => {
        config.watchOptions.poll = 300;
        return config;
    }
}
```

- Incluir archivo global de estilos

Cuando se quiera incluir un archivo global de estilos, por ejemplo el styles.scss de sass, en nuestra app de Next, este debe ser importado dentro del archivo app.js de Next. Ya que este archivo no se encuentra expuesto como si lo está en React, se debe crear uno personalizado y hacer la importación allí. Para el proyecto se empleará Bootstrap

Instalación de bootstrap:

```
npm i bootstrap
```

El archivo se debe llamar _app.js y se ubicará dentro de la carpeta pages la cual es la que contiene los diferentes componentes del proyecto y debería ser creada en el root de client

```
import 'bootstrap/dist/css/bootstrap.css'

export default ({ Component, pageProps  }) => {
    return <Component {...pageProps}/>
} 
```
Se trata de un componente que encierra a cualquier componente a ser renderizado, ese es el comportamiento de Next. Component se refiere al componente a renderizar y pageProps las props que se le quieran pasar a ese componente. Para mayor info:

```
https://github.com/vercel/next.js/blob/master/errors/css-global.md

```

- Naturaleza de SSR

En la aplicación de ticketing, cuando se recibe la petición get inicial a nuestra app next, se mostrará un contenido u otro dependiendo si se está logueado o no. Para esto, se debe realizar una petición a la ruta auth/currentuser para determinarlo. Ya que Next Js devuelve un componente completamente renderizado luego de esa primera petición desde el cliente, para ejecutar la petición al current user, debe hacerse previo al renderizado del componente. Para esto se usa el método getInitialProps. Esa es la unica manera de hacer fetch de data durante el proceso de renderizado

La idea es que Next ejecuta inicalmente este método del lado del servidor una sola vez y la data que se obtenga como resultado es pasada automaticamente al componente como props (ver next/ssr-nextjs.png), ejemplo:

index.js

```
const LandingPage = ({ color }) => {
    console.log('Estoy del lado del cliente ', color );
    return <h1>Landing Page</h1>
}

LandingPage.getInitialProps = () => {
    console.log('Estoy en el lado del servidor')
    return { color: 'red'}
}

export default LandingPage;
```

Al hacer la petición desde el navegador al root de nuestra aplicación, para el caso a ticketing.dev, primero se ejecutará el método estático getInitialProps del lado del servidor. En la consola del navegador veremos solo el msj "estoy del lado del cliente red" mientras que en la consola del servidor ( la ventana cmd ) veremos los dos mensajes. 

- Problema al ejecutar el getInitialProps desde el servidor

Partiendo de lo anterior, el código entonces debería ser el siguiente:

```
import axios from 'axios';

const LandingPage = ({ currentUser }) => {
    console.log(currentUser)
    return <h1>Landing Page</h1>
}

LandingPage.getInitialProps = async() => {
    const response = await axios.get('/api/users/currentuser')
   
    return response.data
}

export default LandingPage;
```
en este caso, recibiriamos por las props la respuesta de la api la cual sería un objeto currentUser en null si no se está legueado o con la info si lo está. Al ejecutar el código de esta manera, se nos presenta un gran error Error: connect ECONNREFUSED 127.0.0.1:80. Para entender el error se debe inicialmente entender que esta peticióon se esta haciendo desde el lado del servidor, es decir desde el cluster de kubernetes

Si la linea de código de axios la ejecutamos desde el componente (petición desde el cliente), en vez de desde getInitialProps (peticion desde el servidor) el proceso funciona, por que? 

- Por qué funciona? 

Ver imagen nextjs/fetch-request-from-server.png

Inicialmente, al ejecutar ticketing.dev desde el navegador, se hace la petición GET al dominio ticketing.dev. El pc internamente convierte este dominio a 127.0.0.1:80 ( gracias a la modificación hecha en el archivo host del sistema operativo ). Esta acción nos conecta con Ingress Nginx y este, al ver que es una petición sin ningun path extra, solo el root, redirige a nuestro cliente ( gracias a las reglas establecidas en ingress-srv.yaml).

Nuestra app cliente devuelve una pagina html para ser mostrada, en este caso el título loading page y una vez esta es renderizada en el navegador, se hace la peticion a 'api/users/currentuser'. Aclarar acá, que el navegador completa la petición de manera automatica al mismo dominio en el cual se está trabajando, es decir 'http://ticketing.dev:80/api/users/currentuser y nuesto pc lo transforma a 'http://127.0.0.1:80/api/users/currentuser.

Esta ruta le indica a ingress nginx que enrute hacia nuestro auth service y este responde la petición con el current user.

Ahora, por que no funciona con el código que se mostró arriba el cual envía la petición desde el servidor? 

- Por que no funciona desde el servidor? 

ver imagen nextjs/fetch-from-server-wrong.png

Al hacer la petición como se debe hacer, desde el método getInitialProps mediante la instrucción que para nosotros sería la correcta 

```
const response = await axios.get('/api/users/currentuser')
```
pasaría lo siguiente:

Una vez se hace la petición GET inicial desde el navegador a ticketing.dev, esta es convertida a 127.0.0.1:80 e ingress la tramita hacia nuestro cliente. Este ejecuta el método y hace la petición. Como dentro del cluster nuestro dominio sería localhost, esta petición es completada por node a http://localhost:80/api/users/currentuser. El problema se dá en que dentro de nuestro cluster, no hay ningún endpoint escuchando en localhost y por eso se da el error Error: connect ECONNREFUSED 127.0.0.1:80.

- Dos posibles soluciones:

ver imagen nextjs/solutions-to-fetch-from-server

La solución menos viable sería la # 2. En esta, la comunicación se hace directamente a través del nombre del servicio cluster ip del pod al cual nos queramos conectar, en este caso http://auth-srv/api/users/currentuse (el nombre del servicio lo definimos en el archivo auth-depl.yaml). El problema radica en que ademas de conocer la ruta del endpoint (api/users/currentuser) tambien debemos conocer el nombre del servicio cluster ip del pod en el que se encuentra, en este caso auth-srv.

La solución # 1 radica en apuntar a ingres nginx y que este a traves del endpoint que le enviamos encuentre el servicio al cual nos queremos comunicar ( asi se hace cuando hacemos el fetch desde el navegador ). Lo dificil es saber cual es el nombre del servicio de ingress al cual debemos apuntar. La comunicación entre pods se da a través del nombre del servicio cluster ip que nosotros le configuramos en el archivo depl (auth-srv, mongo-srv), esto es posible ya que estos se encuentran en el mismo namespace, pero, entre pods e ingres es diferente pues este ultimo se encuentra en otro namespace (ver imagen nextjs/namespaces.png).

- Como conectar con otro namespace

La ruta es la siguiente: http://nameofservice.namespace.svc.cluster.local. Para conocer los namespaces disponibles en el momento se emplea:

```
kubectl get namespace
```
Al ejecutar este comando, se podrá observar que uno de los namespace es ingress-ngix. Ahora, para saber el nombre del servicio debemos acceder al namespace del cual queremos consultar los servicios. Al hacer el comando kubectl get services accedemos al namespace por defecto, en el que se encuentra los pods, pero en nuestro caso sería asi:

```
kubectl get services -n ingress-ngx  
```

en donde ingress-ngx es el nombre del namespace que encontramos con el comando anterior. Allí nos referimos al que se encuentre bajo el type loadbalancer, en este caso ingress-nginx-controller. En total seria:

```
'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser'
```

- Cuando se llama el método getInitialProps

Según lo descrito hasta el momento, se tiene claro que la petición de axios tendría una estructura cuando es llamada desde el navegador y otra cuando es llamada desde el servidor. Tambien está claro, que si nuestra petición es requerida para renderizar el componente inicialmente, esta debe ir en el método getInitialProps. Podriamos decir entonces que la esctructura corta de axios iria en el componente ( cuendo el fetch se hace posterior al renderizado inicial ) y la estructura larga en el getInitialProps. Pero no es asi.

getInitialProps es llamado no solo por el servidor, si no tambien por el cliente, de esta manera, si tenemos la estructura larga solamente y, el metodo es llamado por el cliente nos dará un error y si tenemos la corta y es llamado por el servidor, tambien nos dará un error. 

El método es llamado por el servidor cuando:

1. Se hace un refresh de la página
2. Cuando se accede a la página mediante el click de un link en un dominio diferente
3. Cuando se accede a la pagina digitando su url en el navegador

El método es llamado por el cliente cuando:

1. Se navega a la página desde otra página de la misma aplicación (como es el caso del redireccionamiento luego de un login exitoso, por ejemplo)

Por esta razón, se debe escribir una lógica para identificar desde donde está siendo llamado el método para aplicar la estructura de axios que corresponda.

```
LandingPage.getInitialProps = async() => {
    if( typeof window === 'undefined' ){
        
        const { data } = await axios.get(
            'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser',{
                headers:{
                    Host: 'ticketing.dev'
                }
            }
        )     

        return data
    }else{
        const { data } = await axios.get( '/api/users/currentuser' );

        return data
    }
}
```
Acá podemos ver, que adicional a esto, cuando se hace una petición desde el servidor, se debe especificar el parámetro headers. Esto se debe a que al ser hecha la petición desde el servidor, ingress no sabe a qué dominio se quiere acceder, por lo tanto no puede aplicar las reglas de enrutamiento establecidas en ingress-srv.yaml. Cuando la petición es hecha desde el navegador, esta ya va identificando http://ticketing.dev.... entonces por esto no hay que poner los headers

- Adjuntar la cookie

Como se sabe, la cookie es adjuntada automaticamente por el navegador al momento de hacer la petición ( la cookie es enviada por el servidor al momento de autenticarse ), pero, cuando la peitición se hace desde el servidor, esta debe ser adjuntada manualmente. Para esto, se accede al objeto req en los parametros del método getInitialProps y a su propiedad req.headers. Allí se encuentra tanto la cookie como el host, de esta manera, podemos resumirlo asi:

```
LandingPage.getInitialProps = async({ req }) => {
    if( typeof window === 'undefined' ){        
        const { data } = await axios.get(
            'http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser',{
                headers: req.headers
            }
        )     

        return data
    }else{
        const { data } = await axios.get( '/api/users/currentuser' );

        return data
    }
}
```

## Refactoring código getInitialProps

Ya que las ventanas de signin, signup e index compartirían un header, con la única diferencia de que en el caso de index este mostraría unas opciones diferentes al de los otros dos. Para poder mostrar un contenido diferente en cada caso, se usa el currentUser.

Por esta razón, la idea es hacer la petición inicial de currentUser desde la custom app ( la que envuelve al resto ) para asi, pasarla a los diferentes componentes hacia abajo. El problema es que los props que se le pasan al método getInitialProps son diferentes para las páginas que para la custom app ( ver imagen next/getInitialProps-props.png).

Según se analiza en la imagen, si se quiere pasar el objeto { req, res } al buildClient, este debe pasarse asi ( appContext.ctx ).

A pesar de tener el getInitialProps en la custom app, tambien se debería garantizar que los getInitialProps de las pages puedan ser ejecutados, lo cual no se hace si se configura el getInitialProps en la custom app. Para resolver esto, lo que se hace es invocar el metodo getInitialProps del landingPage en este caso, en la custom app y que esta info sea pasada hacia abajo (ver imagen next/getInitialProps-props-global.png)

Agregado a _app.js

```
AppComponent.getInitialProps = async( appContext ) => {
   const { data } = await buildClient( appContext.ctx ).get('/api/users/currentuser');

   let pageProps = {};

   if( appContext.Component.getInitialProps ){
       pageProps = await appContext.Component.getInitialProps( appContext.ctx );
   }

   return{
       pageProps,
       ...data
   }
}

export default AppComponent
```

En este caso, podemos ver dos cosas:

1. Ejecución del getInitialProps de appComponent en la primera linea.
2. Ejecución del getInitialProps de los componentes de las pages mediante appContext.Component.getInitialProps. Se le pasa como argumento el appContext.ctx el cual corresponde al objetp { req, res }.
3. Validación en el caso de que el componente de la page no tenga definido un método getInitialProps, lo cual, sin este condicional, arrojaría un error

- Nota: esa información retornada será pasada como pageProps en el componente customizado app. De esta manera, en el componente se desesctructura pageProps y currentUser (el cual viene de ...data ya que data solo trae dentro el objeto currentUser)

_app.js
```
const AppComponent = ({ Component, pageProps, currentUser  }) => {
    return (
        <div>
            <h1>Header!!! { currentUser.email }</h1>
            <Component {...pageProps}/>
        </div>
    )
} 
```

- Resumen: Necesitamos una forma de mostrar un componente Header en todas las páginas pero con algunas diferencias en el Landing Page dependiendo si existe currentUser (está logueado) o no. Para esto, ubicamos en componente Header dentro de nuestro app customizada, la cual es la que envuelve a los componentes de las pages, lo cual, hace que el header sea visible en todas estás páginas. Para personalizar el header según sea el caso, necesitamos que el objeto current user sea accesible desde la app customizada, para esto, ejecutamos en este archivo el método getInitialProps con un fetch al servidor pidiendo el currentUser (lo mismo que en el landingPage). Esta acción inhabilita a los componentes hijos a ejecutar su propio getInitialProps, lo  cual, podría llegar a ser necesario. Para corregir esto, se accede a las propiedades que son pasadas al getInitialProps de la app customizada, las cuales son diferentes a las que son pasadas a los getInitialProps de las pages (ver imagen next/getInitialProps-props.png). Dentro de estas propiedades, se encuentra Component, el cual refiere al componente que se monta en un momento dado. Mediante Component.getInitialProps se accede al método en cuestion de ese componente y se ejecuta pasandole las propiedades que el recibiria normalmente al ser ejecutado directamente desde las pages (appContext.ctx, lo cual es igual a { req, res }). Se pone un condicional ya que de lo contrario, si el componente que está siendo montado o llamado en ese momento no tiene definido el método getInitialProps daría un error. Finalmente, tanto la data adquirida por la ejecución del getInitialProps del componente hijo (pageProps), como la data adquirida mediante el getInitialProps de la app customizada (...data lo que es igual a { currentUser  }) se retornan y son desestructuradas en las props de la app customizadas y pasadas hacia abajo