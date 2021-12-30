
import express from 'express';
import 'express-async-errors';
import { NotFoundError } from './errors/not-found-error';
import { errorHandler } from './middlewares/error-handler';

import cookieSession from 'cookie-session';

import { currentUserRouter } from './routes/current-user';
import { signinRouter } from './routes/signin';
import { signoutRouter } from './routes/signout';
import { signupRouter } from './routes/signup';

const app = express();


app.use(express.json());
app.set('trust proxy',true);
app.use(cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test'              // true if environment is dev or prod, false if it is test
}))                                                              // Asegura el envío automatico de la cookie solo a traves de HTTPS if true



app.use(currentUserRouter);
app.use(signinRouter);
app.use(signupRouter);
app.use(signoutRouter);

app.all('*', async() => {
    throw new NotFoundError();
})

app.use(errorHandler);

export { app };