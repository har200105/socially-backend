import express, { NextFunction, Request, Response, Router } from "express";
import { NotificationController } from "src/controllers/notificationController";
import { authMiddleware } from "src/middlewares/auth-middleware";

const notificationController = new NotificationController();

class NotificationRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get(
      "/notifications",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response, next: NextFunction) =>
        notificationController.notifications(req, res)
    );
    this.router.put(
      "/notification/:notificationId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response, next: NextFunction) =>
        notificationController.updateNotification(req, res)
    );
    this.router.delete(
      "/notification/:notificationId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response, next: NextFunction) =>
        notificationController.deleteNotification(req, res)
    );

    return this.router;
  }
}

export const notificationRoutes: NotificationRoutes = new NotificationRoutes();
