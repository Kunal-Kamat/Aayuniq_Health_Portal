const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    ref: 'Patient',
    index: true
  },
  doctorId: {
    type: String,
    required: true,
    ref: 'Doctor',
    index: true
  },
  visitDate: {
    type: Date,
    required: [true, 'Visit date is required'],
    default: Date.now
  },
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    maxlength: [100, 'Doctor name cannot exceed 100 characters']
  },
  doctorSpecialty: {
    type: String,
    trim: true,
    maxlength: [100, 'Specialty cannot exceed 100 characters']
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true,
    maxlength: [500, 'Diagnosis cannot exceed 500 characters']
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  treatment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Treatment notes cannot exceed 1000 characters']
  },
  medications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      trim: true
    },
    frequency: {
      type: String,
      trim: true
    },
    duration: {
      type: String,
      trim: true
    }
  }],
  vitalSigns: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: {
      type: Number,
      min: [30, 'Heart rate must be at least 30 bpm'],
      max: [200, 'Heart rate cannot exceed 200 bpm']
    },
    temperature: {
      type: Number,
      min: [95, 'Temperature must be at least 95°F'],
      max: [110, 'Temperature cannot exceed 110°F']
    },
    weight: {
      type: Number,
      min: [10, 'Weight must be at least 10 kg'],
      max: [500, 'Weight cannot exceed 500 kg']
    },
    height: {
      type: Number,
      min: [50, 'Height must be at least 50 cm'],
      max: [300, 'Height cannot exceed 300 cm']
    }
  },
  labResults: [{
    testName: {
      type: String,
      required: true,
      trim: true
    },
    result: {
      type: String,
      required: true,
      trim: true
    },
    normalRange: {
      type: String,
      trim: true
    },
    unit: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  attachments: [{
    fileName: String,
    fileType: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
medicalRecordSchema.index({ patientId: 1, visitDate: -1 });
medicalRecordSchema.index({ visitDate: -1 });
medicalRecordSchema.index({ doctorName: 1 });

// Virtual for BMI calculation
medicalRecordSchema.virtual('bmi').get(function() {
  if (!this.vitalSigns.weight || !this.vitalSigns.height) return null;
  const heightInMeters = this.vitalSigns.height / 100;
  return (this.vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(1);
});

// Ensure virtual fields are serialized
medicalRecordSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
