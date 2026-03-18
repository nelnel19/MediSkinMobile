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
  // Acne has highest weight (40%), followed by dark spots (35%), then dark circles (25%)
  const weightedScore = (
    (acneScore * 0.4) +
    (stainScore * 0.35) +
    (darkCircleScore * 0.25)
  );
  
  // Convert to 0-100 scale (Face++ scores are 0-100)
  const overallScore = weightedScore;
  
  // Determine grade based on score
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
  
  // Generate detailed analysis
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

// Get grade-specific recommendations
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

// Function to generate personalized skincare recommendations
function generateSkincareRecommendations(skinData) {
  const recommendations = [];
  
  // Extract skin data with realistic ranges
  const acneScore = skinData.acne || 0;
  const stain = skinData.skin_attributes?.stain || 0;
  const darkCircle = skinData.skin_attributes?.dark_circle || 0;
  const age = parseInt(skinData.age) || 25;
  const skinGrade = skinData.skin_grade || null;
  
  // More realistic thresholds
  const hasAcne = acneScore > 50;
  const hasSevereAcne = acneScore > 75;
  const hasStains = stain > 55;
  const hasDarkCircles = darkCircle > 60;
  
  // Determine skin type based on combination of factors
  let skinType = "Normal";
  if (acneScore > 40) skinType = "Oily";
  else if (stain > 40 && age < 30) skinType = "Combination";
  else if (age > 50) skinType = "Dry";
  
  // Morning Routine
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
  
  // Evening Routine
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
  
  // Weekly Treatments
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
  
  // Lifestyle Recommendations
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
  
  // Product Focus
  let productFocus = "Basic skincare maintenance";
  if (hasAcne && acneScore > 60) productFocus = "Gentle acne management";
  else if (hasStains && stain > 70) productFocus = "Targeted brightening";
  else if (hasDarkCircles) productFocus = "Eye area care";
  else if (age > 45) productFocus = "Hydration and gentle anti-aging";
  
  // Severity assessment
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

// Function to map Face++ skin tone value (0-4) to readable format
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
    console.log('API Key configured:', !!FACEPP_API_KEY);
    console.log('API Secret configured:', !!FACEPP_API_SECRET);
    
    try {
      // Call Face++ API
      console.log('Calling Face++ API with skin attributes...');
      
      const formData = new FormData();
      formData.append('api_key', FACEPP_API_KEY || '');
      formData.append('api_secret', FACEPP_API_SECRET || '');
      
      formData.append('return_attributes', 'gender,age,skinstatus,facequality,blur');
      
      formData.append('image_file', imgBuffer, {
        filename: `face_${timestamp}.jpg`,
        contentType: req.file.mimetype || 'image/jpeg'
      });
      
      console.log('Sending request to Face++...');
      
      const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000
      });

      const apiResult = response.data;

      // Check if face is detected
      if (!apiResult.faces || apiResult.faces.length === 0) {
        console.log('❌ No face detected in the image');
        return res.status(400).json({ 
          error: "NO_FACE_DETECTED",
          message: "No face detected in the image. Please upload a clear photo of your face.",
          details: "The AI could not detect a human face in the uploaded image."
        });
      }

      const faceData = apiResult.faces[0];
      const attrs = faceData.attributes || {};
      
      console.log('Face++ Raw Response Received - Face detected');
      
      // Extract data from Face++
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
      
      // Calculate skin grade
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

      // Cache result
      sessionCache.set(imageHash, {
        result: result,
        timestamp: now
      });
      
      console.log(`✓ Real Face++ Analysis Complete:`);
      console.log(`  Age: ${result.age}, Gender: ${result.gender}`);
      console.log(`  Acne Score: ${result.acne}`);
      console.log(`  Skin Grade: ${result.skin_grade.grade} (${result.skin_grade.description})`);
      
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
    
    console.log('Calling Face++ API with basic attributes...');
    
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
    
    // Calculate skin grade
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
        passed: true
      },
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
    if (!req.file) {
      return res.status(400).json({ error: "NO_IMAGE" });
    }

    const timestamp = Date.now();
    
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
      timestamp: timestamp,
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
      "POST /analyze/test - Test data with recommendations",
      "GET /test-api - Test API connection",
      "GET /clear-cache - Clear session cache",
      "GET /health - Health check"
    ]
  });
});

export default router;