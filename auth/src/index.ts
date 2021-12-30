import mongoose from 'mongoose';
import { app } from './app';

const start = async() => {

    if(!process.env.JWT_KEY){
        throw new Error("JWT_KEY must be defined");     // Se verifica si la variable está seteada durante el proceso de inicio, la otra forma
    }                                                   // sería checkear en la ruta pero entonces el error se daría al usar la ruta y lo mejor 
                                                        // es que se de al arranque

    try {
        await mongoose.connect('mongodb://auth-mongo-srv:27017/auth'); 
        console.log('Connected to MongoDB');       
    } catch (error) {
        console.log(error)
    }

    app.listen(3000, () => {
        console.log('listening on port 3000!!!');
    })
}

start()
