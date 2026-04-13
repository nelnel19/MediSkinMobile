import express from 'express';
import multer from 'multer';
import axios from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';

const router = express.Router();

const FACEPP_API_KEY = process.env.FACEPP_API_KEY;
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET;

// Memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Session-based cache
const sessionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function generateImageHash(imageData) {
  return crypto.createHash('md5').update(imageData).digest('hex');
}

// Function to calculate skin grade based on analysis results
function calculateSkinGrade(skinData) {
  const acneScore = skinData.acne || 0;
  const stainScore = skinData.skin_attributes?.stain || 0;
  const darkCircleScore = skinData.skin_attributes?.dark_circle || 0;
  
  // Calculate weighted scores
  const weightedScore = (
    (acneScore * 0.4) +
    (stainScore * 0.35) +
    (darkCircleScore * 0.25)
  );
  
  const overallScore = weightedScore;
  
  let grade, description, color;
  if (overallScore <= 15) {
    grade = 'A+';
    description = 'Excellent';
    color = '#4CAF50';
  } else if (overallScore <= 30) {
    grade = 'A';
    description = 'Very Good';
    color = '#8BC34A';
  } else if (overallScore <= 45) {
    grade = 'B+';
    description = 'Good';
    color = '#CDDC39';
  } else if (overallScore <= 60) {
    grade = 'B';
    description = 'Fair';
    color = '#FFC107';
  } else if (overallScore <= 75) {
    grade = 'C';
    description = 'Needs Improvement';
    color = '#FF9800';
  } else {
    grade = 'D';
    description = 'Requires Attention';
    color = '#F44336';
  }
  
  const strengths = [];
  const weaknesses = [];
  
  if (acneScore < 30) strengths.push('Clear skin with minimal breakouts');
  else if (acneScore > 60) weaknesses.push('Active acne concerns');
  
  if (stainScore < 30) strengths.push('Even skin tone with minimal dark spots');
  else if (stainScore > 60) weaknesses.push('Noticeable hyperpigmentation');
  
  if (darkCircleScore < 30) strengths.push('Well-rested eye area');
  else if (darkCircleScore > 60) weaknesses.push('Prominent dark circles');
  
  return {
    grade,
    description,
    color,
    overall_score: Math.round(overallScore * 10) / 10,
    components: {
      acne: { score: Math.round(acneScore * 10) / 10, weight: 40 },
      stain: { score: Math.round(stainScore * 10) / 10, weight: 35 },
      dark_circle: { score: Math.round(darkCircleScore * 10) / 10, weight: 25 }
    },
    strengths: strengths.length > 0 ? strengths : ['Overall balanced skin'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Minor areas for improvement'],
    recommendation: getGradeRecommendation(grade, skinData)
  };
}

function getGradeRecommendation(grade, skinData) {
  const age = parseInt(skinData.age) || 25;
  
  const recommendations = {
    'A+': 'Your skin is in excellent condition! Maintain your current routine with focus on prevention. Continue using sunscreen daily and gentle cleansing. Consider adding antioxidants like Vitamin C for enhanced protection.',
    'A': 'Very good skin health! Focus on maintaining your routine with consistent cleansing and sun protection. Consider targeted treatments for any specific concerns.',
    'B+': 'Good skin health with minor concerns. Address specific issues like occasional breakouts or slight uneven tone with targeted ingredients like niacinamide or gentle exfoliation.',
    'B': 'Fair skin condition with room for improvement. Focus on building a consistent routine with cleansing, moisturizing, and sun protection. Add treatments based on your primary concern.',
    'C': 'Your skin needs some attention. Consider consulting with a skincare professional and establish a consistent routine. Focus on gentle products and sun protection.',
    'D': 'Your skin requires significant attention. We strongly recommend consulting a dermatologist for personalized advice. Focus on gentle, soothing products and sun protection.'
  };
  
  return recommendations[grade] || recommendations['B'];
}

function generateSkincareRecommendations(skinData) {
  const recommendations = [];
  
  const acneScore = skinData.acne || 0;
  const stain = skinData.skin_attributes?.stain || 0;
  const darkCircle = skinData.skin_attributes?.dark_circle || 0;
  const age = parseInt(skinData.age) || 25;
  const skinGrade = skinData.skin_grade || null;
  
  const hasAcne = acneScore > 50;
  const hasStains = stain > 55;
  const hasDarkCircles = darkCircle > 60;
  
  let skinType = "Normal";
  if (acneScore > 40) skinType = "Oily";
  else if (stain > 40 && age < 30) skinType = "Combination";
  else if (age > 50) skinType = "Dry";
  
  const morningRoutine = [];
  
  if (skinType === "Oily") {
    morningRoutine.push("Foaming or gel cleanser with salicylic acid");
  } else if (skinType === "Dry") {
    morningRoutine.push("Cream or milky cleanser (hydrating)");
  } else {
    morningRoutine.push("Gentle low-pH cleanser");
  }
  
  if (hasAcne && acneScore > 60) {
    morningRoutine.push("Leave-on salicylic acid treatment (only on active breakouts)");
  }
  
  if (hasStains && stain > 70) {
    morningRoutine.push("Vitamin C serum for targeted brightening");
  }
  
  if (skinType === "Oily") {
    morningRoutine.push("Oil-free gel moisturizer");
  } else {
    morningRoutine.push("Lightweight moisturizer");
  }
  morningRoutine.push("Mineral sunscreen SPF 30+ (last step)");
  
  const eveningRoutine = [];
  eveningRoutine.push("Gentle cleanser to remove sunscreen and impurities");
  
  if (hasAcne && acneScore > 60) {
    eveningRoutine.push("Benzoyl peroxide spot treatment (only on active acne)");
    recommendations.push("Avoid over-drying - use acne treatments only on affected areas");
  }
  
  if (hasStains && stain > 70) {
    eveningRoutine.push("Niacinamide serum for pigmentation");
  }
  
  if (age > 35 && stain < 50) {
    eveningRoutine.push("Retinol (start with 2-3x weekly)");
    recommendations.push("Introduce retinol slowly to avoid irritation");
  } else {
    eveningRoutine.push("Hydrating night cream or gel");
  }
  
  const weeklyTreatments = [];
  
  if (hasAcne && acneScore > 60) {
    weeklyTreatments.push("Salicylic acid mask 1-2x weekly");
    recommendations.push("Don't over-exfoliate - stick to 1-2x weekly maximum");
  }
  
  if (hasStains && stain > 70 && age < 40) {
    weeklyTreatments.push("Gentle enzyme exfoliation 1x weekly");
  }
  
  if (!hasAcne && !hasStains && stain < 30) {
    weeklyTreatments.push("Hydrating mask 1x weekly for maintenance");
  } else if (weeklyTreatments.length === 0) {
    weeklyTreatments.push("Your skin looks balanced - stick to basic routine");
  }
  
  const lifestyleTips = [];
  lifestyleTips.push("Drink water when thirsty - no need to over-hydrate");
  
  if (hasAcne) {
    lifestyleTips.push("Change pillowcases weekly");
    lifestyleTips.push("Avoid touching face throughout the day");
    recommendations.push("Diet affects some people - track if dairy or sugar triggers breakouts");
  }
  
  if (hasDarkCircles) {
    lifestyleTips.push("Aim for 7-8 hours of quality sleep");
    lifestyleTips.push("Elevate head slightly while sleeping to reduce fluid retention");
  }
  
  if (age > 40) {
    lifestyleTips.push("Consider adding collagen-rich foods to diet");
  }
  
  lifestyleTips.push("Remove makeup before sleeping - always");
  
  let productFocus = "Basic skincare maintenance";
  if (hasAcne && acneScore > 60) productFocus = "Gentle acne management";
  else if (hasStains && stain > 70) productFocus = "Targeted brightening";
  else if (hasDarkCircles) productFocus = "Eye area care";
  else if (age > 45) productFocus = "Hydration and gentle anti-aging";
  
  let acneSeverity = "low";
  if (acneScore > 75) acneSeverity = "moderate (consider dermatologist)";
  else if (acneScore > 60) acneSeverity = "mild";
  
  let pigmentationSeverity = "low";
  if (stain > 80) pigmentationSeverity = "noticeable";
  else if (stain > 60) pigmentationSeverity = "mild";
  
  return {
    summary: `Based on your analysis, your skin appears ${skinType.toLowerCase()} with ${acneScore > 50 ? 'some acne concerns' : 'minimal acne'}. Focus on ${productFocus.toLowerCase()}.`,
    skin_type: skinType,
    skin_grade: skinGrade,
    morning_routine: morningRoutine,
    evening_routine: eveningRoutine,
    weekly_treatments: weeklyTreatments,
    lifestyle_tips: lifestyleTips,
    key_recommendations: recommendations.slice(0, 3),
    severity: {
      acne: acneSeverity,
      pigmentation: pigmentationSeverity,
      aging: age > 50 ? "noticeable signs" : age > 35 ? "preventive stage" : "early stage"
    },
    confidence_note: "These are AI-generated suggestions based on visual analysis. For medical concerns, please consult a dermatologist."
  };
}

function mapSkinTone(toneValue) {
  const toneMap = {
    0: { value: 0, name: "Fair / Light", description: "Very fair skin that burns easily", hex: "#F8E8D0" },
    1: { value: 1, name: "Natural / Medium", description: "Fair to medium skin that tans gradually", hex: "#E0C8A8" },
    2: { value: 2, name: "Wheat / Slight tan", description: "Medium to olive skin that tans easily", hex: "#C8A880" },
    3: { value: 3, name: "Tanned / Bronze", description: "Tan to brown skin, rarely burns", hex: "#A88060" },
    4: { value: 4, name: "Darker skin tones", description: "Brown to dark brown skin, very rarely burns", hex: "#806040" }
  };
  
  const tone = typeof toneValue === 'number' ? toneValue : parseInt(toneValue) || 1;
  const validTone = Math.max(0, Math.min(4, tone));
  
  return toneMap[validTone] || toneMap[1];
}

// NEW MULTI-ANGLE ANALYSIS ENDPOINT
router.post('/analyze/multi-angle', upload.fields([
  { name: 'file1', maxCount: 1 },
  { name: 'file2', maxCount: 1 },
  { name: 'file3', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files;
    
    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ 
        error: "NO_IMAGES",
        message: "Please upload 3 photos (left, center, right views)."
      });
    }

    const positions = ['file1', 'file2', 'file3'];
    const analysisResults = [];
    
    console.log(`\n=== MULTI-ANGLE ANALYSIS REQUEST ===`);
    console.log(`Analyzing ${Object.keys(files).length} photos...`);
    
    // Analyze each photo
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      const file = files[position]?.[0];
      
      if (!file) {
        console.log(`⚠️ Missing photo for position ${position}`);
        continue;
      }
      
      console.log(`\n📸 Analyzing photo ${i + 1}/3...`);
      
      const imgBuffer = file.buffer;
      const timestamp = Date.now();
      
      try {
        const formData = new FormData();
        formData.append('api_key', FACEPP_API_KEY || '');
        formData.append('api_secret', FACEPP_API_SECRET || '');
        formData.append('return_attributes', 'gender,age,skinstatus,facequality,blur');
        formData.append('image_file', imgBuffer, {
          filename: `face_${position}_${timestamp}.jpg`,
          contentType: file.mimetype || 'image/jpeg'
        });
        
        const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', formData, {
          headers: formData.getHeaders(),
          timeout: 30000
        });
        
        const apiResult = response.data;
        
        if (!apiResult.faces || apiResult.faces.length === 0) {
          return res.status(400).json({ 
            error: "NO_FACE_DETECTED",
            message: `No face detected in ${getPositionName(position)} photo. Please ensure all photos clearly show your face.`,
            position: position
          });
        }
        
        const faceData = apiResult.faces[0];
        const attrs = faceData.attributes || {};
        
        const rawSkinTone = attrs.skinstatus?.skin_tone;
        const skinToneValue = typeof rawSkinTone === 'number' ? rawSkinTone : 
                             (rawSkinTone !== undefined ? parseInt(rawSkinTone) : 1);
        
        analysisResults.push({
          position: position,
          positionName: getPositionName(position),
          result: {
            age: attrs.age?.value || "Unknown",
            gender: attrs.gender?.value || "Unknown",
            acne: Math.round((attrs.skinstatus?.acne || 0) * 10) / 10,
            stain: Math.round((attrs.skinstatus?.stain || 0) * 10) / 10,
            dark_circle: Math.round((attrs.skinstatus?.dark_circle || 0) * 10) / 10,
            skin_tone: {
              raw_value: skinToneValue,
              ...mapSkinTone(skinToneValue)
            },
            face_quality: attrs.facequality?.value || 0,
            blur: attrs.blur?.blurness?.value || 0,
            confidence: faceData.confidence || 0
          }
        });
        
        console.log(`  ✅ ${getPositionName(position)} analyzed - Age: ${attrs.age?.value}, Acne: ${Math.round((attrs.skinstatus?.acne || 0) * 10) / 10}`);
        
      } catch (error) {
        console.error(`  ❌ Error analyzing ${getPositionName(position)}:`, error.message);
        return res.status(400).json({
          error: "ANALYSIS_FAILED",
          message: `Failed to analyze ${getPositionName(position)} photo. Please try again.`,
          details: error.message
        });
      }
    }
    
    if (analysisResults.length < 3) {
      return res.status(400).json({
        error: "INCOMPLETE_ANALYSIS",
        message: "All 3 photos are required for complete analysis."
      });
    }
    
    // Combine results from all angles
    console.log(`\n📊 Combining results from ${analysisResults.length} angles...`);
    const combinedResult = combineMultiAngleResults(analysisResults);
    
    console.log(`✅ Multi-angle analysis complete!`);
    console.log(`   Skin Grade: ${combinedResult.skin_grade.grade} (${combinedResult.skin_grade.overall_score})`);
    console.log(`   Confidence: High (multi-angle verification)`);
    
    res.json(combinedResult);
    
  } catch (error) {
    console.error('Multi-angle analysis error:', error);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: "An unexpected error occurred during multi-angle analysis.",
      details: error.message
    });
  }
});

