import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();
export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};
export const createNewUser = async (data: any) => {
  return prisma.user.create({
    data,
  });
};
export const getUserById = async (id: any) => {
  return prisma.user.findUnique({
    where: { id },
    omit: {
      password: true,
    },
  });
};

export const updateUser = async (id: any, userData: any) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const getOtpByEmail = async (email: string) => {
  return prisma.otp.findUnique({
    where: { email },
  });
};

export const createOtp = async (data: any) => {
  return prisma.otp.create({
    data,
  });
};

export const updateOtp = async (id: number, data: any) => {
  return prisma.otp.update({
    where: { id },
    data,
  });
};
