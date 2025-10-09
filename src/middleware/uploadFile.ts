import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
// import fs from "fs";
// import path from "path";
import { createError } from "../utilities/error";
import { errorCode } from "../config/errorCode";

// Multer memory storage
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(createError("Invalid file type", 400, errorCode.invalid), false);
  }
};

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB
});

// Optimize and save
// export const optimizeAndSaveImage = async (
//   postImages: Express.Multer.File[]
// ) => {
//   const uploadDir = path.join(__dirname, "../../upload/images");
//   if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
//   }

//   const savedFiles: string[] = [];

//   for (const image of postImages) {
//     const ext = "webp";
//     const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
//     const filePath = path.join(uploadDir, filename);

//     await sharp(image.buffer)
//       .resize({ width: 1200 })
//       .webp({ quality: 80 })
//       .toFile(filePath);

//     savedFiles.push(filename);
//   }

//   return savedFiles;
