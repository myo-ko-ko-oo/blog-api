import { Request, Response, NextFunction } from "express";
import { errorCode } from "../../config/errorCode";
import {
  deleteUserByAdmin,
  getUserLists,
  updateRole,
} from "../../models/userModel";
import { body, validationResult } from "express-validator";
import { createError } from "../../utilities/error";

interface CustomRequest extends Request {
  userId?: number;
}

export const getAllUsers = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userLists = await getUserLists();
  res
    .status(200)
    .json({ message: "successfully get user lists", users: userLists });
};

export const updateUserRole = [
  body("id", "id is required.").isInt({ min: 1 }),
  body("role", "Role is required.").isString().trim().notEmpty().escape(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const { id, role } = req.body;
    await updateRole(id, role);
    res.status(200).json({ message: "successfully updated user" });
  },
];

export const deleteUser = [
  body("id", "id is required.").isInt({ min: 1 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const { id } = req.body;
    await deleteUserByAdmin(id);
    res.status(200).json({ message: "successfully updated user" });
  },
];
