const { db } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ name, email, password, verified = false }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        verified
      });
    
    const userId = result[0];
    return await User.findById(userId);
  }

  static async findByEmail(email) {
    return await db('users')
      .where({ email })
      .first();
  }

  static async findById(id) {
    return await db('users')
      .where({ id })
      .first();
  }

  static async update(id, updates) {
    await db('users')
      .where({ id })
      .update(updates);
    
    return await User.findById(id);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async updateTheme(userId, theme) {
    await db('users')
      .where({ id: userId })
      .update({ themePreference: theme });
    
    return await User.findById(userId);
  }
}

module.exports = User;