// Helper function to get position name
function getPositionName(position) {
  const names = {
    'file1': 'Left Side',
    'file2': 'Front',
    'file3': 'Right Side'
  };
  return names[position] || 'Unknown';
}

// Combine results from multiple angles
function combineMultiAngleResults(analysisResults) {
  // Find front-facing result for primary data
  const frontResult = analysisResults.find(r => r.position === 'file2')?.result || analysisResults[0]?.result;
  
  // Calculate average scores across all angles
  const avgAcne = Math.round(analysisResults.reduce((sum, r) => sum + r.result.acne, 0) / analysisResults.length * 10) / 10;
  const avgStain = Math.round(analysisResults.reduce((sum, r) => sum + r.result.stain, 0) / analysisResults.length * 10) / 10;
  const avgDarkCircle = Math.round(analysisResults.reduce((sum, r) => sum + r.result.dark_circle, 0) / analysisResults.length * 10) / 10;
  
  // Find most common age and gender
  const ages = analysisResults.map(r => r.result.age).filter(a => a !== "Unknown");
  const mostCommonAge = ages.length > 0 ? getMostCommonValue(ages) : "Unknown";
  
  const genders = analysisResults.map(r => r.result.gender).filter(g => g !== "Unknown");
  const mostCommonGender = genders.length > 0 ? getMostCommonValue(genders) : "Unknown";
  
  // Use front-facing skin tone or most common
  const skinToneValues = analysisResults.map(r => r.result.skin_tone);
  const primarySkinTone = frontResult.skin_tone || skinToneValues[0];
  
  // Calculate skin grade with averaged scores
  const skinGrade = calculateSkinGrade({
    acne: avgAcne,
    skin_attributes: {
      stain: avgStain,
      dark_circle: avgDarkCircle,
      acne: avgAcne,
      skin_tone: primarySkinTone
    },
    age: mostCommonAge !== "Unknown" ? mostCommonAge : 25
  });
  
  // Calculate overall image quality
  const avgFaceQuality = Math.round(analysisResults.reduce((sum, r) => sum + (r.result.face_quality || 0), 0) / analysisResults.length);
  const avgBlur = Math.round(analysisResults.reduce((sum, r) => sum + (r.result.blur || 0), 0) / analysisResults.length);
  
  // Generate enhanced recommendations for multi-angle analysis
  const recommendations = generateMultiAngleRecommendations({
    acne: avgAcne,
    stain: avgStain,
    dark_circle: avgDarkCircle,
    age: mostCommonAge !== "Unknown" ? mostCommonAge : 25,
    skin_grade: skinGrade,
    analysisResults: analysisResults
  });
  
  return {
    age: mostCommonAge,
    gender: mostCommonGender,
    acne: avgAcne,
    skin_attributes: {
      stain: avgStain,
      dark_circle: avgDarkCircle,
      acne: avgAcne,
      skin_tone: primarySkinTone
    },
    skin_grade: skinGrade,
    image_quality: {
      blur: avgBlur,
      face_quality: avgFaceQuality,
      passed: avgFaceQuality > 50 && avgBlur < 50,
      multi_angle: true,
      angles_analyzed: analysisResults.length
    },
    skincare_recommendations: recommendations,
    timestamp: Date.now(),
    face_count: analysisResults.length,
    api_used: "Face++ Multi-Angle Analysis",
    face_detected: true,
    face_confidence: Math.round(analysisResults.reduce((sum, r) => sum + (r.result.confidence || 0), 0) / analysisResults.length * 100) / 100,
    multi_angle_data: {
      angles_analyzed: analysisResults.map(r => ({
        position: r.positionName,
        acne: r.result.acne,
        stain: r.result.stain,
        dark_circle: r.result.dark_circle
      })),
      consistency: calculateConsistencyScore(analysisResults)
    }
  };
}

