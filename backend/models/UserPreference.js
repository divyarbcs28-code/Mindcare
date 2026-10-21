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
      'breathing_exercises',
      'social_activities',
    ],
  }],
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('UserPreference', userPreferenceSchema);
