import express, { Request, Response, NextFunction } from "express";

import authRoutes from "./auth";
import adminRoutes from "./admin";
import userRoutes from "./users";

// import { authorise } from "../../Middlewares/authorise";
// import { auth } from "../../Middlewares/auth";

const router = express.Router();
router.get("/", (req: Request, res: Response) => {
  res.status(200).send(
    `<h1> Server Coming Soon </h1></br><h3>server is running.....</h3></br><p> 
        hello</p>`
  );
});
router.use("/api/v1", authRoutes);
router.use("/api/v1/user", userRoutes);
router.use(
  "/api/v1/admin",
  //   auth, authorise(true, "ADMIN"),
  adminRoutes
);

export default router;
