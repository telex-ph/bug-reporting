const Bug = require('../models/Bug');

// When updating bug status
exports.updateBugStatus = async (req, res) => {
  try {
    const { bugId } = req.params;
    const { status } = req.body;
    
    const bug = await Bug.findById(bugId);
    const oldStatus = bug.status;
    
    bug.status = status;
    await bug.save();
    
    // 🔔 SEND REAL-TIME NOTIFICATION!
    if (global.notificationService) {
      global.notificationService.notifyBugStatusChange(bug, oldStatus, status);
    }
    
    res.json({ success: true, bug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// When assigning bug
exports.assignBug = async (req, res) => {
  try {
    const { bugId } = req.params;
    const { assignedTo } = req.body;
    
    const bug = await Bug.findById(bugId);
    bug.assignedTo = assignedTo;
    await bug.save();
    
    // 🔔 SEND REAL-TIME NOTIFICATION!
    if (global.notificationService) {
      const user = await User.findById(assignedTo);
      global.notificationService.notifyBugAssignment(bug, user);
    }
    
    res.json({ success: true, bug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};