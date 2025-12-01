require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

async function runTests() {
    const key = process.env.KAKAO_REST_API_KEY;
    const lat = 37.5089;
    const lng = 127.0639;

    // Try markers only, no center
    const url = `https://dapi.kakao.com/v2/maps/staticmap?markers=color:blue|${lng},${lat}&width=400&height=300`;

    console.log('\n--- Testing Markers Only ---');
    await testUrl(url, key);
}

async function testUrl(url, key) {
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `KakaoAK ${key}`,
            },
            responseType: 'arraybuffer',
        });
        console.log('✅ Success!');
        console.log('✅ Image Size:', response.data.length);
    } catch (error) {
        console.error('❌ Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            try {
                const errorJson = JSON.parse(error.response.data.toString());
                console.error('   Error Type:', errorJson.errorType);
                console.error('   Message:', errorJson.message);
            } catch (e) {
                console.error('   Data (raw):', error.response.data.toString().substring(0, 100));
            }
        }
    }
}

runTests();
