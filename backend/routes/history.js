import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import History from "../models/History.js";

const router = express.Router();

// Save analysis to history
router.post("/save-analysis", async (req, res) => {
  try {
    const { userEmail, imageUrl, analysisResult } = req.body;

    console.log("Save analysis request received:", { 
      userEmail, 
      hasImage: !!imageUrl, 
      hasResult: !!analysisResult 
    });

    if (!userEmail || !imageUrl || !analysisResult) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missing: {
          userEmail: !userEmail,
          imageUrl: !imageUrl,
          analysisResult: !analysisResult
        }
      });
    }

    // Generate hash from image URL
    const imageHash = crypto.createHash('md5')
      .update(imageUrl + Date.now())
      .digest('hex');

    // Extract skinGrade string from analysisResult
    let skinGradeString = 'Unknown';
    let overallCondition = 'Unknown';
    
    // Handle skin_grade object
    if (analysisResult.skin_grade) {
      if (typeof analysisResult.skin_grade === 'object' && analysisResult.skin_grade.grade) {
        // It's an object with a grade property
        skinGradeString = analysisResult.skin_grade.grade;
        // Also extract overall condition from description
        overallCondition = analysisResult.skin_grade.description || 'Unknown';
      } else if (typeof analysisResult.skin_grade === 'string') {
        // It's already a string
        skinGradeString = analysisResult.skin_grade;
      }
    } else if (analysisResult.skinGrade) {
      // Alternative field name
      if (typeof analysisResult.skinGrade === 'object' && analysisResult.skinGrade.grade) {
        skinGradeString = analysisResult.skinGrade.grade;
        overallCondition = analysisResult.skinGrade.description || 'Unknown';
      } else if (typeof analysisResult.skinGrade === 'string') {
        skinGradeString = analysisResult.skinGrade;
      }
    }
    
    // If we couldn't extract a grade, try to determine from acne score
    if (skinGradeString === 'Unknown') {
      const acneScore = analysisResult.acne || analysisResult.skin_attributes?.acne || 0;
      if (acneScore <= 15) skinGradeString = 'A+';
      else if (acneScore <= 30) skinGradeString = 'A';
      else if (acneScore <= 45) skinGradeString = 'B+';
      else if (acneScore <= 60) skinGradeString = 'B';
      else if (acneScore <= 75) skinGradeString = 'C';
      else skinGradeString = 'D';
    }
    
    // Determine overall condition from skin grade string
    if (skinGradeString === 'A+' || skinGradeString === 'A') overallCondition = 'Excellent';
    else if (skinGradeString === 'B+' || skinGradeString === 'B') overallCondition = 'Good';
    else if (skinGradeString === 'C') overallCondition = 'Fair';
    else if (skinGradeString === 'D') overallCondition = 'Needs Improvement';
    else if (overallCondition === 'Unknown') overallCondition = 'Analyzed';

    // Check for duplicate within last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingAnalysis = await History.findOne({ 
      userEmail, 
      imageHash: { $regex: imageHash.substring(0, 10) },
      timestamp: { $gte: oneHourAgo }
    });

    if (existingAnalysis) {
      return res.status(200).json({
        success: true,
        message: 'Analysis already saved recently',
        isDuplicate: true,
        id: existingAnalysis._id
      });
    }

    // Save to database - store skinGrade as string
    const newAnalysis = new History({
      userEmail,
      imageHash,
      imageUrl,
      analysisData: analysisResult,
      skinGrade: skinGradeString,  // Now a string, not an object
      overallCondition,
      timestamp: new Date()
    });

    await newAnalysis.save();

    console.log("Analysis saved successfully with ID:", newAnalysis._id);
    console.log("Saved with skinGrade:", skinGradeString);

    res.status(201).json({
      success: true,
      message: 'Analysis saved successfully',
      isDuplicate: false,
      id: newAnalysis._id
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
      message: error.message || 'Internal server error',
      error: error.toString()
    });
  }
});

// Get ALL analysis history
router.get("/all", async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const analyses = await History.find({})
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await History.countDocuments({});

    const formattedData = analyses.map(analysis => ({
      id: analysis._id,
      imageUrl: analysis.imageUrl,
      skinGrade: analysis.skinGrade,
      overallCondition: analysis.overallCondition,
      timestamp: analysis.timestamp,
      analysisData: analysis.analysisData,
      userEmail: analysis.userEmail
    }));

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get all history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Get user's analysis history
router.get("/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const analyses = await History.find({ userEmail })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await History.countDocuments({ userEmail });

    res.json({
      success: true,
      data: analyses.map(analysis => ({
        id: analysis._id,
        imageUrl: analysis.imageUrl,
        skinGrade: analysis.skinGrade,
        overallCondition: analysis.overallCondition,
        timestamp: analysis.timestamp,
        analysisData: analysis.analysisData,
        userEmail: analysis.userEmail
      })),
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
      message: error.message || 'Internal server error'
    });
  }
});

// Get specific analysis by ID
router.get("/analysis/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const analysis = await History.findById(id).lean();
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
      message: error.message || 'Internal server error'
    });
  }
});

// Delete analysis
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
      message: error.message || 'Internal server error'
    });
  }
});

