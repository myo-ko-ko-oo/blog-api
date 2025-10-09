import sharp from "sharp";
import s3 from "../config/s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Optimize + upload multiple images
export const optimizeAndUploadImages = async (
  postImages: Express.Multer.File[]
) => {
  const uploadedFiles: { url: string; key: string }[] = [];

  for (const image of postImages) {
    const ext = "webp";
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    const key = `blogs/${filename}`;

    // Optimize with sharp
    const optimizedBuffer = await sharp(image.buffer)
      .resize({ width: 1200 })
      .webp({ quality: 80 })
      .toBuffer();

    // Upload to S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: optimizedBuffer,
        ContentType: "image/webp",
        // ACL removed: bucket owner enforced
      })
    );

    uploadedFiles.push({
      url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
      key,
    });
  }

  return uploadedFiles;
};

// Delete from S3
export const deleteFromS3ByKey = async (Key: string) => {
  if (!Key) return;
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key,
    })
  );
};

// Single upload
export const optimizeAndUploadSingle = async (
  file: Express.Multer.File
): Promise<{ url: string; key: string }> => {
  if (!file) throw new Error("No file provided");

  const ext = "webp";
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const key = `blogs/${filename}`;

  const optimizedBuffer = await sharp(file.buffer)
    .resize({ width: 1200 })
    .webp({ quality: 80 })
    .toBuffer();

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: optimizedBuffer,
      ContentType: "image/webp",
      // ACL removed
    })
  );

  return {
    url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    key,
  };
};
