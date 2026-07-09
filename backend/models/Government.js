const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const governmentSchema = new mongoose.Schema({
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
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Health Ministry', 'Statistics Ministry', 'Planning Ministry', 'Research Ministry', 'Public Health Department'],
    trim: true
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true,
    maxlength: [100, 'Designation cannot exceed 100 characters']
  },
  accessLevel: {
    type: String,
    required: true,
    enum: ['View Only', 'Analytics', 'Full Access'],
    default: 'View Only'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
governmentSchema.pre('save', async function(next) {
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
governmentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
governmentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Government', governmentSchema);














