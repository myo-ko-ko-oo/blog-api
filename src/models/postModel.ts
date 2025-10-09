import moment from "moment";
import { PrismaClient } from "../../generated/prisma";
import { errorCode } from "../config/errorCode";
import { createError } from "../utilities/error";

interface GetPostsOptions {
  page: number;
  limit: number;
}

const prisma = new PrismaClient();
// --- Create Post ---
export const createNewPost = async (
  data: any,
  uploadedCoverFile: { url: string; key: string },
  uploadedSectionFiles: { url: string; key: string }[]
) => {
  const postData: any = {
    title: data.title,
    slug: data.slug,
    type: data.type,
    mainContent: data.mainContent,
    coverUrl: uploadedCoverFile.url,
    coverKey: uploadedCoverFile.key,
    author: {
      connect: { id: data.authorId },
    },
  };

  if (data.sections && data.sections.length > 0) {
    postData.sections = {
      create: data.sections.map((section: any, index: number) => ({
        content: section.content,
        imageUrl: uploadedSectionFiles[index].url,
        imageKey: uploadedSectionFiles[index].key,
        order: index + 1,
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
  try {
    return await prisma.post.findUnique({
      where: { id: postId },
      include: { sections: true, categories: true, tags: true },
    });
  } catch (error) {
    console.error("Get post error:", error);
    throw createError("Could not found post.", 400, errorCode.invalid);
  }
};

// --- Update Post ---
export const getSectionByPostId = async (id: number) => {
  return prisma.postSection.findUnique({
    where: { id },
  });
};
export const updateImageUrlAndKey = async (sectionId: number, data: any) => {
  return prisma.postSection.update({
    where: { id: sectionId },
    data,
  });
};
export const updatePostModel = async (
  postId: number,
  data: {
    title: string;
    type: string;
    slug: string;
    mainContent: string;
    categories: number[];
    tags: any[];
  },
  sections: any[],
  uploadedFiles: { url: string; key: string }[],
  cover?: { url: string; key: string }
) => {
  // --- Update or create sections ---
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];

    const imageData = uploadedFiles[i]
      ? { imageUrl: uploadedFiles[i].url, imageKey: uploadedFiles[i].key }
      : {};

    if (sec.id) {
      await prisma.postSection.update({
        where: { id: sec.id },
        data: {
          content: sec.content || null,
          order: i + 1,
          ...imageData,
        },
      });
    } else {
      await prisma.postSection.create({
        data: {
          postId,
          content: sec.content || null,
          order: i + 1,
          ...imageData,
        },
      });
    }
  }

  // --- Update main post ---
  return prisma.post.update({
    where: { id: postId },
    data: {
      title: data.title,
      slug: data.slug,
      type: data.type as any,
      mainContent: data.mainContent,
      ...(cover && { coverUrl: cover.url, coverKey: cover.key }),
      categories: {
        deleteMany: {},
        create: data.categories.map((catId) => ({ categoryId: catId })),
      },
      tags: {
        deleteMany: {},
        create: data.tags.map((tag) => ({ tagId: tag.id || tag })),
      },
    },
    include: {
      sections: true,
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });
};

export const getPostDetailByPostId = async (postId: number) => {
  return prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { name: true, authorName: true } },
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

export const getPostsList = async ({ page, limit }: GetPostsOptions) => {
  const skip = (page - 1) * limit;

  const posts = await prisma.post.findMany({
    skip,
    take: limit + 1, // fetch one extra to detect next page
    select: {
      id: true,
      title: true,
      updatedAt: true,
      sections: {
        select: {
          id: true,
          content: true,
          imageUrl: true,
          order: true,
        },
      },
      categories: {
        select: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
      author: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // detect next page
  const hasNextPage = posts.length > limit;
  if (hasNextPage) posts.pop();

  // count for total pages
  const totalCount = await prisma.post.count();
  const totalPages = Math.ceil(totalCount / limit);

  return {
    posts,
    hasNextPage,
    totalCount,
    totalPages,
  };
};

export const getPostsListByOptions = async (options: any) => {
  const posts = await prisma.post.findMany(options);

  return posts.map((post) => ({
    ...post,
    updatedAt: moment(post.updatedAt).format("DD-MMM-YYYY").toLowerCase(),
  }));
};

export const getKeysByPostId = async (postId: number) => {
  try {
    return await prisma.post.findUnique({
      where: { id: postId },
      select: {
        coverKey: true,
        sections: {
          select: {
            imageKey: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get post error:", error);
    throw createError("Could not found post.", 400, errorCode.invalid);
  }
};

export const deletePostByPostId = async (postId: number) => {
  try {
    return await prisma.post.delete({
      where: { id: postId },
    });
    // to delete postTags and postCategory
  } catch (error) {
    console.error("Get post error:", error);
    throw createError("Could not delete post.", 400, errorCode.invalid);
  }
};

export const getRandomPostsModel = async (take: number) => {
  const count = await prisma.post.count();
  if (count === 0) return [];

  const ids = await prisma.post.findMany({
    select: { id: true },
  });

  const randomIds = ids
    .map((p) => p.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, take);

  return prisma.post.findMany({
    where: { id: { in: randomIds } },
    select: {
      id: true,
      slug: true,
      title: true,
      mainContent: true,
      coverUrl: true,
    },
  });
};
