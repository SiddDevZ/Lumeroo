import mongoose from 'mongoose'

const pendingPasswordResetSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    unique: true
  },
  otp: { 
    type: String, 
    required: true 
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 3600
  }
})

const PendingPasswordReset = mongoose.model('PendingPasswordReset', pendingPasswordResetSchema)

export default PendingPasswordReset