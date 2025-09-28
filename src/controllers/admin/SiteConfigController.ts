import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import {
  updateHomeData,
  updateAboutData,
  updateContactData,
} from "../../models/configModel";

interface CustomRequest extends Request {
  userId?: number;
}

export const updateHome = [
  body("homeTitle", "Home Title is required.").trim().notEmpty().escape(),
  body("homeDescription", "Home Description is required.")
    .trim()
    .notEmpty()
    .escape(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }
    const { homeTitle, homeDescription } = req.body;
    const configId = +1;
    const data = {
      homeTitle,
      homeDescription,
    };
    await updateHomeData(configId, data);

    res.status(200).json({ message: "successfully updated home data" });
  },
];

export const updateAbout = [
  body("aboutTitle", "About Title Name is required.")
    .trim()
    .notEmpty()
    .escape(),
  body("aboutDescription", "About Description is required.")
    .trim()
    .notEmpty()
    .escape(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }
    const { aboutTitle, aboutDescription } = req.body;
    const configId = +1;
    const data = {
      aboutTitle,
      aboutDescription,
    };
    await updateAboutData(configId, data);

    res.status(200).json({ message: "successfully updated about data" });
  },
];
export const updateContact = [
  body("contactEmail", "Contact Email is required.").trim().notEmpty().escape(),
  body("contactPhone", "Contact Phone is required.").trim().notEmpty().escape(),
  body("contactAddress", "Contact Address is required.")
    .trim()
    .notEmpty()
    .escape(),

  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }
    const { contactEmail, contactPhone, contactAddress } = req.body;
    const configId = +1;
    const data = {
      contactEmail,
      contactPhone,
      contactAddress,
    };
    await updateContactData(configId, data);

    res.status(200).json({ message: "successfully updated contact data" });
  },
];