// Helper function to get most common value
function getMostCommonValue(arr) {
  const frequency = {};
  let maxFreq = 0;
  let mostCommon = arr[0];
  
  for (const item of arr) {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxFreq) {
      maxFreq = frequency[item];
      mostCommon = item;
    }
  }
  
  return mostCommon;
}

// Calculate consistency score across angles
function calculateConsistencyScore(results) {
  const acneValues = results.map(r => r.result.acne);
  const stainValues = results.map(r => r.result.stain);
  const darkCircleValues = results.map(r => r.result.dark_circle);
  
  const calculateVariance = (values) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return variance;
  };
  
  const acneVariance = calculateVariance(acneValues);
  const stainVariance = calculateVariance(stainValues);
  const darkCircleVariance = calculateVariance(darkCircleValues);
  
  const totalVariance = (acneVariance + stainVariance + darkCircleVariance) / 3;
  const consistencyScore = Math.max(0, Math.min(100, 100 - (totalVariance * 2)));
  
  let consistencyLevel = "High";
  if (consistencyScore < 60) consistencyLevel = "Low";
  else if (consistencyScore < 80) consistencyLevel = "Medium";
  
  return {
    score: Math.round(consistencyScore),
    level: consistencyLevel,
    note: consistencyLevel === "High" ? "Results are consistent across all angles" :
           consistencyLevel === "Medium" ? "Some variation detected between angles" :
           "Significant variation detected - consider retaking photos"
  };
}

