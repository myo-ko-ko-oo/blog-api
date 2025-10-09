import { errorCode } from "../config/errorCode";
import { createError } from "./error";
import { PrismaClient } from "../../generated/prisma";
const prisma = new PrismaClient();

export const checkCoverFile = async (files: any) => {
  if (!files) {
    throw createError("Cover Image is Required", 400, errorCode.invalid);
  }
};
export const checkSectionFiles = async (files: any) => {
  if (!files) return;
  if (files.length > 4) {
    throw createError("Maximum 4 images allowed", 400, errorCode.invalid);
  }
};

export const checkMaximumFiles = async (files: any) => {
  if (files.length > 4) {
    throw createError("Maximum 4 images allowed", 400, errorCode.invalid);
  }
};
