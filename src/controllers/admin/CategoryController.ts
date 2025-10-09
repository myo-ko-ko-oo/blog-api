import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import {
  createNewCategory,
  deleteCategoryById,
  updateCategoryById,
} from "../../models/categoryModel";

interface CustomRequest extends Request {
  userId?: number;
}

export const createCategory = [
  body("name", "Category Name is required.").trim().notEmpty().escape(),
  // body("slug", "Slug is required.").trim().notEmpty().escape(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }
    const { name } = req.body;
    const catgoryData = {
      name,
    };
    await createNewCategory(catgoryData);

    res.status(201).json({ message: "successfull created a new category" });
  },
];

export const updateCategory = [
  body("categoryId", "Invalid Post Id").isInt({ min: 1 }),
  body("name", "Category Name is required.").trim().notEmpty().escape(),
  // body("slug", "Slug is required.").trim().notEmpty().escape(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }
    const { categoryId, name } = req.body;
    const updateData = {
      name,
    };
    await updateCategoryById(categoryId, updateData);

    res.status(200).json({ message: "successfull updated category" });
  },
];

export const deleteCategory = [
  body("categoryId", "Invalid Category Id").isInt({ min: 1 }),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }
    const { categoryId } = req.body;
    await deleteCategoryById(categoryId);

    res.status(200).json({ message: "successfull deleted category" });
  },
];
