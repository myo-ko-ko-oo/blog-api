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
router.post("/createCategory", auth, createCategory);
router.patch("/updateCategory", auth, updateCategory);
router.delete("/deleteCategory", auth, deleteCategory);

//Admin Create Post
router.post(
  "/createPost",
  auth,
  uploadMemory.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "sectionImages", maxCount: 5 },
  ]),
  createPost
);
router.put(
  "/updatePost",
  auth,
  uploadMemory.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "sectionImages", maxCount: 5 },
  ]),
  updatePost
);
router.delete("/deletePost", auth, deletePost);

//Admin Update Config data
router.patch("/updateHome", auth, authorise(true, "ADMIN"), updateHome);
router.patch("/updateAbout", auth, authorise(true, "ADMIN"), updateAbout);
router.patch("/updateContact", auth, authorise(true, "ADMIN"), updateContact);

export default router;
