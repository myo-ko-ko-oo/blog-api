import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { createError } from "../../utilities/error";
import { errorCode } from "../../config/errorCode";
import moment from "moment";
import {
  getPostDetailByPostId,
  getPostsList,
  getPostsListByOptions,
  getRandomPostsModel,
} from "../../models/postModel";
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
        mainContent: post.mainContent,
        slug: post.slug,
        coverUrl: post.coverUrl,
        name: post.author.name,
        author: post.author.authorName || "Unknown",
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

interface CustomRequest extends Request {}

export const getRandomPosts = [
  query("take", "Take number must be unsigned integer.")
    .isInt({ gt: 0 }) // allow take > 0
    .optional(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    try {
      // default to 5 if not provided
      const take = req.query.take ? parseInt(req.query.take as string, 10) : 5;

      const posts = await getRandomPostsModel(take);

      res.status(200).json({
        message: "Get Random Articles",
        posts,
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

export const getInfinitePostsByPagination = [
  // ✅ Validation
  query("cursor", "Cursor must be Post ID.").isInt({ gt: 0 }).optional(),
  query("limit", "Limit number must be unsigned integer.")
    .isInt({ gt: 1 })
    .optional(),
  query("search").optional().isString().trim(),
  query("category").optional().isString().trim(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req).array({ onlyFirstError: true });
      if (errors.length > 0) {
        return next(createError(errors[0].msg, 400, errorCode.invalid));
      }

      // Extract query params
      const lastCursor = req.query.cursor;
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;

      // Validate user
      const userId = req.userId;
      const user = await getUserById(userId!);
      checkUserIfNotExist(user);

      const where: any = {};

      // Search in title, mainContent, or authorName
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { mainContent: { contains: search, mode: "insensitive" } },
          {
            author: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { authorName: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ];
      }

      // Category filter (assuming post has many categories)
      if (category) {
        where.categories = {
          some: {
            category: { name: { equals: category, mode: "insensitive" } },
          },
        };
      }

      // 🔹 Prisma options
      const options = {
        take: limit + 1,
        skip: lastCursor ? 1 : 0,
        cursor: lastCursor ? { id: Number(lastCursor) } : undefined,
        where, // <--- applied filter
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          mainContent: true,
          coverUrl: true,
          updatedAt: true,
          author: {
            select: {
              name: true,
              authorName: true,
            },
          },
          categories: {
            include: {
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { id: "desc" },
      };

      const posts = await getPostsListByOptions(options);

      const hasNextPage = posts.length > limit;
      if (hasNextPage) posts.pop();

      const nextCursor = posts.length > 0 ? posts[posts.length - 1].id : null;

      res.status(200).json({
        message: "Get all infinite posts",
        hasNextPage,
        nextCursor,
        prevCursor: lastCursor ? Number(lastCursor) : null,
        posts,
      });
    } catch (error) {
      next(error);
    }
  },
];

// export const getInfinitePostsByPagination = [
//   query("cursor", "Cursor must be Post ID.").isInt({ gt: 0 }).optional(),
//   query("limit", "Limit number must be unsigned integer.")
//     .isInt({ gt: 1 })
//     .optional(),
//   async (req: CustomRequest, res: Response, next: NextFunction) => {
//     try {
//       const errors = validationResult(req).array({ onlyFirstError: true });
//       // If validation error occurs
//       if (errors.length > 0) {
//         return next(createError(errors[0].msg, 400, errorCode.invalid));
//       }
//       const lastCursor = req.query.cursor;
//       const limit = req.query.limit || 5;

//       const userId = req.userId;
//       const user = await getUserById(userId!);
//       checkUserIfNotExist(user);

//       const options = {
//         take: +limit + 1,
//         skip: lastCursor ? 1 : 0,
//         cursor: lastCursor ? { id: +lastCursor } : undefined,
//         select: {
//           id: true,
//           title: true,
//           slug: true,
//           type: true,
//           mainContent: true,
//           coverUrl: true,
//           updatedAt: true,
//           author: {
//             select: {
//               name: true,
//               authorName: true,
//             },
//           },
//           categories: {
//             include: { category: { select: { name: true } } },
//           },
//         },
//         orderBy: {
//           id: "desc",
//         },
//       };

//       // const cacheKey = `posts:${JSON.stringify(req.query)}`;
//       // const posts = await getOrSetCache(cacheKey, async () => {
//       //   return await getPostsList(options);
//       // });
//       const posts = await getPostsListByOptions(options);

//       const hasNextPage = posts.length > +limit;

//       if (hasNextPage) {
//         posts.pop();
//       }

//       const nextCursor = posts.length > 0 ? posts[posts.length - 1].id : null;

//       res.status(200).json({
//         message: "Get All infinite posts",
//         hasNextPage,
//         nextCursor,
//         prevCursor: lastCursor,
//         posts,
//       });
//     } catch (error) {
//       next(error);
//     }
//   },
// ];
