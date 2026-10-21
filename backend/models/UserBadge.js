import mongoose from 'mongoose';

const userBadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
}, { timestamps: true });
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
export default mongoose.model('UserBadge', userBadgeSchema);
