import mongoose from 'mongoose';

export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

export const generateRandomSuffix = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const ImageSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  slug:         { type: String, required: true, unique: true, trim: true },
  imageUrls:    { 
    type: [String], 
    required: true, 
    validate: [arr => arr.length > 0, 'At least one image URL is required'] 
  },
  thumbnailIndex: { 
    type: Number, 
    default: 0, 
    validate: {
      validator(value) { return value >= 0 && value < this.imageUrls.length; },
      message: props => `${props.value} is not a valid index for the imageUrls array`
    }
  },
  uploader:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadDate:   { type: Date, default: Date.now },
  views:        { type: Number, default: 0 },
  likedBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags:         { type: [String], default: [] },
  hotness:      { type: Number, default: 0, index: true },
}, { timestamps: true });


ImageSchema.methods.calculateHotness = function() {
  const up    = this.likedBy.length;
  const down  = this.dislikedBy.length;
  const views = this.views;
  const net   = up - down + views * 0.01;

  const order = Math.log10(Math.abs(net) + 1);
  const sign  = net >= 0 ? 1 : -1;

  const t0  = Math.floor(this.uploadDate.getTime() / 1000);
  const now = Math.floor(Date.now() / 1000);
  const dt  = now - t0;

  const decay = Math.log10(dt + 1) / 8;

  return sign * order - decay;
};

ImageSchema.pre('save', function(next) {
  if (
    this.isNew ||
    this.isModified('views') ||
    this.isModified('likedBy') ||
    this.isModified('dislikedBy')
  ) {
    this.hotness = this.calculateHotness();
  }
  next();
});

ImageSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  const fresh = await this.model.findById(doc._id);
  if (!fresh) return;
  fresh.hotness = fresh.calculateHotness();
  await fresh.save();
});

ImageSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'contentId',
  match: { contentType: 'image' }
});

ImageSchema.set('toJSON', { virtuals: true });
ImageSchema.set('toObject', { virtuals: true });

ImageSchema.index({ title: 'text', description: 'text', tags: 'text' });
ImageSchema.index({ uploader: 1 });
ImageSchema.index({ views: -1 });
ImageSchema.index({ uploadDate: -1 });
ImageSchema.index({ hotness: -1 });

const Image = mongoose.model('Image', ImageSchema);

export default Image;