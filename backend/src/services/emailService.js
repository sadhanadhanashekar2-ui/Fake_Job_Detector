const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 5000,
      socketTimeout: 5000,
      pool: {
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 4000,
        rateLimit: 14
      }
    });
  }

  async sendOTP(email, otpCode) {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 10px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Fake Job Detector</h1>
              <p>Your OTP Code for Verification</p>
            </div>
            <div class="content">
              <h2>Hello,</h2>
              <p>Thank you for registering with Fake Job Detector. Please use the following OTP code to complete your verification:</p>
              <div class="otp-code">${otpCode}</div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Fake Job Detector. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Your OTP Code - Fake Job Detector',
      html: htmlTemplate
    };

    return await this.transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(email, name) {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .features { margin: 20px 0; }
            .feature-item { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Fake Job Detector!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for joining Fake Job Detector! Your account has been successfully verified.</p>
              
              <div class="features">
                <h3>What you can do:</h3>
                <div class="feature-item">
                  <strong>📄 Upload Job Postings</strong>
                  <p>Upload PDFs or paste text to analyze job listings</p>
                </div>
                <div class="feature-item">
                  <strong>🔍 Detect Fake Jobs</strong>
                  <p>Our system analyzes multiple factors to identify potential scams</p>
                </div>
                <div class="feature-item">
                  <strong>📊 Get Detailed Reports</strong>
                  <p>Receive comprehensive analysis with confidence scores</p>
                </div>
                <div class="feature-item">
                  <strong>📱 Track History</strong>
                  <p>Keep records of all your previous scans</p>
                </div>
              </div>
              
              <p>Start protecting yourself from job scams today!</p>
              <p><a href="${process.env.FRONTEND_URL}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Fake Job Detector. All rights reserved.</p>
              <p>Stay safe in your job search journey!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Fake Job Detector" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: 'Welcome to Fake Job Detector!',
      html: htmlTemplate
    };

    return await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();