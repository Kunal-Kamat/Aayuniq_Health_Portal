const express = require('express');
const { body, validationResult } = require('express-validator');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/medical-records
// @desc    Create a new medical record (for doctors/admin)
// @access  Private (should be restricted to doctors/admin)
router.post('/', [
  auth,
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorName').trim().isLength({ min: 2, max: 100 }).withMessage('Doctor name is required'),
  body('diagnosis').trim().isLength({ min: 1, max: 500 }).withMessage('Diagnosis is required'),
  body('visitDate').optional().isISO8601().withMessage('Please provide a valid visit date'),
  body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
  body('treatment').optional().trim().isLength({ max: 1000 }).withMessage('Treatment notes cannot exceed 1000 characters'),
  body('medications').optional().isArray().withMessage('Medications must be an array'),
  body('vitalSigns').optional().isObject().withMessage('Vital signs must be an object'),
  body('labResults').optional().isArray().withMessage('Lab results must be an array'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters')
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

    // Check if patient exists
    const patient = await Patient.findOne({ patientId: req.body.patientId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const medicalRecord = new MedicalRecord({
      ...req.body,
      visitDate: req.body.visitDate || new Date()
    });

    await medicalRecord.save();

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: { medicalRecord }
    });

  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating medical record'
    });
  }
});

// @route   GET /api/medical-records
// @desc    Get medical records (with optional patient filter)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { patientId, doctorName, startDate, endDate } = req.query;

    // Build query
    const query = { isActive: true };
    
    if (patientId) {
      query.patientId = patientId;
    }
    
    if (doctorName) {
      query.doctorName = { $regex: doctorName, $options: 'i' };
    }
    
    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) query.visitDate.$gte = new Date(startDate);
      if (endDate) query.visitDate.$lte = new Date(endDate);
    }

    const medicalRecords = await MedicalRecord.find(query)
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('patientId', 'name patientId')
      .lean();

    const totalRecords = await MedicalRecord.countDocuments(query);

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

// @route   GET /api/medical-records/:recordId
// @desc    Get specific medical record
// @access  Private
router.get('/:recordId', auth, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findOne({
      _id: req.params.recordId,
      isActive: true
    }).populate('patientId', 'name patientId email phone');

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

// @route   PUT /api/medical-records/:recordId
// @desc    Update medical record
// @access  Private (should be restricted to doctors/admin)
router.put('/:recordId', [
  auth,
  body('doctorName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Doctor name must be between 2 and 100 characters'),
  body('diagnosis').optional().trim().isLength({ min: 1, max: 500 }).withMessage('Diagnosis must be between 1 and 500 characters'),
  body('treatment').optional().trim().isLength({ max: 1000 }).withMessage('Treatment notes cannot exceed 1000 characters'),
  body('notes').optional().trim().isLength({ max: 2000 }).withMessage('Notes cannot exceed 2000 characters')
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
      'doctorName', 'doctorSpecialty', 'diagnosis', 'symptoms', 'treatment',
      'medications', 'vitalSigns', 'labResults', 'notes', 'followUpRequired', 'followUpDate'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const medicalRecord = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.recordId, isActive: true },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    res.json({
      success: true,
      message: 'Medical record updated successfully',
      data: { medicalRecord }
    });

  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating medical record'
    });
  }
});

// @route   DELETE /api/medical-records/:recordId
// @desc    Soft delete medical record
// @access  Private (should be restricted to doctors/admin)
router.delete('/:recordId', auth, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.recordId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    });

  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting medical record'
    });
  }
});

// @route   GET /api/medical-records/patient/:patientId
// @desc    Get all medical records for a specific patient
// @access  Private
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if patient exists
    const patient = await Patient.findOne({ patientId: req.params.patientId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const medicalRecords = await MedicalRecord.find({ 
      patientId: req.params.patientId,
      isActive: true 
    })
    .sort({ visitDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const totalRecords = await MedicalRecord.countDocuments({ 
      patientId: req.params.patientId,
      isActive: true 
    });

    res.json({
      success: true,
      data: {
        patient: {
          patientId: patient.patientId,
          name: patient.name
        },
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
    console.error('Get patient medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient medical records'
    });
  }
});

module.exports = router;