// Enhanced recommendations for multi-angle analysis
function generateMultiAngleRecommendations(skinData) {
  const baseRecommendations = generateSkincareRecommendations(skinData);
  
  // Add multi-angle specific insights
  const acneVariation = calculateVariation(skinData.analysisResults, 'acne');
  const stainVariation = calculateVariation(skinData.analysisResults, 'stain');
  
  if (acneVariation > 30) {
    baseRecommendations.key_recommendations.unshift(
      "Acne appears unevenly distributed - focus treatment on specific areas rather than whole face"
    );
  }
  
  if (stainVariation > 30) {
    baseRecommendations.key_recommendations.unshift(
      "Pigmentation varies across your face - consider spot treatment for darker areas"
    );
  }
  
  baseRecommendations.summary = `Multi-angle analysis (${skinData.analysisResults.length} views) shows ${baseRecommendations.summary.toLowerCase()}`;
  baseRecommendations.multi_angle_insight = "Analysis performed from multiple angles for more accurate results";
  
  return baseRecommendations;
}

function calculateVariation(results, attribute) {
  const values = results.map(r => r.result[attribute]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// Main analysis endpoint
router.post('/analyze/skin', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: "NO_IMAGE",
        message: "Please select or capture a photo first."
      });
    }

    const imgBuffer = req.file.buffer;
    const timestamp = Date.now();
    const imageHash = generateImageHash(imgBuffer) + "_" + timestamp;
    
    // Clean old cache
    const now = Date.now();
    for (const [key, value] of sessionCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        sessionCache.delete(key);
      }
    }
    
    // Check cache
    const cached = sessionCache.get(imageHash);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
      return res.json({ ...cached.result, cached: true });
    }
    
    console.log(`\n=== FACE++ ANALYSIS REQUEST ===`);
    
    try {
      const formData = new FormData();
      formData.append('api_key', FACEPP_API_KEY || '');
      formData.append('api_secret', FACEPP_API_SECRET || '');
      formData.append('return_attributes', 'gender,age,skinstatus,facequality,blur');
      formData.append('image_file', imgBuffer, {
        filename: `face_${timestamp}.jpg`,
        contentType: req.file.mimetype || 'image/jpeg'
      });
      
      const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });

      const apiResult = response.data;

      if (!apiResult.faces || apiResult.faces.length === 0) {
        return res.status(400).json({ 
          error: "NO_FACE_DETECTED",
          message: "No face detected in the image. Please upload a clear photo of your face."
        });
      }

      const faceData = apiResult.faces[0];
      const attrs = faceData.attributes || {};
      
      const rawSkinTone = attrs.skinstatus?.skin_tone;
      const skinToneValue = typeof rawSkinTone === 'number' ? rawSkinTone : 
                           (rawSkinTone !== undefined ? parseInt(rawSkinTone) : 1);
      
      const skinAttributes = {
        stain: Math.round((attrs.skinstatus?.stain || 0) * 10) / 10,
        dark_circle: Math.round((attrs.skinstatus?.dark_circle || 0) * 10) / 10,
        acne: Math.round((attrs.skinstatus?.acne || 0) * 10) / 10,
        skin_tone: {
          raw_value: skinToneValue,
          ...mapSkinTone(skinToneValue)
        }
      };
      
      const skinGrade = calculateSkinGrade({
        acne: skinAttributes.acne,
        skin_attributes: skinAttributes,
        age: attrs.age?.value || 25
      });
      
      const result = {
        age: attrs.age?.value || "Unknown",
        gender: attrs.gender?.value || "Unknown",
        acne: skinAttributes.acne,
        skin_attributes: skinAttributes,
        skin_grade: skinGrade,
        image_quality: {
          blur: attrs.blur?.blurness?.value || 0,
          face_quality: attrs.facequality?.value || 0,
          passed: (attrs.facequality?.value || 0) > 50 && (attrs.blur?.blurness?.value || 100) < 50
        },
        skincare_recommendations: generateSkincareRecommendations({
          acne: skinAttributes.acne,
          skin_attributes: skinAttributes,
          age: attrs.age?.value || 25,
          skin_grade: skinGrade
        }),
        timestamp: timestamp,
        face_count: apiResult.faces.length,
        api_used: "Face++ (Skin Analysis)",
        face_detected: true,
        face_confidence: faceData.confidence || 0.9
      };

      sessionCache.set(imageHash, {
        result: result,
        timestamp: now
      });
      
      console.log(`✓ Analysis Complete: Age: ${result.age}, Acne: ${result.acne}, Grade: ${result.skin_grade.grade}`);
      
      res.json(result);

    } catch (apiError) {
      console.error('Face++ API Error:', apiError.message);
      
      if (apiError.response?.data?.error_message?.includes('NO_FACE_DETECTED')) {
        return res.status(400).json({ 
          error: "NO_FACE_DETECTED",
          message: "No face detected in the image. Please upload a clear photo of your face."
        });
      }
      
      return res.status(400).json({ 
        error: "ANALYSIS_FAILED",
        message: "Unable to analyze the image. Please try with a different photo.",
        details: apiError.message
      });
    }

  } catch (error) {
    console.error('Server Error:', error.message);
    
    res.status(500).json({ 
      error: "SERVER_ERROR",
      message: "An unexpected error occurred.",
      suggestion: "Please try again."
    });
  }
});

