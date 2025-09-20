import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(__dirname, "../../upload/images");

export const removeFiles = async (filePaths: string[]) => {
  for (const fileName of filePaths) {
    const filePath = path.join(UPLOAD_DIR, fileName);

    try {
      // check if file exists
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        console.warn(`File not found, skipping: ${filePath}`);
      } else {
        throw err;
      }
    }
  }
};
