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
const upload = multer({ storage });

// Session-based cache
const sessionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function generateImageHash(imageData) {
  return crypto.createHash('md5').update(imageData).digest('hex');
}

// Function to generate personalized skincare recommendations
function generateSkincareRecommendations(skinData) {
  const recommendations = [];
  
  // Extract skin data
  const acneScore = skinData.acne || 0;
  const stain = skinData.skin_attributes?.stain || 0;
  const darkCircle = skinData.skin_attributes?.dark_circle || 0;
  const age = parseInt(skinData.age) || 25;
  
  // Determine skin issues
  const hasAcne = acneScore > 30;
  const hasSevereAcne = acneScore > 60;
  const hasStains = stain > 40;
  const hasDarkCircles = darkCircle > 40;
  const isMatureSkin = age > 35;
  
  // Morning Routine
  const morningRoutine = [];
  morningRoutine.push("Gentle cleanser suitable for your skin type");
  
  if (hasAcne) {
    morningRoutine.push("Salicylic acid or benzoyl peroxide treatment");
  }
  
  if (hasStains) {
    morningRoutine.push("Vitamin C serum for brightening");
  }
  
  morningRoutine.push("Lightweight moisturizer with SPF 30+");
  
  // Evening Routine
  const eveningRoutine = [];
  eveningRoutine.push("Double cleanse: oil-based then water-based");
  
  if (hasSevereAcne) {
    eveningRoutine.push("Spot treatment with acne-fighting ingredients");
    recommendations.push("Consider consulting a dermatologist for severe acne");
  }
  
  if (hasStains) {
    eveningRoutine.push("Retinol or niacinamide serum");
  }
  
  if (hasDarkCircles) {
    eveningRoutine.push("Caffeine or vitamin K eye cream");
    recommendations.push("Get 7-8 hours of sleep to reduce dark circles");
  }
  
  if (isMatureSkin) {
    eveningRoutine.push("Peptide or retinol night cream");
  } else {
    eveningRoutine.push("Hydrating night cream");
  }
  
  // Weekly Treatments
  const weeklyTreatments = [];
  
  if (hasAcne) {
    weeklyTreatments.push("Chemical exfoliation 2-3 times weekly (AHA/BHA)");
    weeklyTreatments.push("Clay mask to absorb excess oil");
    recommendations.push("Avoid touching your face to prevent breakouts");
  }
  
  if (hasStains) {
    weeklyTreatments.push("Weekly brightening mask with vitamin C");
  }
  
  if (!hasAcne && !hasStains) {
    weeklyTreatments.push("Weekly hydrating sheet mask");
  }
  
  // Lifestyle Recommendations
  const lifestyleTips = [];
  lifestyleTips.push("Drink at least 8 glasses of water daily");
  lifestyleTips.push("Eat antioxidant-rich foods (berries, leafy greens)");
  
  if (hasAcne) {
    lifestyleTips.push("Reduce dairy and high-sugar foods");
    recommendations.push("Change pillowcases twice weekly to prevent acne");
  }
  
  if (hasDarkCircles) {
    lifestyleTips.push("Prioritize sleep and reduce screen time before bed");
  }
  
  lifestyleTips.push("Always remove makeup before sleeping");
  
  // Product Type Recommendations
  let productFocus = "Balanced hydration and maintenance";
  if (hasAcne) productFocus = "Acne control and oil regulation";
  if (hasStains) productFocus = "Brightening and pigmentation correction";
  if (hasDarkCircles) productFocus = "Eye care and depuffing";
  if (isMatureSkin) productFocus = "Anti-aging and firming";
  
  return {
    summary: `Your skin analysis shows ${hasAcne ? 'acne concerns' : 'good skin health'} with focus needed on ${productFocus.toLowerCase()}`,
    morning_routine: morningRoutine,
    evening_routine: eveningRoutine,
    weekly_treatments: weeklyTreatments,
    lifestyle_tips: lifestyleTips,
    key_recommendations: recommendations,
    severity: {
      acne: hasSevereAcne ? "high" : hasAcne ? "moderate" : "low",
      pigmentation: hasStains ? "moderate" : "low",
      aging: isMatureSkin ? "preventive care needed" : "maintenance"
    }
  };
}

// Function to map Face++ skin tone value (0-4) to readable format
function mapSkinTone(toneValue) {
  // Face++ skin tone values:
  // 0: Fair / Light
  // 1: Natural / Medium
  // 2: Wheat / Slight tan
  // 3: Tanned / Bronze
  // 4: Darker skin tones
  
  const toneMap = {
    0: { value: 0, name: "Fair / Light", description: "Fair skin that burns easily", hex: "#F8E8D0" },
    1: { value: 1, name: "Natural / Medium", description: "Medium skin that tans gradually", hex: "#E0C8A8" },
    2: { value: 2, name: "Wheat / Slight tan", description: "Wheatish complexion, tans easily", hex: "#C8A880" },
    3: { value: 3, name: "Tanned / Bronze", description: "Tanned skin, rarely burns", hex: "#A88060" },
    4: { value: 4, name: "Darker skin tones", description: "Dark skin, never burns", hex: "#806040" }
  };
  
  // Ensure toneValue is a number between 0-4
  const tone = typeof toneValue === 'number' ? toneValue : parseInt(toneValue) || 1;
  const validTone = Math.max(0, Math.min(4, tone));
  
  return toneMap[validTone] || toneMap[1];
}

