const msal = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  },
};

const msalClient = new msal.ConfidentialClientApplication(msalConfig);

async function getAccessToken() {
  const tokenRequest = {
    scopes: ['https://graph.microsoft.com/.default'],
  };
  
  try {
    console.log('Attempting to get access token...');
    const response = await msalClient.acquireTokenByClientCredential(tokenRequest);
    console.log('✓ Access token acquired successfully');
    return response.accessToken;
  } catch (error) {
    console.error('❌ Error getting access token:', error.message);
    throw new Error(`Failed to authenticate with Microsoft Graph: ${error.message}`);
  }
}

async function getGraphClient() {
  const accessToken = await getAccessToken();
  
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

async function fetchBugReportsFromOutlook() {
  try {
    const client = await getGraphClient();
    const adminEmail = process.env.ADMIN_EMAIL;
    
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL is not configured in environment variables');
    }
    
    console.log(`📧 Fetching recent emails from: ${adminEmail}`);
    
    // METHOD 1: Try using search first (more flexible)
    // ✅ UPDATED: Now fetches uniqueBody to get ONLY the first email, not the entire thread
    try {
      console.log('Trying search method...');
      const searchResults = await client
        .api(`/users/${adminEmail}/messages`)
        .search('"BUG REPORT"')
        .select('id,subject,bodyPreview,body,uniqueBody,from,receivedDateTime,isRead,hasAttachments,conversationId')
        .filter('isDraft eq false')  // ✅ Exclude drafts
        .top(50)
        .get();
      
      // ✅ Filter: Only get ORIGINAL bug reports (not replies/forwards)
      let bugReports = searchResults.value.filter(msg => {
        if (!msg.subject || !msg.subject.includes('[BUG REPORT]')) {
          return false;
        }
        
        // ✅ Exclude replies and forwards
        const subject = msg.subject.toUpperCase();
        if (subject.startsWith('RE:') || subject.startsWith('FW:') || 
            subject.startsWith('FWD:') || subject.includes('RE: [BUG REPORT]')) {
          console.log(`⏭️ Skipping reply/forward: ${msg.subject}`);
          return false;
        }
        
        return true;
      });
      
      // ✅ Deduplicate by conversationId (keep only the FIRST email per thread)
      const uniqueConversations = new Map();
      bugReports.forEach(msg => {
        const convId = msg.conversationId;
        if (!uniqueConversations.has(convId)) {
          uniqueConversations.set(convId, msg);
        } else {
          // Keep the older one (first email in thread)
          const existing = uniqueConversations.get(convId);
          if (new Date(msg.receivedDateTime) < new Date(existing.receivedDateTime)) {
            uniqueConversations.set(convId, msg);
          }
        }
      });
      
      bugReports = Array.from(uniqueConversations.values());
      
      console.log(`✓ Search method: Found ${bugReports.length} unique bug report emails (deduplicated)`);
      
      // Sort by date
      bugReports.sort((a, b) => 
        new Date(b.receivedDateTime) - new Date(a.receivedDateTime)
      );
      
      return bugReports;
      
    } catch (searchError) {
      console.log('Search method failed, trying fallback method...');
      
      // METHOD 2: Fallback - fetch from inbox only (not sent items)
      // ✅ UPDATED: Added uniqueBody and conversationId
      const messages = await client
        .api(`/users/${adminEmail}/mailFolders/inbox/messages`)
        .select('id,subject,bodyPreview,body,uniqueBody,from,receivedDateTime,isRead,hasAttachments,conversationId')
        .filter('isDraft eq false')  // ✅ Exclude drafts
        .top(100)
        .get();
      
      console.log(`✓ Fetched ${messages.value.length} recent emails from INBOX`);
      
      // ✅ Filter: Only get ORIGINAL bug reports (not replies/forwards)
      let bugReports = messages.value.filter(msg => {
        if (!msg.subject || !msg.subject.toUpperCase().includes('[BUG REPORT]')) {
          return false;
        }
        
        // ✅ Exclude replies and forwards
        const subject = msg.subject.toUpperCase();
        if (subject.startsWith('RE:') || subject.startsWith('FW:') || 
            subject.startsWith('FWD:') || subject.includes('RE: [BUG REPORT]')) {
          console.log(`⏭️ Skipping reply/forward: ${msg.subject}`);
          return false;
        }
        
        return true;
      });
      
      // ✅ Deduplicate by conversationId (keep only the FIRST email per thread)
      const uniqueConversations = new Map();
      bugReports.forEach(msg => {
        const convId = msg.conversationId;
        if (!uniqueConversations.has(convId)) {
          uniqueConversations.set(convId, msg);
        } else {
          // Keep the older one (first email in thread)
          const existing = uniqueConversations.get(convId);
          if (new Date(msg.receivedDateTime) < new Date(existing.receivedDateTime)) {
            uniqueConversations.set(convId, msg);
          }
        }
      });
      
      bugReports = Array.from(uniqueConversations.values());
      
      console.log(`✓ Fallback method: Found ${bugReports.length} unique bug report emails (deduplicated)`);
      
      // Sort by date
      bugReports.sort((a, b) => 
        new Date(b.receivedDateTime) - new Date(a.receivedDateTime)
      );
      
      return bugReports;
    }
    
  } catch (error) {
    console.error('❌ Error fetching emails from Outlook:', error.message);
    
    if (error.statusCode === 401) {
      throw new Error('Authentication failed. Check Azure credentials and permissions.');
    } else if (error.statusCode === 403) {
      throw new Error('Access forbidden. Grant Mail.Read permission in Azure Portal.');
    } else if (error.statusCode === 404) {
      throw new Error(`User ${process.env.ADMIN_EMAIL} not found. Check ADMIN_EMAIL in .env`);
    }
    
    throw error;
  }
}

async function markEmailAsRead(messageId) {
  try {
    const client = await getGraphClient();
    const adminEmail = process.env.ADMIN_EMAIL;
    
    await client
      .api(`/users/${adminEmail}/messages/${messageId}`)
      .update({ isRead: true });
    
    console.log(`✓ Marked email ${messageId} as read`);
  } catch (error) {
    console.error('❌ Error marking email as read:', error.message);
    // Don't throw - this is not critical
  }
}

module.exports = {
  fetchBugReportsFromOutlook,
  markEmailAsRead,
};