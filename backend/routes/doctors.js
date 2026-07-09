const express = require('express');
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const doctorAuth = require('../middleware/doctorAuth');

const router = express.Router();

// @route   GET /api/doctors/profile
// @desc    Get doctor profile
// @access  Private (Doctor)
router.get('/profile', doctorAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.doctorId }).select('-password -otp');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: { doctor }
    });

  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor profile'
    });
  }
});

// @route   PUT /api/doctors/profile
// @desc    Update doctor profile
// @access  Private (Doctor)
router.put('/profile', [
  doctorAuth,
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Please provide a valid phone number'),
  body('specialization').optional().trim().notEmpty().withMessage('Specialization is required'),
  body('hospital').optional().trim().notEmpty().withMessage('Hospital name is required'),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a non-negative number'),
  body('qualifications').optional().isArray().withMessage('Qualifications must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name,
      phone,
      specialization,
      hospital,
      experience,
      qualifications
    } = req.body;

    const doctor = await Doctor.findOne({ doctorId: req.doctorId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check if phone number is already taken by another doctor
    if (phone && phone !== doctor.phone) {
      const existingDoctor = await Doctor.findOne({ phone, doctorId: { $ne: req.doctorId } });
      if (existingDoctor) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already in use by another doctor'
        });
      }
    }

    // Update fields
    if (name) doctor.name = name;
    if (phone) doctor.phone = phone;
    if (specialization) doctor.specialization = specialization;
    if (hospital) doctor.hospital = hospital;
    if (experience !== undefined) doctor.experience = experience;
    if (qualifications) doctor.qualifications = qualifications;

    await doctor.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { doctor }
    });

  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   POST /api/doctors/patients
// @desc    Add medical record for existing patient by patient ID
// @access  Private (Doctor)
router.post('/patients', [
  doctorAuth,
  body('patientId').trim().notEmpty().withMessage('Patient ID is required')
    .matches(/^PAT[0-9]{6}$/).withMessage('Patient ID must be in format PAT123456 (PAT followed by 6 digits)'),
  body('visitDate').isISO8601().withMessage('Please provide a valid visit date'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('treatment').optional().trim(),
  body('symptoms').isArray().withMessage('Symptoms must be an array'),
  body('medications').optional().isArray().withMessage('Medications must be an array'),
  body('vitalSigns').optional().isObject().withMessage('Vital signs must be an object'),
  body('labResults').optional().isArray().withMessage('Lab results must be an array'),
  body('notes').optional().trim(),
  body('followUpRequired').optional().isBoolean().withMessage('Follow up required must be boolean'),
  body('followUpDate').optional().isISO8601().withMessage('Please provide a valid follow-up date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { patientId } = req.body;

    // Check if patient exists
    const patient = await Patient.findOne({ 
      patientId, 
      isVerified: true 
    }).select('-otp -otpExpires');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found with the provided Patient ID'
      });
    }

    // Get doctor details
    const doctor = await Doctor.findOne({ doctorId: req.doctorId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Create medical record
    const medicalRecord = new MedicalRecord({
      patientId,
      doctorId: req.doctorId,
      visitDate: req.body.visitDate,
      diagnosis: req.body.diagnosis,
      treatment: req.body.treatment,
      symptoms: req.body.symptoms || [],
      medications: req.body.medications || [],
      vitalSigns: req.body.vitalSigns,
      labResults: req.body.labResults || [],
      notes: req.body.notes,
      followUpRequired: req.body.followUpRequired || false,
      followUpDate: req.body.followUpDate,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialization
    });

    await medicalRecord.save();

    res.status(201).json({
      success: true,
      message: 'Medical record added successfully',
      data: { 
        patient,
        medicalRecord 
      }
    });

  } catch (error) {
    console.error('Add medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding medical record'
    });
  }
});

// @route   GET /api/doctors/patients
// @desc    Get patients assigned to this doctor (patients with medical records)
// @access  Private (Doctor)
router.get('/patients', doctorAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get patients that have medical records with this doctor
    const medicalRecords = await MedicalRecord.find({ doctorId: req.doctorId })
      .select('patientId')
      .distinct('patientId');

    // Get patient details for those patient IDs
    const patients = await Patient.find({ 
      patientId: { $in: medicalRecords },
      isVerified: true 
    })
      .select('-otp -otpExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Patient.countDocuments({ 
      patientId: { $in: medicalRecords },
      isVerified: true 
    });

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPatients: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patients'
    });
  }
});

