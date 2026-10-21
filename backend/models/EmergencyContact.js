import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contactName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  relationship: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('EmergencyContact', emergencyContactSchema);
