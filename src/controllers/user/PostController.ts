import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { createError } from "../../utilities/error";
import { errorCode } from "../../config/errorCode";
import moment from "moment";
import { getPostDetailByPostId } from "../../models/postModel";
interface CustomRequest extends Request {
  userId?: number;
}

export const getDetailPost = [
  param("id", "Invalid Post Id").isInt({ min: 1 }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const postId = parseInt(req.params.id, 10);

    try {
      const post = await getPostDetailByPostId(+postId);

      if (!post) {
        return next(createError("Post not found", 404, errorCode.invalid));
      }

      // Transform response
      const formattedPost = {
        id: post.id,
        title: post.title,
        author: post.author?.name || "Unknown",
        sections: post.sections.map((s) => ({
          id: s.id,
          content: s.content,
          imageUrl: s.imageUrl,
          order: s.order,
        })),
        categories: post.categories.map((c) => c.category.name),
        tags: post.tags.map((t) => t.tag.name),
        updatedAt: moment(post.updatedAt).format("DD-MMM-YYYY").toLowerCase(),
      };

      res.status(200).json({
        message: "detail post",
        post: formattedPost,
      });
    } catch (error) {
      next(error);
    }
  },
];
