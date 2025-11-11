import express from "express";
import History from "../models/History.js";

const router = express.Router();

// Save analysis to history
router.post("/save-analysis", async (req, res) => {
  try {
    const { userEmail, imageHash, analysisData, skinGrade, overallCondition } = req.body;

    if (!userEmail || !imageHash || !analysisData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userEmail, imageHash, analysisData'
      });
    }

    // Check if analysis with same image hash already exists for this user
    const existingAnalysis = await History.findOne({ userEmail, imageHash });
    if (existingAnalysis) {
      return res.status(200).json({
        success: true,
        message: 'Analysis already saved in history',
        data: existingAnalysis
      });
    }

    const newAnalysis = new History({
      userEmail,
      imageHash,
      analysisData,
      skinGrade,
      overallCondition,
      timestamp: new Date()
    });

    await newAnalysis.save();

    res.status(201).json({
      success: true,
      message: 'Analysis saved to history successfully',
      data: newAnalysis
    });

  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's analysis history
router.get("/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const analyses = await History.find({ userEmail })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-analysisData.image_hash'); // Exclude large image data

    const total = await History.countDocuments({ userEmail });

    res.json({
      success: true,
      data: analyses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific analysis by ID
router.get("/analysis/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await History.findById(id);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete analysis from history
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await History.findByIdAndDelete(id);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      message: 'Analysis deleted from history successfully'
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get analysis statistics for user
router.get("/stats/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;

    const totalAnalyses = await History.countDocuments({ userEmail });
    
    // Get skin grade distribution
    const gradeDistribution = await History.aggregate([
      { $match: { userEmail } },
      { $group: { _id: "$skinGrade", count: { $sum: 1 } } }
    ]);

    // Get latest analysis
    const latestAnalysis = await History.findOne({ userEmail })
      .sort({ timestamp: -1 })
      .select('skinGrade overallCondition timestamp');

    res.json({
      success: true,
      data: {
        totalAnalyses,
        gradeDistribution,
        latestAnalysis
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;