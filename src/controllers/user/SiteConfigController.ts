import { Request, Response, NextFunction } from "express";
import {
  getDataForAbout,
  getDataForContact,
  getDataForHome,
} from "../../models/configModel";

export const getHomeData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getDataForHome();
    res.status(200).json({ message: "successfully get home data", data });
  } catch (error) {
    console.error("Get config error:", error);
    next(error);
  }
};

export const getAboutData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getDataForAbout();
    res.status(200).json({ message: "successfully get about data", data });
  } catch (error) {
    console.error("Get config error:", error);
    next(error);
  }
};
export const getContactData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getDataForContact();
    res.status(200).json({ message: "successfully get contact data", data });
  } catch (error) {
    console.error("Get config error:", error);
    next(error);
  }
};
