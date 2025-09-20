import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { getCategories } from "../../models/categoryModel";

interface CustomRequest extends Request {
  userId?: number;
}

export const getAllCategories = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req).array({ onlyFirstError: true });
  if (errors.length > 0) {
    const error: any = new Error(errors[0].msg);
    error.status = 400;
    error.code = errorCode.invalid;
    return next(error);
  }

  const categories = await getCategories();

  res.status(200).json({ message: "Get All Categories", categories });
};
