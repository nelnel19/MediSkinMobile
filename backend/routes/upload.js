import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload skin analysis image
router.post("/skin-analysis", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    console.log("Uploading skin analysis image to Cloudinary...");
    console.log("File size:", req.file.size);
    console.log("File mimetype:", req.file.mimetype);

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    
    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataURI, {
      folder: "mediskin/skin-analysis",
      transformation: [
        { width: 800, height: 800, crop: "limit" },
        { quality: "auto" },
        { format: "jpg" }
      ]
    });

    console.log("✅ Skin analysis image uploaded successfully:", uploadResult.secure_url);

    res.json({
      success: true,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      message: "Image uploaded successfully"
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Image upload failed: " + error.message
    });
  }
});

export default router;