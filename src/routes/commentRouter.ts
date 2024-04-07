import express, { Router, Request, Response } from "express";
import { CommentController } from "src/controllers/commentController";
import { authMiddleware } from "src/middlewares/auth-middleware";

const commentController = new CommentController();

class CommentRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get(
      "/post/comments/:postId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => commentController.getPostComments(req, res)
    );
    this.router.get(
      "/post/commentsnames/:postId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => commentController.getPostCommentsNamesFromCache(req, res)
    );
    this.router.get(
      "/post/single/comment/:postId/:commentId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => commentController.getPostSingleComment(req, res)
    );

    this.router.post(
      "/post/comment",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => commentController.addComment(req, res)
    );

    return this.router;
  }
}

export const commentRoutes: CommentRoutes = new CommentRoutes();
