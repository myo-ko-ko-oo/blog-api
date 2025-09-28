import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

export const updateHomeData = async (id: number, data: any) => {
  return prisma.config.update({
    where: { id },
    data,
  });
};

export const updateAboutData = async (id: number, data: any) => {
  return prisma.config.update({
    where: { id },
    data,
  });
};

export const updateContactData = async (id: number, data: any) => {
  return prisma.config.update({
    where: { id },
    data,
  });
};

export const getDataForHome = async () => {
  return prisma.config.findFirst({
    select: {
      homeTitle: true,
      homeDescription: true,
    },
  });
};
export const getDataForAbout = async () => {
  return prisma.config.findFirst({
    select: {
      aboutTitle: true,
      aboutDescription: true,
    },
  });
};
export const getDataForContact = async () => {
  return prisma.config.findFirst({
    select: {
      contactEmail: true,
      contactPhone: true,
      contactAddress: true,
    },
  });
};
