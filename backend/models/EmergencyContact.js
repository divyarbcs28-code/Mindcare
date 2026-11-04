import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contactName: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  relationship: { type: String, default: 'Contact', trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

emergencyContactSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('EmergencyContact', emergencyContactSchema);
