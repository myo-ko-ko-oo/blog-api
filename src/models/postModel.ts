import { PrismaClient } from "../../generated/prisma";
import { errorCode } from "../config/errorCode";
import { createError } from "../utilities/error";
import { removeFiles } from "../utilities/removeFiles";
const prisma = new PrismaClient();

export const createNewPost = async (data: any, savedPaths: string[]) => {
  const postData: any = {
    title: data.title,
    slug: data.slug,
    author: {
      connect: { id: data.authorId },
    },
  };

  if (data.sections && data.sections.length > 0) {
    postData.sections = {
      create: data.sections.map((section: any, index: number) => ({
        content: section.content,
        imageUrl: savedPaths[index],
        order: index + 1,
      })),
    };
  }

  if (data.tags && data.tags.length > 0) {
    postData.tags = {
      create: data.tags.map((tagName: string) => ({
        tag: {
          connectOrCreate: {
            where: { name: tagName },
            create: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, "-"),
            },
          },
        },
      })),
    };
  }

  if (data.categories && data.categories.length > 0) {
    postData.categories = {
      create: data.categories.map((id: string) => ({
        category: {
          connect: { id: Number(id) },
        },
      })),
    };
  }

  return prisma.post.create({
    data: postData,
    include: {
      sections: true,
      tags: true,
      categories: true,
    },
  });
};

export const getPostByPostId = async (postId: number) => {
  return prisma.post.findUnique({
    where: { id: postId },
  });
};

export const updatePostByPostId = async (
  postId: number,
  data: any,
  savedPaths: string[]
) => {
  const postData: any = {
    title: data.title,
    slug: data.slug,
    author: {
      connect: { id: data.authorId },
    },
  };

  // --- Sections ---
  if (data.sections && data.sections.length > 0) {
    // get old imageUrls
    const oldSections = await prisma.postSection.findMany({
      where: { postId },
      select: { imageUrl: true },
    });

    const oldImageFiles = oldSections
      .map((s) => s.imageUrl)
      .filter((url): url is string => !!url);

    // delete old sections
    await prisma.postSection.deleteMany({ where: { postId } });

    // delete old files from disk
    await removeFiles(oldImageFiles);

    //create new sections
    postData.sections = {
      create: data.sections.map((section: any, index: number) => ({
        content: section.content,
        imageUrl: section.imageUrl || savedPaths[index] || null,
        order: index + 1,
      })),
    };
  }

  // --- Tags ---
  if (data.tags && data.tags.length > 0) {
    await prisma.postTag.deleteMany({ where: { postId } });
    postData.tags = {
      create: data.tags.map((tagName: string) => ({
        tag: {
          connectOrCreate: {
            where: { name: tagName },
            create: {
              name: tagName,
              slug: tagName.toLowerCase().replace(/\s+/g, "-"),
            },
          },
        },
      })),
    };
  }

  // --- Categories ---
  if (data.categories && data.categories.length > 0) {
    await prisma.postCategory.deleteMany({ where: { postId } });
    postData.categories = {
      create: data.categories.map((id: string) => ({
        category: {
          connect: { id: Number(id) },
        },
      })),
    };
  }

  return prisma.post.update({
    where: { id: postId },
    data: postData,
    include: {
      sections: true,
      tags: true,
      categories: true,
    },
  });
};

export const deletePostByPostId = async (postId: number) => {
  const postExists = await prisma.post.findUnique({ where: { id: postId } });
  if (!postExists) throw new Error("Post not found");

  const oldSections = await prisma.postSection.findMany({
    where: { postId },
    select: { imageUrl: true },
  });

  const oldImageFiles = oldSections
    .map((s) => s.imageUrl)
    .filter((url): url is string => !!url);

  await removeFiles(oldImageFiles);

  await prisma.$transaction([
    prisma.postTag.deleteMany({ where: { postId } }),
    prisma.postCategory.deleteMany({ where: { postId } }),
    prisma.post.delete({ where: { id: postId } }),
  ]);

  return true;
};

export const getPostDetailByPostId = async (postId: number) => {
  return prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { name: true } },
      sections: true,
      tags: {
        include: { tag: { select: { name: true } } },
      },
      categories: {
        include: { category: { select: { name: true } } },
      },
    },
  });
};
