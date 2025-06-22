import mongoose from 'mongoose';

const PendingUserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 }
});

PendingUserSchema.index({ email: 1 }, { unique: true });
PendingUserSchema.index({ username: 1 }, { unique: true });

const PendingUser = mongoose.model('PendingUser', PendingUserSchema);

export default PendingUser;