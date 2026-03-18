from pymongo import MongoClient
import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
from datetime import datetime, timezone, timedelta
import logging
from bson import ObjectId

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Philippines timezone (UTC+8)
PH_TIMEZONE = timezone(timedelta(hours=8))

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
try:
    client = MongoClient(MONGO_URI)
    db = client["Mediskin"]
    skin_history_collection = db["skin_history"]
    # Create index for faster queries
    skin_history_collection.create_index("user_id")
    skin_history_collection.create_index("created_at")
    logger.info("✅ MongoDB connected successfully")
except Exception as e:
    logger.error(f"❌ MongoDB connection failed: {e}")
    raise

# Cloudinary configuration
try:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )
    logger.info("✅ Cloudinary configured successfully")
except Exception as e:
    logger.error(f"❌ Cloudinary configuration failed: {e}")
    raise

def get_ph_time():
    """Get current Philippines time (UTC+8) as a naive datetime"""
    # Get timezone-aware time
    aware_time = datetime.now(PH_TIMEZONE)
    # Convert to naive datetime by removing timezone info
    # This preserves the actual time (e.g., 2026-03-04 08:30:00) but without timezone
    naive_time = aware_time.replace(tzinfo=None)
    return naive_time

def save_skin_analysis_to_history(user_id, image_path, prediction_result):
    """
    Save skin analysis to MongoDB with Cloudinary image
    """
    try:
        logger.info(f"Saving skin analysis for user: {user_id}")
        
        # Get Philippines time as naive datetime
        ph_time = get_ph_time()
        
        # Log the time being saved
        logger.info(f"Philippines time to save: {ph_time.isoformat()}")
        
        # Upload image to Cloudinary with Philippines time in filename
        cloudinary_result = cloudinary.uploader.upload(
            image_path,
            folder="skin_analysis",
            public_id=f"skin_{user_id}_{ph_time.strftime('%Y%m%d_%H%M%S')}",
            resource_type="image"
        )
        
        logger.info(f"✅ Image uploaded to Cloudinary: {cloudinary_result['secure_url']}")
        
        # Create history document with Philippines time (naive datetime)
        history_entry = {
            "user_id": user_id,
            "image_url": cloudinary_result["secure_url"],
            "cloudinary_public_id": cloudinary_result["public_id"],
            "prediction": {
                "disease": prediction_result.get("disease"),
                "confidence": prediction_result.get("confidence"),
                "description": prediction_result.get("description"),
                "medication_info": prediction_result.get("medication_info"),
                "warning": prediction_result.get("warning"),
                "error": prediction_result.get("error"),
                "details": prediction_result.get("details")
            },
            "created_at": ph_time,  # Store as naive datetime (no timezone)
            "created_at_utc": datetime.now(timezone.utc).replace(tzinfo=None),  # Also store UTC for reference (as naive)
            "timezone": "Asia/Manila",
            "status": "completed" if not prediction_result.get("error") else "error"
        }
        
        # Save to MongoDB
        result = skin_history_collection.insert_one(history_entry)
        logger.info(f"✅ History saved to MongoDB with ID: {result.inserted_id}")
        logger.info(f"✅ Time saved (Philippines): {ph_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        return {
            "success": True,
            "history_id": str(result.inserted_id),
            "image_url": cloudinary_result["secure_url"]
        }
    except Exception as e:
        logger.error(f"❌ Error saving to history: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def get_user_skin_history(user_id, limit=20):
    """
    Get skin analysis history for a user
    """
    try:
        logger.info(f"Fetching history for user: {user_id}")
        
        history = skin_history_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(limit)
        
        result = []
        for item in history:
            # Get the created_at field (naive datetime in Philippines time)
            created_at = item["created_at"]
            
            # Convert to timestamp in milliseconds for frontend
            # Since created_at is already in Philippines time, we use it directly
            timestamp = int(created_at.timestamp() * 1000)
            
            # Log the time for debugging
            logger.info(f"Item created_at: {created_at.isoformat()} -> timestamp: {timestamp}")
            
            result.append({
                "id": str(item["_id"]),
                "image_url": item["image_url"],
                "prediction": item["prediction"],
                "created_at": timestamp,  # Send as timestamp in milliseconds
                "created_at_iso": created_at.isoformat(),  # Keep ISO for reference
                "created_at_display": created_at.strftime('%Y-%m-%d %H:%M:%S'),  # Add formatted string for debugging
                "timezone": item.get("timezone", "Asia/Manila"),
                "status": item.get("status", "completed")
            })
        
        logger.info(f"✅ Found {len(result)} history items")
        return result
    except Exception as e:
        logger.error(f"❌ Error fetching history: {e}")
        return []

def delete_skin_history_entry(history_id):
    """
    Delete a specific history entry and its image from Cloudinary
    """
    try:
        logger.info(f"Attempting to delete history entry: {history_id}")
        
        # First find the document to get Cloudinary public_id
        doc = skin_history_collection.find_one({"_id": ObjectId(history_id)})
        
        if not doc:
            logger.warning(f"❌ History entry {history_id} not found")
            return {
                "success": False, 
                "error": "Entry not found"
            }
        
        # Delete image from Cloudinary if it exists
        if "cloudinary_public_id" in doc and doc["cloudinary_public_id"]:
            try:
                cloudinary.uploader.destroy(doc["cloudinary_public_id"])
                logger.info(f"✅ Deleted image from Cloudinary: {doc['cloudinary_public_id']}")
            except Exception as e:
                logger.error(f"❌ Error deleting from Cloudinary: {e}")
                # Continue with MongoDB deletion even if Cloudinary fails
        
        # Delete from MongoDB
        result = skin_history_collection.delete_one({"_id": ObjectId(history_id)})
        
        if result.deleted_count > 0:
            logger.info(f"✅ Deleted history entry: {history_id}")
            return {"success": True}
        else:
            logger.warning(f"❌ Failed to delete history entry: {history_id}")
            return {"success": False, "error": "Entry not found"}
            
    except Exception as e:
        logger.error(f"❌ Error deleting history: {e}")
        return {"success": False, "error": str(e)}