const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

const initializeGoogleAPI = async () => {
    try {
        const credentialsPath = path.join(__dirname, '../credentials/oauth-client.json');
        const tokenPath = path.join(__dirname, '../credentials/tokens.json');

        await fs.access(credentialsPath);
        await fs.access(tokenPath);

        const content = await fs.readFile(credentialsPath);
        const credentials = JSON.parse(content);
        const { client_secret, client_id } = credentials.web || credentials.installed;

        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3000');

        const tokenContent = await fs.readFile(tokenPath);
        const tokens = JSON.parse(tokenContent);
        oAuth2Client.setCredentials(tokens);

        return {
            drive: google.drive({ version: 'v3', auth: oAuth2Client }),
            docs: google.docs({ version: 'v1', auth: oAuth2Client })
        };
    } catch (error) {
        console.error('❌ Google API 초기화 실패:', error.message);
        throw error;
    }
};

const testCreation = async () => {
    try {
        const { drive } = await initializeGoogleAPI();
        console.log('📝 Creating test document with OAuth 2.0...');

        const res = await drive.files.create({
            requestBody: {
                name: 'OAuth Test Document ' + new Date().toISOString(),
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
