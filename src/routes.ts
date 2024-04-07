import { Application } from 'express';
import { serverAdapter } from './queues/base.queue';
import { authRoutes } from './routes/authRouter';
import { authMiddleware } from './middlewares/auth-middleware';
import { postRoutes } from './routes/postRouter';
import { reactionRoutes } from './routes/reactionRouter';
import { commentRoutes } from './routes/commentRouter';
import { followerRoutes } from './routes/followerRouter';
import { notificationRoutes } from './routes/notificationRouter';
import { imageRoutes } from './routes/imageRouter';
import { chatRoutes } from './routes/chatRouter';
import { userRoutes } from './routes/userRouter';


const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());

    app.use(BASE_PATH, authRoutes.routes());

    app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, reactionRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, commentRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, followerRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, notificationRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, imageRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, chatRoutes.routes());
    app.use(BASE_PATH, authMiddleware.verifyUser, userRoutes.routes());
  };
  routes();
};