// BASIC ANALYSIS ENDPOINT
router.post('/analyze/basic', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "NO_IMAGE" });
    }

    const imgBuffer = req.file.buffer;
    const timestamp = Date.now();
    
    const formData = new FormData();
    formData.append('api_key', FACEPP_API_KEY || '');
    formData.append('api_secret', FACEPP_API_SECRET || '');
    formData.append('return_attributes', 'gender,age,skinstatus');
    formData.append('image_file', imgBuffer, {
      filename: `face_${timestamp}.jpg`,
      contentType: req.file.mimetype || 'image/jpeg'
    });
    
    const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    const apiResult = response.data;
    
    if (!apiResult.faces || apiResult.faces.length === 0) {
      return res.status(400).json({ 
        error: "NO_FACE_DETECTED",
        message: "No face detected in the image."
      });
    }

    const faceData = apiResult.faces[0];
    const attrs = faceData.attributes || {};
    
    const rawSkinTone = attrs.skinstatus?.skin_tone;
    const skinToneValue = typeof rawSkinTone === 'number' ? rawSkinTone : 
                         (rawSkinTone !== undefined ? parseInt(rawSkinTone) : 1);
    
    const skinAttributes = {
      stain: Math.round((attrs.skinstatus?.stain || 0) * 10) / 10,
      dark_circle: Math.round((attrs.skinstatus?.dark_circle || 0) * 10) / 10,
      acne: Math.round((attrs.skinstatus?.acne || 0) * 10) / 10,
      skin_tone: {
        raw_value: skinToneValue,
        ...mapSkinTone(skinToneValue)
      }
    };
    
    const skinGrade = calculateSkinGrade({
      acne: skinAttributes.acne,
      skin_attributes: skinAttributes,
      age: attrs.age?.value || 25
    });
    
    const result = {
      age: attrs.age?.value || "Unknown",
      gender: attrs.gender?.value || "Unknown",
      acne: skinAttributes.acne,
      skin_attributes: skinAttributes,
      skin_grade: skinGrade,
      image_quality: { passed: true },
      skincare_recommendations: generateSkincareRecommendations({
        acne: skinAttributes.acne,
        skin_attributes: skinAttributes,
        age: attrs.age?.value || 25,
        skin_grade: skinGrade
      }),
      timestamp: timestamp,
      face_count: apiResult.faces.length,
      api_used: "Face++ (Basic)",
      face_detected: true,
      face_confidence: faceData.confidence || 0.9
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Basic Analysis Error:', error.message);
    
    return res.status(400).json({ 
      error: "ANALYSIS_FAILED",
      message: "Unable to analyze the image. Please ensure it contains a clear face.",
      details: error.message
    });
  }
});

