import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import historyRoutes from "./routes/history.js";
import faceRoutes from "./routes/face.js"; // This will work now

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use("/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/face", faceRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "🧴 Skincare Analyzer API is running!" });
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));