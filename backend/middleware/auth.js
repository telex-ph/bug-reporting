const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

const auth = async (req, res, next) => {
  try {
    // Get token from header - FIXED: Use req.headers or req.get()
    const authHeader = req.headers['authorization'] || req.headers.Authorization || req.get('Authorization');
    
    console.log('🔍 Auth middleware - Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('❌ No authorization header found');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    const token = authHeader.replace('Bearer ', '').trim();
    
    console.log('🔍 Token extracted:', token ? 'Yes (length: ' + token.length + ')' : 'No');
    
    if (!token) {
      console.log('❌ No token in authorization header');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    console.log('🔐 Verifying token with JWT_SECRET...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✓ Token verified, decoded user ID:', decoded.id);
    
    // Find admin
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      console.log('❌ Admin not found with ID:', decoded.id);
      return res.status(401).json({ message: 'Admin not found' });
    }
    
    console.log('✓ Admin found:', admin.email);

    if (!admin.isActive) {
      console.log('❌ Admin account is deactivated:', admin.email);
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Attach admin to request
    req.admin = admin;
    req.user = admin; // Also attach as req.user for compatibility
    
    console.log('✓ Auth successful for:', admin.email);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if admin has specific role
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

module.exports = { auth, checkRole };