// TEST ENDPOINT
router.post('/analyze/test', upload.single('file'), async (req, res) => {
  try {
    const testResult = {
      age: "28",
      gender: "Female",
      acne: 45,
      skin_attributes: {
        stain: 35,
        dark_circle: 42,
        acne: 45,
        skin_tone: {
          raw_value: 2,
          value: 2,
          name: "Wheat / Slight tan",
          description: "Medium to olive skin that tans easily",
          hex: "#C8A880"
        }
      },
      skin_grade: {
        grade: "B+",
        description: "Good",
        color: "#CDDC39",
        overall_score: 41.3,
        components: {
          acne: { score: 45, weight: 40 },
          stain: { score: 35, weight: 35 },
          dark_circle: { score: 42, weight: 25 }
        },
        strengths: ["Even skin tone with minimal dark spots", "Well-rested eye area"],
        weaknesses: ["Minor areas for improvement"],
        recommendation: "Good skin health with minor concerns. Address specific issues like occasional breakouts or slight uneven tone with targeted ingredients like niacinamide or gentle exfoliation."
      },
      image_quality: {
        blur: 15,
        face_quality: 85,
        passed: true,
      },
      skincare_recommendations: {
        summary: "Based on your analysis, your skin appears combination with some acne concerns. Focus on gentle acne management.",
        skin_type: "Combination",
        morning_routine: [
          "Gentle low-pH cleanser",
          "Oil-free gel moisturizer",
          "Mineral sunscreen SPF 30+ (last step)"
        ],
        evening_routine: [
          "Gentle cleanser to remove sunscreen and impurities",
          "Hydrating night cream or gel"
        ],
        weekly_treatments: [
          "Your skin looks balanced - stick to basic routine"
        ],
        lifestyle_tips: [
          "Drink water when thirsty - no need to over-hydrate",
          "Remove makeup before sleeping - always"
        ],
        key_recommendations: [
          "Diet affects some people - track if dairy or sugar triggers breakouts"
        ],
        severity: { 
          acne: "mild", 
          pigmentation: "low", 
          aging: "early stage" 
        },
        confidence_note: "These are AI-generated suggestions based on visual analysis. For medical concerns, please consult a dermatologist."
      },
      timestamp: Date.now(),
      face_count: 1,
      api_used: "Test Data",
      face_detected: true,
      face_confidence: 0.95,
      note: "This is test data for debugging purposes."
    };
    
    res.json(testResult);

  } catch (error) {
    console.error('Test Error:', error.message);
    res.status(500).json({ 
      error: "TEST_FAILED",
      message: error.message
    });
  }
});

