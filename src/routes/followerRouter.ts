import express, { Router, Request, Response } from "express";
import { FollowerController } from "src/controllers/followerController";
import { authMiddleware } from "src/middlewares/auth-middleware";

const followerController = new FollowerController();

class FollowerRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get(
      "/user/following",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) =>
        followerController.getUserFollowing(req, res)
    );
    this.router.get(
      "/user/followers/:userId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) =>
        followerController.getUserFollowers(req, res)
    );

    this.router.put(
      "/user/follow/:followerId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) =>
        followerController.addFollower(req, res)
    );
    this.router.put(
      "/user/unfollow/:followeeId/:followerId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) =>
        followerController.removeFollower(req, res)
    );
    this.router.put(
      "/user/block/:followerId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) =>
        followerController.block(req, res)
    );
    this.router.put(
      "/user/unblock/:followerId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) =>
        followerController.unblock(req, res)
    );

    return this.router;
  }
}

export const followerRoutes: FollowerRoutes = new FollowerRoutes();
