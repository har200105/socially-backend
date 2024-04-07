import { UploadApiResponse } from "cloudinary";
import { Request, Response } from "express";
import { Helpers } from "src/helpers";
import {
  IBgUploadResponse,
  IFileImageDocument,
} from "src/interfaces/image.interface";
import { IUserDocument } from "src/interfaces/user.interface";
import { uploads } from "src/middlewares/cloudinary-upload";
import { BadRequestError } from "src/middlewares/error-handler";
import { joiValidation } from "src/middlewares/joi-validation.decorator";
import { imageQueue } from "src/queues/image.queue";
import { imageService } from "src/services/database/image.service";
import { UserCache } from "src/services/redis/user.cache";
import { socketIOImageObject } from "src/sockets/image";
import { addImageSchema } from "src/validators/image";

const userCache: UserCache = new UserCache();

export class ImageController {

  public async getImages(req: Request, res: Response): Promise<void> {
    const images: IFileImageDocument[] = await imageService.getImages(
      req.params.userId
    );
    res.status(200).json({ message: "User images", images });
  }

  @joiValidation(addImageSchema)
  public async addProfileImage(req: Request, res: Response): Promise<void> {
    const result: UploadApiResponse = (await uploads(
      req.body.image,
      req.currentUser!.userId,
      true,
      true
    )) as UploadApiResponse;
    if (!result?.public_id) {
      throw new BadRequestError("File upload: Error occurred. Try again.");
    }
    const url = `https://res.cloudinary.com/dyamr9ym3/image/upload/v${result.version}/${result.public_id}`;
    const cachedUser: IUserDocument =
      (await userCache.updateSingleUserItemInCache(
        `${req.currentUser!.userId}`,
        "profilePicture",
        url
      )) as IUserDocument;
    socketIOImageObject.emit("update user", cachedUser);
    imageQueue.addImageJob("addUserProfileImageToDB", {
      key: `${req.currentUser!.userId}`,
      value: url,
      imgId: result.public_id,
      imgVersion: result.version.toString(),
    });
    res.status(200).json({ message: "Image added successfully" });
  }

  @joiValidation(addImageSchema)
  public async addBackgroundImage(req: Request, res: Response): Promise<void> {
    const { version, publicId }: IBgUploadResponse =
      await ImageController.prototype.backgroundUpload(req.body.image);
    const bgImageId: Promise<IUserDocument> =
      userCache.updateSingleUserItemInCache(
        `${req.currentUser!.userId}`,
        "bgImageId",
        publicId
      ) as Promise<IUserDocument>;
    const bgImageVersion: Promise<IUserDocument> =
      userCache.updateSingleUserItemInCache(
        `${req.currentUser!.userId}`,
        "bgImageVersion",
        version
      ) as Promise<IUserDocument>;
    const response: [IUserDocument, IUserDocument] = (await Promise.all([
      bgImageId,
      bgImageVersion,
    ])) as [IUserDocument, IUserDocument];
    socketIOImageObject.emit("update user", {
      bgImageId: publicId,
      bgImageVersion: version,
      userId: response[0],
    });
    imageQueue.addImageJob("updateBGImageInDB", {
      key: `${req.currentUser!.userId}`,
      imgId: publicId,
      imgVersion: version.toString(),
    });
    res.status(200).json({ message: "Image added successfully" });
  }

  private async backgroundUpload(image: string): Promise<IBgUploadResponse> {
    const isDataURL = Helpers.isDataURL(image);
    let version = "";
    let publicId = "";
    if (isDataURL) {
      const result: UploadApiResponse = (await uploads(
        image
      )) as UploadApiResponse;
      if (!result.public_id) {
        throw new BadRequestError(result.message);
      } else {
        version = result.version.toString();
        publicId = result.public_id;
      }
    } else {
      const value = image.split("/");
      version = value[value.length - 2];
      publicId = value[value.length - 1];
    }
    return { version: version.replace(/v/g, ""), publicId };
  }

  public async deleteImage(req: Request, res: Response): Promise<void> {
    const { imageId } = req.params;
    socketIOImageObject.emit("delete image", imageId);
    imageQueue.addImageJob("removeImageFromDB", {
      imageId,
    });
    res.status(200).json({ message: "Image deleted successfully" });
  }

  public async deleteBackgroundImage(
    req: Request,
    res: Response
  ): Promise<void> {
    const image: IFileImageDocument = await imageService.getImageByBackgroundId(
      req.params.bgImageId
    );
    socketIOImageObject.emit("delete image", image?._id);
    const bgImageId: Promise<IUserDocument> =
      userCache.updateSingleUserItemInCache(
        `${req.currentUser!.userId}`,
        "bgImageId",
        ""
      ) as Promise<IUserDocument>;
    const bgImageVersion: Promise<IUserDocument> =
      userCache.updateSingleUserItemInCache(
        `${req.currentUser!.userId}`,
        "bgImageVersion",
        ""
      ) as Promise<IUserDocument>;
    (await Promise.all([bgImageId, bgImageVersion])) as [
      IUserDocument,
      IUserDocument
    ];
    imageQueue.addImageJob("removeImageFromDB", {
      imageId: image?._id,
    });
    res.status(200).json({ message: "Image deleted successfully" });
  }
}
