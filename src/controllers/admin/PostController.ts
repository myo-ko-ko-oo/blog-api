import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import { errorCode } from "../../config/errorCode";
// import { optimizeAndSaveImage } from "../../Utilities/imageOptimize";
import { createError } from "../../utilities/error";
import slugify from "slugify";
import path from "path";
import { unlink } from "node:fs/promises";
import { optimizeAndSaveImage } from "../../middleware/uploadFile";
import {
  createNewPost,
  deletePostByPostId,
  getPostByPostId,
  updatePostByPostId,
} from "../../models/postModel";
import { checkImageFiles } from "../../utilities/post";

interface CustomRequest extends Request {
  userId?: number;
}

export const createPost = [
  body("title", "Title is required").trim().notEmpty().escape(),
  body("sections", "Sections must be an array").isArray({ min: 1 }),
  body("categories").optional().isArray(),
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
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .bail()
    .customSanitizer((value) => sanitizeHtml(value)),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const imageFiles = req.files as Express.Multer.File[];
    await checkImageFiles(imageFiles);
    const savedPaths = await optimizeAndSaveImage(imageFiles);

    const { title, sections, categories = [], tags = [] } = req.body;
    const authorId = +1; //req.userId;
    const slug = slugify(title, { lower: true, strict: true });
    const data = {
      title,
      slug,
      authorId,
      sections,
      categories: categories.map(Number),
      tags,
    };
    const post = await createNewPost(data, savedPaths);

    res.status(201).json({ message: "successfull created post" });
  },
];

export const updatePost = [
  body("postId", "Invalid Post Id").isInt({ min: 1 }),
  body("title", "Title is required").trim().notEmpty().escape(),
  body("sections", "Sections must be an array").isArray({ min: 1 }),
  body("categories").optional().isArray(),
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
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .bail()
    .customSanitizer((value) => sanitizeHtml(value)),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { postId, title, sections, categories = [], tags = [] } = req.body;
    // check post exists
    const post = await getPostByPostId(+postId);
    if (!post) {
      return next(
        createError("not found post with this postId!", 400, errorCode.invalid)
      );
    }

    const imageFiles = req.files as Express.Multer.File[] | undefined;
    const savedPaths = imageFiles ? await optimizeAndSaveImage(imageFiles) : [];

    const authorId = +1; // TODO: replace with req.userId
    const slug = slugify(title, { lower: true, strict: true });
    const data = {
      title,
      slug,
      authorId,
      sections,
      categories: categories.map(Number),
      tags,
    };

    const updatedPost = await updatePostByPostId(post.id, data, savedPaths);

    res.status(200).json({
      message: "successfully updated post",
      post: updatedPost,
    });
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
      await deletePostByPostId(+postId);
      res.status(200).json({ message: "Successfully deleted post" });
    } catch (err: any) {
      console.error("Delete post error:", err);
      next(createError("delete post fail", 500, errorCode.invalid));
    }
  },
];
