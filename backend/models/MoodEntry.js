import mongoose from 'mongoose';

const MoodEntrySchema = new mongoose.Schema(
  {
    mood: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('MoodEntry', MoodEntrySchema);
