import { INotificationDocument } from "src/interfaces/notification.inteface";
import { notificationService } from "src/services/database/notification.service";
import { Request, Response } from 'express';
import { socketIONotificationObject } from "src/sockets/notification";
import { notificationQueue } from "src/queues/notification.queue";


export class NotificationController {
    public async notifications(req: Request, res: Response): Promise<void> {
      const notifications: INotificationDocument[] = await notificationService.getNotifications(req.currentUser!.userId);
      res.status(200).json({ message: 'User notifications', notifications });
    }

    public async updateNotification(req: Request, res: Response): Promise<void> {
      const { notificationId } = req.params;
      socketIONotificationObject.emit('update notification', notificationId);
      notificationQueue.addNotificationJob('updateNotification', { key: notificationId });
      res.status(200).json({ message: 'Notification marked as read' });
    }

    public async deleteNotification(req: Request, res: Response): Promise<void> {
        const { notificationId } = req.params;
        socketIONotificationObject.emit('delete notification', notificationId);
        notificationQueue.addNotificationJob('deleteNotification', { key: notificationId });
        res.status(200).json({ message: 'Notification deleted successfully' });
    }
  }
  