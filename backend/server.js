import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import historyRoutes from "./routes/history.js";
import faceRoutes from "./routes/face.js";
import uploadRoutes from './routes/upload.js';
import testCloudinaryRoutes from "./routes/test-cloudinary.js";

dotenv.config();
const app = express();

// Enhanced CORS configuration for mobile apps
const corsOptions = {
  origin: '*',  // Allow all origins for mobile app
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'X-Requested-With',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours cache for preflight requests
};

// Apply CORS middleware - this handles all OPTIONS requests automatically
app.use(cors(corsOptions));

// REMOVE THIS LINE - it's causing the error
// app.options('/*', cors(corsOptions));

// Add security headers
app.use((req, res, next) => {
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // These headers are redundant if you're using cors middleware
  // res.setHeader('Access-Control-Allow-Origin', '*');
  // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware (helpful for debugging)
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/face", faceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/test', testCloudinaryRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Skincare Analyzer API is running!",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "node-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log("✅ MongoDB connected successfully");
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1); // Exit if database fails to connect
});

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📱 Accepting connections from all origins`);
});