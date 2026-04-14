import dns from 'dns';
import nodemailer from 'nodemailer';

dns.setDefaultResultOrder?.('ipv4first');

const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);

const createTransportOptions = (portNumber: number) => {
  const emailHost = process.env.EMAIL_HOST?.trim();
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPassRaw = process.env.EMAIL_PASS?.trim();
  const emailPass = emailPassRaw ? emailPassRaw.replace(/\s+/g, '') : undefined;

  return {
    host: emailHost,
    port: portNumber,
    secure: portNumber === 465,
    requireTLS: portNumber === 587,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    logger: process.env.NODE_ENV !== 'production',
    debug: process.env.NODE_ENV !== 'production',
    lookup: (hostname: string, options: dns.LookupOneOptions, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
      return dns.lookup(hostname, { ...options, family: 4 }, callback);
    },
  };
};

const sendWithTransport = async (mailOptions: any, portNumber: number) => {
  const transporter = nodemailer.createTransport(createTransportOptions(portNumber));
  return transporter.sendMail(mailOptions);
};

function getMailOptions(email: string, subject: string, html: string, text?: string) {
  return {
    from: process.env.EMAIL_FROM || 'noreply@refurbishedpc.com',
    to: email,
    subject,
    html,
    text,
  };
}

export async function sendEmail(email: string, subject: string, html: string, text?: string): Promise<{ success: boolean; message: string }> {
  const emailHost = process.env.EMAIL_HOST?.trim();
  const emailPortEnv = process.env.EMAIL_PORT?.trim();
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPassRaw = process.env.EMAIL_PASS?.trim();
  const emailPass = emailPassRaw ? emailPassRaw.replace(/\s+/g, '') : undefined;

  if (!emailHost || !emailPortEnv || !emailUser || !emailPass) {
    const msg = 'Email configuration incomplete';
    console.warn(msg, {
      EMAIL_HOST: emailHost,
      EMAIL_PORT: emailPortEnv,
      EMAIL_USER: emailUser ? 'set' : 'missing',
      EMAIL_PASS: emailPass ? 'set' : 'missing',
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV EMAIL] To: ${email}, Subject: ${subject}`);
      console.log(html);
      return { success: true, message: 'Development fallback: Email output logged to console' };
    }

    return { success: false, message: 'Email settings are not configured on server' };
  }

  const port = parseInt(emailPortEnv, 10);
  const mailOptions = getMailOptions(email, subject, html, text);

  try {
    const info = await sendWithTransport(mailOptions, port);
    console.log('Email sent:', info.response);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email send error:', error);

    const sendError = error as Error & { code?: string };
    if (emailHost.includes('gmail.com') && port === 587 && ['ETIMEDOUT', 'ECONNECTION', 'EAI_AGAIN'].includes(sendError.code || '')) {
      try {
        const retryInfo = await sendWithTransport(mailOptions, 465);
        console.log('Email sent on fallback port 465:', retryInfo.response);
        return { success: true, message: 'Email sent successfully on fallback port 465' };
      } catch (retryError) {
        console.error('Gmail fallback send error:', retryError);
      }
    }

    return { success: false, message: sendError.message || 'Unknown email error' };
  }
}

export async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; message: string; otp?: string }> {
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Verification</h2>
        <p>Hello,</p>
        <p>Your OTP for order verification is:</p>
        <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
        <p style="color: #666;">If you did not request this OTP, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">© 2024 Refurbished PC Studio. All rights reserved.</p>
      </div>
    `;

  const result = await sendEmail(email, 'Your OTP for Order Verification', html);
  return { ...result, otp: result.success ? otp : undefined };
}
