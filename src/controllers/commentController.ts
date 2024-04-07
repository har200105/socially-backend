import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { joiValidation } from 'src/middlewares/joi-validation.decorator';
import { addCommentSchema } from 'src/validators/comment';
import { CommentCache } from 'src/services/redis/comment.cache';
import { ICommentDocument, ICommentJob, ICommentNameList } from 'src/interfaces/comment.interface';
import { commentQueue } from 'src/queues/comment.queue';
import mongoose from 'mongoose';
import { commentService } from 'src/services/database/comment.service';

const commentCache: CommentCache = new CommentCache();

export class CommentController {

  @joiValidation(addCommentSchema)
  public async addComment(req: Request, res: Response): Promise<void> {
    const { userTo, postId, profilePicture, comment } = req.body;
    const commentObjectId: ObjectId = new ObjectId();
    const commentData: ICommentDocument = {
      _id: commentObjectId,
      postId,
      username: `${req.currentUser?.username}`,
      avatarColor: `${req.currentUser?.avatarColor}`,
      profilePicture,
      comment,
      createdAt: new Date()
    } as ICommentDocument;
    await commentCache.savePostCommentToCache(postId, JSON.stringify(commentData));

    const databaseCommentData: ICommentJob = {
      postId,
      userTo,
      userFrom: req.currentUser!.userId,
      username: req.currentUser!.username,
      comment: commentData
    };
    commentQueue.addCommentJob('addCommentToDB', databaseCommentData);
    res.status(200).json({ message: 'Comment created successfully' });
  }


  public async getPostComments(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const cachedComments: ICommentDocument[] = await commentCache.getCommentsFromCache(postId);
    const comments: ICommentDocument[] = cachedComments.length
      ? cachedComments
      : await commentService.getPostComments({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 });

    res.status(200).json({ message: 'Post comments', comments });
  }

  public async getPostCommentsNamesFromCache(req: Request, res: Response): Promise<void> {
    const { postId } = req.params;
    const cachedCommentsNames: ICommentNameList[] = await commentCache.getCommentsNamesFromCache(postId);
    const commentsNames: ICommentNameList[] = cachedCommentsNames.length
      ? cachedCommentsNames
      : await commentService.getPostCommentNames({ postId: new mongoose.Types.ObjectId(postId) }, { createdAt: -1 });

    res.status(200).json({ message: 'Post comments names', comments: commentsNames.length ? commentsNames[0] : [] });
  }

  public async getPostSingleComment(req: Request, res: Response): Promise<void> {
    const { postId, commentId } = req.params;
    const cachedComments: ICommentDocument[] = await commentCache.getSingleCommentFromCache(postId, commentId);
    const comments: ICommentDocument[] = cachedComments.length
      ? cachedComments
      : await commentService.getPostComments({ _id: new mongoose.Types.ObjectId(commentId) }, { createdAt: -1 });

    res.status(200).json({ message: 'Single comment', comments: comments.length ? comments[0] : [] });
  }


}
