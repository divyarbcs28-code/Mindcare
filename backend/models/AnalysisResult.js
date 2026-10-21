import mongoose from 'mongoose';

const analysisResultSchema = new mongoose.Schema({
  reflectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reflection', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  analysisType: { type: String, enum: ['text', 'voice', 'combined'], required: true },
  emotionCategory: { type: String, default: '' },
  confidenceScore: { type: Number, default: 0 },
  sentimentCategory: { type: String, default: '' },
  sentimentScore: { type: Number, default: 0 },
  original_text: { type: String, default: '' },
  english_text: { type: String, default: '' },
  detected_language: { type: String, default: '' },
  themeTags: [{ type: String }],
  acousticFeatures: {
    pitchVariation: Number,
    energy: Number,
    pauseDuration: Number,
  },
  deviationScore: { type: Number, default: 0 },
  resultId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('AnalysisResult', analysisResultSchema);
