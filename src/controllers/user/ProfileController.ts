import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { getUserById } from "../../models/authModel";
import { checkUserIfNotExist } from "../../utilities/auth";
import moment from "moment";

interface CustomRequest extends Request {
  userId?: number;
}

export const getProfile = async (
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
  const userId = req.userId;
  const user = await getUserById(userId);
  checkUserIfNotExist(user);
  const profile = {
    name: user?.name,
    authorName: user?.authorName,
    email: user?.email,
    role: user?.role,
    phone: user?.phone,
    image: user?.imageUrl,
    createdAt: moment(user?.createdAt).format("DD-MMM-YYYY").toLowerCase(),
  };

  res.status(200).json({ message: "Get Profile", profile });
};

export const updateProfile = [
  body("name", "Category Name is required.").trim().notEmpty().escape(),
  body("authorName", "Category Name is required.").trim().notEmpty().escape(),
  body("slug", "Slug is required.").trim().notEmpty().escape(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }
    const { categoryId, name, slug } = req.body;
    const updateData = {
      name,
      slug,
    };

    res.status(200).json({ message: "successfull updated category" });
  },
];
