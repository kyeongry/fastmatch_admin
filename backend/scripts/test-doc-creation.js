const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

const initializeGoogleAPI = async () => {
    try {
        const keyFilePath = path.join(__dirname, '../credentials/google-service-account.json');
        await fs.access(keyFilePath);
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents'],
        });
        return {
            drive: google.drive({ version: 'v3', auth }),
            docs: google.docs({ version: 'v1', auth })
        };
    } catch (error) {
        console.error('❌ Google API 초기화 실패:', error.message);
        throw error;
    }
};

const testCreation = async () => {
    try {
        const { drive } = await initializeGoogleAPI();
        console.log('📝 Creating test document...');

        const res = await drive.files.create({
            requestBody: {
                name: 'Test Document ' + new Date().toISOString(),
                mimeType: 'application/vnd.google-apps.document',
            },
            fields: 'id, name',
        });

        console.log(`✅ Document created successfully: ${res.data.id}`);

        // Clean up
        await drive.files.delete({ fileId: res.data.id });
        console.log('✅ Test document deleted.');

    } catch (error) {
        console.error('❌ Error creating document:', error.message);
        if (error.response && error.response.data) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
};

testCreation();
