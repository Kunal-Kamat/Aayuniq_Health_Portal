const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');

const auth = async (req, res, next) => {
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
    
    // Check if patient exists
    const patient = await Patient.findOne({ patientId: decoded.patientId });
    if (!patient) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - patient not found'
      });
    }

    // Check if patient is verified
    if (!patient.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Patient account not verified'
      });
    }

    // Add patient info to request
    req.patientId = decoded.patientId;
    req.patient = patient;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
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
      message: 'Server error in authentication'
    });
  }
};

module.exports = auth;
