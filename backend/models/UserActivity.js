import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  activityId: { type: String, required: true },
  mood: { type: String, required: true },
  status: { type: String, enum: ['recommended', 'in_progress', 'completed', 'skipped'], default: 'recommended', required: true },
  recommendedAt: { type: Date, default: Date.now },
  startedAt: Date,
  completedAt: Date,
  durationMinutes: { type: Number, min: 0, max: 240, default: 0 },
}, { timestamps: true });
userActivitySchema.index({ userId: 1, activityId: 1, status: 1, recommendedAt: -1 });
export default mongoose.model('UserActivity', userActivitySchema);
