import { PrismaClient } from "../../generated/prisma";

export const prisma = new PrismaClient().$extends({
  result: {
    user: {
      updatedAt: {
        needs: { updatedAt: true },
        compute(post) {
          return post?.updatedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        },
      },
    },
    post: {
      // image: {
      //   needs: { image: true },
      //   compute(post) {
      //     return "/optimize/" + post.image.split(".")[0] + ".webp";
      //   },
      // },
      updatedAt: {
        needs: { updatedAt: true },
        compute(post) {
          return post?.updatedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        },
      },
    },
    //   image: {
    //     path: {
    //       needs: { path: true },
    //       compute(image) {
    //         return "/optimize/" + image.path.split(".")[0] + ".webp";
    //       },
    //     },
    //   },
  },
});
