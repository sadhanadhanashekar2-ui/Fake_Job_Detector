const { db } = require('../config/database');

class OTP {
  static async create({ email, code }) {
    const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const result = await db('otp')
      .insert({
        email,
        code: String(code), // Ensure code is stored as string
        expiration: expiration.toISOString()
      });
    
    const otpId = result[0];
    return await db('otp').where({ id: otpId }).first();
  }

  static async findValidOTP(email, code) {
    const now = new Date().toISOString();
    console.log(`[OTP.findValidOTP] Looking for email=${email}, code=${code}, now=${now}`);
    
    const record = await db('otp')
      .where({ email, code: String(code) })
      .where('expiration', '>', now)
      .first();
    
    console.log(`[OTP.findValidOTP] Found record:`, record);
    return record;
  }

  static async deleteByEmail(email) {
    return await db('otp')
      .where({ email })
      .del();
  }

  static async deleteById(id) {
    return await db('otp')
      .where({ id })
      .del();
  }

  static async cleanupExpired() {
    const now = new Date().toISOString();
    return await db('otp')
      .where('expiration', '<=', now)
      .del();
  }
}

module.exports = OTP;