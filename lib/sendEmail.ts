import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; message: string; otp?: string }> {
  try {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const msg = 'Email configuration incomplete';
      console.warn(msg, {
        EMAIL_HOST: process.env.EMAIL_HOST,
        EMAIL_PORT: process.env.EMAIL_PORT,
        EMAIL_USER: process.env.EMAIL_USER ? 'set' : 'missing',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'set' : 'missing',
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV OTP] To: ${email}, OTP: ${otp}`);
        return { success: true, message: 'Development fallback: OTP logged to console', otp };
      }

      return { success: false, message: 'Email settings are not configured on server' };
    }

    await transporter.verify();

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@refurbishedpc.com',
      to: email,
      subject: 'Your OTP for Order Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Order Verification</h2>
          <p>Hello,</p>
          <p>Your OTP for order verification is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666;">This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
          <p style="color: #666;">If you did not request this OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999;">© 2024 Refurbished PC Studio. All rights reserved.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return { success: true, message: 'OTP email sent successfully' };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, message: (error as Error).message || 'Unknown email error' };
  }
}
