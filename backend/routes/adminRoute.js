const express = require('express');
const router = express.Router();
const Admin = require('../models/admin');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET /api/admin
// @desc    Get all admins
// @access  Private (Admin only)
router.get('/', auth, checkRole('Super Admin', 'Admin'), async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      admins,
      total: admins.length
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/:id
// @desc    Get single admin
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.json(admin);
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/:id
// @desc    Update admin
// @access  Private (Super Admin only or self)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if admin is updating themselves or is Super Admin
    if (req.params.id !== req.admin._id.toString() && req.admin.role !== 'Super Admin') {
      return res.status(403).json({ 
        message: 'You can only update your own profile unless you are a Super Admin' 
      });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Prevent updating sensitive fields
    const allowedUpdates = ['name', 'profilePicture'];
    
    // Super Admin can update role and isActive
    if (req.admin.role === 'Super Admin') {
      allowedUpdates.push('role', 'isActive');
    }

    // Update allowed fields
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        admin[key] = req.body[key];
      }
    });

    await admin.save();

    const updatedAdmin = await Admin.findById(admin._id).select('-password');

    res.json({
      message: 'Admin updated successfully',
      admin: updatedAdmin
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/:id/password
// @desc    Change admin password
// @access  Private (Self only)
router.put('/:id/password', auth, async (req, res) => {
  try {
    // Only allow admins to change their own password
    if (req.params.id !== req.admin._id.toString()) {
      return res.status(403).json({ 
        message: 'You can only change your own password' 
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Please provide current password and new password' 
      });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/:id
// @desc    Delete admin
// @access  Private (Super Admin only)
router.delete('/:id', auth, checkRole('Super Admin'), async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ 
        message: 'You cannot delete your own account' 
      });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;