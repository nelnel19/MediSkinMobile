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
  analysisData: {
    type: Object,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  skinGrade: {
    type: String,
    required: true
  },
  overallCondition: {
    type: String,
    required: true
  },
  analysisType: {
    type: String,
    default: "skin_analysis"
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
historySchema.index({ userEmail: 1, timestamp: -1 });
historySchema.index({ userEmail: 1, skinGrade: 1 });

export default mongoose.model("History", historySchema);