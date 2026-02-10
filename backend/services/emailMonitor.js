const { Client } = require('@microsoft/microsoft-graph-client');
const { fetchBugReportsFromOutlook } = require('./graphService'); // I-import ang service
const Bug = require('../models/bug');

class EmailMonitor {
  constructor(notificationService) {
    this.notificationService = notificationService;
    this.isMonitoring = false;
  }

  async checkForNewEmails() {
    try {
      const emails = await fetchBugReportsFromOutlook();
      if (!emails || emails.length === 0) return 0;

      let newBugsCount = 0;
      for (const email of emails) {
        const existingBug = await Bug.findOne({ emailId: email.id });
        if (existingBug) continue;

        const bugData = this.extractBugDataFromEmail(email);
        const bug = new Bug(bugData);
        await bug.save();
        
        newBugsCount++;
        
        if (this.notificationService) {
          this.notificationService.notifyNewBugFromOutlook(bug);
          console.log(`🚀 Real-time notification broadcasted for: ${bug.title}`);
        }
      }
      return newBugsCount;
    } catch (error) {
      console.error('❌ Error checking emails:', error.message);
      return 0;
    }
  }

  async parseEmailAndCreateBug(email) {
    try {
      const bugData = this.extractBugDataFromEmail(email);
      
      // Create bug in database
      const bug = new Bug(bugData);
      await bug.save();
      
      console.log(`✅ Bug created from email: ${bug.title}`);
      
      return bug;
    } catch (error) {
      console.error('Error creating bug from email:', error);
      return null;
    }
  }

  extractBugDataFromEmail(email) {
    const subject = email.subject.replace('[BUG REPORT]', '').trim();
    return {
      emailId: email.id, 
      title: subject,
      description: email.bodyPreview,
      severity: this.detectSeverity(email.bodyPreview),
      priority: this.detectPriority(email.bodyPreview),
      status: 'Open',
      source: 'outlook',
      reportedBy: {
        name: email.from?.emailAddress?.name || 'Unknown',
        email: email.from?.emailAddress?.address || 'Unknown'
      },
      receivedDateTime: new Date(email.receivedDateTime)
    };
  }

  detectSeverity(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('critical') || lowerText.includes('urgent')) return 'Critical';
    if (lowerText.includes('high')) return 'High';
    if (lowerText.includes('medium')) return 'Medium';
    return 'Low';
  }

  detectPriority(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('urgent') || lowerText.includes('asap')) return 'Urgent';
    if (lowerText.includes('high priority')) return 'High';
    if (lowerText.includes('low priority')) return 'Low';
    return 'Normal';
  }

  startMonitoring(intervalMinutes = 1) {
    if (this.isMonitoring) {
      console.log('⚠️ Email monitoring already running');
      return;
    }

    console.log(`📧 Starting email monitoring (every ${intervalMinutes} minute(s))`);
    this.isMonitoring = true;

    // Check immediately
    this.checkForNewEmails();

    // Then check at intervals
    this.monitoringInterval = setInterval(() => {
      this.checkForNewEmails();
    }, intervalMinutes * 60 * 1000);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.isMonitoring = false;
      console.log('📧 Email monitoring stopped');
    }
  }

  getAuthenticatedClient() {
    // Your existing Microsoft Graph authentication logic
    // Return authenticated client
  }
}

module.exports = EmailMonitor;