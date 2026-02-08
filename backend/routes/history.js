import express from "express";
import History from "../models/History.js";
import crypto from "crypto"; // Import crypto at the top

const router = express.Router();

// Save analysis to history
router.post("/save-analysis", async (req, res) => {
  try {
    const { 
      userEmail, 
      imageUrl, 
      analysisResult // The complete result from your face analysis
    } = req.body;

    if (!userEmail || !imageUrl || !analysisResult) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate hash from image URL using crypto
    const imageHash = crypto.createHash('md5')
      .update(imageUrl)
      .digest('hex');

    // Check for existing analysis
    const existingAnalysis = await History.findOne({ userEmail, imageHash });
    if (existingAnalysis) {
      return res.status(200).json({
        success: true,
        message: 'Analysis already saved',
        isDuplicate: true
      });
    }

    // Extract skinGrade and overallCondition from analysisResult if available
    let skinGrade = 'Unknown';
    let overallCondition = 'Unknown';
    
    if (analysisResult.skin_grade) {
      skinGrade = analysisResult.skin_grade;
    } else if (analysisResult.skinGrade) {
      skinGrade = analysisResult.skinGrade;
    }
    
    if (analysisResult.overall_condition) {
      overallCondition = analysisResult.overall_condition;
    } else if (analysisResult.overallCondition) {
      overallCondition = analysisResult.overallCondition;
    }

    // Save to database
    const newAnalysis = new History({
      userEmail,
      imageHash,
      imageUrl,
      analysisData: analysisResult, // Store the complete result
      skinGrade,
      overallCondition
    });

    await newAnalysis.save();

    res.status(201).json({
      success: true,
      message: 'Analysis saved successfully',
      isDuplicate: false
    });

  } catch (error) {
    console.error('Save analysis error:', error);
    
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: 'Analysis already saved',
        isDuplicate: true
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Rest of your routes remain the same...

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
      .select('imageUrl skinGrade overallCondition timestamp analysisData'); // Include ALL analysisData

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
    
    // Get skin grade distribution (optional, can keep or remove)
    const gradeDistribution = await History.aggregate([
      { $match: { userEmail } },
      { $group: { _id: "$skinGrade", count: { $sum: 1 } } }
    ]);

    // Get latest analysis WITH analysisData
    const latestAnalysis = await History.findOne({ userEmail })
      .sort({ timestamp: -1 })
      .select('analysisData timestamp imageUrl');

    // Extract age and gender from the latest analysis
    let latestAge = 'N/A';
    let latestGender = 'N/A';
    
    if (latestAnalysis && latestAnalysis.analysisData) {
      const analysis = latestAnalysis.analysisData;
      latestAge = analysis.age || analysis.face?.age || 'N/A';
      latestGender = analysis.gender || analysis.face?.gender || 'N/A';
    }

    // Calculate average acne score
    const allAnalyses = await History.find({ userEmail }).select('analysisData');
    let totalAcneScore = 0;
    let validScores = 0;
    
    allAnalyses.forEach(analysis => {
      if (analysis.analysisData) {
        const acneScore = analysis.analysisData.acne || 
                         analysis.analysisData.skin_attributes?.acne;
        if (acneScore !== undefined && acneScore !== null) {
          totalAcneScore += acneScore;
          validScores++;
        }
      }
    });
    
    const averageAcneScore = validScores > 0 ? Math.round(totalAcneScore / validScores) : 0;

    res.json({
      success: true,
      data: {
        totalAnalyses,
        gradeDistribution,
        latestAnalysis: {
          age: latestAge,
          gender: latestGender,
          acneScore: latestAnalysis?.analysisData?.acne || 
                    latestAnalysis?.analysisData?.skin_attributes?.acne || 0,
          imageUrl: latestAnalysis?.imageUrl,
          timestamp: latestAnalysis?.timestamp
        },
        averageAcneScore
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