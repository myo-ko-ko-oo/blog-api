import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { createError } from "../../utilities/error";

interface CustomRequest extends Request {
  userId?: number;
}

export const register = [
  body("postId", "Invalid Post Id").isInt({ min: 1 }),

  (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    res.status(201).json({ message: "Successfully registered" });
  },
];

export const login = [
  body("postId", "Invalid Post Id").isInt({ min: 1 }),

  (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    res.status(201).json({ message: "Successfully logged in" });
  },
];

export const logout = [
  body("postId", "Invalid Post Id").isInt({ min: 1 }),

  (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    res.status(201).json({ message: "Successfully logged out" });
  },
];
