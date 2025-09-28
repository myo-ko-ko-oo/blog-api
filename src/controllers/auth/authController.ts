import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { createError } from "../../utilities/error";
import {
  createNewUser,
  createOtp,
  getOtpByEmail,
  getUserByEmail,
  getUserById,
  updateOtp,
  updateUser,
} from "../../models/authModel";
import {
  checkOtpErrorIfSameDate,
  checkUserExist,
  checkUserIfNotExist,
} from "../../utilities/auth";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateOTP, generateToken } from "../../utilities/generate";
import moment from "moment";
import {
  changeOtpTemplate,
  forgetPasswordOtpTemplate,
} from "../../utilities/emailTemplate";
import { sendEmail } from "../../utilities/sentEmail";

export const register = [
  body("name", "Invalid Name")
    .isString()
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 50 })
    .escape(),

  body("email", "Invalid Email").trim().notEmpty().isEmail().normalizeEmail(),

  body("password", "Invalid Password")
    .isString()
    .isLength({ min: 8, max: 25 })
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character"),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { name, email, password } = req.body;
    const user = await getUserByEmail(email);
    checkUserExist(user);

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    if (!user) {
      const data = {
        name,
        email,
        password: hashPassword,
        role: "AUTHOR",
      };
      await createNewUser(data);
    }
    //Sent Email with credential user Data
    res.status(201).json({ message: "Successfully registered" });
  },
];

export const login = [
  body("email", "Invalid Email").trim().notEmpty().isEmail().normalizeEmail(),
  body("password", "Invalid Password")
    .isString()
    .isLength({ min: 8, max: 25 })
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character"),

  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    checkUserIfNotExist(user);

    // If wrong password was over limit
    if (user!.status === "FREEZE") {
      return next(
        createError(
          "Your account is temporarily locked. Please contact us.",
          401,
          errorCode.accountFreeze
        )
      );
    }

    const isMatchPassword = await bcrypt.compare(password, user!.password);
    if (!isMatchPassword) {
      // --------- Starting to record wrong times
      const lastRequest = new Date(user!.updatedAt).toLocaleDateString();
      const isSameDate = lastRequest == new Date().toLocaleDateString();

      // Today password is wrong first time
      if (!isSameDate) {
        const userData = {
          errorLoginCount: 1,
        };
        await updateUser(user!.id, userData);
      } else {
        // Today password was wrong 5 times
        if (user!.errorLoginCount >= 5) {
          const userData = {
            status: "FREEZE",
          };
          await updateUser(user!.id, userData);
        } else {
          // Today password was wrong one time
          const userData = {
            errorLoginCount: {
              increment: 1,
            },
          };
          await updateUser(user!.id, userData);
        }
      }
      // --------- Ending -----------------------
      return next(createError("wrongPasswd", 401, errorCode.invalid));
    }
    // Authorization token
    const accessTokenPayload = { id: user!.id };
    const refreshTokenPayload = { id: user!.id, email: user!.email };

    const accessToken = jwt.sign(
      accessTokenPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, // 15 min
      }
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    const userData = {
      errorLoginCount: 0, // reset error count
      accessToken: refreshToken,
    };

    await updateUser(user!.id, userData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: "/",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      })
      .status(200)
      .json({
        message: "Successfully Logged In.",
        userId: user!.id,
      });
  },
];

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req).array({ onlyFirstError: true });
  if (errors.length > 0) {
    return next(createError(errors[0].msg, 400, errorCode.invalid));
  }

  const refreshToken = req.cookies ? req.cookies.refreshToken : null;
  console.log(refreshToken);

  if (!refreshToken) {
    return next(
      createError(
        "You are not an authenticated user!.",
        401,
        errorCode.unauthenticated
      )
    );
  }

  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
      id: number;
      email: string;
    };
  } catch (err) {
    return next(
      createError(
        "You are not an authenticated user!.",
        401,
        errorCode.unauthenticated
      )
    );
  }

  if (isNaN(decoded.id)) {
    return next(
      createError(
        "You are not an authenticated user!.",
        401,
        errorCode.unauthenticated
      )
    );
  }

  const user = await getUserById(decoded.id);
  checkUserIfNotExist(user);

  if (user!.email !== decoded.email) {
    return next(
      createError(
        "You are not an authenticated user!.",
        401,
        errorCode.unauthenticated
      )
    );
  }

  const userData = {
    acessToken: generateToken(),
  };
  await updateUser(user!.id, userData);

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
  });

  res.status(200).json({ message: "Successfully logged out." });
};

