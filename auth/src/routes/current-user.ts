import {Router} from 'express';
import { currentUser } from '../middlewares/current-user';

const router = Router();

router.get('/api/users/currentuser', currentUser, (req, res) => {    
    res.send({ currentUser: req.currentUser || null  })        // req.currenUser ya viene del middleware
})                                                             // si no hay currentUser, el middleware devolverá undefined, por esto, se pone
                                                               // el || null, para que devuelve null en vez de undefined
export { router as currentUserRouter }