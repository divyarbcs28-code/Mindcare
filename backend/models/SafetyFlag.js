import mongoose from 'mongoose';

const safetyFlagSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tier: { type: String, enum: ['low', 'medium', 'high'], required: true },
  triggerReason: { type: String, required: true },
  flagId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('SafetyFlag', safetyFlagSchema);
