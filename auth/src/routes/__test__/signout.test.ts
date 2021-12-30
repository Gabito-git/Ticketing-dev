import  request  from "supertest";
import { app } from "../../app";

it('clears the cookie after sign out', async() => {

    await request(app)
        .post('/api/users/signup')
        .send({
            email: 'test@test.com',
            password: '123456'
        })
        .expect(201)

    const response = await request(app)
        .post('/api/users/signout')
        .send({})
        .expect(200)
        
    expect(response.get("Set-Cookie")[0]).toEqual(
        "express:sess=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly"   // una sesión vacía. Esta respuesta se econtró al hacer un console.log
    );


} )