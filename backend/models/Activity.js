import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['relaxation', 'exercise', 'music', 'games', 'journaling', 'breathing_exercises', 'social_activities'],
    required: true,
  },
  description: { type: String, default: '' },
});

export default mongoose.model('Activity', activitySchema);
