from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os
import logging
import tempfile
from datetime import datetime
from database import save_skin_analysis_to_history, get_user_skin_history, delete_skin_history_entry, get_all_skin_history_statistics, get_disease_history_by_name

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

# =========================
# DISEASE INFORMATION DATABASE (PRESCRIPTION-FREE VERSION)
# =========================
DISEASE_DATABASE = {
    "Acne": {
        "description": "Common skin condition when hair follicles become clogged with oil and dead skin cells.",
        "medications": [
            {
                "category": "Gentle Cleansing",
                "items": ["Use a gentle, non-comedogenic cleanser twice daily", "Avoid harsh soaps that strip natural oils", "Look for cleansers with salicylic acid (over-the-counter)"],
                "description": "Keep skin clean without over-drying. Wash gently with lukewarm water."
            },
            {
                "category": "Over-the-Counter Topical Treatments",
                "items": ["Benzoyl peroxide (2.5% - 10%)", "Salicylic acid (0.5% - 2%)", "Sulfur-based treatments", "Niacinamide serums"],
                "description": "Available without prescription. Start with lower concentrations and use as directed."
            },
            {
                "category": "Oil Control",
                "items": ["Use oil-free, non-comedogenic moisturizers", "Blotting papers for excess oil", "Lightweight gel-based products"],
                "description": "Control excess oil without clogging pores."
            },
            {
                "category": "Natural Anti-Inflammatories",
                "items": ["Green tea extract", "Witch hazel (alcohol-free)", "Aloe vera gel", "Tea tree oil (diluted)"],
                "description": "Gentle natural options to reduce inflammation and redness."
            },
            {
                "category": "Lifestyle Modifications",
                "items": ["Change pillowcases weekly", "Avoid touching face", "Clean phone screens regularly", "Use clean towels daily"],
                "description": "Simple daily habits to reduce bacterial transfer and irritation."
            }
        ],
        "general_advice": [
            "Wash face twice daily with gentle, non-comedogenic cleanser",
            "Avoid picking or squeezing pimples - can cause scarring",
            "Use oil-free, non-comedogenic skincare and makeup products",
            "Apply oil-free sunscreen daily to prevent dark spots",
            "Be patient - over-the-counter treatments can take 4-8 weeks to show results",
            "Change pillowcases frequently and avoid touching face",
            "Consider reducing dairy and high-glycemic foods if breakouts persist"
        ]
    },
    "Actinic_Keratosis": {
        "description": "Rough, scaly patches on skin from years of sun exposure. These are precancerous and should be monitored by a dermatologist.",
        "medications": [
            {
                "category": "Sun Protection (Most Important)",
                "items": ["Broad-spectrum SPF 50+ sunscreen", "UPF 50+ protective clothing", "Wide-brimmed hats", "UV-blocking sunglasses", "Sun-protective gloves"],
                "description": "Prevent new lesions and protect existing ones. Reapply sunscreen every 2 hours."
            },
            {
                "category": "Skin Barrier Repair",
                "items": ["Gentle moisturizers with ceramides", "Niacinamide creams", "Vitamin C serums (antioxidants)", "Hyaluronic acid for hydration"],
                "description": "Support skin health and repair sun-damaged barrier."
            },
            {
                "category": "Regular Self-Monitoring",
                "items": ["Monthly skin self-exams", "Take photos to track changes", "Use body map to document spots", "Measure spots with ruler"],
                "description": "Early detection is key. Monitor for changes in size, color, or texture."
            },
            {
                "category": "Professional Treatment Options",
                "items": ["Cryotherapy (liquid nitrogen freezing)", "Chemical peels (superficial)", "Photodynamic therapy (light treatment)"],
                "description": "In-office procedures performed by dermatologist. Covered by most insurance."
            },
            {
                "category": "Preventive Lifestyle Changes",
                "items": ["Seek shade between 10am-4pm", "Avoid tanning beds completely", "Wear sun-protective clothing daily", "Use lip balm with SPF"],
                "description": "Daily protection prevents progression and new lesions."
            }
        ],
        "general_advice": [
            "Strict sun protection - SPF 50+, protective clothing, wide-brimmed hats",
            "Regular skin self-exams monthly - check all areas including scalp and ears",
            "Professional dermatology follow-ups every 6-12 months",
            "Avoid tanning beds and excessive sun exposure completely",
            "Treatment may require multiple sessions for complete clearance",
            "Some treatments cause temporary redness and irritation - this indicates they're working",
            "Early treatment prevents progression to skin cancer"
        ]
    },
    "Eczema": {
        "description": "Condition that makes skin red and itchy. Also known as atopic dermatitis. Chronic condition with flares.",
        "medications": [
            {
                "category": "Intensive Moisturizing",
                "items": ["Thick cream moisturizers (ceramide-rich)", "Petroleum jelly (Vaseline)", "Shea butter based creams", "Oatmeal-based lotions", "Urea creams (10% or less)"],
                "description": "Apply liberally and frequently - at least 2-3 times daily, especially after bathing"
            },
            {
                "category": "Over-the-Counter Anti-Itch Relief",
                "items": ["Hydrocortisone cream 1% (for short-term use)", "Pramoxine lotions", "Calamine lotion", "Colloidal oatmeal baths"],
                "description": "Temporary relief for mild itching. Use as directed and not for extended periods."
            },
            {
                "category": "Natural Soothing Agents",
                "items": ["Cold compresses", "Aloe vera gel", "Coconut oil (virgin/unrefined)", "Sunflower seed oil", "Jojoba oil"],
                "description": "Cool and soothe inflamed skin naturally."
            },
            {
                "category": "Gentle Skin Care Routine",
                "items": ["Fragrance-free cleansers", "Non-soap cleansers", "Avoid hot water (use lukewarm)", "Pat dry - don't rub", "Apply moisturizer within 3 minutes of bathing"],
                "description": "Proper bathing and moisturizing routine prevents flares."
            },
            {
                "category": "Trigger Management",
                "items": ["Identify and avoid personal triggers", "Use humidifier in dry weather", "Wear soft cotton clothing", "Avoid wool and synthetic fabrics", "Use fragrance-free laundry detergent"],
                "description": "Environmental triggers are common - track what causes flares."
            }
        ],
        "general_advice": [
            "Take lukewarm showers (5-10 minutes max) - hot water dries skin",
            "Apply moisturizer immediately after bathing while skin is damp",
            "Wear soft, breathable fabrics like cotton; avoid wool and synthetics",
            "Keep nails short and smooth to minimize damage from scratching",
            "Use fragrance-free, hypoallergenic laundry detergents",
            "Maintain comfortable room temperature and humidity (40-60%)",
            "Avoid known triggers like stress, harsh soaps, and extreme temperatures"
        ]
    },
    "Infestations_Bites": {
        "description": "Skin reactions from insect bites or parasitic infestations like scabies, lice, or bed bugs.",
        "medications": [
            {
                "category": "Topical Itch Relief",
                "items": ["Calamine lotion", "Colloidal oatmeal baths", "Baking soda paste", "Aloe vera gel", "Cool compresses"],
                "description": "Relieve itching and inflammation from bites. Apply as needed for symptom relief."
            },
            {
                "category": "Oral Anti-Itch Options",
                "items": ["Oral antihistamines (cetirizine, loratadine, fexofenadine)", "Diphenhydramine (for nighttime itching)"],
                "description": "Over-the-counter antihistamines help reduce itching and allergic reactions."
            },
            {
                "category": "Over-the-Counter Treatments",
                "items": ["Permethrin cream (for scabies - available OTC in many countries)", "Pyrethrin-based sprays (for lice)", "Lice combs and kits"],
                "description": "Many treatments are available without prescription. Follow package instructions carefully."
            },
            {
                "category": "Environmental Control",
                "items": ["Wash all bedding in hot water (130°F/54°C)", "Dry on high heat for at least 30 minutes", "Vacuum carpets and furniture thoroughly", "Seal non-washable items in plastic bags for 2 weeks", "Use mattress and pillow encasements"],
                "description": "Remove pests from environment and prevent reinfestation."
            },
            {
                "category": "Prevention",
                "items": ["Insect repellent with DEET or picaridin", "Permethrin-treated clothing", "Mosquito nets", "Avoid standing water", "Cover skin when outdoors at dawn/dusk"],
                "description": "Prevent future bites and infestations."
            }
        ],
        "general_advice": [
            "Avoid scratching - can lead to secondary bacterial infection",
            "Apply cold compresses to reduce itching and swelling",
            "For scabies/lice, treat all household members and close contacts simultaneously",
            "Wash all bedding, clothing, and towels in hot water and dry on high heat",
            "Vacuum carpets, furniture, and mattresses thoroughly",
            "Items that can't be washed can be sealed in plastic bags for 2 weeks",
            "Use insect repellent with DEET or picaridin when outdoors",
            "Consult pharmacist for over-the-counter treatment options"
        ]
    },
    "Moles": {
        "description": "Growths on the skin, usually brown or black. Most are benign but should be monitored for changes.",
        "medications": [
            {
                "category": "Sun Protection",
                "items": ["Broad-spectrum SPF 50+ sunscreen", "UPF clothing", "Hats with brim", "Seek shade during peak hours"],
                "description": "Protect moles from UV damage. Apply sunscreen generously over all moles."
            },
            {
                "category": "Self-Monitoring Tools",
                "items": ["Handheld mirror", "Body mole map template", "Smartphone photography with date stamp", "Ruler for measuring", "Good lighting"],
                "description": "Track changes monthly using the ABCDE method."
            },
            {
                "category": "Daily Skin Protection",
                "items": ["Moisturizer with SPF", "Lip balm with SPF", "Sunscreen sticks for easy reapplication", "Sunscreen spray for hard-to-reach areas"],
                "description": "Make sun protection a daily habit, not just for beach days."
            },
            {
                "category": "Professional Monitoring",
                "items": ["Annual full-body skin exam by dermatologist", "Baseline photography", "Dermoscopy (specialized magnification)"],
                "description": "Regular professional checks are essential, especially if you have many moles."
            },
            {
                "category": "When to Seek Care",
                "items": ["ABCDE criteria check", "New mole after age 30", "Mole that itches or bleeds", "Mole that looks different from others", "Family history of skin cancer"],
                "description": "Know the warning signs and when to consult a dermatologist."
            }
        ],
        "general_advice": [
            "Follow ABCDE rule: Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolution over time",
            "Protect moles from sun exposure with sunscreen and clothing",
            "Perform monthly self-examination of all skin areas including back and scalp",
            "Use a mirror or ask someone to help examine hard-to-see areas",
            "See dermatologist for any new, changing, or symptomatic moles",
            "Not all moles need removal - only suspicious, symptomatic, or cosmetically concerning ones",
            "Take baseline photos and date them for future comparison",
            "Limit sun exposure, especially between 10am-4pm"
        ]
    },
    "Psoriasis": {
        "description": "Skin disease that causes red, itchy scaly patches, commonly on knees, elbows, and scalp. Autoimmune condition.",
        "medications": [
            {
                "category": "Intensive Moisturizing",
                "items": ["Thick emollient creams", "Petroleum jelly", "Shea butter", "Coconut oil", "Urea-based creams (10-20%)", "Salicylic acid creams (OTC 2-3%) for scales"],
                "description": "Keep skin well-hydrated to reduce scaling and itching. Apply multiple times daily."
            },
            {
                "category": "Over-the-Counter Scale Reducers",
                "items": ["Coal tar preparations (shampoos, creams, ointments)", "Salicylic acid (2-3%)", "Sulfur preparations", "Baking soda baths"],
                "description": "Help remove scales and reduce itching. Available without prescription."
            },
            {
                "category": "Natural Anti-Inflammatories",
                "items": ["Aloe vera gel", "Capsaicin cream (from chili peppers)", "Oatmeal baths", "Dead Sea salt baths", "Apple cider vinegar (diluted for scalp)"],
                "description": "Natural options to reduce inflammation and itching."
            },
            {
                "category": "Lifestyle Management",
                "items": ["Stress reduction techniques (meditation, yoga)", "Regular exercise", "Healthy anti-inflammatory diet", "Avoid alcohol", "Maintain healthy weight"],
                "description": "Stress and lifestyle factors significantly affect psoriasis flares."
            },
            {
                "category": "Light Therapy (Home Options)",
                "items": ["Limited sun exposure (10-15 minutes daily)", "Use caution to avoid sunburn", "Cover unaffected areas", "Best in morning or late afternoon"],
                "description": "Controlled sun exposure can help. Always protect face and unaffected areas."
            }
        ],
        "general_advice": [
            "Keep skin well-moisturized with thick creams and ointments",
            "Identify and avoid triggers (stress, infection, skin injuries, alcohol)",
            "Take lukewarm baths with Epsom salts, Dead Sea salts, or colloidal oatmeal",
            "Limited sun exposure can help (5-10 minutes) but avoid sunburn",
            "Manage stress through relaxation techniques, exercise, or counseling",
            "Avoid alcohol which can worsen psoriasis",
            "Don't pick at scales - this can cause new lesions",
            "Consider anti-inflammatory diet rich in fish, vegetables, and fruits"
        ]
    },
    "Rosacea": {
        "description": "Chronic skin condition that causes redness and visible blood vessels on the face. Often includes papules and pustules.",
        "medications": [
            {
                "category": "Gentle Skin Care",
                "items": ["Fragrance-free, non-comedogenic cleansers", "Alcohol-free products", "Lukewarm water only (never hot)", "Soft cotton pads (no scrubbing)", "Pat dry gently"],
                "description": "Gentle cleansing is essential. Avoid anything that irritates skin."
            },
            {
                "category": "Over-the-Counter Topical Options",
                "items": ["Azelaic acid (10% OTC)", "Niacinamide serums", "Sulfur-based creams", "Green-tinted color correctors", "Mineral makeup (non-irritating)"],
                "description": "Help reduce redness and bumps. Available without prescription."
            },
            {
                "category": "Sun Protection",
                "items": ["Mineral sunscreens (zinc oxide, titanium dioxide only)", "SPF 30-50+ broad spectrum", "Physical blockers (no chemical sunscreens)", "Wide-brimmed hat", "Seek shade"],
                "description": "Sun is a major trigger. Physical sunscreens are less irritating than chemical ones."
            },
            {
                "category": "Trigger Management",
                "items": ["Keep a trigger diary", "Avoid spicy foods", "Limit alcohol (especially red wine)", "Avoid hot beverages", "Stay cool (avoid overheating)", "Manage stress"],
                "description": "Identifying and avoiding personal triggers is the most effective management strategy."
            },
            {
                "category": "Redness Reduction Techniques",
                "items": ["Cool compresses", "Green tea compresses (cooled)", "Aloe vera gel", "Avoid extreme temperatures", "Sleep with head slightly elevated", "Use humidifier"],
                "description": "Cooling and calming techniques help reduce acute redness."
            }
        ],
        "general_advice": [
            "Use gentle, fragrance-free, non-comedogenic skincare products",
            "Apply mineral sunscreen every day (zinc oxide or titanium dioxide)",
            "Avoid hot showers, saunas, steam rooms, and overheating",
            "Keep a trigger diary to identify and avoid personal triggers",
            "Be gentle with your skin - no harsh scrubbing or exfoliating",
            "Use lukewarm water for washing face",
            "Protect face from cold wind with soft scarf",
            "Choose cosmetics labeled 'non-comedogenic' and 'hypoallergenic'",
            "Avoid spicy foods, alcohol, and hot beverages if they trigger flares"
        ]
    },
    "Sun_Sunlight_Damage": {
        "description": "Skin damage caused by prolonged sun exposure including sunburn, photoaging, and actinic damage.",
        "medications": [
            {
                "category": "Immediate Sunburn Relief",
                "items": ["Cool compresses", "Aloe vera gel (pure, no alcohol)", "Cool colloidal oatmeal baths", "Fragrance-free moisturizers", "Cool water soaks"],
                "description": "Apply immediately after sun exposure. Keep skin cool and hydrated."
            },
            {
                "category": "Hydration and Skin Repair",
                "items": ["Drink plenty of water", "Petroleum jelly on blisters (don't pop)", "Gentle fragrance-free moisturizers", "Hyaluronic acid serums", "Niacinamide creams"],
                "description": "Rehydrate skin from inside and out. Support natural healing."
            },
            {
                "category": "Over-the-Counter Relief",
                "items": ["Hydrocortisone cream 1% (for severe redness, short-term)", "Ibuprofen or naproxen (for pain and inflammation)", "Cooling gels with menthol", "Calamine lotion"],
                "description": "For symptom management. Use as directed on package."
            },
            {
                "category": "Long-term Skin Health",
                "items": ["Vitamin C serums (antioxidants)", "Vitamin E creams", "Green tea extract products", "Retinol creams (start with low concentration OTC)", "Niacinamide (helps repair UV damage)"],
                "description": "Support skin repair and prevent further damage."
            },
            {
                "category": "Prevention (Most Important)",
                "items": ["SPF 30-50+ broad spectrum sunscreen (apply 15 min before sun)", "Reapply every 2 hours", "UPF 50+ protective clothing", "Wide-brimmed hats", "Seek shade 10am-4pm"],
                "description": "Prevention is the only cure. Make sun protection a daily habit."
            }
        ],
        "general_advice": [
            "Apply sunscreen generously 15 minutes before sun exposure",
            "Reapply every 2 hours and immediately after swimming or heavy sweating",
            "Seek shade during peak sun hours (10am-4pm)",
            "Drink plenty of water to rehydrate after sun exposure",
            "Do not pop blisters - allow them to heal naturally to prevent infection",
            "Take cool baths or use cool compresses for sunburn relief",
            "Use moisturizer with aloe vera or soy to soothe sunburned skin",
            "Stay out of the sun while sunburn is healing",
            "Regular self-exams for any new or changing spots from cumulative sun damage",
            "Wear UPF clothing, wide-brimmed hats, and UV-blocking sunglasses"
        ]
    },
    "Vitiligo": {
        "description": "Condition where skin loses its pigment cells (melanocytes), resulting in white patches on the skin.",
        "medications": [
            {
                "category": "Sun Protection (Essential)",
                "items": ["Broad-spectrum SPF 50+ sunscreen (apply to all depigmented areas)", "Zinc oxide or titanium dioxide sunscreens", "UPF 50+ protective clothing", "Wide-brimmed hats", "Sun-protective sleeves/gloves"],
                "description": "Depigmented skin has NO natural sun protection. Sun protection is absolutely essential."
            },
            {
                "category": "Camouflage Options",
                "items": ["Self-tanners (DHA-based) to blend white patches", "Camouflage makeup (waterproof, transfer-resistant)", "Body stains and dyes", "Color correctors", "Setting powders"],
                "description": "Cosmetic options to even skin tone appearance. Test on small area first."
            },
            {
                "category": "Natural Supportive Therapies",
                "items": ["Ginkgo biloba extract (may help repigmentation)", "Vitamin D supplements (due to sun avoidance)", "Vitamin B12 and folic acid", "Alpha-lipoic acid (antioxidant)", "Polypodium leucotomos (fern extract)"],
                "description": "Some natural supplements may support repigmentation. Discuss with healthcare provider."
            },
            {
                "category": "Topical Options (Over-the-Counter)",
                "items": ["Hydrocortisone cream 1% (for short-term use on small areas)", "Avoid harsh chemicals and irritants", "Gentle moisturizers to maintain skin health"],
                "description": "OTC options are limited. Most treatments require prescription or medical supervision."
            },
            {
                "category": "Lifestyle Management",
                "items": ["Stress reduction techniques", "Join vitiligo support groups", "Counseling for body image", "Protective clothing year-round", "Avoid skin trauma (cuts, scrapes, friction)"],
                "description": "Emotional support and stress management are important for quality of life."
            }
        ],
        "general_advice": [
            "Sun protection is crucial - depigmented skin burns very easily",
            "Use SPF 50+ broad-spectrum sunscreen on all vitiligo patches daily",
            "Camouflage with cosmetic concealers, stains, or self-tanners if desired for appearance",
            "Treatment response takes months - be patient and consistent",
            "Join support groups for emotional support and coping strategies",
            "Protect patches from sunburn with high SPF sunscreen, clothing, and seeking shade",
            "Stress management may help prevent progression",
            "Consider vitamin D supplementation as sun avoidance limits natural vitamin D production",
            "Consult dermatologist for prescription treatments if desired"
        ]
    },
    "Warts": {
        "description": "Small, rough growths on the skin caused by human papillomavirus (HPV). Common on hands, feet, and face.",
        "medications": [
            {
                "category": "Over-the-Counter Keratolytic Agents",
                "items": ["Salicylic acid (17-40% liquid, gel, or pads)", "Lactic acid preparations", "Urea creams (20-40%)", "Silver nitrate sticks (available at pharmacies)"],
                "description": "Peel away layers of the wart gradually. Apply daily, file dead skin between treatments."
            },
            {
                "category": "Home Physical Treatments",
                "items": ["Duct tape occlusion (cover wart with duct tape for 6 days, remove, file, repeat)", "Pumice stone or emery board (file between treatments)", "Warm water soaks (soften before treatment)"],
                "description": "Simple home methods that can be very effective. Patience is key."
            },
            {
                "category": "Natural Remedies",
                "items": ["Apple cider vinegar (diluted, apply with cotton ball)", "Tea tree oil (diluted)", "Garlic extract", "Thuja oil", "Vitamin E oil"],
                "description": "Natural options some people find helpful. Test on small area first."
            },
            {
                "category": "Prevention and Hygiene",
                "items": ["Keep feet dry (wear breathable shoes/socks)", "Don't share towels, shoes, socks, or razors", "Cover warts when swimming", "Wear flip-flops in locker rooms and public showers", "Dispose of emery boards after use"],
                "description": "Prevent spread to other body parts and to other people."
            },
            {
                "category": "Immune Support",
                "items": ["Zinc supplements (oral)", "Multivitamins (ensure adequate nutrition)", "Healthy diet (fruits, vegetables)", "Adequate sleep", "Stress reduction"],
                "description": "Strong immune system helps body fight HPV virus."
            }
        ],
        "general_advice": [
            "Over-the-counter treatments can take weeks to months of consistent application",
            "Do not pick or scratch warts - can spread virus to other body parts",
            "Keep feet dry to prevent plantar warts",
            "Don't share towels, shoes, socks, or razors",
            "Cover warts with waterproof bandage when swimming",
            "Wear flip-flops in communal showers and locker rooms",
            "File warts with disposable emery board between treatments",
            "Be patient - many warts eventually resolve on their own but treatment speeds resolution",
            "If OTC treatments fail after 3 months, consult healthcare provider"
        ]
    }
}

