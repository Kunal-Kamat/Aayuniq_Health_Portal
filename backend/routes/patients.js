const express = require('express');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const auth = require('../middleware/auth');
const { generateHealthReportPDF } = require('../utils/pdfGenerator');

const router = express.Router();

// @route   GET /api/patients/profile
// @desc    Get patient profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.patientId }).select('-otp');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/patients/profile
// @desc    Update patient profile
// @access  Private
router.put('/profile', [
  auth,
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').optional().matches(/^\+?[\d\s-()]+$/).withMessage('Please provide a valid phone number'),
  body('height').optional().isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm'),
  body('weight').optional().isFloat({ min: 10, max: 500 }).withMessage('Weight must be between 10 and 500 kg'),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('allergies').optional().isArray().withMessage('Allergies must be an array'),
  body('medicalIssues').optional().isArray().withMessage('Medical issues must be an array')
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

    const allowedUpdates = [
      'name', 'email', 'phone', 'height', 'weight', 'bloodGroup', 
      'allergies', 'medicalIssues', 'emergencyContact'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Check if email or phone is being updated and if it's already taken
    if (updates.email || updates.phone) {
      const existingPatient = await Patient.findOne({
        $and: [
          { patientId: { $ne: req.patientId } },
          { $or: [
            ...(updates.email ? [{ email: updates.email }] : []),
            ...(updates.phone ? [{ phone: updates.phone }] : [])
          ]}
        ]
      });

      if (existingPatient) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone number already exists'
        });
      }
    }

    const patient = await Patient.findOneAndUpdate(
      { patientId: req.patientId },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-otp');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { patient }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   GET /api/patients/medical-records
// @desc    Get patient's medical records
// @access  Private
router.get('/medical-records', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const medicalRecords = await MedicalRecord.find({ 
      patientId: req.patientId,
      isActive: true 
    })
    .sort({ visitDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const totalRecords = await MedicalRecord.countDocuments({ 
      patientId: req.patientId,
      isActive: true 
    });

    res.json({
      success: true,
      data: {
        medicalRecords,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          hasNext: page < Math.ceil(totalRecords / limit),
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

// @route   GET /api/patients/medical-records/:recordId
// @desc    Get specific medical record
// @access  Private
router.get('/medical-records/:recordId', auth, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findOne({
      _id: req.params.recordId,
      patientId: req.patientId,
      isActive: true
    });

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    res.json({
      success: true,
      data: { medicalRecord }
    });

  } catch (error) {
    console.error('Get medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medical record'
    });
  }
});

// @route   GET /api/patients/health-summary
// @desc    Get patient's health summary
// @access  Private
router.get('/health-summary', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.patientId }).select('-otp');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get recent medical records
    const recentRecords = await MedicalRecord.find({ 
      patientId: req.patientId,
      isActive: true 
    })
    .sort({ visitDate: -1 })
    .limit(5)
    .select('visitDate doctorName diagnosis treatment')
    .lean();

    // Get total number of visits
    const totalVisits = await MedicalRecord.countDocuments({ 
      patientId: req.patientId,
      isActive: true 
    });

    // Get last visit date
    const lastVisit = await MedicalRecord.findOne({ 
      patientId: req.patientId,
      isActive: true 
    })
    .sort({ visitDate: -1 })
    .select('visitDate')
    .lean();

    // Calculate BMI if height and weight are available
    let bmi = null;
    if (patient.height && patient.weight) {
      const heightInMeters = patient.height / 100;
      bmi = (patient.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    res.json({
      success: true,
      data: {
        patient: {
          patientId: patient.patientId,
          name: patient.name,
          age: patient.age,
          height: patient.height,
          weight: patient.weight,
          bmi,
          bloodGroup: patient.bloodGroup,
          allergies: patient.allergies,
          medicalIssues: patient.medicalIssues
        },
        summary: {
          totalVisits,
          lastVisitDate: lastVisit?.visitDate || null,
          recentRecords
        }
      }
    });

  } catch (error) {
    console.error('Get health summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching health summary'
    });
  }
});

// @route   GET /api/patients/download-report
// @desc    Download health report as PDF
// @access  Private
router.get('/download-report', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ patientId: req.patientId }).select('-otp');
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get all medical records
    const medicalRecords = await MedicalRecord.find({ 
      patientId: req.patientId,
      isActive: true 
    })
    .sort({ visitDate: -1 })
    .lean();

    // Generate PDF
    const pdfBuffer = await generateHealthReportPDF(patient, medicalRecords);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="health-report-${patient.patientId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache');

    res.end(pdfBuffer);

  } catch (error) {
    console.error('Download report error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      patientId: req.patientId
    });
    
    res.status(500).json({
      success: false,
      message: `Server error while generating health report: ${error.message}`
    });
  }
});

module.exports = router;
