import { Request, Response, NextFunction } from "express";
import { getCategories } from "../../models/categoryModel";

interface CustomRequest extends Request {
  userId?: number;
}

export const getAllCategories = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const categories = await getCategories();

  res.status(200).json({ message: "Get All Categories", categories });
};