// @route   GET /api/doctors/patients/search
// @desc    Search for patients by Patient ID (for adding medical records)
// @access  Private (Doctor)
router.get('/patients/search', doctorAuth, async (req, res) => {
  try {
    const { patientId } = req.query;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required for search'
      });
    }

    // Search for patient by Patient ID
    const patient = await Patient.findOne({ 
      patientId,
      isVerified: true 
    }).select('-otp -otpExpires');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found with the provided Patient ID'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });

  } catch (error) {
    console.error('Search patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching for patient'
    });
  }
});

// @route   GET /api/doctors/patients/:patientId
// @desc    Get specific patient details
// @access  Private (Doctor)
router.get('/patients/:patientId', doctorAuth, async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findOne({ patientId, isVerified: true })
      .select('-otp -otpExpires');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get patient's medical records
    const medicalRecords = await MedicalRecord.find({ patientId })
      .sort({ date: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        patient,
        medicalRecords
      }
    });

  } catch (error) {
    console.error('Get patient details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient details'
    });
  }
});

// @route   POST /api/doctors/patients/:patientId/medical-records
// @desc    Add medical record for a patient
// @access  Private (Doctor)
router.post('/patients/:patientId/medical-records', [
  doctorAuth,
  body('date').isISO8601().withMessage('Please provide a valid date'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('treatment').trim().notEmpty().withMessage('Treatment is required'),
  body('notes').optional().trim(),
  body('prescription').optional().isArray().withMessage('Prescription must be an array'),
  body('followUpDate').optional().isISO8601().withMessage('Please provide a valid follow-up date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { patientId } = req.params;
    const {
      date,
      diagnosis,
      treatment,
      notes,
      prescription = [],
      followUpDate
    } = req.body;

    // Check if patient exists
    const patient = await Patient.findOne({ patientId, isVerified: true });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Create medical record
    const medicalRecord = new MedicalRecord({
      patientId,
      doctorId: req.doctorId,
      date,
      diagnosis,
      treatment,
      notes,
      prescription,
      followUpDate
    });

    await medicalRecord.save();

    res.status(201).json({
      success: true,
      message: 'Medical record added successfully',
      data: { medicalRecord }
    });

  } catch (error) {
    console.error('Add medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding medical record'
    });
  }
});

// @route   GET /api/doctors/patients/:patientId/medical-records
// @desc    Get medical records for a specific patient
// @access  Private (Doctor)
router.get('/patients/:patientId/medical-records', doctorAuth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if patient exists
    const patient = await Patient.findOne({ patientId, isVerified: true });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const medicalRecords = await MedicalRecord.find({ patientId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MedicalRecord.countDocuments({ patientId });

    res.json({
      success: true,
      data: {
        medicalRecords,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medical records'
    });
  }
});

// @route   GET /api/doctors/dashboard
// @desc    Get doctor dashboard statistics
// @access  Private (Doctor)
router.get('/dashboard', doctorAuth, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ doctorId: req.doctorId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get statistics
    const totalPatients = await Patient.countDocuments({ isVerified: true });
    const totalMedicalRecords = await MedicalRecord.countDocuments({ doctorId: req.doctorId });
    
    // Get recent medical records
    const recentRecords = await MedicalRecord.find({ doctorId: req.doctorId })
      .sort({ visitDate: -1 })
      .limit(5);

    // Manually populate patient data
    const populatedRecords = await Promise.all(
      recentRecords.map(async (record) => {
        const patient = await Patient.findOne({ patientId: record.patientId }).select('name patientId');
        return {
          ...record.toObject(),
          patientId: patient ? { name: patient.name, patientId: patient.patientId } : null
        };
      })
    );

    // Get patients with recent visits (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPatients = await MedicalRecord.find({
      doctorId: req.doctorId,
      visitDate: { $gte: thirtyDaysAgo }
    })
    .distinct('patientId');

    res.json({
      success: true,
      data: {
        doctor: {
          name: doctor.name,
          specialization: doctor.specialization,
          hospital: doctor.hospital,
          experience: doctor.experience
        },
        statistics: {
          totalPatients,
          totalMedicalRecords,
          recentPatientsCount: recentPatients.length
        },
        recentRecords: populatedRecords
      }
    });

  } catch (error) {
    console.error('Get doctor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

module.exports = router;
