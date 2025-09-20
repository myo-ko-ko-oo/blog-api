import { errorCode } from "../config/errorCode";

export const checkImageFiles = async (imageFiles: any) => {
  if (!imageFiles || imageFiles.length < 1) {
    const error: any = new Error(
      "Post Image is Required! as least 1 cover image needed"
    );
    error.status = 400;
    error.code = errorCode.invalid;
    throw error;
  }
};
