import  request  from "supertest";
import { app } from "../../app";

it('responds with details about the current user', async()=>{   
    
    // Lo que se hace acá, es hacer uso de una función global creada en el archivo test/setup.ts. Esta función
    // se encarga de hacer un request post a sign up y retornar la cookie para que pueda ser adjuntada en la
    // petición a currentuser, ya que supertest no lo hace automaticamente
    const cookie = await global.signup();

    const response = await request(app)
        .get('/api/users/currentuser')
        .set('Cookie', cookie)
        .send()

    expect(response.body.currentUser.email).toEqual('test@test.com')
    
})

it('responds with null if not authenticated', async() => {

    const response = await request(app)
    .get('/api/users/currentuser')    
    .send()
    .expect(200)

    expect(response.body.currentUser).toEqual(null);
})