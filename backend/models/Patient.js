const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  height: {
    type: Number,
    min: [50, 'Height must be at least 50 cm'],
    max: [300, 'Height cannot exceed 300 cm']
  },
  weight: {
    type: Number,
    min: [10, 'Weight must be at least 10 kg'],
    max: [500, 'Weight cannot exceed 500 kg']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  allergies: [{
    type: String,
    trim: true
  }],
  medicalIssues: [{
    type: String,
    trim: true
  }],
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    relationship: {
      type: String,
      trim: true
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expires: Date
  },
  lastLogin: {
    type: Date
  },
  profilePicture: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Generate unique Patient ID (6 digits)
patientSchema.statics.generatePatientId = function() {
  const prefix = 'PAT';
  // Generate 6-digit number (100000 to 999999)
  const randomNum = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}${randomNum}`;
};

// Generate OTP
patientSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expires: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  return otp;
};

// Verify OTP
patientSchema.methods.verifyOTP = function(otp) {
  if (!this.otp || !this.otp.code || !this.otp.expires) {
    return false;
  }
  
  if (new Date() > this.otp.expires) {
    return false;
  }
  
  return this.otp.code === otp;
};

// Clear OTP after successful verification
patientSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

// Update last login
patientSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
};

// Virtual for age calculation
patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Ensure virtual fields are serialized
patientSchema.set('toJSON', { virtuals: true });

// Index for better query performance
patientSchema.index({ patientId: 1 });
patientSchema.index({ email: 1 });
patientSchema.index({ phone: 1 });

module.exports = mongoose.model('Patient', patientSchema);
