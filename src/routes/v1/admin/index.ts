import express from "express";
import {
  createPost,
  deletePost,
  updatePost,
} from "../../../controllers/admin/PostController";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../controllers/admin/CategoryController";
import { uploadMemory } from "../../../middleware/uploadFile";

const router = express.Router();

//Admin user routes
// router.get("/get-all-users", getAllUsers);

//Admin Create Category
router.post("/createCategory", createCategory);
router.patch("/updateCategory", updateCategory);
router.delete("/deleteCategory", deleteCategory);

//Admin Create Post
router.post("/createPost", uploadMemory.array("postImages", 5), createPost);
router.patch("/updatePost", updatePost);
router.delete("/deletePost", deletePost);

export default router;
