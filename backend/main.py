from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests, os, time
from dotenv import load_dotenv
import hashlib
from typing import Dict, Any
import io
from PIL import Image

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FACEPP_API_KEY = os.getenv("FACEPP_API_KEY")
FACEPP_API_SECRET = os.getenv("FACEPP_API_SECRET")

# Cache to prevent duplicate processing (optional, for development)
analysis_cache = {}

def generate_image_hash(image_data: bytes) -> str:
    """Generate unique hash for image to detect duplicates"""
    return hashlib.md5(image_data).hexdigest()

def validate_image_quality(img_bytes: bytes) -> Dict[str, Any]:
    """Validate image quality for accurate analysis"""
    try:
        image = Image.open(io.BytesIO(img_bytes))
        width, height = image.size
        
        # Check image resolution
        min_resolution = 640 * 480  # VGA quality
        current_resolution = width * height
        
        # Check aspect ratio (should be roughly square for face detection)
        aspect_ratio = width / height
        aspect_ok = 0.7 <= aspect_ratio <= 1.3
        
        quality_issues = []
        
        if current_resolution < min_resolution:
            quality_issues.append("Low resolution")
        
        if not aspect_ok:
            quality_issues.append("Poor aspect ratio")
        
        return {
            "is_acceptable": len(quality_issues) == 0,
            "resolution": f"{width}x{height}",
            "issues": quality_issues,
            "recommendations": [
                "Use good lighting (natural light preferred)",
                "Ensure face is clearly visible and centered",
                "Avoid shadows and glare",
                "Use front camera with high resolution",
                "Keep neutral expression"
            ]
        }
        
    except Exception as e:
        return {
            "is_acceptable": True,  # Default to True if check fails
            "error": str(e)
        }

def analyze_skin_attributes(skin_data: Dict, gender: str, age: int) -> Dict[str, Any]:
    """Enhanced and more accurate skin analysis with better thresholding"""
    
    # Extract raw scores with safe defaults
    acne_score = skin_data.get("acne", 0)
    dark_circle_score = skin_data.get("dark_circle", 0)
    blackhead_score = skin_data.get("blackhead", 0)
    health_score = skin_data.get("health", 0)
    stain_score = skin_data.get("stain", 0)
    clarity_score = skin_data.get("clarity", 0)

    # Age and gender adjustments (more conservative)
    age_factor = min(age / 80, 1.0) if age else 0.5
    is_male = gender.lower() == "male"

    # IMPROVED ACNE DETECTION - Much more conservative
    # Face++ tends to over-detect acne, so we raise thresholds
    acne_adjustment = (1.0 - age_factor) * 0.2  # Less weight for age
    if is_male:
        acne_adjustment += 0.1  # Smaller adjustment for males
    
    # Combined acne index with higher thresholds
    acne_index = (acne_score * 0.6) + ((1 - health_score) * 0.2) + acne_adjustment
    acne_index = min(max(acne_index, 0), 1)

    # Higher thresholds for acne detection
    if acne_index < 0.4:  # Increased from 0.2
        acne = "None"
    elif acne_index < 0.6:  # Increased from 0.4
        acne = "Very Mild"
    elif acne_index < 0.75:  # Increased from 0.6
        acne = "Mild"
    elif acne_index < 0.85:  # Increased from 0.8
        acne = "Moderate"
    else:
        acne = "Severe"

    # IMPROVED PIMPLE DETECTION - Much more conservative
    pimple_index = (acne_score * 0.5) + (stain_score * 0.3) + ((1 - clarity_score) * 0.2)
    pimple_index = min(max(pimple_index, 0), 1)

    # Higher thresholds for pimples
    if pimple_index < 0.4:  # Increased from 0.25
        pimples = "None"
    elif pimple_index < 0.65:  # Increased from 0.5
        pimples = "Few"
    elif pimple_index < 0.8:  # Increased from 0.75
        pimples = "Several"
    else:
        pimples = "Many"

    # IMPROVED DARK CIRCLES - More conservative
    dark_circle_adjustment = age_factor * 0.15  # Reduced adjustment
    dark_circle_index = (dark_circle_score * 0.8) + dark_circle_adjustment
    dark_circle_index = min(max(dark_circle_index, 0), 1)

    dark_circles = (
        "None" if dark_circle_index < 0.35 else  # Increased threshold
        "Mild" if dark_circle_index < 0.6 else   # Increased threshold
        "Moderate" if dark_circle_index < 0.8 else  # Increased threshold
        "Heavy"
    )

    # IMPROVED BLACKHEADS - More conservative
    blackhead_index = (blackhead_score * 0.7) + ((1 - clarity_score) * 0.3)
    blackhead_index = min(max(blackhead_index, 0), 1)

    blackheads = (
        "None" if blackhead_index < 0.3 else    # Increased threshold
        "Few" if blackhead_index < 0.55 else    # Increased threshold
        "Moderate" if blackhead_index < 0.75 else  # Increased threshold
        "Many"
    )

    # IMPROVED SKIN TONE - More accurate assessment
    if health_score > 0.75 and clarity_score > 0.7:
        skin_tone = "Radiant"
    elif health_score > 0.6 and stain_score < 0.3:
        skin_tone = "Healthy"
    elif stain_score > 0.5 or clarity_score < 0.4:
        skin_tone = "Uneven"
    elif health_score < 0.4:
        skin_tone = "Dull"
    else:
        skin_tone = "Normal"

    # IMPROVED OVERALL CONDITION - More balanced
    combined_score = (health_score * 0.4 + clarity_score * 0.3 + 
                     (1 - acne_score) * 0.2 + (1 - stain_score) * 0.1)
    
    if combined_score > 0.8:
        overall_condition = "Excellent"
        skin_grade = "A"
    elif combined_score > 0.65:
        overall_condition = "Good"
        skin_grade = "B"
    elif combined_score > 0.5:
        overall_condition = "Fair"
        skin_grade = "C"
    else:
        overall_condition = "Needs Care"
        skin_grade = "D"

    # Additional metrics with better accuracy
    skin_moisture = (
        "High" if health_score > 0.75 else 
        "Medium" if health_score > 0.5 else 
        "Low"
    )
    
    pore_visibility = (
        "Minimal" if clarity_score > 0.75 else 
        "Visible" if clarity_score > 0.45 else 
        "Prominent"
    )

    # Confidence score based on multiple factors
    confidence_factors = [
        health_score,
        clarity_score,
        1 - min(acne_score * 2, 1),  # Penalize high acne scores (likely false positives)
        1 - min(stain_score * 1.5, 1)  # Penalize high stain scores
    ]
    analysis_confidence = sum(confidence_factors) / len(confidence_factors) * 100

    return {
        "acne": acne,
        "pimples": pimples,
        "dark_circles": dark_circles,
        "blackheads": blackheads,
        "skin_tone": skin_tone,
        "overall_condition": overall_condition,
        "skin_grade": skin_grade,
        "skin_moisture": skin_moisture,
        "pore_visibility": pore_visibility,
        "analysis_confidence": round(analysis_confidence, 1),
        "raw_scores": {
            "acne_score": round(acne_score, 3),
            "health_score": round(health_score, 3),
            "clarity_score": round(clarity_score, 3),
            "dark_circle_score": round(dark_circle_score, 3),
            "blackhead_score": round(blackhead_score, 3),
            "stain_score": round(stain_score, 3),
            "combined_score": round(combined_score, 3)
        }
    }

