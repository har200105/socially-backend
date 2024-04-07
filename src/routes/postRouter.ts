import express, { Router, Request, Response } from "express";
import { PostController } from "src/controllers/postController";
import { authMiddleware } from "src/middlewares/auth-middleware";

const postController = new PostController();

class PostRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get(
      "/post/all/:page",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => postController.getAllPosts(req, res)
    );
    this.router.get(
      "/post/images/:page",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) =>
        postController.getPostsWithImages(req, res)
    );
    this.router.get(
      "/post/videos/:page",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) =>
        postController.getPostsWithVideos(req, res)
    );

    this.router.post(
      "/post",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response)=>
        postController.createPost(req,res)
    );
    this.router.post(
      "/post/image/post",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response)=>
        postController.postWithImage(req,res)
    );
    this.router.post(
      "/post/video/post",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response)=>
        postController.postWithVideo(req,res)
    );

    this.router.put(
      "/post/:postId",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response)=>
        postController.updatePostById(req,res)
    );
    this.router.put(
      "/post/image/:postId",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response)=>
        postController.updatePostWithImage(req,res)
    );
    this.router.put(
      "/post/video/:postId",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response)=>
        postController.updatePostWithVideo(req,res)
    );

    this.router.delete(
      "/post/:postId",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response)=>
        postController.deletePost(req,res)
    );

    return this.router;
  }
}

export const postRoutes: PostRoutes = new PostRoutes();
