import mongoose from 'mongoose';

const generateRandomHexColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  avatarColor: { type: String, default: generateRandomHexColor },
  bio: { type: String, default: '' },
  token: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  subscriberCount: { type: Number, default: 0 },
  subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

export default User;