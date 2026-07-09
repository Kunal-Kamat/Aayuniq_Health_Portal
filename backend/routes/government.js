const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Government = require('../models/Government');
const governmentAuth = require('../middleware/governmentAuth');

const router = express.Router();

// @route   POST /api/government/register
// @desc    Register a new government official
// @access  Public (Admin only in production)
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('department').isIn(['Health Ministry', 'Statistics Ministry', 'Planning Ministry', 'Research Ministry', 'Public Health Department']).withMessage('Invalid department'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('accessLevel').optional().isIn(['View Only', 'Analytics', 'Full Access']).withMessage('Invalid access level')
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

    const { name, email, password, department, designation, accessLevel = 'View Only' } = req.body;

    // Check if government official already exists
    const existingOfficial = await Government.findOne({ email });
    if (existingOfficial) {
      return res.status(400).json({
        success: false,
        message: 'Government official with this email already exists'
      });
    }

    // Create new government official
    const government = new Government({
      name,
      email,
      password,
      department,
      designation,
      accessLevel
    });

    await government.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: government._id, type: 'government' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Government official registered successfully',
      data: {
        government: government.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Government registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering government official'
    });
  }
});

// @route   POST /api/government/login
// @desc    Login government official
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
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

    // Find government official
    const government = await Government.findOne({ email });
    if (!government) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!government.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await government.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    government.lastLogin = new Date();
    await government.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: government._id, type: 'government' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        government: government.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Government login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while logging in'
    });
  }
});

// @route   GET /api/government/profile
// @desc    Get government official profile
// @access  Private
router.get('/profile', governmentAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        government: req.government
      }
    });
  } catch (error) {
    console.error('Get government profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/government/profile
// @desc    Update government official profile
// @access  Private
router.put('/profile', [
  governmentAuth,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty')
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

    const { name, designation } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (designation) updateData.designation = designation;

    const government = await Government.findByIdAndUpdate(
      req.governmentId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { government }
    });

  } catch (error) {
    console.error('Update government profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// @route   POST /api/government/logout
// @desc    Logout government official
// @access  Private
router.post('/logout', governmentAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Government logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while logging out'
    });
  }
});

module.exports = router;


