import mongoose from 'mongoose';

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const generateRandomSuffix = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const VideoSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  slug:         { type: String, unique: true },
  videoUrl:     { type: String, required: true },
  thumbnail:    { type: String, required: true },
  duration:     { type: Number, required: true },
  views:        { type: Number, default: 0 },
  uploader:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadDate:   { type: Date, default: Date.now },
  likedBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags:         { type: [String], default: [] },
  hotness:      { type: Number, default: 0, index: true },
  isProcessing: { type: Boolean, default: true },
}, { timestamps: true });

VideoSchema.methods.calculateHotness = function() {
  const up      = this.likedBy.length;
  const down    = this.dislikedBy.length;
  const views   = this.views;
  const net     = up - down + views * 0.01;

  const order   = Math.log10(Math.abs(net) + 1);
  const sign    = net >= 0 ? 1 : -1;

  const t0      = Math.floor(this.uploadDate.getTime() / 1000);
  const now     = Math.floor(Date.now() / 1000);
  const dt      = now - t0;

  const decay   = Math.log10(dt + 1) / 8;

  return sign * order - decay;
};

VideoSchema.pre('save', function(next) {
  if (this.isModified('views')
   || this.isModified('likedBy')
   || this.isModified('dislikedBy')
   || this.isNew) {
    this.hotness = this.calculateHotness();
  }
  next();
});

VideoSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  const fresh = await this.model.findById(doc._id);
  if (!fresh) return;
  fresh.hotness = fresh.calculateHotness();
  await fresh.save();
});

VideoSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'contentId',
  match: { contentType: 'video' }
});

VideoSchema.set('toJSON', { virtuals: true });
VideoSchema.set('toObject', { virtuals: true });

VideoSchema.index({ title: 'text', description: 'text', tags: 'text' });
VideoSchema.index({ uploader: 1 });
VideoSchema.index({ views: -1 });
VideoSchema.index({ uploadDate: -1 });
VideoSchema.index({ hotness: -1 });

const Video = mongoose.model('Video', VideoSchema);

export { generateSlug, generateRandomSuffix };
export default Video;