interface CustomRequest extends Request {
  userId?: number;
}
export const authCheck = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const user = await getUserById(userId!);
  checkUserIfNotExist(user);

  res.status(200).json({
    message: "You are authenticated.",
  });
};

export const forgetPassword = [
  body("email", "Invalid Email").trim().notEmpty().isEmail().normalizeEmail(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { email } = req.body;
    const user = await getUserByEmail(email);
    checkUserIfNotExist(user);

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashOtp = await bcrypt.hash(otp.toString(), salt);
    const token = generateToken();

    const otpRow = await getOtpByEmail(email!);
    let result: any;

    if (!otpRow) {
      const otpData = {
        email,
        otp: hashOtp,
        rememberToken: token,
        count: 1,
        error: 0,
      };
      result = await createOtp(otpData);
    } else {
      const lastOtpRequest = new Date(otpRow.updatedAt).toLocaleDateString();
      const today = new Date().toLocaleDateString();
      const isSameDate = lastOtpRequest === today;

      checkOtpErrorIfSameDate(isSameDate, otpRow.error);

      if (!isSameDate) {
        // reset count + error
        const otpData = {
          otp: hashOtp,
          rememberToken: token,
          count: 1,
          error: 0,
        };
        result = await updateOtp(otpRow.id, otpData);
      } else {
        if (otpRow.count === 5) {
          return next(
            createError(
              "OTP is allowed to request 5 times per day",
              405,
              errorCode.overLimit
            )
          );
        } else {
          const otpData = {
            otp: hashOtp,
            rememberToken: token,
            count: otpRow.count + 1,
          };
          result = await updateOtp(otpRow.id, otpData);
        }
      }
    }

    // const otpRow = await getOtpByEmail(email);

    // let result: any;

    // const lastOtpRequest = new Date(otpRow!.updatedAt).toLocaleDateString();
    // const today = new Date().toLocaleDateString();
    // const isSameDate = lastOtpRequest === today;
    // checkOtpErrorIfSameDate(isSameDate, otpRow!.error);
    // // If OTP request is not in the same date
    // if (!isSameDate) {
    //   const otpData = {
    //     otp: hashOtp,
    //     rememberToken: token,
    //     count: 1,
    //     error: 0,
    //   };
    //   result = await updateOtp(otpRow!.id, otpData);
    // } else {
    //   // If OTP request is in the same date and over limit
    //   if (otpRow!.count === 5) {
    //     return next(
    //       createError(
    //         "OTP is allowed to request 5 times per day",
    //         405,
    //         errorCode.overLimit
    //       )
    //     );
    //   } else {
    //     // If OTP request is in the same date but not over limit
    //     const otpData = {
    //       otp: hashOtp,
    //       rememberToken: token,
    //       count: otpRow!.count + 1,
    //     };
    //     result = await updateOtp(otpRow!.id, otpData);
    //   }
    // }
    // //Sent Email
    const { subject, text, html } = forgetPasswordOtpTemplate(otp);
    await sendEmail(result.email, subject, text, html);

    res.status(200).json({
      message: `We are sending OTP to 09${result.email} to reset password.`,
      email: result.email,
      token: result.rememberToken,
    });
  },
];