// Get analysis statistics for user
router.get("/stats/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;

    const totalAnalyses = await History.countDocuments({ userEmail });
    
    const latestAnalysis = await History.findOne({ userEmail })
      .sort({ timestamp: -1 })
      .lean();

    const allAnalyses = await History.find({ userEmail }).select('analysisData').lean();
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

    const gradeDistribution = await History.aggregate([
      { $match: { userEmail } },
      { $group: { 
        _id: "$skinGrade", 
        count: { $sum: 1 } 
      } }
    ]);

    res.json({
      success: true,
      data: {
        totalAnalyses,
        gradeDistribution,
        latestAnalysis: latestAnalysis ? {
          age: latestAnalysis.analysisData?.age || 'N/A',
          gender: latestAnalysis.analysisData?.gender || 'N/A',
          acneScore: latestAnalysis.analysisData?.acne || 
                    latestAnalysis.analysisData?.skin_attributes?.acne || 0,
          skinGrade: latestAnalysis.skinGrade,
          imageUrl: latestAnalysis.imageUrl,
          timestamp: latestAnalysis.timestamp
        } : null,
        averageAcneScore
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Test endpoint
router.post("/test", async (req, res) => {
  try {
    const testData = {
      userEmail: "test@example.com",
      imageUrl: "test-image-url",
      analysisResult: {
        age: "28",
        gender: "Female",
        acne: 45,
        skin_grade: {
          grade: "B+",
          description: "Good",
          color: "#CDDC39",
          overall_score: 41.3
        }
      }
    };

    const imageHash = crypto.createHash('md5')
      .update(testData.imageUrl + Date.now())
      .digest('hex');

    // Extract grade string from the object
    const skinGradeString = testData.analysisResult.skin_grade.grade;

    const newAnalysis = new History({
      userEmail: testData.userEmail,
      imageHash,
      imageUrl: testData.imageUrl,
      analysisData: testData.analysisResult,
      skinGrade: skinGradeString,  // Store as string
      overallCondition: "Good"
    });

    await newAnalysis.save();

    res.json({
      success: true,
      message: "Test data saved successfully",
      id: newAnalysis._id,
      data: {
        userEmail: testData.userEmail,
        skinGrade: skinGradeString
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// Add this new endpoint to history.js - Get disease statistics from analysisData

// Get disease statistics from all analyses
router.get("/disease-statistics", async (req, res) => {
  try {
    // First, try to get disease from analysisData.disease (if available)
    let diseaseStats = await History.aggregate([
      {
        $match: {
          $or: [
            { "analysisData.disease": { $exists: true, $ne: null } },
            { "analysisData.prediction": { $exists: true, $ne: null } },
            { "analysisData.aggregated_result.disease": { $exists: true, $ne: null } }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $ifNull: ["$analysisData.disease", false] },
              "$analysisData.disease",
              {
                $cond: [
                  { $ifNull: ["$analysisData.aggregated_result.disease", false] },
                  "$analysisData.aggregated_result.disease",
                  "$analysisData.prediction"
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          disease_name: "$_id",
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // If no disease field found, try to extract from acne_regions or other indicators
    if (diseaseStats.length === 0) {
      // Get all analyses and manually extract diseases from various possible fields
      const allAnalyses = await History.find({}).lean();
      const diseaseMap = new Map();
      
      allAnalyses.forEach(analysis => {
        let disease = null;
        
        // Check various possible locations for disease name
        if (analysis.analysisData) {
          // Check for disease field
          if (analysis.analysisData.disease) {
            disease = analysis.analysisData.disease;
          }
          // Check for aggregated_result
          else if (analysis.analysisData.aggregated_result?.disease) {
            disease = analysis.analysisData.aggregated_result.disease;
          }
          // Check for prediction
          else if (analysis.analysisData.prediction) {
            disease = analysis.analysisData.prediction;
          }
          // Check for skin condition from skin_attributes
          else if (analysis.analysisData.skin_attributes?.primary_condition) {
            disease = analysis.analysisData.skin_attributes.primary_condition;
          }
        }
        
        if (disease && disease !== 'Unknown' && disease !== 'N/A') {
          diseaseMap.set(disease, (diseaseMap.get(disease) || 0) + 1);
        }
      });
      
      diseaseStats = Array.from(diseaseMap.entries()).map(([disease_name, count]) => ({
        disease_name,
        count
      })).sort((a, b) => b.count - a.count);
    }

    const totalAnalyses = await History.countDocuments({});

    res.json({
      success: true,
      total_analyses: totalAnalyses,
      disease_stats: diseaseStats,
      total_diseases: diseaseStats.length
    });

  } catch (error) {
    console.error('Get disease statistics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      disease_stats: []
    });
  }
});

// Get detailed analytics dashboard
router.get("/analytics/dashboard", async (req, res) => {
  try {
    const totalAnalyses = await History.countDocuments({});
    const totalUsers = await History.distinct("userEmail");
    
    // Get grade distribution
    const gradeDistribution = await History.aggregate([
      {
        $group: {
          _id: "$skinGrade",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Get monthly trends
    const monthlyTrends = await History.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    // Get disease distribution from analysisData
    let diseaseStats = await History.aggregate([
      {
        $match: {
          $or: [
            { "analysisData.disease": { $exists: true, $ne: null } },
            { "analysisData.aggregated_result.disease": { $exists: true, $ne: null } }
          ]
        }
      },
      {
        $group: {
          _id: {
            $ifNull: ["$analysisData.disease", "$analysisData.aggregated_result.disease"]
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          disease: "$_id",
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: {
          total_analyses: totalAnalyses,
          total_unique_users: totalUsers.length,
          average_analyses_per_user: totalUsers.length > 0 ? (totalAnalyses / totalUsers.length).toFixed(2) : 0
        },
        grade_distribution: gradeDistribution.map(g => ({
          grade: g._id || "Unknown",
          count: g.count,
          percentage: totalAnalyses > 0 ? ((g.count / totalAnalyses) * 100).toFixed(1) : 0
        })),
        disease_distribution: diseaseStats,
        monthly_trends: monthlyTrends.map(t => ({
          month: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
          count: t.count
        }))
      }
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

export default router;