import nodemailer from 'nodemailer'
import { config } from "dotenv";

config();

const transporter = nodemailer.createTransport({
  host: 'smtp.email.ap-mumbai-1.oci.oraclecloud.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
})

export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export const sendVerificationEmail = async (email, otp, context = 'verification') => {
  const isPasswordReset = context === 'password-reset';
  
  const mailOptions = {
    from: 'noreply@siddz.com',
    to: email,
    subject: isPasswordReset ? 'Reset Your Lumeroo Password' : 'Verify Your Lumeroo Account',
    text: `Your ${isPasswordReset ? 'password reset' : 'verification'} code is: ${otp}\nThis code will expire in 1 hour.`,
    html: `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 580px; margin: 20px auto; padding: 25px; border-radius: 10px; background-color: #f9f9f7; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);">
        <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #2c3e50; font-size: 26px; font-weight: 600; margin-top: 0; text-align: center; margin-bottom: 25px;">
            ${isPasswordReset ? 'Reset Your Password' : 'Welcome to Lumeroo!'}
          </h2>
          
          <p style="color: #555f6b; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
            ${isPasswordReset ? 
              'We received a request to reset your password. Use the code below to complete the process:' : 
              'Please verify your email address with the code below:'}
          </p>
          
          <div style="background-color: #fffdf0; padding: 18px; border-radius: 6px; font-size: 32px; text-align: center; font-weight: bold; margin: 30px 0; color: #343a40; border: 2px dashed #d6d203;">${otp.trim()}</div>
          
          <p style="color: #7f8c8d; font-size: 14px; line-height: 1.5; margin-bottom: 8px; text-align: center;">
            This code will expire in 1 hour.
          </p>
          
          <p style="color: #95a5a6; font-size: 13px; line-height: 1.5; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            ${isPasswordReset ? 
              'If you did not request a password reset, please ignore this email or contact support if you have concerns.' : 
              'If you didn\'t create an account, you can safely ignore this email.'}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 25px; color: #a0a0a0; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Lumeroo. All rights reserved.</p>
          <p style="margin-top: 8px;">
            <a href="https://lumeroo.siddz.com.org/privacy" style="color: #b8b002; text-decoration: none; margin: 0 8px;">Privacy Policy</a> | 
            <a href="https://lumeroo.siddz.com.org/terms" style="color: #b8b002; text-decoration: none; margin: 0 8px;">Terms of Service</a>
          </p>
        </div>
      </div>
    `
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email sending error:', error)
        reject(error)
      } else {
        console.log('Verification email sent:', info.response)
        resolve(info)
      }
    })
  })
}