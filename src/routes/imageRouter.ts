import express, { Router, Request, Response } from "express";
import { ImageController } from "src/controllers/imageController";
import { authMiddleware } from "src/middlewares/auth-middleware";

const imageController = new ImageController();

class ImageRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get(
      "/images/:userId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => imageController.getImages(req, res)
    );
    this.router.post(
      "/images/profile",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response) => imageController.addProfileImage(req,res)
    );
    this.router.post(
      "/images/background",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response) => imageController.addBackgroundImage(req,res)
    );
    this.router.delete(
      "/images/:imageId",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response) => imageController.deleteImage(req,res)
    );
    this.router.delete(
      "/images/background/:bgImageId",
      authMiddleware.checkAuthentication,
      (req:Request,res:Response) => imageController.deleteBackgroundImage(req,res)
    );

    return this.router;
  }
}

export const imageRoutes: ImageRoutes = new ImageRoutes();
