import mongoose from 'mongoose';

const userPreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  preferredActivities: [{
    type: String,
    enum: [
      'relaxation',
      'exercise',
      'music',
      'games',
      'journaling',
      'breathing',
      'breathing_exercises',
      'social',
      'social_activities',
    ],
  }],
  updatedAt: { type: Date, default: Date.now },
});

userPreferenceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('UserPreference', userPreferenceSchema);