# Format medications for API response
def format_medications_for_response(disease_name):
    if disease_name in DISEASE_DATABASE:
        disease_info = DISEASE_DATABASE[disease_name]
        medications = disease_info.get("medications", [])
        
        formatted_medications = []
        for med in medications:
            formatted_medications.append({
                "category": med["category"],
                "items": med["items"],
                "description": med["description"]
            })
        
        return {
            "has_medications": True,
            "medications": formatted_medications,
            "general_advice": disease_info.get("general_advice", [])
        }
    
    return {
        "has_medications": False,
        "medications": [],
        "general_advice": ["Please consult a healthcare provider for specific treatment recommendations."]
    }

# Disease descriptions for basic response
DISEASE_DESCRIPTIONS = {
    disease: info["description"] for disease, info in DISEASE_DATABASE.items()
}

# =========================
# CONFIDENCE THRESHOLDS
# =========================
LOW_CONFIDENCE_THRESHOLD = 0.45
HIGH_CONFIDENCE_THRESHOLD = 0.70

# =========================
# IMAGE PREPROCESSING
# =========================
def preprocess_image(image: Image.Image):
    image = image.resize((224, 224))
    image = np.array(image).astype("float32") / 255.0
    image = np.expand_dims(image, axis=0)
    return image

def predict_single_image(image: Image.Image):
    """Make prediction for a single image"""
    processed_image = preprocess_image(image)
    predictions = model.predict(processed_image, verbose=0)
    class_index = int(np.argmax(predictions))
    confidence = float(predictions[0][class_index])
    disease_name = CLASS_NAMES[class_index]
    return disease_name, confidence, predictions[0]

