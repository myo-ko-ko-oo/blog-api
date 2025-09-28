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
import {
  updateAbout,
  updateContact,
  updateHome,
} from "../../../controllers/admin/SiteConfigController";
import {
  deleteUser,
  getAllUsers,
  updateUserRole,
} from "../../../controllers/admin/UserController";
import { auth } from "../../../middleware/auth";
import { authorise } from "../../../middleware/authorise";

const router = express.Router();

//Admin user routes
router.get("/get-all-users", auth, authorise(true, "ADMIN"), getAllUsers);
router.patch("/edit-role-user", auth, authorise(true, "ADMIN"), updateUserRole);
router.delete("/delete-user", auth, authorise(true, "ADMIN"), deleteUser);

//Admin Create Category
router.post("/createCategory", createCategory);
router.patch("/updateCategory", updateCategory);
router.delete("/deleteCategory", deleteCategory);

//Admin Create Post
router.post("/createPost", uploadMemory.array("postImages", 5), createPost);
router.patch("/updatePost", uploadMemory.array("postImages", 5), updatePost);
router.delete("/deletePost", deletePost);

//Admin Update Config data
router.patch("/updateHome", updateHome);
router.patch("/updateAbout", updateAbout);
router.patch("/updateContact", updateContact);

export default router;
