export const forgetPasswordOtpTemplate = (otp: number) => {
  const subject = "Forgetpassword OTP Code";
  const text = `Your OTP code is ${otp}. It will expire in 5 minutes.`;
  const html = `
        <div style="font-family: Arial, sans-serif; padding: 25px; background: #f9f9f9;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center;">🔐 Your OTP Code</h2>
            <p style="font-size: 16px; color: #555;">Use the following One-Time (OTP) to complete your forgetpassword:</p>
            <div style="font-size: 24px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #777; text-align: center;">⚠️ This code will expire in <b>5 minutes</b>.</p>
          </div>
        </div>
      `;

  return { subject, text, html };
};

export const changeOtpTemplate = (otp: number) => {
  const subject = "Your OTP Code";
  const text = `Your OTP code is ${otp}. It will expire in 5 minutes.`;
  const html = `
        <div style="font-family: Arial, sans-serif; padding: 25px; background: #f9f9f9;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center;">🔐 Your OTP Code</h2>
            <p style="font-size: 16px; color: #555;">Use the following One-Time (OTP) to complete your change password:</p>
            <div style="font-size: 24px; font-weight: bold; color: #007bff; text-align: center; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #777; text-align: center;">⚠️ This code will expire in <b>5 minutes</b>.</p>
          </div>
        </div>
      `;

  return { subject, text, html };
};
