const { db } = require('../config/database');

class Prediction {
  static async create({
    userId,
    text,
    fileName = null,
    fileType = 'manual',
    prediction,
    confidence,
    explanation,
    redFlags = [],
    recommendations = [],
    metadata = {}
  }) {
    const result = await db('predictions')
      .insert({
        user_id: userId,
        text: text.substring(0, 5000),
        file_name: fileName,
        file_type: fileType,
        prediction,
        confidence,
        explanation,
        red_flags: JSON.stringify(redFlags),
        recommendations: JSON.stringify(recommendations),
        metadata: JSON.stringify(metadata)
      });
    
    const predId = result[0];
    const pred = await db('predictions').where({ id: predId }).first();
    
    // Parse JSON fields
    if (pred) {
      pred.red_flags = JSON.parse(pred.red_flags || '[]');
      pred.recommendations = JSON.parse(pred.recommendations || '[]');
      pred.metadata = JSON.parse(pred.metadata || '{}');
    }
    
    return pred;
  }

  static async findByUserId(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    
    const predictions = await db('predictions')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select(
        'id',
        'user_id',
        'file_name',
        'file_type',
        'prediction',
        'confidence',
        'explanation',
        'red_flags',
        'recommendations',
        'metadata',
        'created_at'
      );
    
    // Parse JSON fields
    return predictions.map(pred => ({
      ...pred,
      red_flags: JSON.parse(pred.red_flags || '[]'),
      recommendations: JSON.parse(pred.recommendations || '[]'),
      metadata: JSON.parse(pred.metadata || '{}')
    }));
  }

  static async findByIdAndUserId(id, userId) {
    const prediction = await db('predictions')
      .where({ id, user_id: userId })
      .first();
    
    if (prediction) {
      prediction.red_flags = JSON.parse(prediction.red_flags || '[]');
      prediction.recommendations = JSON.parse(prediction.recommendations || '[]');
      prediction.metadata = JSON.parse(prediction.metadata || '{}');
    }
    
    return prediction;
  }

  static async countByUserId(userId) {
    const [{ count }] = await db('predictions')
      .where({ user_id: userId })
      .count('id as count');
    
    return parseInt(count);
  }

  static async deleteByIdAndUserId(id, userId) {
    return await db('predictions')
      .where({ id, user_id: userId })
      .del();
  }
}

module.exports = Prediction;