export const verifyOtpForPassword = [
  body("email", "Invalid email")
    .exists()
    .trim()
    .notEmpty()
    .isEmail()
    .isLength({ max: 254 })
    .normalizeEmail(),
  body("otp", "Invalid OTP")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 6, max: 6 }),
  body("token", "Invalid token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { email, otp, token } = req.body;

    const user = await getUserByEmail(email);
    checkUserIfNotExist(user);

    const otpRow = await getOtpByEmail(email);

    const lastOtpVerify = new Date(otpRow!.updatedAt).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    const isSameDate = lastOtpVerify === today;
    // If OTP error is in the same date and over limit
    checkOtpErrorIfSameDate(isSameDate, otpRow!.error);

    // Token is wrong
    if (otpRow?.rememberToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);

      return next(createError("Invalid token", 400, errorCode.invalid));
    }

    // OTP is expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 2;
    if (isExpired) {
      return next(createError("OTP is expired", 403, errorCode.otpExpired));
    }

    const isMatchOtp = await bcrypt.compare(otp, otpRow!.otp);
    // OTP is wrong
    if (!isMatchOtp) {
      // If OTP error is first time today
      if (!isSameDate) {
        const otpData = {
          error: 1,
        };
        await updateOtp(otpRow!.id, otpData);
      } else {
        // If OTP error is not first time today
        const otpData = {
          error: { increment: 1 },
        };
        await updateOtp(otpRow!.id, otpData);
      }

      return next(createError("OTP is incorrect", 401, errorCode.invalid));
    }

    // All are OK
    const verifyToken = generateToken();
    const otpData = {
      verifyToken,
      error: 0,
      count: 1,
    };
    const result = await updateOtp(otpRow!.id, otpData);

    res.status(200).json({
      message: "OTP is successfully verified to reset password",
      email: result.email,
      token: result.verifyToken,
    });
  },
];

export const resetPassword = [
  // Validate and sanitize fields.
  body("email", "Invalid email")
    .exists()
    .trim()
    .notEmpty()
    .isEmail()
    .isLength({ max: 254 })
    .normalizeEmail(),
  body("token", "Token must not be empty.").trim().notEmpty().escape(),

  body("password", "Invalid Password")
    .isString()
    .isLength({ min: 8, max: 25 })
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character"),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const { token, email, password } = req.body;

    const user = await getUserByEmail(email);
    checkUserIfNotExist(user);

    const otpRow = await getOtpByEmail(email);

    if (otpRow!.error === 5) {
      return next(
        createError(
          "This request may be an attack. If not, try again tomorrow.",
          401,
          errorCode.attack
        )
      );
    }

    if (otpRow!.verifyToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);

      return next(createError("Token is invalid.", 400, errorCode.attack));
    }

    // request is expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 5;
    if (isExpired) {
      return next(
        createError(
          "Your request is expired. Please try again.",
          403,
          errorCode.requestExpired
        )
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // jwt token
    const accessPayload = { id: user!.id };
    const refreshPayload = { id: user!.id, email: user!.email };

    const accessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, // 15 mins
      }
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d", // "30d" in production
      }
    );

    const userUpdateData = {
      password: hashPassword,
      randToken: refreshToken,
    };
    await updateUser(user!.id, userUpdateData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 15 * 60 * 1000, // 15 mins
        path: "/",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      })
      .status(200)
      .json({
        message: "Successfully reset your password.",
        userId: user!.id,
      });
  },
];

export const changePassword = [
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const userId = req.userId;
    const user = await getUserById(userId!);
    checkUserIfNotExist(user);
    const email = user!.email;

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashOtp = await bcrypt.hash(otp.toString(), salt);
    const token = generateToken();

    const otpRow = await getOtpByEmail(email!);
    let result: any;

    if (!otpRow) {
      const otpData = {
        email,
        otp: hashOtp,
        rememberToken: token,
        count: 1,
        error: 0,
      };
      result = await createOtp(otpData);
    } else {
      const lastOtpRequest = new Date(otpRow.updatedAt).toLocaleDateString();
      const today = new Date().toLocaleDateString();
      const isSameDate = lastOtpRequest === today;

      checkOtpErrorIfSameDate(isSameDate, otpRow.error);

      if (!isSameDate) {
        // reset count + error
        const otpData = {
          otp: hashOtp,
          rememberToken: token,
          count: 1,
          error: 0,
        };
        result = await updateOtp(otpRow.id, otpData);
      } else {
        if (otpRow.count === 5) {
          return next(
            createError(
              "OTP is allowed to request 5 times per day",
              405,
              errorCode.overLimit
            )
          );
        } else {
          const otpData = {
            otp: hashOtp,
            rememberToken: token,
            count: otpRow.count + 1,
          };
          result = await updateOtp(otpRow.id, otpData);
        }
      }
    }

    //Sent Email
    // await GeneralQueue.add(
    //   "changePassword_otp",
    //   {
    //     email,
    //     otp,
    //   },
    //   {
    //     attempts: 3,
    //     backoff: {
    //       type: "exponential",
    //       delay: 1000,
    //     },
    //   }
    // );
    // //Sent Email
    const { subject, text, html } = changeOtpTemplate(otp);
    await sendEmail(result.email, subject, text, html);

    res.status(200).json({
      message: `We are sending OTP to ${result.email} to set new password.`,
      email: result.email,
      token: result.rememberToken,
    });
  },
];

