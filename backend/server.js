import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import historyRoutes from "./routes/history.js"; // Add this import

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use("/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/history", historyRoutes); // Add this line

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));