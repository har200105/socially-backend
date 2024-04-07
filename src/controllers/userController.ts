import { Request, Response } from "express";
import moment from "moment";
import publicIP from "ip";
import {
  basicInfoSchema,
  changePasswordSchema,
  notificationSettingsSchema,
  socialLinksSchema,
} from "src/validators/user";
import { joiValidation } from "src/middlewares/joi-validation.decorator";
import { BadRequestError } from "src/middlewares/error-handler";
import { IAuthDocument } from "src/interfaces/auth.interface";
import { authService } from "src/services/database/auth.service";
import { userService } from "src/services/database/user.service";
import {
  IAllUsers,
  IResetPasswordParams,
  ISearchUser,
  IUserDocument,
} from "src/interfaces/user.interface";
import { resetPasswordTemplate } from "src/services/emails/templates/reset-password/reset-password-template";
import { emailQueue } from "src/queues/email.queue";
import { IFollowerData } from "src/interfaces/follower.interface";
import { followerService } from "src/services/database/follower.service";
import mongoose from "mongoose";
import { postService } from "src/services/database/post.service";
import { IPostDocument } from "src/interfaces/post.interface";
import { Helpers } from "src/helpers";
import { PostCache } from "src/services/redis/post.cache";
import { FollowerCache } from "src/services/redis/follower.cache";
import { UserCache } from "src/services/redis/user.cache";
import { userQueue } from "src/queues/user.queue";

const PAGE_SIZE = 12;

interface IUserAll {
  newSkip: number;
  limit: number;
  skip: number;
  userId: string;
}

const postCache: PostCache = new PostCache();
const userCache: UserCache = new UserCache();
const followerCache: FollowerCache = new FollowerCache();

