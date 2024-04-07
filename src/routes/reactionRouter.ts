import express, { Router ,Request,Response} from 'express';
import { ReactionController } from 'src/controllers/reactionController';
import { authMiddleware } from 'src/middlewares/auth-middleware';



const reactionController = new ReactionController();

class ReactionRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    
    this.router.get('/post/reactions/:postId', authMiddleware.checkAuthentication, (req:Request,res:Response) => (req:Request,res:Response) => reactionController.getReactions(req,res));
    
    this.router.get(
      '/post/single/reaction/username/:username/:postId',
      authMiddleware.checkAuthentication,
      (req:Request,res:Response) => (req:Request,res:Response) => reactionController.singleReactionByUsername(req,res)
    );

    this.router.get('/post/reactions/username/:username', authMiddleware.checkAuthentication, 
    (req:Request,res:Response) => (req:Request,res:Response) => reactionController.reactionsByUsername(req,res));

    this.router.post('/post/reaction', authMiddleware.checkAuthentication, 
    (req:Request,res:Response) => (req:Request,res:Response) => reactionController.addReaction(req,res));

    this.router.delete(
      '/post/reaction/:postId/:previousReaction/:postReactions',
      authMiddleware.checkAuthentication,
      (req:Request,res:Response) => (req:Request,res:Response) => reactionController.removeReaction(req,res)
    );

    return this.router;
  }
}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes();
