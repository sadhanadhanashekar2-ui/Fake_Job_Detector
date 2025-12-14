const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all prediction routes
router.use(authMiddleware);

// File upload route
router.post('/upload', 
  predictionController.getUploadMiddleware(),
  predictionController.uploadFile
);

// Text analysis route
router.post('/analyze', predictionController.analyzeText);

// History routes
router.get('/history', predictionController.getHistory);
router.get('/history/:id', predictionController.getPrediction);
router.delete('/history/:id', predictionController.deletePrediction);

module.exports = router;