const Prediction = require('../models/Prediction');
const fakeJobDetector = require('../services/fakeJobDetector');
const pdfParser = require('../utils/pdfParser');
const { jobTextSchema } = require('../utils/validators');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  }
});

class PredictionController {
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      let text;
      const ext = path.extname(req.file.originalname).toLowerCase();

      if (ext === '.pdf') {
        text = await pdfParser.extractTextFromPDF(req.file.buffer);
      } else if (ext === '.txt') {
        text = req.file.buffer.toString('utf-8');
      }

      if (!text || text.trim().length < 50) {
        return res.status(400).json({
          success: false,
          message: 'File content is too short or could not be extracted'
        });
      }

      // Analyze text
      const result = fakeJobDetector.predict(text);

      // Save prediction to database
      const prediction = await Prediction.create({
        userId: req.userId,
        text,
        fileName: req.file.originalname,
        fileType: ext.substring(1),
        prediction: result.prediction,
        confidence: result.confidence,
        explanation: result.explanation,
        redFlags: result.redFlags,
        recommendations: result.recommendations,
        metadata: result.metadata
      });

      res.status(200).json({
        success: true,
        message: 'Analysis complete',
        data: {
          id: prediction.id,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          explanation: prediction.explanation,
          recommendations: prediction.recommendations,
          redFlags: prediction.red_flags,
          metadata: prediction.metadata,
          fileName: prediction.file_name,
          timestamp: prediction.created_at
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Analysis failed',
        error: error.message
      });
    }
  }

  async analyzeText(req, res) {
    try {
      const validatedData = jobTextSchema.parse(req.body);
      const { text } = validatedData;

      // Analyze text
      const result = fakeJobDetector.predict(text);

      // Save prediction to database
      const prediction = await Prediction.create({
        userId: req.userId,
        text,
        fileType: 'manual',
        prediction: result.prediction,
        confidence: result.confidence,
        explanation: result.explanation,
        redFlags: result.redFlags,
        recommendations: result.recommendations,
        metadata: result.metadata
      });

      res.status(200).json({
        success: true,
        message: 'Analysis complete',
        data: {
          id: prediction.id,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          explanation: prediction.explanation,
          recommendations: prediction.recommendations,
          redFlags: prediction.red_flags,
          metadata: prediction.metadata,
          timestamp: prediction.created_at
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
        message: 'Analysis failed',
        error: error.message
      });
    }
  }

  async getHistory(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;

      const predictions = await Prediction.findByUserId(req.userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      const total = await Prediction.countByUserId(req.userId);

      res.status(200).json({
        success: true,
        data: {
          predictions: predictions.map(pred => ({
            _id: pred.id,
            userId: pred.user_id,
            fileName: pred.file_name,
            fileType: pred.file_type,
            prediction: pred.prediction,
            confidence: pred.confidence,
            explanation: pred.explanation,
            redFlags: pred.red_flags,
            recommendations: pred.recommendations,
            metadata: pred.metadata,
            createdAt: pred.created_at
          })),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch history',
        error: error.message
      });
    }
  }

  async getPrediction(req, res) {
    try {
      const { id } = req.params;

      const prediction = await Prediction.findByIdAndUserId(id, req.userId);

      if (!prediction) {
        return res.status(404).json({
          success: false,
          message: 'Prediction not found'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          _id: prediction.id,
          userId: prediction.user_id,
          text: prediction.text,
          fileName: prediction.file_name,
          fileType: prediction.file_type,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          explanation: prediction.explanation,
          redFlags: prediction.red_flags,
          recommendations: prediction.recommendations,
          metadata: prediction.metadata,
          createdAt: prediction.created_at
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch prediction',
        error: error.message
      });
    }
  }

  async deletePrediction(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Prediction.deleteByIdAndUserId(id, req.userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Prediction not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Prediction deleted successfully'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete prediction',
        error: error.message
      });
    }
  }

  // Get multer upload middleware
  getUploadMiddleware() {
    return upload.single('file');
  }
}

module.exports = new PredictionController();