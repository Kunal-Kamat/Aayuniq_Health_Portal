const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const doctorSchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  hospital: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  qualifications: [{
    type: String,
    trim: true
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
doctorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
doctorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP method
doctorSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

// Verify OTP method
doctorSchema.methods.verifyOTP = function(otp) {
  if (!this.otp || !this.otpExpires) {
    return false;
  }
  
  if (new Date() > this.otpExpires) {
    return false;
  }
  
  return this.otp === otp;
};

// Clear OTP method
doctorSchema.methods.clearOTP = function() {
  this.otp = null;
  this.otpExpires = null;
};

// Update last login method
doctorSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
};

// Generate JWT token method
doctorSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { doctorId: this.doctorId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Remove password from JSON output
doctorSchema.methods.toJSON = function() {
  const doctor = this.toObject();
  delete doctor.password;
  delete doctor.otp;
  delete doctor.otpExpires;
  return doctor;
};

module.exports = mongoose.model('Doctor', doctorSchema);
