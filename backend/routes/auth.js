const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');
const { sendOTP, verifyOTP } = require('../utils/otpService');

const router = express.Router();

// Generate JWT token for patients
const generateToken = (patientId) => {
  return jwt.sign({ patientId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate JWT token for doctors
const generateDoctorToken = (doctorId) => {
  return jwt.sign({ doctorId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new patient
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^\+?[\d\s-()]+$/).withMessage('Please provide a valid phone number'),
  body('dateOfBirth').isISO8601().withMessage('Please provide a valid date of birth'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
  body('height').optional().isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm'),
  body('weight').optional().isFloat({ min: 10, max: 500 }).withMessage('Weight must be between 10 and 500 kg'),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Invalid blood group'),
  body('allergies').optional().isArray().withMessage('Allergies must be an array'),
  body('medicalIssues').optional().isArray().withMessage('Medical issues must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
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
      email,
      phone,
      dateOfBirth,
      gender,
      height,
      weight,
      bloodGroup,
      allergies = [],
      medicalIssues = [],
      emergencyContact
    } = req.body;

    // Check if patient already exists
    const existingPatient = await Patient.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this email or phone number already exists'
      });
    }

    // Generate unique Patient ID
    let patientId;
    let isUnique = false;
    while (!isUnique) {
      patientId = Patient.generatePatientId();
      const existingId = await Patient.findOne({ patientId });
      if (!existingId) {
        isUnique = true;
      }
    }

    // Create new patient
    const patient = new Patient({
      patientId,
      name,
      email,
      phone,
      dateOfBirth,
      gender,
      height,
      weight,
      bloodGroup,
      allergies,
      medicalIssues,
      emergencyContact
    });

    // Generate and send OTP
    const otp = patient.generateOTP();
    await patient.save();

    // Send OTP via SMS
    try {
      await sendOTP(phone, otp);
    } catch (otpError) {
      console.error('OTP sending failed:', otpError);
      // Don't fail registration if OTP sending fails
    }

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully. Please verify your phone number with the OTP sent.',
      data: {
        patientId: patient.patientId,
        name: patient.name,
        email: patient.email,
        phone: patient.phone
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for patient registration
// @access  Public
router.post('/verify-otp', [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

    const { patientId, otp } = req.body;

    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (patient.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Patient is already verified'
      });
    }

    if (!patient.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark patient as verified and clear OTP
    patient.isVerified = true;
    patient.clearOTP();
    await patient.save();

    // Generate JWT token
    const token = generateToken(patient.patientId);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      data: {
        token,
        patient: patient
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login patient with Patient ID and phone number
// @access  Public
router.post('/login', [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('phone').matches(/^\+?[\d\s-()]+$/).withMessage('Please provide a valid phone number')
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

    const { patientId, phone } = req.body;

    const patient = await Patient.findOne({ patientId, phone });
    if (!patient) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Patient ID or phone number'
      });
    }

    if (!patient.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your phone number first'
      });
    }

    // Generate and send OTP for login
    const otp = patient.generateOTP();
    await patient.save();

    // Send OTP via SMS
    try {
      await sendOTP(phone, otp);
    } catch (otpError) {
      console.error('OTP sending failed:', otpError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent to your registered phone number',
      data: {
        patientId: patient.patientId,
        phone: patient.phone
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/verify-login-otp
// @desc    Verify OTP for login
// @access  Public
router.post('/verify-login-otp', [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

    const { patientId, otp } = req.body;

    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    if (!patient.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update last login and clear OTP
    patient.updateLastLogin();
    patient.clearOTP();
    await patient.save();

    // Generate JWT token
    const token = generateToken(patient.patientId);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        patient: patient
      }
    });

  } catch (error) {
    console.error('Login OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login verification'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current patient profile
// @access  Private
router.get('/me', auth, async (req, res) => {
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

// @route   POST /api/auth/logout
// @desc    Logout patient (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// ==================== DOCTOR AUTHENTICATION ROUTES ====================

// @route   POST /api/auth/doctor/register
// @desc    Register a new doctor
// @access  Public
router.post('/doctor/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^\+?[\d\s-()]+$/).withMessage('Please provide a valid phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
  body('hospital').trim().notEmpty().withMessage('Hospital name is required'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a non-negative number'),
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
      email,
      phone,
      password,
      specialization,
      licenseNumber,
      hospital,
      experience,
      qualifications = []
    } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({
      $or: [{ email }, { phone }, { licenseNumber }]
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this email, phone, or license number already exists'
      });
    }

    // Generate unique Doctor ID
    let doctorId;
    let isUnique = false;
    while (!isUnique) {
      doctorId = 'DOC' + Math.floor(100000 + Math.random() * 900000);
      const existingId = await Doctor.findOne({ doctorId });
      if (!existingId) {
        isUnique = true;
      }
    }

    // Create new doctor
    const doctor = new Doctor({
      doctorId,
      name,
      email,
      phone,
      password,
      specialization,
      licenseNumber,
      hospital,
      experience,
      qualifications
    });

    // Generate and send OTP
    const otp = doctor.generateOTP();
    await doctor.save();

    // Send OTP via SMS
    try {
      await sendOTP(phone, otp);
    } catch (otpError) {
      console.error('OTP sending failed:', otpError);
      // Don't fail registration if OTP sending fails
    }

    res.status(201).json({
      success: true,
      message: 'Doctor registered successfully. Please verify your phone number with the OTP sent.',
      data: {
        doctorId: doctor.doctorId,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone
      }
    });

  } catch (error) {
    console.error('Doctor registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during doctor registration'
    });
  }
});

// @route   POST /api/auth/doctor/verify-otp
// @desc    Verify OTP for doctor registration
// @access  Public
router.post('/doctor/verify-otp', [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
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

    const { doctorId, otp } = req.body;

    const doctor = await Doctor.findOne({ doctorId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (doctor.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is already verified'
      });
    }

    if (!doctor.verifyOTP(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark doctor as verified and clear OTP
    doctor.isVerified = true;
    doctor.clearOTP();
    await doctor.save();

    // Generate JWT token
    const token = generateDoctorToken(doctor.doctorId);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      data: {
        token,
        doctor: doctor
      }
    });

  } catch (error) {
    console.error('Doctor OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
});

// @route   POST /api/auth/doctor/login
// @desc    Login doctor with email and password
// @access  Public
router.post('/doctor/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!doctor.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your phone number first'
      });
    }

    if (!doctor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check password
    const isPasswordValid = await doctor.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    doctor.updateLastLogin();
    await doctor.save();

    // Generate JWT token
    const token = generateDoctorToken(doctor.doctorId);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        doctor: doctor
      }
    });

  } catch (error) {
    console.error('Doctor login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/doctor/me
// @desc    Get current doctor profile
// @access  Private (Doctor)
router.get('/doctor/me', auth, async (req, res) => {
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

// @route   POST /api/auth/doctor/logout
// @desc    Logout doctor (client-side token removal)
// @access  Private (Doctor)
router.post('/doctor/logout', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
