const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

const doctorAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if doctor exists
    const doctor = await Doctor.findOne({ doctorId: decoded.doctorId });
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - doctor not found'
      });
    }

    // Check if doctor is verified
    if (!doctor.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Doctor account not verified'
      });
    }

    // Check if doctor is active
    if (!doctor.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Doctor account is deactivated'
      });
    }

    // Add doctor info to request
    req.doctorId = decoded.doctorId;
    req.doctor = doctor;
    
    next();
  } catch (error) {
    console.error('Doctor auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error in doctor authentication'
    });
  }
};

module.exports = doctorAuth;
