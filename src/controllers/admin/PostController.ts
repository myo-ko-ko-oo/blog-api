import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import { errorCode } from "../../config/errorCode";
import { createError } from "../../utilities/error";
import slugify from "slugify";

import {
  createNewPost,
  deletePostByPostId,
  getKeysByPostId,
  getPostByPostId,
  getSectionByPostId,
  updateImageUrlAndKey,
  updatePostModel,
} from "../../models/postModel";
import {
  checkCoverFile,
  checkMaximumFiles,
  checkSectionFiles,
} from "../../utilities/post";

import {
  deleteFromS3ByKey,
  optimizeAndUploadImages,
  optimizeAndUploadSingle,
} from "../../utilities/awsImageS3";

interface CustomRequest extends Request {
  userId?: number;
}

export const createPost = [
  body("title", "Title is Required").trim().notEmpty().escape(),
  body("type", "Invalid Type of language")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Required Language")
    .escape(),
  body("mainContent", "Content is Required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => sanitizeHtml(value)),
  body("sections", "Sections must be an array").isArray().optional(),
  body("categories", "Category is Required").notEmpty().isArray({ min: 1 }),
  body("tags").optional().isArray(),
  body("tags.*.name", "Tag name is invalid.")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((name: string) => name.trim() !== "");
      }
      return value;
    }),

  // Sanitize each section content
  body("sections.*.content", "invalid Section Content")
    .optional({ nullable: true })
    .trim()
    .customSanitizer((value) => sanitizeHtml(value)),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const files = req.files as {
      coverImage?: Express.Multer.File;
      sectionImages?: Express.Multer.File[];
    };

    const coverFile = files.coverImage?.[0];
    const sectionFiles = files.sectionImages || [];

    checkCoverFile(coverFile);
    checkSectionFiles(sectionFiles);

    //upload to aws S3
    const uploadedCoverFile = await optimizeAndUploadSingle(coverFile);
    const uploadedSectionFiles = await optimizeAndUploadImages(sectionFiles);

    const {
      title,
      type,
      mainContent,
      sections,
      categories = [],
      tags = [],
    } = req.body;
    const authorId = req.userId;
    const slug = slugify(title, { lower: true, strict: true });
    const data = {
      title,
      type,
      slug,
      mainContent,
      authorId,
      sections,
      categories: categories.map(Number),
      tags,
    };
    const post = await createNewPost(
      data,
      uploadedCoverFile,
      uploadedSectionFiles
    );

    res.status(201).json({ message: "successfull created post" });
  },
];

export const updatePost = [
  body("postId", "Invalid Post Id").isInt({ min: 1 }),
  body("type", "Invalid Type of language")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Required Language")
    .escape(),
  body("title", "Title is required").trim().notEmpty().escape(),
  body("sections", "Sections must be an array").optional().isArray({ min: 1 }),
  body("categories", "Category is Required").notEmpty().isArray({ min: 1 }),
  body("tags").optional().isArray(),
  body("tags.*.name", "Tag name is invalid.")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((name: string) => name.trim() !== "");
      }
      return value;
    }),

  // Sanitize each section content
  body("sections.*.content")
    .optional({ nullable: true })
    .trim()
    .customSanitizer((value) => sanitizeHtml(value)),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const {
        postId,
        title,
        type,
        mainContent,
        sections,
        removeSectionImages = [],
        categories = [],
        tags = [],
      } = req.body;

      const slug = slugify(title, { lower: true, strict: true });
      const post = await getPostByPostId(+postId);

      // Parse JSON if string
      const parsedSections =
        typeof sections === "string" ? JSON.parse(sections) : sections;
      const parsedRemoveImages =
        typeof removeSectionImages === "string"
          ? JSON.parse(removeSectionImages)
          : removeSectionImages;

      const files = req.files as {
        coverImage?: Express.Multer.File[];
        sectionImages?: Express.Multer.File[];
      };
      const coverFile = files.coverImage?.[0];
      const sectionFiles = files.sectionImages || [];
      await checkMaximumFiles(sectionFiles);

      // Step 1: Remove images from S3 + DB

      for (const sectionId of parsedRemoveImages) {
        const section = await getSectionByPostId(sectionId);
        if (section?.imageKey) {
          await deleteFromS3ByKey(section.imageKey);
        }
        const data = {
          imageUrl: null,
          imageKey: null,
        };
        await updateImageUrlAndKey(sectionId, data);
      }

      // --- Step 2: Upload new images ---
      let uploadedNewCoverFile: { url: string; key: string } | undefined;
      if (coverFile) {
        //delete old cover
        await deleteFromS3ByKey(post!.coverKey);
        uploadedNewCoverFile = await optimizeAndUploadSingle(coverFile);
      }

      const uploadedSectionFiles = sectionFiles.length
        ? await optimizeAndUploadImages(sectionFiles)
        : [];

      // --- Step 3: Update / Create sections ---
      const data = {
        title,
        slug,
        type,
        mainContent,
        categories,
        tags,
      };
      const updatedPost = await updatePostModel(
        +postId,
        data,
        parsedSections,
        uploadedSectionFiles,
        uploadedNewCoverFile
      );

      res.status(200).json({ message: "Post updated" });
    } catch (err) {
      next(err);
    }
  },
];

export const deletePost = [
  body("postId", "Invalid Post Id").isInt({ min: 1 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const { postId } = req.body;
    try {
      //Delete s3 cover image
      const keys = await getKeysByPostId(+postId);
      if (keys?.coverKey) {
        await deleteFromS3ByKey(keys.coverKey);
      }
      //Delete s3 section images
      if (keys!.sections?.length) {
        await Promise.all(
          keys!.sections.map((section) =>
            section.imageKey
              ? deleteFromS3ByKey(section.imageKey)
              : Promise.resolve()
          )
        );
      }
      await deletePostByPostId(+postId);
      res.status(200).json({ message: "Successfully deleted post" });
    } catch (err: any) {
      console.error("Delete post error:", err);
      next(createError("delete post fail", 500, errorCode.invalid));
    }
  },
];
