import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../app';
import  request  from "supertest";

// Método para agregar el método signup a l objeto global
declare global {
    function signup(): Promise<string[]>;    
}

let mongo: any;

// Conecta a Mongo en memoria antes de todo
beforeAll(async () => {
    process.env.JWT_KEY = 'whatever';         // Se setea debido a que en el proceso de signup es llamada, entonces la necesitamos

    mongo = await MongoMemoryServer.create();
    const mongoUri = mongo.getUri();

    await mongoose.connect(mongoUri);
} )

// Antes de cada test, borra todas las colecciones
beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();

    for(let collection of collections){
        await collection.deleteMany({});
    }
})

// Este código me estaba dando error de timeout en la prueba de envío de la cookie

// afterAll(async() => {
//     await mongo.stop();
//     await mongoose.connection.close()
// })  


// otra manera de hacer esto es creando esta función en un archivo aparte, exportarla e importarla en 
// donde se necesite
global.signup = async() => {
    const email = "test@test.com";
    const password = "123456"

    const response = await request(app)
        .post('/api/users/signup')
        .send({email, password})
        .expect(201)

    const cookie = response.get('Set-Cookie');

    return cookie;
}