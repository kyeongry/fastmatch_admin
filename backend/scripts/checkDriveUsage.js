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

const checkUsage = async () => {
    try {
        const drive = await initializeGoogleAPI();

        // Check About info for storage quota
        const about = await drive.about.get({
            fields: 'storageQuota, user',
        });

        let output = '';
        output += '📊 Drive Storage Info:\n';
        output += `User: ${about.data.user.emailAddress}\n`;
        if (about.data.storageQuota) {
            const limit = parseInt(about.data.storageQuota.limit || 0);
            const usage = parseInt(about.data.storageQuota.usage || 0);
            output += `Limit: ${(limit / 1024 / 1024).toFixed(2)} MB\n`;
            output += `Usage: ${(usage / 1024 / 1024).toFixed(2)} MB\n`;
            output += `Usage %: ${limit > 0 ? ((usage / limit) * 100).toFixed(2) : 'N/A'}%\n`;
        }

        // List all files
        output += '\n📂 Top 20 Largest Files:\n';
        const response = await drive.files.list({
            pageSize: 20,
            fields: 'files(id, name, size, mimeType, trashed, owners)',
            orderBy: 'quotaBytesUsed desc',
        });

        const files = response.data.files || [];
        files.forEach(file => {
            const size = parseInt(file.size || 0);
            const owner = file.owners && file.owners[0] ? file.owners[0].emailAddress : 'Unknown';
            output += `- [${file.trashed ? '🗑️' : '📄'}] ${file.name} (${(size / 1024 / 1024).toFixed(2)} MB) - Owner: ${owner}\n`;
        });

        await fs.writeFile('drive_usage.txt', output);
        console.log('✅ Usage info written to drive_usage.txt');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

checkUsage();
