import mongoose from 'mongoose';

const reflectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'voice'], required: true },
  content: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  transcript: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Reflection', reflectionSchema);
