import express, { Router ,Request,Response} from 'express';
import { UserController } from 'src/controllers/userController';
import { authMiddleware } from 'src/middlewares/auth-middleware';


const userController =  new UserController();

class UserRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/user/all/:page', authMiddleware.checkAuthentication, (req: Request,res:Response)=> userController.getAllUsers(req,res));
    this.router.get('/user/profile', authMiddleware.checkAuthentication,  (req: Request,res:Response)=> userController.getUserProfile(req,res));
    this.router.get('/user/profile/:userId', authMiddleware.checkAuthentication,  (req: Request,res:Response)=> userController.getProfileByUserId(req,res));
    this.router.get('/user/profile/posts/:username/:userId/:uId', authMiddleware.checkAuthentication,  (req: Request,res:Response)=> userController.getUserProfileAndPosts(req,res));
    this.router.get('/user/profile/user/suggestions', authMiddleware.checkAuthentication,(req: Request,res:Response)=> userController.randomUserSuggestions(req,res));
    this.router.get('/user/profile/search/:query', authMiddleware.checkAuthentication, (req: Request,res:Response)=> userController.searchUser(req,res));

    this.router.put('/user/profile/change-password', authMiddleware.checkAuthentication, (req: Request,res:Response)=> userController.changePassword(req,res));
    this.router.put('/user/profile/basic-info', authMiddleware.checkAuthentication, (req: Request,res:Response)=> userController.updateProfileBasicInfo(req,res));
    this.router.put('/user/profile/social-links', authMiddleware.checkAuthentication, (req: Request,res:Response)=> userController.updateUserSocialLinks(req,res));
    this.router.put('/user/profile/settings', authMiddleware.checkAuthentication, (req: Request,res:Response)=> userController.updateUserNotificationSettings(req,res));

    return this.router;
  }
}

export const userRoutes: UserRoutes = new UserRoutes();
