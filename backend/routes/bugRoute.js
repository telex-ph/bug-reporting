const express = require('express');
const router = express.Router();
const Bug = require('../models/bug');
const { auth } = require('../middleware/auth');
const { fetchBugReportsFromOutlook, markEmailAsRead } = require('../services/graphService');
const { parseEmailToBug } = require('../utils/emailParser');

// @route   POST /api/bugs/sync
// @desc    Sync bug reports from Outlook
// @access  Private (Admin only)
router.post('/sync', auth, async (req, res) => {
  try {
    console.log('Starting Outlook sync...');
    
    // Fetch emails from Outlook
    const emails = await fetchBugReportsFromOutlook();
    console.log(`Found ${emails.length} bug report emails`);
    
    const newBugs = [];
    const existingBugs = [];
    const errors = [];
    
    for (const email of emails) {
      try {
        // Check if bug already exists (by emailId)
        const existingBug = await Bug.findOne({ emailId: email.id });
        
        if (existingBug) {
          existingBugs.push(existingBug);
          continue;
        }
        
        // Parse email to bug format
        const bugData = parseEmailToBug(email);
        
        // Create new bug
        const bug = new Bug(bugData);
        await bug.save();
        
        newBugs.push(bug);
        
        // Mark email as read (optional)
        // await markEmailAsRead(email.id);
        
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        errors.push({
          emailId: email.id,
          subject: email.subject,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Successfully synced ${newBugs.length} new bug reports`,
      summary: {
        totalEmails: emails.length,
        newBugs: newBugs.length,
        existingBugs: existingBugs.length,
        errors: errors.length
      },
      newBugs: newBugs,
      errors: errors
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to sync bug reports from Outlook',
      error: error.message 
    });
  }
});

// @route   GET /api/bugs/pending
// @desc    Get pending/open bugs (for modal)
// @access  Private
router.get('/pending', auth, async (req, res) => {
  try {
    const pendingBugs = await Bug.find({ 
      status: { $in: ['Open', 'Reopened'] }
    })
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json(pendingBugs);
  } catch (error) {
    console.error('Get pending bugs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bugs
// @desc    Get all bugs with filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      status, 
      severity, 
      priority, 
      category,
      assignedTo,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'reportedBy.name': { $regex: search, $options: 'i' } },
        { 'reportedBy.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get bugs with pagination
    const bugs = await Bug.find(filter)
      .populate('assignedTo', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Bug.countDocuments(filter);

    res.json({
      bugs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get bugs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bugs/stats
// @desc    Get bug statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = {
      total: await Bug.countDocuments(),
      byStatus: {
        open: await Bug.countDocuments({ status: 'Open' }),
        inProgress: await Bug.countDocuments({ status: 'In Progress' }),
        resolved: await Bug.countDocuments({ status: 'Resolved' }),
        closed: await Bug.countDocuments({ status: 'Closed' }),
        reopened: await Bug.countDocuments({ status: 'Reopened' })
      },
      bySeverity: {
        critical: await Bug.countDocuments({ severity: 'Critical' }),
        high: await Bug.countDocuments({ severity: 'High' }),
        medium: await Bug.countDocuments({ severity: 'Medium' }),
        low: await Bug.countDocuments({ severity: 'Low' })
      },
      byPriority: {
        urgent: await Bug.countDocuments({ priority: 'Urgent' }),
        high: await Bug.countDocuments({ priority: 'High' }),
        normal: await Bug.countDocuments({ priority: 'Normal' }),
        low: await Bug.countDocuments({ priority: 'Low' })
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bugs/:id
// @desc    Get single bug by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('comments.author', 'name email');

    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    res.json(bug);
  } catch (error) {
    console.error('Get bug error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/bugs
// @desc    Create new bug
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const bugData = {
      ...req.body,
      reportedBy: {
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role
      }
    };

    const bug = new Bug(bugData);
    await bug.save();

    res.status(201).json({
      message: 'Bug created successfully',
      bug
    });
  } catch (error) {
    console.error('Create bug error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/bugs/:id/confirm
// @desc    Confirm/update bug (for email sync workflow)
// @access  Private
router.patch('/:id/confirm', auth, async (req, res) => {
  try {
    const { status, priority, severity, notes, assignedTo } = req.body;
    
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' });
    }
    
    // Update fields
    if (status) bug.status = status;
    if (priority) bug.priority = priority;
    if (severity) bug.severity = severity;
    if (assignedTo) bug.assignedTo = assignedTo;
    
    // Add confirmation note
    if (notes) {
      bug.comments.push({
        authorName: req.admin.name,
        author: req.admin._id,
        message: `Confirmed: ${notes}`,
        createdAt: new Date()
      });
    }
    
    await bug.save();
    
    const updatedBug = await Bug.findById(bug._id)
      .populate('assignedTo', 'name email role');
    
    res.json({
      message: 'Bug confirmed successfully',
      bug: updatedBug
    });
  } catch (error) {
    console.error('Confirm bug error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/bugs/:id
// @desc    Update bug
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdAt') {
        bug[key] = req.body[key];
      }
    });

    // Set resolved/closed timestamps
    if (req.body.status === 'Resolved' && !bug.resolvedAt) {
      bug.resolvedAt = new Date();
    }
    if (req.body.status === 'Closed' && !bug.closedAt) {
      bug.closedAt = new Date();
    }

    await bug.save();

    const updatedBug = await Bug.findById(bug._id)
      .populate('assignedTo', 'name email role');

    res.json({
      message: 'Bug updated successfully',
      bug: updatedBug
    });
  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/bugs/:id
// @desc    Delete bug
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    await Bug.findByIdAndDelete(req.params.id);

    res.json({ message: 'Bug deleted successfully' });
  } catch (error) {
    console.error('Delete bug error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/bugs/:id/comments
// @desc    Add comment to bug
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);

    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    const comment = {
      author: req.admin._id,
      authorName: req.admin.name,
      message: req.body.message,
      createdAt: new Date()
    };

    bug.comments.push(comment);
    await bug.save();

    const updatedBug = await Bug.findById(bug._id)
      .populate('assignedTo', 'name email role')
      .populate('comments.author', 'name email');

    res.json({
      message: 'Comment added successfully',
      bug: updatedBug
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;