# =========================
# MULTI-IMAGE ANALYSIS ENDPOINT
# =========================
@app.post("/predict-skin-multi")
async def predict_skin_multi(
    files: list[UploadFile] = File(..., description="Upload up to 3 images of skin condition")
):
    """
    Analyze multiple images (up to 3) and return aggregated results
    """
    try:
        # Validate number of files
        if not files or len(files) == 0:
            raise HTTPException(status_code=400, detail="At least one image is required")
        
        if len(files) > 3:
            raise HTTPException(status_code=400, detail="Maximum 3 images allowed")
        
        logger.info(f"Received {len(files)} images for analysis")
        
        # Store predictions for each image
        predictions_list = []
        all_confidences = []
        all_disease_names = []
        detailed_results = []
        
        for idx, file in enumerate(files):
            # Read and validate image
            image_bytes = await file.read()
            if len(image_bytes) == 0:
                raise HTTPException(status_code=400, detail=f"Empty image file for image {idx+1}")
            
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
            # Basic image validation
            if image.size[0] < 50 or image.size[1] < 50:
                raise HTTPException(status_code=400, detail=f"Image {idx+1} is too small. Please use clearer photos.")
            
            # Check if image is mostly a single color
            img_array = np.array(image)
            unique_colors = len(np.unique(img_array.reshape(-1, img_array.shape[2]), axis=0))
            if unique_colors < 10:
                raise HTTPException(status_code=400, detail=f"Image {idx+1} appears too simple or uniform. Please capture actual skin.")
            
            # Make prediction
            disease_name, confidence, full_predictions = predict_single_image(image)
            
            # Get all class probabilities for this image
            class_probabilities = {
                CLASS_NAMES[i]: float(full_predictions[i]) 
                for i in range(len(CLASS_NAMES))
            }
            
            predictions_list.append({
                "image_index": idx + 1,
                "disease": disease_name,
                "confidence": round(confidence * 100, 2),
                "all_probabilities": class_probabilities
            })
            
            all_confidences.append(confidence)
            all_disease_names.append(disease_name)
            detailed_results.append({
                "image": idx + 1,
                "disease": disease_name,
                "confidence": confidence
            })
        
        # Aggregate results
        from collections import Counter
        
        # Find most common disease (mode)
        disease_counter = Counter(all_disease_names)
        most_common_disease = disease_counter.most_common(1)[0][0]
        disease_count = disease_counter[most_common_disease]
        
        # Calculate average confidence for the most common disease
        confidences_for_common = [
            all_confidences[i] for i, d in enumerate(all_disease_names) 
            if d == most_common_disease
        ]
        avg_confidence = sum(confidences_for_common) / len(confidences_for_common) * 100
        
        # Calculate consistency score (percentage of images agreeing on the same disease)
        consistency_score = (disease_count / len(files)) * 100
        
        # Get description and medication info for the aggregated disease
        description = DISEASE_DESCRIPTIONS.get(most_common_disease, "No description available")
        medication_info = format_medications_for_response(most_common_disease)
        
        # Determine overall confidence level
        overall_confidence_level = "high" if avg_confidence >= 70 else "medium" if avg_confidence >= 45 else "low"
        
        response = {
            "aggregated_result": {
                "disease": most_common_disease,
                "average_confidence": round(avg_confidence, 2),
                "consistency_score": round(consistency_score, 2),
                "images_analyzed": len(files),
                "images_agreeing": disease_count,
                "confidence_level": overall_confidence_level,
                "description": description,
                "medication_info": medication_info
            },
            "individual_results": predictions_list,
            "detailed_analysis": detailed_results
        }
        
        # Add warnings based on consistency
        if consistency_score < 50:
            response["warning"] = "Low consistency between images. Results may be less reliable. Consider retaking photos."
        elif consistency_score < 75:
            response["warning"] = "Moderate consistency. Results are reasonably reliable but confirm with a doctor."
        else:
            response["success"] = "High consistency across all images. Results are reliable."
        
        # Check if average confidence is too low
        if avg_confidence < LOW_CONFIDENCE_THRESHOLD * 100:
            response["warning"] = f"Average confidence is low ({avg_confidence:.1f}%). Results may not be accurate."
        
        logger.info(f"Multi-image analysis complete: {most_common_disease} with {avg_confidence:.1f}% avg confidence, {consistency_score:.1f}% consistent")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multi-image prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# =========================