// API test
router.get('/test-api', async (req, res) => {
  try {
    console.log('Testing Face++ API connection...');
    
    if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
      return res.json({
        status: "error",
        message: "API keys not configured",
        api_key_set: !!FACEPP_API_KEY,
        api_secret_set: !!FACEPP_API_SECRET
      });
    }
    
    const formData = new FormData();
    formData.append('api_key', FACEPP_API_KEY);
    formData.append('api_secret', FACEPP_API_SECRET);
    formData.append('image_url', 'https://faceplusplus.com/static/img/demo/9.jpg');
    
    const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', formData, {
      headers: formData.getHeaders(),
      timeout: 10000
    });
    
    res.json({
      status: "success",
      message: "Face++ API is working!",
      faces_detected: response.data.faces?.length || 0,
      test_complete: true,
      api_used: "Face++ v3"
    });
    
  } catch (error) {
    console.error('API Test Error:', error.message);
    
    res.json({
      status: "error",
      message: "Face++ API test failed",
      error: error.message,
      status_code: error.response?.status,
      suggestion: "Check your API keys and internet connection"
    });
  }
});

// Clear cache
router.get('/clear-cache', (req, res) => {
  const size = sessionCache.size;
  sessionCache.clear();
  res.json({ 
    success: true,
    message: "Cache cleared",
    cleared_entries: size
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: "healthy",
    timestamp: Date.now(),
    cache_size: sessionCache.size,
    api_key_configured: !!FACEPP_API_KEY,
    api_secret_configured: !!FACEPP_API_SECRET,
    endpoints: [
      "POST /analyze/skin - Face analysis with skincare recommendations",
      "POST /analyze/basic - Basic analysis with recommendations",
      "POST /analyze/multi-angle - Multi-angle analysis (3 photos)",
      "POST /analyze/test - Test data with recommendations",
      "GET /test-api - Test API connection",
      "GET /clear-cache - Clear session cache",
      "GET /health - Health check"
    ]
  });
});

export default router;