import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { createError } from "../../utilities/error";
import { errorCode } from "../../config/errorCode";
import moment from "moment";
import { getPostDetailByPostId, getPostsList } from "../../models/postModel";
import { checkUserIfNotExist } from "../../utilities/auth";
import { getUserById } from "../../models/authModel";
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

export const getPostsByPagination = [
  query("page", "Page number must be unsigned integer.")
    .isInt({ gt: 0 })
    .optional(),
  query("limit", "Limit number must be unsigned integer.")
    .isInt({ gt: 4 })
    .optional(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req).array({ onlyFirstError: true });
      // If validation error occurs
      if (errors.length > 0) {
        return next(createError(errors[0].msg, 400, errorCode.invalid));
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 5;

      const { posts, hasNextPage, totalCount, totalPages } = await getPostsList(
        {
          page,
          limit,
        }
      );
      const formattedPosts = posts.map((post) => ({
        ...post,
        updatedAt: moment(post.updatedAt).format("DD-MM-YYYY"),
      }));

      res.status(200).json({
        message: "Get All Posts",
        currentPage: page,
        previousPage: page > 1 ? page - 1 : null,
        nextPage: hasNextPage ? page + 1 : null,
        hasNextPage,
        totalCount,
        totalPages,
        posts: formattedPosts,
      });
    } catch (error) {
      next(error);
    }
  },
];
