from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os
import logging

# =========================
# LOGGING SETUP
# =========================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =========================
# FASTAPI APP
# =========================
app = FastAPI()

# Allow React Native / Expo / Web access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# MODEL PATH
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "skin_disease_mobilenet.keras")

# =========================
# LOAD MODEL
# =========================
try:
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    logger.info("✅ Skin disease model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load model: {e}")
    raise RuntimeError(f"Model loading failed: {e}")

# =========================
# CLASS NAMES (MATCH FOLDERS)
# =========================
CLASS_NAMES = [
    "Acne",
    "Actinic_Keratosis",
    "Eczema",
    "Infestations_Bites",
    "Moles",
    "Psoriasis",
    "Rosacea",
    "Sun_Sunlight_Damage",
    "Vitiligo",
    "Warts"
]

# Disease descriptions for better user feedback
DISEASE_DESCRIPTIONS = {
    "Acne": "Common skin condition when hair follicles become clogged with oil and dead skin cells.",
    "Actinic_Keratosis": "Rough, scaly patches on skin from years of sun exposure.",
    "Eczema": "Condition that makes skin red and itchy.",
    "Infestations_Bites": "Skin reactions from insect bites or infestations.",
    "Moles": "Growths on the skin, usually brown or black.",
    "Psoriasis": "Skin disease that causes red, itchy scaly patches.",
    "Rosacea": "Chronic skin condition that causes redness and visible blood vessels.",
    "Sun_Sunlight_Damage": "Skin damage caused by prolonged sun exposure.",
    "Vitiligo": "Condition where skin loses its pigment cells.",
    "Warts": "Small, rough growths caused by HPV virus."
}

# =========================
# CONFIDENCE THRESHOLDS
# =========================
LOW_CONFIDENCE_THRESHOLD = 0.45  # 45% - Below this, not confident it's skin
HIGH_CONFIDENCE_THRESHOLD = 0.70  # 70% - Above this, very confident

# =========================
# IMAGE PREPROCESSING
# =========================
def preprocess_image(image: Image.Image):
    image = image.resize((224, 224))
    image = np.array(image).astype("float32") / 255.0
    image = np.expand_dims(image, axis=0)  # shape (1, 224, 224, 3)
    return image

# =========================
# PREDICTION ENDPOINT
# =========================
@app.post("/predict-skin")
async def predict_skin(file: UploadFile = File(...)):
    try:
        # Read and validate image
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Basic image validation
        if image.size[0] < 50 or image.size[1] < 50:
            raise HTTPException(status_code=400, detail="Image is too small. Please use a clearer photo.")
        
        # Check if image is mostly a single color (likely not skin)
        img_array = np.array(image)
        unique_colors = len(np.unique(img_array.reshape(-1, img_array.shape[2]), axis=0))
        if unique_colors < 10:  # Very few colors
            raise HTTPException(status_code=400, detail="Image appears too simple or uniform. Please capture actual skin.")
        
        processed_image = preprocess_image(image)

        # Make prediction
        predictions = model.predict(processed_image, verbose=0)
        class_index = int(np.argmax(predictions))
        confidence = float(predictions[0][class_index])
        
        # Get class name and description
        disease_name = CLASS_NAMES[class_index]
        description = DISEASE_DESCRIPTIONS.get(disease_name, "No description available")
        
        # Log prediction details for debugging
        logger.info(f"Prediction: {disease_name} with {confidence*100:.1f}% confidence")
        
        # Check confidence levels
        if confidence < LOW_CONFIDENCE_THRESHOLD:
            # Very low confidence - likely not skin or not matching any trained class
            second_best_index = np.argsort(predictions[0])[-2] if len(predictions[0]) > 1 else class_index
            second_best_confidence = float(predictions[0][second_best_index])
            
            error_detail = {
                "error": "LOW_CONFIDENCE",
                "message": f"The AI is not confident this is a skin condition (confidence: {confidence*100:.1f}%).",
                "details": "This might not be skin, or it doesn't match any of the trained conditions.",
                "top_prediction": disease_name,
                "top_confidence": round(confidence * 100, 2),
                "second_prediction": CLASS_NAMES[second_best_index],
                "second_confidence": round(second_best_confidence * 100, 2),
                "threshold": LOW_CONFIDENCE_THRESHOLD * 100
            }
            logger.warning(f"Low confidence prediction: {error_detail}")
            raise HTTPException(status_code=400, detail=error_detail)
        
        elif confidence < HIGH_CONFIDENCE_THRESHOLD:
            # Medium confidence - might be skin but not very certain
            return {
                "disease": disease_name,
                "confidence": round(confidence * 100, 2),
                "description": description,
                "warning": "Medium confidence - please consult a doctor for confirmation",
                "is_confident": True
            }
        else:
            # High confidence - good prediction
            return {
                "disease": disease_name,
                "confidence": round(confidence * 100, 2),
                "description": description,
                "is_confident": True,
                "is_high_confidence": True
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# =========================
# HEALTH CHECK ENDPOINT
# =========================
@app.get("/")
async def health_check():
    return {
        "status": "healthy", 
        "model": "skin_disease_mobilenet",
        "thresholds": {
            "low_confidence": LOW_CONFIDENCE_THRESHOLD * 100,
            "high_confidence": HIGH_CONFIDENCE_THRESHOLD * 100
        },
        "classes": CLASS_NAMES
    }

# =========================
# THRESHOLD INFO ENDPOINT
# =========================
@app.get("/thresholds")
async def get_thresholds():
    return {
        "low_confidence_threshold": LOW_CONFIDENCE_THRESHOLD * 100,
        "high_confidence_threshold": HIGH_CONFIDENCE_THRESHOLD * 100,
        "message": "Predictions below low threshold will be rejected"
    }