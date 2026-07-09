const jwt = require('jsonwebtoken');
const Government = require('../models/Government');

const governmentAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const government = await Government.findById(decoded.id).select('-password');
    
    if (!government) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Government user not found.'
      });
    }

    if (!government.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    req.governmentId = government._id;
    req.government = government;
    next();
  } catch (error) {
    console.error('Government auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

module.exports = governmentAuth;














