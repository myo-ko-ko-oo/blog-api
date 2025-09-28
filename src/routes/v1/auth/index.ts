import express from "express";
import {
  authCheck,
  changePassword,
  changeVerifyOtpPassword,
  forgetPassword,
  login,
  logout,
  register,
  resetPassword,
  setNewPassword,
  verifyOtpForPassword,
} from "../../../controllers/auth/authController";
import { auth } from "../../../middleware/auth";

// import { auth } from "../../middlewares/auth";

const router = express.Router();

router.post("/register", register);
// router.post("/verify-otp", verifyOtp);
// router.post("/confirm-password", confirmPassword);
router.post("/login", login);
router.post("/logout", logout);

router.post("/forget-password", forgetPassword);
router.post("/verify", verifyOtpForPassword);
router.post("/reset-password", resetPassword);

router.post("/change-password", auth, changePassword);
router.post("/otp-verify", auth, changeVerifyOtpPassword);
router.post("/new-set-password", setNewPassword);

router.get("/auth-check", auth, authCheck);

export default router;
