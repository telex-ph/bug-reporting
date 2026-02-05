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
    try {
      console.log('Trying search method...');
      const searchResults = await client
        .api(`/users/${adminEmail}/messages`)
        .search('"BUG REPORT"')
        .select('id,subject,bodyPreview,body,from,receivedDateTime,isRead,hasAttachments')
        .top(50)
        .get();
      
      const bugReports = searchResults.value.filter(msg => 
        msg.subject && msg.subject.includes('[BUG REPORT]')
      );
      
      console.log(`✓ Search method: Found ${bugReports.length} bug report emails`);
      
      // Sort by date
      bugReports.sort((a, b) => 
        new Date(b.receivedDateTime) - new Date(a.receivedDateTime)
      );
      
      return bugReports;
      
    } catch (searchError) {
      console.log('Search method failed, trying fallback method...');
      
      // METHOD 2: Fallback - fetch all recent emails then filter
      const messages = await client
        .api(`/users/${adminEmail}/mailFolders/inbox/messages`)
        .select('id,subject,bodyPreview,body,from,receivedDateTime,isRead,hasAttachments')
        .top(100)
        .get();
      
      console.log(`✓ Fetched ${messages.value.length} recent emails`);
      
      // Filter for bug reports client-side
      const bugReports = messages.value.filter(msg => 
        msg.subject && msg.subject.toUpperCase().includes('[BUG REPORT]')
      );
      
      console.log(`✓ Fallback method: Found ${bugReports.length} bug report emails`);
      
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