import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// REGISTER (updated to handle image)
router.post("/register", upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, password, age, birthday } = req.body;

    if (!name || !email || !password || !age || !birthday)
      return res.status(400).json({ message: "All fields are required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    
    let profileImage = {};
    
    // Upload profile image if provided
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: "mediskin/profiles",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto" },
          { format: "webp" }
        ]
      });
      
      profileImage = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url
      };
    }

    const user = new User({ 
      name, 
      email, 
      password: hashed, 
      age, 
      birthday,
      profileImage 
    });
    
    await user.save();

    res.json({ 
      message: "Registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        birthday: user.birthday,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN (restored from original)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ 
      message: "Login successful", 
      token, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        birthday: user.birthday,
        profileImage: user.profileImage
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE PROFILE (updated to handle image)
router.put("/update/:id", upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, password, age, birthday } = req.body;
    const updates = { name, email, age, birthday };

    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    // Handle profile image upload
    if (req.file) {
      const user = await User.findById(req.params.id);
      
      // Delete old image from Cloudinary if exists
      if (user.profileImage && user.profileImage.public_id) {
        await cloudinary.uploader.destroy(user.profileImage.public_id);
      }

      // Upload new image
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      
      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: "mediskin/profiles",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto" },
          { format: "webp" }
        ]
      });
      
      updates.profileImage = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ 
      message: "Profile updated successfully", 
      user: updatedUser 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET USER PROFILE
router.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;