export class UserController {
  @joiValidation(changePasswordSchema)
  public async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      throw new BadRequestError("Passwords do not match.");
    }
    const existingUser: IAuthDocument = await authService.getAuthUserByUsername(
      req.currentUser!.username
    );
    const passwordsMatch: boolean = await existingUser.comparePassword(
      currentPassword
    );
    if (!passwordsMatch) {
      throw new BadRequestError("Invalid credentials");
    }
    const hashedPassword: string = await existingUser.hashPassword(newPassword);
    userService.updatePassword(`${req.currentUser!.username}`, hashedPassword);

    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format("DD//MM//YYYY HH:mm"),
    };
    const template: string =
      resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.addEmailJob("changePassword", {
      template,
      receiverEmail: existingUser.email!,
      subject: "Password update confirmation",
    });
    res.status(200).json({
      message:
        "Password updated successfully. You will be redirected shortly to the login page.",
    });
  }

  public async getAllUsers(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip: number = (parseInt(page) - 1) * PAGE_SIZE;
    const limit: number = PAGE_SIZE * parseInt(page);
    const newSkip: number = skip === 0 ? skip : skip + 1;
    const allUsers = await UserController.prototype.allUsers({
      newSkip,
      limit,
      skip,
      userId: `${req.currentUser!.userId}`,
    });
    const followers: IFollowerData[] = await UserController.prototype.followers(
      `${req.currentUser!.userId}`
    );
    res
      .status(200)
      .json({
        message: "Get users",
        users: allUsers.users,
        totalUsers: allUsers.totalUsers,
        followers,
      });
  }

  public async getUserProfile(req: Request, res: Response): Promise<void> {
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(
      `${req.currentUser!.userId}`
    )) as IUserDocument;
    const existingUser: IUserDocument = cachedUser
      ? cachedUser
      : await userService.getUserById(`${req.currentUser!.userId}`);
    res.status(200).json({ message: "Get user profile", user: existingUser });
  }
  

  public async getProfileByUserId(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(
      userId
    )) as IUserDocument;
    const existingUser: IUserDocument = cachedUser
      ? cachedUser
      : await userService.getUserById(userId);
    res
      .status(200)
      .json({ message: "Get user profile by id", user: existingUser });
  }

  public async getUserProfileAndPosts(
    req: Request,
    res: Response
  ): Promise<void> {
    const { userId, username, uId } = req.params;
    const userName: string = Helpers.firstLetterUppercase(username);
    const cachedUser: IUserDocument = (await userCache.getUserFromCache(
      userId
    )) as IUserDocument;
    const cachedUserPosts: IPostDocument[] =
      await postCache.getUserPostsFromCache("post", parseInt(uId, 10));

    const existingUser: IUserDocument = cachedUser
      ? cachedUser
      : await userService.getUserById(userId);
    const userPosts: IPostDocument[] = cachedUserPosts.length
      ? cachedUserPosts
      : await postService.getPosts({ username: userName }, 0, 100, {
          createdAt: -1,
        });

    res
      .status(200)
      .json({
        message: "Get user profile and posts",
        user: existingUser,
        posts: userPosts,
      });
  }

  public async randomUserSuggestions(
    req: Request,
    res: Response
  ): Promise<void> {
    let randomUsers: IUserDocument[] = [];
    const cachedUsers: IUserDocument[] =
      await userCache.getRandomUsersFromCache(
        `${req.currentUser!.userId}`,
        req.currentUser!.username
      );
    if (cachedUsers.length) {
      randomUsers = [...cachedUsers];
    } else {
      const users: IUserDocument[] = await userService.getRandomUsers(
        req.currentUser!.userId
      );
      randomUsers = [...users];
    }
    res.status(200).json({ message: "User suggestions", users: randomUsers });
  }

  private async allUsers({
    newSkip,
    limit,
    skip,
    userId,
  }: IUserAll): Promise<IAllUsers> {
    let users;
    let type = "";
    const cachedUsers: IUserDocument[] = (await userCache.getUsersFromCache(
      newSkip,
      limit,
      userId
    )) as IUserDocument[];
    if (cachedUsers.length) {
      type = "redis";
      users = cachedUsers;
    } else {
      type = "mongodb";
      users = await userService.getAllUsers(userId, skip, limit);
    }
    const totalUsers: number = await UserController.prototype.usersCount(type);
    return { users, totalUsers };
  }

  private async usersCount(type: string): Promise<number> {
    const totalUsers: number =
      type === "redis"
        ? await userCache.getTotalUsersInCache()
        : await userService.getTotalUsersInDB();
    return totalUsers;
  }

  private async followers(userId: string): Promise<IFollowerData[]> {
    const cachedFollowers: IFollowerData[] =
      await followerCache.getFollowersFromCache(`followers:${userId}`);
    const result = cachedFollowers.length
      ? cachedFollowers
      : await followerService.getFollowerData(
          new mongoose.Types.ObjectId(userId)
        );
    return result;
  }

  public async searchUser(req: Request, res: Response): Promise<void> {
    const regex = new RegExp(Helpers.escapeRegex(req.params.query), "i");
    const users: ISearchUser[] = await userService.searchUsers(regex);
    res.status(200).json({ message: "Search results", search: users });
  }

  @joiValidation(basicInfoSchema)
  public async updateProfileBasicInfo(
    req: Request,
    res: Response
  ): Promise<void> {
    for (const [key, value] of Object.entries(req.body)) {
      await userCache.updateSingleUserItemInCache(
        `${req.currentUser!.userId}`,
        key,
        `${value}`
      );
    }
    userQueue.addUserJob("updateBasicInfoInDB", {
      key: `${req.currentUser!.userId}`,
      value: req.body,
    });
    res.status(200).json({ message: "Updated successfully" });
  }

  @joiValidation(socialLinksSchema)
  public async updateUserSocialLinks(
    req: Request,
    res: Response
  ): Promise<void> {
    await userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      "social",
      req.body
    );
    userQueue.addUserJob("updateSocialLinksInDB", {
      key: `${req.currentUser!.userId}`,
      value: req.body,
    });
    res.status(200).json({ message: "Updated successfully" });
  }

  @joiValidation(notificationSettingsSchema)
  public async updateUserNotificationSettings(
    req: Request,
    res: Response
  ): Promise<void> {
    await userCache.updateSingleUserItemInCache(
      `${req.currentUser!.userId}`,
      "notifications",
      req.body
    );
    userQueue.addUserJob("updateNotificationSettings", {
      key: `${req.currentUser!.userId}`,
      value: req.body,
    });
    res
      .status(200)
      .json({
        message: "Notification settings updated successfully",
        settings: req.body,
      });
  }
}
