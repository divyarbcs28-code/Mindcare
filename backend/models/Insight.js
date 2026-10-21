import mongoose from 'mongoose';

const insightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reflectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reflection', required: true },
  combinedLabel: { type: String, required: true },
  trendStatus: {
    type: String,
    enum: ['stable', 'improving', 'declining', 'needs_attention'],
    required: true,
  },
  insightId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Insight', insightSchema);
