import express from "express";
import { getDetailPost } from "../../../controllers/user/PostController";
import { getAllCategories } from "../../../controllers/user/CategoryController";

const router = express.Router();

// user category routes
router.get("/get-all-categories", getAllCategories);

// user posts routes
router.get("/get-detail-post/:id", getDetailPost);
// router.get("/posts/offset", auth, getPostsByPagination); // Offset Pagination
// router.get("/posts/infinite", auth, getInfinitePostsByPagination); // Cursor-based Pagination

export default router;
