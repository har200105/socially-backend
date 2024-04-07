import express, { Router,Request,Response } from 'express';
import { AuthController } from 'src/controllers/authController';
import { authMiddleware } from 'src/middlewares/auth-middleware';

const authController = new AuthController();

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/signup', (req:Request,res:Response)=> authController.create(req,res));
    this.router.post('/signin', (req:Request,res:Response)=> authController.signIn(req,res));
    this.router.post('/forgot-password', (req:Request,res:Response)=> authController.forgotPassword(req,res));
    this.router.post('/reset-password/:token', (req:Request,res:Response)=> authController.resetPassword(req,res));
    this.router.get('/currentuser',authMiddleware.verifyUser,authMiddleware.checkAuthentication, (req:Request,res:Response)=> authController.getCurrentUser(req,res));
    this.router.get('/signout', (req:Request,res:Response)=> authController.logout(req,res));
    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
