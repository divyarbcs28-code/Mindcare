import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  insightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Insight' },
  recommendation: { type: String, required: true },
  reasonText: { type: String, required: true },
  recommendationId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Recommendation', recommendationSchema);