// Main analysis endpoint - USING REAL FACE++ API
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
      // Call Face++ API with skin attributes
      console.log('Calling Face++ API with skin attributes...');
      
      const formData = new FormData();
      formData.append('api_key', FACEPP_API_KEY || '');
      formData.append('api_secret', FACEPP_API_SECRET || '');
      
      // Request all available attributes including skin tone
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
      console.log('Skinstatus data:', JSON.stringify(attrs.skinstatus, null, 2));
      
      // Extract data from Face++
      // Face++ provides skin tone as a numeric value (0-4)
      const rawSkinTone = attrs.skinstatus?.skin_tone;
      const skinToneValue = typeof rawSkinTone === 'number' ? rawSkinTone : 
                           (rawSkinTone !== undefined ? parseInt(rawSkinTone) : 1);
      
      const skinAttributes = {
        stain: attrs.skinstatus?.stain || 0,
        dark_circle: attrs.skinstatus?.dark_circle || 0,
        acne: attrs.skinstatus?.acne || 0,
        // Blackhead removed - not accurately provided by Face++
        skin_tone: {
          raw_value: skinToneValue,
          ...mapSkinTone(skinToneValue)
        }
      };
      
      const result = {
        // Age
        age: attrs.age?.value || "Unknown",
        
        // Gender
        gender: attrs.gender?.value || "Unknown",
        
        // Skin status
        acne: skinAttributes.acne,
        
        // Skin attributes including skin tone from Face++
        skin_attributes: skinAttributes,
        
        // Image quality
        image_quality: {
          blur: attrs.blur?.blurness?.value || 0,
          face_quality: attrs.facequality?.value || 0,
          passed: (attrs.facequality?.value || 0) > 50 && (attrs.blur?.blurness?.value || 100) < 50
        },
        
        // Skincare recommendations
        skincare_recommendations: generateSkincareRecommendations({
          acne: skinAttributes.acne,
          skin_attributes: skinAttributes,
          age: attrs.age?.value || 25
        }),
        
        // Metadata
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
      console.log(`  Skin Tone: ${result.skin_attributes.skin_tone.name} (${result.skin_attributes.skin_tone.raw_value})`);
      console.log(`  Face Detected: Yes`);
      
      res.json(result);

    } catch (apiError) {
      console.error('Face++ API Error:', apiError.message);
      
      if (apiError.response?.data?.error_message?.includes('NO_FACE_DETECTED') || 
          apiError.message.includes('No face')) {
        return res.status(400).json({ 
          error: "NO_FACE_DETECTED",
          message: "No face detected in the image. Please upload a clear photo of your face.",
          details: "The AI could not detect a human face in the uploaded image."
        });
      }
      
      console.error('API Error Details:', apiError.response?.data);
      
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
      stain: attrs.skinstatus?.stain || 0,
      dark_circle: attrs.skinstatus?.dark_circle || 0,
      acne: attrs.skinstatus?.acne || 0,
      // Blackhead removed
      skin_tone: {
        raw_value: skinToneValue,
        ...mapSkinTone(skinToneValue)
      }
    };
    
    const result = {
      age: attrs.age?.value || "Unknown",
      gender: attrs.gender?.value || "Unknown",
      acne: skinAttributes.acne,
      skin_attributes: skinAttributes,
      image_quality: { 
        passed: true
      },
      skincare_recommendations: generateSkincareRecommendations({
        acne: skinAttributes.acne,
        skin_attributes: skinAttributes,
        age: attrs.age?.value || 25
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
        // Blackhead removed
        skin_tone: {
          raw_value: 2,
          value: 2,
          name: "Wheat / Slight tan",
          description: "Wheatish complexion, tans easily",
          hex: "#C8A880"
        }
      },
      image_quality: {
        blur: 15,
        face_quality: 85,
        passed: true,
      },
      skincare_recommendations: {
        summary: "Your skin shows moderate acne concerns with some pigmentation",
        morning_routine: ["Gentle cleanser", "Vitamin C serum", "SPF 30+ moisturizer"],
        evening_routine: ["Double cleanse", "Salicylic acid treatment", "Hydrating night cream"],
        weekly_treatments: ["Chemical exfoliation 2x weekly", "Clay mask 1x weekly"],
        lifestyle_tips: ["Drink 8 glasses of water", "Reduce sugar intake", "Change pillowcases twice weekly"],
        key_recommendations: ["Consider niacinamide for pigmentation"],
        severity: { acne: "moderate", pigmentation: "moderate", aging: "maintenance" }
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