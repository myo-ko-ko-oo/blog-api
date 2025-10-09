import moment from "moment";
import { PrismaClient } from "../../generated/prisma";
import { errorCode } from "../config/errorCode";
import { createError } from "../utilities/error";

const prisma = new PrismaClient();
export const getUserLists = async () => {
  try {
    const users = await prisma.user.findMany({
      omit: {
        password: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return users.map((user) => ({
      ...user,
      updatedAt: moment(user.updatedAt).format("DD-MMM-YYYY").toLowerCase(),
    }));
  } catch (error) {
    console.error("Get user error:", error);
    throw createError("Could not get user lists.", 404, errorCode.invalid);
  }
};

export const updateRole = async (id: number, role: string) => {
  try {
    return await prisma.user.update({
      where: { id },
      data: role,
    });
  } catch (error) {
    console.error("Update user error:", error);
    throw createError("Could not update user role.", 404, errorCode.invalid);
  }
};

export const deleteUserByAdmin = async (id: number) => {
  try {
    return await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    throw createError("Could not delete user.", 404, errorCode.invalid);
  }
};
