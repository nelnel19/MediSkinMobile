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
from database import save_skin_analysis_to_history, get_user_skin_history, delete_skin_history_entry  

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
# DISEASE INFORMATION DATABASE
# =========================
DISEASE_DATABASE = {
    "Acne": {
        "description": "Common skin condition when hair follicles become clogged with oil and dead skin cells.",
        "medications": [
            {
                "category": "Topical Retinoids (Vitamin A Derivatives)",
                "items": ["Adapalene (Differin)", "Tretinoin (Retin-A)", "Tazarotene"],
                "description": "Vitamin A derivatives that unclog pores and promote cell turnover. Apply at night."
            },
            {
                "category": "Benzoyl Peroxide",
                "items": ["2.5% - 10% creams/gels", "Washes", "Leave-on treatments"],
                "description": "Antiseptic and comedolytic agent that kills bacteria and removes dead skin. Start with lower concentrations."
            },
            {
                "category": "Topical Antibiotics",
                "items": ["Clindamycin", "Erythromycin", "Dapsone"],
                "description": "Reduce bacteria and inflammation. Often combined with benzoyl peroxide to prevent resistance."
            },
            {
                "category": "Azelaic Acid and Salicylic Acid",
                "items": ["Azelaic acid (15-20%)", "Salicylic acid", "Niacinamide"],
                "description": "Exfoliating and anti-inflammatory agents. Good for sensitive skin and dark spots."
            },
            {
                "category": "Oral Antibiotics and Systemic Treatment",
                "items": ["Doxycycline", "Minocycline", "Isotretinoin (severe cases)"],
                "description": "Prescription-only for moderate to severe acne. Requires medical supervision."
            },
            {
                "category": "Combination Therapy",
                "items": ["Benzoyl peroxide + clindamycin", "Adapalene + benzoyl peroxide"],
                "description": "Multiple agents for enhanced effectiveness. Common in fixed-dose combinations."
            }
        ],
        "general_advice": [
            "Wash face twice daily with gentle, non-comedogenic cleanser",
            "Avoid picking or squeezing pimples - can cause scarring",
            "Use oil-free, non-comedogenic skincare and makeup products",
            "Apply sunscreen daily to prevent post-inflammatory hyperpigmentation",
            "Be patient - treatments can take 6-8 weeks to show results",
            "Change pillowcases frequently and avoid touching face"
        ]
    },
    "Actinic_Keratosis": {
        "description": "Rough, scaly patches on skin from years of sun exposure. Considered precancerous and requires treatment.",
        "medications": [
            {
                "category": "Topical Chemotherapeutic Agents",
                "items": ["5-Fluorouracil (5-FU) cream", "Diclofenac gel"],
                "description": "Destroys abnormal cells. Causes temporary inflammation and crusting."
            },
            {
                "category": "Topical Immune Response Modifiers",
                "items": ["Imiquimod cream (Aldara)"],
                "description": "Stimulates immune system to attack abnormal cells. Used for 2-3 times weekly."
            },
            {
                "category": "Cryotherapy",
                "items": ["Liquid nitrogen application"],
                "description": "Freezing treatment - quick in-office procedure. May cause blistering and hypopigmentation."
            },
            {
                "category": "Photodynamic Therapy (PDT)",
                "items": ["Photosensitizing agent + blue/red light activation"],
                "description": "Light-based treatment for widespread areas on face and scalp."
            },
            {
                "category": "Surgical and Destructive Techniques",
                "items": ["Curettage", "Laser therapy", "Chemical peels", "Dermabrasion"],
                "description": "Physical removal of lesions. Used for thicker or resistant lesions."
            },
            {
                "category": "Field Treatment vs. Lesion-Directed Therapy",
                "items": ["Area-wide treatment (field)", "Individual spot treatment"],
                "description": "Field treatment for sun-damaged areas; lesion-directed for isolated keratoses."
            }
        ],
        "general_advice": [
            "Strict sun protection - SPF 50+, protective clothing, wide-brimmed hats",
            "Regular skin self-exams monthly",
            "Professional dermatology follow-ups every 6-12 months",
            "Avoid tanning beds and excessive sun exposure",
            "Treatment may require multiple sessions for complete clearance",
            "Some treatments cause temporary redness and irritation - this indicates they're working"
        ]
    },
    "Eczema": {
        "description": "Condition that makes skin red and itchy. Also known as atopic dermatitis. Chronic condition with flares.",
        "medications": [
            {
                "category": "Moisturizers and Emollients",
                "items": ["Ceramide creams (CeraVe, Cetaphil Restoraderm)", "Petroleum jelly (Vaseline)", "Urea-based creams", "Aquaphor"],
                "description": "Restore skin barrier - apply liberally and frequently, even when skin is clear"
            },
            {
                "category": "Topical Corticosteroids",
                "items": ["Hydrocortisone 1% (mild)", "Triamcinolone 0.1% (moderate)", "Clobetasol 0.05% (potent)", "Mometasone"],
                "description": "Reduce inflammation and itching. Use as prescribed - avoid long-term use on face/creases."
            },
            {
                "category": "Topical Calcineurin Inhibitors",
                "items": ["Tacrolimus (Protopic)", "Pimecrolimus (Elidel)"],
                "description": "Non-steroidal anti-inflammatory for sensitive areas like face, eyelids, and skin folds."
            },
            {
                "category": "Antihistamines",
                "items": ["Cetirizine (Zyrtec)", "Loratadine (Claritin)", "Fexofenadine (Allegra)", "Diphenhydramine (Benadryl - for sleep)"],
                "description": "Systemic relief for itching, especially at night. Non-sedating for daytime use."
            },
            {
                "category": "Wet Wrap Therapy",
                "items": ["Damp bandages/garments over moisturized skin"],
                "description": "Intensive treatment for severe flares. Apply moisturizer, wet wraps, then dry layer."
            },
            {
                "category": "Trigger Avoidance",
                "items": ["Identify and avoid personal triggers"],
                "description": "Common triggers: harsh soaps, allergens, stress, weather changes, wool fabrics"
            }
        ],
        "general_advice": [
            "Take lukewarm showers (5-10 minutes max) - hot water dries skin",
            "Apply moisturizer immediately after bathing while skin is damp",
            "Wear soft, breathable fabrics like cotton; avoid wool and synthetics",
            "Keep nails short and smooth to minimize damage from scratching",
            "Use fragrance-free, hypoallergenic laundry detergents",
            "Maintain comfortable room temperature and humidity"
        ]
    },
    "Infestations_Bites": {
        "description": "Skin reactions from insect bites or parasitic infestations like scabies, lice, or bed bugs.",
        "medications": [
            {
                "category": "Topical Skin Soothers",
                "items": ["Calamine lotion", "Colloidal oatmeal baths", "Hydrocortisone cream 1%", "Pramoxine", "Aloe vera"],
                "description": "Relieve itching and inflammation from bites. Apply as needed for symptom relief."
            },
            {
                "category": "Antihistamines",
                "items": ["Diphenhydramine (Benadryl)", "Loratadine (Claritin)", "Cetirizine (Zyrtec)"],
                "description": "Systemic relief for itching and allergic reactions. Sedating options help with sleep."
            },
            {
                "category": "Antiparasitic Agents",
                "items": ["Permethrin 5% cream (scabies)", "Benzyl benzoate", "Ivermectin (oral)", "Lindane (second-line)"],
                "description": "Kill parasitic organisms causing infestations. Requires prescription and specific application instructions."
            },
            {
                "category": "Secondary Infection Prevention",
                "items": ["Mupirocin (Bactroban)", "Bacitracin", "Neosporin", "Oral antibiotics if infected"],
                "description": "Prevent or treat bacterial infection from scratching. Apply to broken skin."
            },
            {
                "category": "Elimination of Causative Organisms",
                "items": ["Lice combs", "Environmental sprays", "Washing bedding in hot water", "Vacuuming", "Freezing items"],
                "description": "Remove pests from environment and prevent reinfestation. Treat household contacts simultaneously."
            }
        ],
        "general_advice": [
            "Avoid scratching - can lead to secondary bacterial infection",
            "Apply cold compresses to reduce itching and swelling",
            "For scabies/lice, treat all household members and close contacts simultaneously",
            "Wash all bedding, clothing, and towels in hot water (130°F/54°C) and dry on high heat",
            "Vacuum carpets, furniture, and mattresses thoroughly",
            "Items that can't be washed can be sealed in plastic bags for 2 weeks",
            "Use insect repellent with DEET or picaridin when outdoors"
        ]
    },
    "Moles": {
        "description": "Growths on the skin, usually brown or black. Most are benign but should be monitored for changes.",
        "medications": [
            {
                "category": "Observation and Monitoring",
                "items": ["Regular self-exams", "ABCDE criteria tracking", "Monthly checks", "Baseline photography"],
                "description": "Monitor for changes in size, shape, color, or symptoms. Document with photos."
            },
            {
                "category": "Medical Evaluation",
                "items": ["Dermatoscopy (dermoscopy)", "Total body skin examination", "Sequential digital dermoscopy"],
                "description": "Professional assessment of suspicious moles using specialized magnification."
            },
            {
                "category": "Surgical Removal",
                "items": ["Excision with stitches", "Shave removal", "Punch excision"],
                "description": "For suspicious moles, irritated moles, or cosmetic concerns. Usually outpatient procedure."
            },
            {
                "category": "Biopsy and Histologic Examination",
                "items": ["Punch biopsy", "Excisional biopsy", "Shave biopsy", "Incisional biopsy"],
                "description": "Tissue sampling for microscopic examination to rule out malignancy."
            },
            {
                "category": "Least Invasive Management",
                "items": ["Leave in place", "Monitor with photography", "Regular surveillance"],
                "description": "Appropriate for benign-appearing, stable, symmetrical moles with no concerning features."
            }
        ],
        "general_advice": [
            "Follow ABCDE rule: Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolution over time",
            "Protect moles from sun exposure with sunscreen and clothing",
            "Perform monthly self-examination of all skin areas including back and scalp",
            "Use a mirror or ask someone to help examine hard-to-see areas",
            "See dermatologist for any new, changing, or symptomatic moles",
            "Not all moles need removal - only suspicious, symptomatic, or cosmetically concerning ones",
            "Take baseline photos and date them for future comparison"
        ]
    },
    "Psoriasis": {
        "description": "Skin disease that causes red, itchy scaly patches, commonly on knees, elbows, and scalp. Autoimmune condition.",
        "medications": [
            {
                "category": "Topical Corticosteroids",
                "items": ["Betamethasone", "Clobetasol", "Triamcinolone", "Fluocinonide", "Hydrocortisone (mild cases)"],
                "description": "Reduce inflammation and slow skin cell turnover. Different potencies for different body areas."
            },
            {
                "category": "Vitamin D Analogues",
                "items": ["Calcipotriene (Dovonex)", "Calcitriol", "Tacalcitol"],
                "description": "Slow skin cell growth and normalize skin development. Often combined with steroids."
            },
            {
                "category": "Phototherapy (Ultraviolet Light Therapy)",
                "items": ["UVB narrowband", "PUVA (psoralen + UVA)", "Excimer laser", "Home UVB units"],
                "description": "Light therapy for widespread or resistant psoriasis. 2-3 times weekly treatments."
            },
            {
                "category": "Systemic Anti-Inflammatory and Immune Modulators",
                "items": ["Methotrexate", "Cyclosporine", "Apremilast (Otezla)", "Acitretin"],
                "description": "Oral medications for moderate to severe cases. Requires regular blood test monitoring."
            },
            {
                "category": "Biologics",
                "items": ["Adalimumab (Humira)", "Etanercept (Enbrel)", "Ustekinumab (Stelara)", "Secukinumab (Cosentyx)", "Ixekizumab (Taltz)"],
                "description": "Targeted immune modulators for severe disease. Self-injected or IV infusions."
            },
            {
                "category": "Combination Therapy",
                "items": ["Topical + phototherapy", "Topical + systemic", "Systemic + biologic"],
                "description": "Multiple approaches for better control with lower doses of individual medications."
            }
        ],
        "general_advice": [
            "Keep skin well-moisturized with thick creams and ointments",
            "Identify and avoid triggers (stress, infection, certain medications, skin injuries)",
            "Take lukewarm baths with Epsom salts, Dead Sea salts, or colloidal oatmeal",
            "Limited sun exposure can help (5-10 minutes) but avoid sunburn",
            "Manage stress through relaxation techniques, exercise, or counseling",
            "Avoid alcohol which can worsen psoriasis and interfere with treatments",
            "Don't pick at scales - this can cause new lesions (Koebner phenomenon)"
        ]
    },
    "Rosacea": {
        "description": "Chronic skin condition that causes redness and visible blood vessels on the face. Often includes papules and pustules.",
        "medications": [
            {
                "category": "Topical Anti-Inflammatory Agents",
                "items": ["Metronidazole cream/gel (0.75-1%)", "Azelaic acid (15-20%)", "Ivermectin cream (1%)"],
                "description": "Reduce redness and inflammatory lesions. Apply once or twice daily."
            },
            {
                "category": "Oral Antibiotics (Anti-Inflammatory Doses)",
                "items": ["Doxycycline (40mg modified-release)", "Minocycline", "Tetracycline"],
                "description": "Anti-inflammatory doses (not antibacterial) for moderate rosacea."
            },
            {
                "category": "Vascular Modulators and Redness-Reducing Agents",
                "items": ["Brimonidine gel (Mirvaso)", "Oxymetazoline cream (Rhofade)"],
                "description": "Temporarily reduce facial redness by constricting blood vessels. Effects last 8-12 hours."
            },
            {
                "category": "Avoidance of Triggers and Gentle Skin Care",
                "items": ["Identify personal triggers", "Fragrance-free products", "Non-irritating cleansers"],
                "description": "Common triggers: sun, stress, spicy foods, alcohol, hot beverages, extreme temperatures"
            },
            {
                "category": "Sun Protection",
                "items": ["Broad-spectrum SPF 30+", "Mineral sunscreens (zinc oxide, titanium dioxide)"],
                "description": "Essential for preventing flares and reducing redness. Apply daily regardless of weather."
            },
            {
                "category": "Adjunctive Supportive Care",
                "items": ["Intense Pulsed Light (IPL)", "Laser therapy", "Electrocautery"],
                "description": "Reduce visible blood vessels and persistent redness. Multiple sessions needed."
            }
        ],
        "general_advice": [
            "Use gentle, fragrance-free, non-comedogenic skincare products",
            "Apply sunscreen every day, even indoors and during winter",
            "Avoid hot showers, saunas, steam rooms, and overheating",
            "Keep a trigger diary to identify and avoid personal triggers",
            "Be gentle with your skin - no harsh scrubbing or exfoliating",
            "Use lukewarm water for washing face",
            "Protect face from cold wind with scarf",
            "Choose cosmetics labeled 'non-comedogenic' and 'hypoallergenic'"
        ]
    },
    "Sun_Sunlight_Damage": {
        "description": "Skin damage caused by prolonged sun exposure including sunburn, photoaging, and actinic damage.",
        "medications": [
            {
                "category": "Skin Soothing and Hydration After UV Exposure",
                "items": ["Aloe vera gel", "Cool compresses", "Fragrance-free moisturizers", "After-sun products"],
                "description": "Immediate relief for acute sunburn. Apply liberally and reapply frequently."
            },
            {
                "category": "Anti-Inflammatory Medications",
                "items": ["Hydrocortisone cream 1%", "Over-the-counter hydrocortisone"],
                "description": "Reduce inflammation and redness from sunburn. Use for 2-3 days only."
            },
            {
                "category": "Systemic Anti-Inflammatory Support",
                "items": ["Ibuprofen (Advil)", "Naproxen (Aleve)", "Aspirin"],
                "description": "Reduce pain and inflammation from severe sunburn. Start as soon as possible after burn."
            },
            {
                "category": "Barrier Repair and Skin Protection",
                "items": ["Ceramide creams", "Petroleum jelly", "Aquaphor", "Cicaplast"],
                "description": "Restore damaged skin barrier during healing phase."
            },
            {
                "category": "Sun Protection to Prevent Further Damage",
                "items": ["SPF 30-50+ broad spectrum", "UPF clothing", "Wide-brimmed hats", "Sunglasses", "Sun-protective swimwear"],
                "description": "Prevent further damage. Reapply every 2 hours and after swimming/sweating."
            },
            {
                "category": "Monitoring and Medical Evaluation",
                "items": ["Regular skin checks", "Dermatology referral for persistent changes"],
                "description": "Evaluate persistent redness, texture changes, or concerning lesions."
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
            "Regular self-exams for any new or changing spots from cumulative sun damage"
        ]
    },
    "Vitiligo": {
        "description": "Condition where skin loses its pigment cells (melanocytes), resulting in white patches on the skin.",
        "medications": [
            {
                "category": "Topical Corticosteroids",
                "items": ["Potent corticosteroids (clobetasol, betamethasone)", "Mometasone"],
                "description": "First-line treatment for localized vitiligo. Use intermittently to prevent side effects."
            },
            {
                "category": "Topical Calcineurin Inhibitors",
                "items": ["Tacrolimus (Protopic)", "Pimecrolimus (Elidel)"],
                "description": "Especially for face and sensitive areas. Fewer side effects than steroids."
            },
            {
                "category": "Phototherapy (Ultraviolet B Light)",
                "items": ["Narrowband UVB", "Excimer laser (308nm)", "PUVA"],
                "description": "Most effective for widespread vitiligo. Requires 2-3 treatments weekly for months."
            },
            {
                "category": "Systemic Therapies",
                "items": ["Oral corticosteroids (short-term)", "JAK inhibitors (ruxolitinib cream)", "Minocycline"],
                "description": "For rapidly progressive or extensive disease. Newer treatments show promise."
            },
            {
                "category": "Depigmentation",
                "items": ["Monobenzone cream", "Hydroquinone"],
                "description": "Option for extensive vitiligo (>50% body surface) to achieve uniform skin tone. Permanent."
            },
            {
                "category": "Sun Protection and Cosmetic Support",
                "items": ["Broad-spectrum SPF 50+", "Camouflage makeup", "Self-tanners", "Dyes"],
                "description": "Protect depigmented skin from sunburn. Cosmetic options for appearance."
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
            "Consider vitamin D supplementation as sun avoidance limits natural vitamin D production"
        ]
    },
    "Warts": {
        "description": "Small, rough growths on the skin caused by human papillomavirus (HPV). Common on hands, feet, and face.",
        "medications": [
            {
                "category": "Keratolytic Agents",
                "items": ["Salicylic acid (liquid, gel, pads - 17-40%)", "Lactic acid", "Urea"],
                "description": "Peel away layers of the wart gradually. Apply daily, file dead skin between treatments."
            },
            {
                "category": "Immune Response Modulators",
                "items": ["Imiquimod cream (Aldara 5%)"],
                "description": "Stimulate body's immune system to fight the virus. Prescription only."
            },
            {
                "category": "Physical/Destructive Techniques",
                "items": ["Cryotherapy (liquid nitrogen)", "Cantharidin", "Electrosurgery", "Laser therapy", "Curettage"],
                "description": "In-office procedures to destroy wart tissue. Multiple sessions often needed."
            },
            {
                "category": "Duct Tape and Occlusion Strategies",
                "items": ["Duct tape", "Medical tape", "Apple cider vinegar (home remedy)"],
                "description": "Adjunctive therapy - may stimulate immune response. Change every few days."
            },
            {
                "category": "Secondary Infection Prevention",
                "items": ["Keep clean and dry", "Avoid picking", "Cover with waterproof bandage"],
                "description": "Prevent spread to other areas of body or to other people."
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
            "Be patient - many warts eventually resolve on their own but treatment speeds resolution"
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
        "general_advice": ["Please consult a dermatologist for specific treatment recommendations."]
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
                "warning": "Medium confidence - please consult a doctor for confirmation",
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
                "warning": "Medium confidence - please consult a doctor for confirmation",
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
# NEW: SAVE ANALYSIS TO HISTORY ENDPOINT
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
        "history_enabled": True
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