import express from "express";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// Test Cloudinary connection
router.get("/test-cloudinary", async (req, res) => {
  try {
    console.log("Testing Cloudinary connection...");
    console.log("Cloudinary config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
    });

    // Test the connection by getting account info
    const pingResult = await cloudinary.api.ping();
    console.log("Cloudinary ping result:", pingResult);
    
    // Try to upload a test image
    const testUpload = await cloudinary.uploader.upload(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      {
        folder: "test",
        public_id: "test-image",
        overwrite: true
      }
    );

    console.log("Test upload successful:", testUpload.secure_url);

    res.json({
      success: true,
      message: "Cloudinary connection successful",
      ping: pingResult,
      testUpload: {
        url: testUpload.secure_url,
        publicId: testUpload.public_id
      },
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
      }
    });

  } catch (error) {
    console.error("Cloudinary test error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.toString(),
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
      }
    });
  }
});

export default router;