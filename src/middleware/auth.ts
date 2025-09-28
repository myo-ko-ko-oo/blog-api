import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getUserById } from "../models/authModel";
import { errorCode } from "../config/errorCode";
import { createError } from "../utilities/error";

interface CustomRequest extends Request {
  userId?: number;
  email?: string;
}
type DecodedProp = { id: number; email: string };

export const auth = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return next(
      createError("Not authenticated", 401, errorCode.unauthenticated)
    );
  }

  // generate new access token
  const generateNewAccessToken = async (decoded: DecodedProp) => {
    const user = await getUserById(decoded.id);
    if (!user)
      return next(
        createError("Account not found", 401, errorCode.unauthenticated)
      );

    const newAccessToken = jwt.sign(
      { id: user.id },
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: "15m",
      }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 15 * 60 * 1000,
    });

    req.userId = decoded.id;
    req.email = decoded.email;
    next();
  };

  if (!accessToken) {
    // no access token, check refresh
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET!
      ) as DecodedProp;
      return generateNewAccessToken(decoded);
    } catch {
      return next(
        createError("Invalid refresh token", 401, errorCode.unauthenticated)
      );
    }
  }

  // if access token exists
  try {
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET!
    ) as DecodedProp;
    req.userId = decoded.id;
    req.email = decoded.email;
    return next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET!
        ) as DecodedProp;
        return generateNewAccessToken(decoded);
      } catch {
        return next(
          createError("Invalid refresh token", 401, errorCode.unauthenticated)
        );
      }
    }
    return next(createError("Invalid access token", 401, errorCode.attack));
  }
};

//option 2 For high-security apps (banking, finance, healthcare)

// const generateNewTokens = async (decoded: DecodedProp, res: Response, next: NextFunction) => {
//   const user = await getUserById(decoded.id);
//   if (!user) return next(createError("Account not found", 401, errorCode.unauthenticated));

//   const newAccessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET!, {
//     expiresIn: "15m",
//   });

//   const newRefreshToken = jwt.sign(
//     { id: user.id, email: user.email },
//     process.env.REFRESH_TOKEN_SECRET!,
//     { expiresIn: "30d" }
//   );

//   // ⚠️ Save to DB in a refreshToken field (not accessToken)
//   await updateUser(user.id, { refreshToken: newRefreshToken });

//   res
//     .cookie("accessToken", newAccessToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//       maxAge: 15 * 60 * 1000,
//     })
//     .cookie("refreshToken", newRefreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
//       maxAge: 30 * 24 * 60 * 60 * 1000,
//     });
// };
