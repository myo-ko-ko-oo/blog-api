import express from "express";
import {
  getDetailPost,
  getPostsByPagination,
} from "../../../controllers/user/PostController";
import { getAllCategories } from "../../../controllers/user/CategoryController";
import { getProfile } from "../../../controllers/user/ProfileController";
import { auth } from "../../../middleware/auth";
import {
  getHomeData,
  getAboutData,
  getContactData,
} from "../../../controllers/user/SiteConfigController";

const router = express.Router();

// user category routes
router.get("/get-all-categories", getAllCategories);

// user profile routes
router.get("/profile", auth, getProfile);

// user posts routes
router.get("/get-detail-post/:id", getDetailPost);
router.get("/posts/offset", auth, getPostsByPagination); // Offset Pagination
// router.get("/posts/infinite", auth, getInfinitePostsByPagination); // Cursor-based Pagination

// user SiteConfig routes
router.get("/config-home", getHomeData);
router.get("/config-about", getAboutData);
router.get("/config-contact", getContactData);

export default router;