export const changeVerifyOtpPassword = [
  body("email", "Invalid email")
    .exists()
    .trim()
    .notEmpty()
    .isEmail()
    .isLength({ max: 254 })
    .normalizeEmail(),
  body("otp", "Invalid OTP")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 6, max: 6 }),
  body("token", "Invalid token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { email, otp, token } = req.body;

    const user = await getUserByEmail(email);
    checkUserIfNotExist(user);

    const otpRow = await getOtpByEmail(email);

    const lastOtpVerify = new Date(otpRow!.updatedAt).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    const isSameDate = lastOtpVerify === today;
    // If OTP error is in the same date and over limit
    checkOtpErrorIfSameDate(isSameDate, otpRow!.error);

    // Token is wrong
    if (otpRow?.rememberToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);

      return next(createError("Invalid token", 400, errorCode.invalid));
    }

    // OTP is expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 5;
    if (isExpired) {
      return next(createError("OTP is expired", 403, errorCode.otpExpired));
    }

    const isMatchOtp = await bcrypt.compare(otp, otpRow!.otp);
    // OTP is wrong
    if (!isMatchOtp) {
      // If OTP error is first time today
      if (!isSameDate) {
        const otpData = {
          error: 1,
        };
        await updateOtp(otpRow!.id, otpData);
      } else {
        // If OTP error is not first time today
        const otpData = {
          error: { increment: 1 },
        };
        await updateOtp(otpRow!.id, otpData);
      }

      return next(createError("OTP is incorrect", 401, errorCode.invalid));
    }

    // All are OK
    const verifyToken = generateToken();
    const otpData = {
      verifyToken,
      error: 0,
      count: 1,
    };
    const result = await updateOtp(otpRow!.id, otpData);

    res.status(200).json({
      message: "OTP is successfully verified to reset password",
      email: result.email,
      token: result.verifyToken,
    });
  },
];

export const setNewPassword = [
  // Validate and sanitize fields.
  body("email", "Invalid email")
    .exists()
    .trim()
    .notEmpty()
    .isEmail()
    .isLength({ max: 254 })
    .normalizeEmail(),
  body("token", "Token must not be empty.").trim().notEmpty().escape(),
  body("OldPassword", "Invalid Old Password")
    .isString()
    .isLength({ min: 8, max: 25 })
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character"),

  body("newPassword", "Invalid New Password")
    .isString()
    .isLength({ min: 8, max: 25 })
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character"),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    // If validation error occurs
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const { token, email, oldPassword, newPassword } = req.body;

    const user = await getUserByEmail(email);
    checkUserIfNotExist(user);

    const otpRow = await getOtpByEmail(email);

    if (otpRow!.error === 5) {
      return next(
        createError(
          "This request may be an attack. If not, try again tomorrow.",
          401,
          errorCode.attack
        )
      );
    }

    if (otpRow!.verifyToken !== token) {
      const otpData = {
        error: 5,
      };
      await updateOtp(otpRow!.id, otpData);

      return next(createError("Token is invalid.", 400, errorCode.attack));
    }

    // request is expired
    const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 5;
    if (isExpired) {
      return next(
        createError(
          "Your request is expired. Please try again.",
          403,
          errorCode.requestExpired
        )
      );
    }

    //Check old password
    const isMatchPassword = await bcrypt.compare(oldPassword, user!.password);
    if (!isMatchPassword) {
      return next(
        createError("Old Password is incorrect.", 403, errorCode.invalid)
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    // jwt token
    const accessPayload = { id: user!.id };
    const refreshPayload = { id: user!.id, email: user!.email };

    const accessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, // 15 mins
      }
    );

    const refreshToken = jwt.sign(
      refreshPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d", // "30d" in production
      }
    );

    const userUpdateData = {
      password: hashPassword,
      randToken: refreshToken,
    };
    await updateUser(user!.id, userUpdateData);

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 15 * 60 * 1000, // 15 mins
        path: "/",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      })
      .status(200)
      .json({
        message: "Successfully set your new password.",
        userId: user!.id,
      });
  },
];
