import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, default: '' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  dob: { type: Date },
  age: { type: Number },
  gender: {
    type: String,
    enum: ['female', 'male', 'non-binary', 'prefer-not-to-say', ''],
    default: '',
  },
  privacyPreferences: {
    analytics: { type: Boolean, default: false },
    personalization: { type: Boolean, default: false },
    emergencyAccess: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre('save', function nextUpdatedAt(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('User', userSchema);
