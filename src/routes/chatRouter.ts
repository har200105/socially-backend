import express, { Router, Request, Response } from "express";
import { ChatController } from "src/controllers/chatController";
import { authMiddleware } from "src/middlewares/auth-middleware";

const chatController = new ChatController();

class ChatRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get(
      "/chat/message/conversation-list",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) =>
        chatController.getConversationList(req, res)
    );

    this.router.get(
      "/chat/message/user/:receiverId",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => chatController.getMessages(req, res)
    );

    this.router.post(
      "/chat/message",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => chatController.addMessage(req, res)
    );
    this.router.post(
      "/chat/message/add-chat-users",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => chatController.addChatUsers(req, res)
    );
    this.router.post(
      "/chat/message/remove-chat-users",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => chatController.removeChatUsers(req, res)
    );
    this.router.put(
      "/chat/message/mark-as-read",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => chatController.updateChatMessage(req, res)
    );
    this.router.put(
      "/chat/message/reaction",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => chatController.addMessagereaction(req, res)
    );
    this.router.delete(
      "/chat/message/mark-as-deleted/:messageId/:senderId/:receiverId/:type",
      authMiddleware.checkAuthentication,
      (req: Request, res: Response) => chatController.markMessageAsDeleted(req, res)
    );

    return this.router;
  }
}

export const chatRoutes: ChatRoutes = new ChatRoutes();
