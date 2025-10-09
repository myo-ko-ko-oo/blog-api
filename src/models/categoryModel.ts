import moment from "moment";
import { PrismaClient } from "../../generated/prisma";
import { errorCode } from "../config/errorCode";
import { createError } from "../utilities/error";

const prisma = new PrismaClient();

export const getCategories = async () => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return categories.map((category) => ({
      ...category,
      updatedAt: moment(category.updatedAt).format("DD-MMM-YYYY").toLowerCase(),
    }));
  } catch (error) {
    console.error("Get categories error:", error);
    throw createError("Could not get categories.", 404, errorCode.invalid);
  }
};

export const createNewCategory = async (catgoryData: any) => {
  try {
    return await prisma.category.create({
      data: catgoryData,
    });
  } catch (err: any) {
    throw new Error("Could not create category");
  }
};

export const updateCategoryById = async (
  categoryId: number,
  updateData: any
) => {
  try {
    return await prisma.category.update({
      where: { id: Number(categoryId) },
      data: updateData,
    });
  } catch (error) {
    throw new Error("Could not update category");
  }
};

export const deleteCategoryById = async (categoryId: number) => {
  try {
    return await prisma.category.delete({
      where: { id: Number(categoryId) },
    });
  } catch (error) {
    throw new Error("Could not delete category");
  }
};