@app.get("/")
def root():
    return {"message": "🧴 Enhanced Skincare Analyzer Backend is running!"}

@app.post("/analyze/skin")
async def analyze_skin(file: UploadFile = File(...)):
    try:
        img_bytes = await file.read()
        
        # Validate image quality first
        quality_check = validate_image_quality(img_bytes)
        if not quality_check["is_acceptable"]:
            return {
                "error": "Poor image quality detected",
                "issues": quality_check["issues"],
                "recommendations": quality_check["recommendations"],
                "analysis_skipped": True
            }
        
        # Generate unique hash for this image
        image_hash = generate_image_hash(img_bytes)
        
        # Check cache (optional - remove in production)
        if image_hash in analysis_cache:
            print("Returning cached result for same image")
            return analysis_cache[image_hash]
        
        print(f"Analyzing new image with hash: {image_hash[:16]}...")
        print(f"Image quality: {quality_check}")

        # Try analysis multiple times with different parameters
        analyses = []
        for attempt in range(2):  # Try twice
            try:
                url = "https://api-us.faceplusplus.com/facepp/v3/detect"
                data = {
                    "api_key": FACEPP_API_KEY,
                    "api_secret": FACEPP_API_SECRET,
                    "return_attributes": "skinstatus,gender,age"
                }
                files = {"image_file": img_bytes}

                response = requests.post(url, data=data, files=files, timeout=30)
                result = response.json()

                if "faces" not in result or len(result["faces"]) == 0:
                    if attempt == 1:  # Only raise on last attempt
                        raise HTTPException(status_code=400, detail="No face detected in image. Please ensure face is clearly visible.")
                    continue

                face_data = result["faces"][0]
                attrs = face_data.get("attributes", {})
                skin_data = attrs.get("skinstatus", {})
                gender_data = attrs.get("gender", {}).get("value", "Unknown")
                age_data = attrs.get("age", {}).get("value", 25)  # Default age

                print(f"Attempt {attempt + 1} - Gender: {gender_data}, Age: {age_data}")
                print(f"Raw skin scores: {skin_data}")

                # Enhanced analysis with age and gender considerations
                analysis_result = analyze_skin_attributes(skin_data, gender_data, age_data)
                
                # Add basic info
                analysis_result.update({
                    "gender": gender_data,
                    "estimated_age": age_data,
                    "face_confidence": round(face_data.get("face_rectangle", {}).get("confidence", 0) * 100, 1),
                    "timestamp": time.time(),
                    "image_hash": image_hash[:16],  # For debugging
                    "analysis_attempt": attempt + 1
                })

                analyses.append(analysis_result)
                
            except requests.exceptions.Timeout:
                if attempt == 1:
                    raise HTTPException(status_code=408, detail="Analysis timeout. Please try again.")
                continue
            except HTTPException:
                raise
            except Exception as e:
                print(f"Analysis attempt {attempt + 1} failed: {e}")
                if attempt == 1 and not analyses:
                    raise HTTPException(status_code=500, detail=f"All analysis attempts failed: {str(e)}")
                continue
        
        if not analyses:
            raise HTTPException(status_code=500, detail="All analysis attempts failed")

        # Use the best analysis (highest confidence)
        final_result = max(analyses, key=lambda x: x.get("analysis_confidence", 0))
        final_result["analysis_attempts"] = len(analyses)
        final_result["image_quality"] = quality_check
        
        # Cache result (optional)
        analysis_cache[image_hash] = final_result
        
        # Limit cache size
        if len(analysis_cache) > 50:
            oldest_key = next(iter(analysis_cache))
            del analysis_cache[oldest_key]

        print(f"Final analysis result: {final_result['skin_grade']} - {final_result['overall_condition']}")
        return final_result

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Service temporarily unavailable: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

@app.get("/clear-cache")
async def clear_cache():
    """Endpoint to clear cache (for testing)"""
    analysis_cache.clear()
    return {"message": "Cache cleared"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "cache_size": len(analysis_cache)
    }