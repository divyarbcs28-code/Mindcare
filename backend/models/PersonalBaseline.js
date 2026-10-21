import mongoose from 'mongoose';

const personalBaselineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollingFeatures: {
    avgPitchVariation: Number,
    avgEnergy: Number,
    avgPauseDuration: Number,
  },
  entryCount: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('PersonalBaseline', personalBaselineSchema);
