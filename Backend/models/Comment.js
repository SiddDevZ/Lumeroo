import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'contentType' },
  contentType: { type: String, enum: ['video', 'image'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [ReplySchema],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });


CommentSchema.index({ contentType: 1, contentId: 1 });
CommentSchema.index({ user: 1 });
CommentSchema.index({ likedBy: -1 });

const Comment = mongoose.model('Comment', CommentSchema);

export default Comment;
