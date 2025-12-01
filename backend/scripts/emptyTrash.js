const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

const initializeGoogleAPI = async () => {
    try {
        const keyFilePath = path.join(__dirname, '../credentials/google-service-account.json');
        await fs.access(keyFilePath);
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });
        return google.drive({ version: 'v3', auth });
    } catch (error) {
        console.error('❌ Google API 초기화 실패:', error.message);
        throw error;
    }
};

const emptyTrash = async () => {
    try {
        const drive = await initializeGoogleAPI();
        console.log('🗑️ Emptying trash...');
        await drive.files.emptyTrash();
        console.log('✅ Trash emptied successfully.');
    } catch (error) {
        console.error('❌ Error emptying trash:', error.message);
    }
};

emptyTrash();