# PREDICTION ENDPOINT (Original - kept for backward compatibility)
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
        if unique_colors < 10:
            raise HTTPException(status_code=400, detail="Image appears too simple or uniform. Please capture actual skin.")
        
        processed_image = preprocess_image(image)

        # Make prediction
        predictions = model.predict(processed_image, verbose=0)
        class_index = int(np.argmax(predictions))
        confidence = float(predictions[0][class_index])
        
        # Get class name and description
        disease_name = CLASS_NAMES[class_index]
        description = DISEASE_DESCRIPTIONS.get(disease_name, "No description available")
        
        # Get medication recommendations
        medication_info = format_medications_for_response(disease_name)
        
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
                "medication_info": medication_info,
                "warning": "Medium confidence - please consult a healthcare provider for confirmation",
                "is_confident": True
            }
        else:
            # High confidence - good prediction
            return {
                "disease": disease_name,
                "confidence": round(confidence * 100, 2),
                "description": description,
                "medication_info": medication_info,
                "is_confident": True,
                "is_high_confidence": True
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# =========================
# PREDICTION ENDPOINT (Without history - for initial analysis)
# =========================
@app.post("/predict-skin-only")
async def predict_skin_only(file: UploadFile = File(...)):
    """
    Predict skin disease without saving to history
    Returns only the prediction result
    """
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
        if unique_colors < 10:
            raise HTTPException(status_code=400, detail="Image appears too simple or uniform. Please capture actual skin.")
        
        processed_image = preprocess_image(image)

        # Make prediction
        predictions = model.predict(processed_image, verbose=0)
        class_index = int(np.argmax(predictions))
        confidence = float(predictions[0][class_index])
        
        # Get class name and description
        disease_name = CLASS_NAMES[class_index]
        description = DISEASE_DESCRIPTIONS.get(disease_name, "No description available")
        
        # Get medication recommendations
        medication_info = format_medications_for_response(disease_name)
        
        # Log prediction details for debugging
        logger.info(f"Prediction (no history): {disease_name} with {confidence*100:.1f}% confidence")
        
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
                "medication_info": medication_info,
                "warning": "Medium confidence - please consult a healthcare provider for confirmation",
                "is_confident": True
            }
        else:
            # High confidence - good prediction
            return {
                "disease": disease_name,
                "confidence": round(confidence * 100, 2),
                "description": description,
                "medication_info": medication_info,
                "is_confident": True,
                "is_high_confidence": True
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# =========================
# SAVE ANALYSIS TO HISTORY ENDPOINT
# =========================
@app.post("/save-analysis-to-history")
async def save_analysis_to_history(
    user_id: str = Form(...),
    image_data: str = Form(...),  # base64 image data
    prediction_result: str = Form(...)  # JSON string of prediction result
):
    """
    Save an existing analysis to history
    """
    temp_file_path = None
    try:
        import json
        import base64
        from PIL import Image
        import io
        
        # Parse prediction result
        prediction = json.loads(prediction_result)
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Save image temporarily for Cloudinary upload
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            image.save(tmp_file.name)
            temp_file_path = tmp_file.name
            
            history_info = save_skin_analysis_to_history(
                user_id=user_id,
                image_path=temp_file_path,
                prediction_result=prediction
            )
        
        if history_info and history_info.get("success"):
            return {
                "success": True,
                "history_id": history_info["history_id"],
                "image_url": history_info["image_url"]
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save to history")
        
    except Exception as e:
        logger.error(f"Error saving to history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save: {str(e)}")
    finally:
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

# =========================
# GET USER HISTORY ENDPOINT
# =========================
@app.get("/user-skin-history/{user_id}")
async def get_skin_history(user_id: str, limit: int = 20):
    """
    Get skin analysis history for a specific user
    """
    try:
        history = get_user_skin_history(user_id, limit)
        return {
            "user_id": user_id,
            "total": len(history),
            "history": history
        }
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

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
        "classes": CLASS_NAMES,
        "diseases_supported": len(DISEASE_DATABASE),
        "history_enabled": True,
        "multi_image_support": True,
        "max_images": 3,
        "disclaimer": "These recommendations are for informational purposes only. Always consult a healthcare provider for medical advice."
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

# =========================
# DISEASE INFO ENDPOINT
# =========================
@app.get("/disease-info/{disease_name}")
async def get_disease_info(disease_name: str):
    disease_key = disease_name.replace(" ", "_")
    if disease_key in DISEASE_DATABASE:
        return DISEASE_DATABASE[disease_key]
    raise HTTPException(status_code=404, detail="Disease information not found")

# =========================
# GET ALL SKIN HISTORY STATISTICS ENDPOINT
# =========================
@app.get("/skin-history-statistics")
async def get_skin_history_statistics():
    """
    Get statistics about all skin history entries across all users
    Returns counts per disease for analytics
    """
    try:
        statistics = get_all_skin_history_statistics()
        return statistics
    except Exception as e:
        logger.error(f"Error fetching statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")


# =========================
# GET HISTORY BY DISEASE NAME ENDPOINT
# =========================
@app.get("/skin-history-by-disease/{disease_name}")
async def get_history_by_disease(disease_name: str):
    """
    Get all history entries for a specific disease
    """
    try:
        history = get_disease_history_by_name(disease_name)
        return {
            "disease": disease_name,
            "total": len(history),
            "entries": history
        }
    except Exception as e:
        logger.error(f"Error fetching disease history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch disease history: {str(e)}")

# =========================
# DELETE SKIN HISTORY ENDPOINT
# =========================
@app.delete("/delete-skin-history/{history_id}")
async def delete_skin_history(history_id: str):
    """
    Delete a skin analysis history entry
    """
    try:
        logger.info(f"Received delete request for history ID: {history_id}")
        
        # Call the database function
        result = delete_skin_history_entry(history_id)
        
        if result.get("success"):
            return {
                "success": True,
                "message": "History deleted successfully"
            }
        else:
            # Check if it's a "not found" error
            if "not found" in result.get("error", "").lower():
                raise HTTPException(
                    status_code=404,
                    detail=result.get("error", "History entry not found")
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail=result.get("error", "Failed to delete history")
                )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete: {str(e)}"
        )