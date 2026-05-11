import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  imageHash: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true // Cloudinary URL
  },
  // Store the complete analysis result from any face/skin analysis API
  analysisData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // These are optional - can be extracted from analysisData
  skinGrade: {
    type: String,
    required: false
  },
  overallCondition: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate analyses
historySchema.index({ userEmail: 1, imageHash: 1 }, { unique: true });

export default mongoose.model("History", historySchema);