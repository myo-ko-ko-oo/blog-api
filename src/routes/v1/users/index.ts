import express from "express";
import {
  getDetailPost,
  getInfinitePostsByPagination,
  getPostsByPagination,
  getRandomPosts,
} from "../../../controllers/user/PostController";
import { getAllCategories } from "../../../controllers/user/CategoryController";
import {
  getProfile,
  updateProfile,
} from "../../../controllers/user/ProfileController";
import { auth } from "../../../middleware/auth";
import {
  getHomeData,
  getAboutData,
  getContactData,
} from "../../../controllers/user/SiteConfigController";

const router = express.Router();

// user category routes
router.get("/get-all-categories", getAllCategories);

// auth user profile routes
router.get("/profile", auth, getProfile);
router.patch("/profile/update", auth, updateProfile);

// user posts routes
router.get("/get-detail-post/:id", getDetailPost);
router.get("/get-random-posts", getRandomPosts);
router.get("/posts/offset", getPostsByPagination); // Offset Pagination
router.get("/posts/infinite", getInfinitePostsByPagination); // Cursor-based Pagination

// user SiteConfig routes
router.get("/config-home", getHomeData);
router.get("/config-about", getAboutData);
router.get("/config-contact", getContactData);

export default router;
