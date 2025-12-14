const User = require('../models/User');
const OTP = require('../models/OTP');
const { registerSchema, loginSchema, otpSchema } = require('../utils/validators');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');

class AuthController {
  async register(req, res) {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);
      const { name, email, password } = validatedData;

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Generate OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Delete any existing OTPs for this email
      await OTP.deleteByEmail(email);

      // Save OTP
      await OTP.create({
        email,
        code: otpCode
      });

      // Send OTP email (non-blocking with timeout)
      const emailPromise = emailService.sendOTP(email, otpCode);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout')), 5000)
      );
      
      Promise.race([emailPromise, timeoutPromise])
        .then(() => {
          console.log(`OTP sent to ${email}`);
        })
        .catch((emailError) => {
          console.log(`[DEV MODE] OTP for ${email}: ${otpCode}`);
          console.log(`Email error (non-blocking): ${emailError.message}`);
        });

      // Create unverified user
      const user = await User.create({
        name,
        email,
        password,
        verified: false
      });

      res.status(201).json({
        success: true,
        message: 'OTP sent to email',
        data: {
          userId: user.id,
          email: user.email,
          name: user.name
        }
      });

    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  async verifyOTP(req, res) {
    try {
      const validatedData = otpSchema.parse(req.body);
      const { email, code } = validatedData;

      console.log(`[VERIFY OTP] Attempting to verify: email=${email}, code=${code}`);

      // Find valid OTP
      const otpRecord = await OTP.findValidOTP(email, code);

      if (!otpRecord) {
        console.log(`[VERIFY OTP] No valid OTP found for email=${email}, code=${code}`);
        // Debug: show all OTPs for this email
        const allOTPs = await require('../config/database').db('otp').where({ email });
        console.log(`[VERIFY OTP] All OTPs for ${email}:`, allOTPs);
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Find and verify user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const updatedUser = await User.update(user.id, { verified: true });

      // Delete used OTP
      await OTP.deleteById(otpRecord.id);

      // Send welcome email
      await emailService.sendWelcomeEmail(email, user.name);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          token,
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            verified: updatedUser.verified,
            themePreference: updatedUser.themePreference
          }
        }
      });

    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Verification failed',
        error: error.message
      });
    }
  }

  async login(req, res) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { email, password } = validatedData;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if verified
      if (!user.verified) {
        return res.status(401).json({
          success: false,
          message: 'Please verify your email first'
        });
      }

      // Check password
      const isPasswordValid = await User.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            themePreference: user.themePreference
          }
        }
      });

    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  async resendOTP(req, res) {
    try {
      const { email } = req.body;

      // Check if user exists
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.verified) {
        return res.status(400).json({
          success: false,
          message: 'User already verified'
        });
      }

      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Delete old OTPs
      await OTP.deleteByEmail(email);

      // Save new OTP
      await OTP.create({
        email,
        code: otpCode
      });

      // Send OTP email (non-blocking with timeout)
      const emailPromise = emailService.sendOTP(email, otpCode);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout')), 5000)
      );
      
      Promise.race([emailPromise, timeoutPromise])
        .then(() => {
          console.log(`OTP resent to ${email}`);
        })
        .catch((emailError) => {
          console.log(`[DEV MODE] OTP for ${email}: ${otpCode}`);
          console.log(`Email error (non-blocking): ${emailError.message}`);
        });

      res.status(200).json({
        success: true,
        message: 'OTP resent successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP',
        error: error.message
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        data: userWithoutPassword
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message
      });
    }
  }

  async updateTheme(req, res) {
    try {
      const { theme } = req.body;
      
      if (!['light', 'dark'].includes(theme)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid theme value'
        });
      }

      const user = await User.updateTheme(req.userId, theme);

      res.status(200).json({
        success: true,
        message: 'Theme updated successfully',
        data: user
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update theme',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();