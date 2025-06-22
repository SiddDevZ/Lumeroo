import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  reporter: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  contentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  contentType: { 
    type: String, 
    enum: ['video', 'image'], 
    required: true 
  },
  category: {
    type: String,
    required: true
  },
  details: {
    type: String,
    maxlength: 500,
    default: ''
  },
  contentSnapshot: {
    title: String,
    slug: String,
    uploaderUsername: String,
    uploadedAt: Date
  }
}, { timestamps: true });

ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ contentId: 1, contentType: 1 });
ReportSchema.index({ reporter: 1 });

ReportSchema.virtual('contentUrl').get(function() {
  return `/watch?v=${this.contentId}`;
});

ReportSchema.set('toJSON', { virtuals: true });
ReportSchema.set('toObject', { virtuals: true });

const Report = mongoose.model('Report', ReportSchema);

export default Report;