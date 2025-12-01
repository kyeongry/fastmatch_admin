require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

async function testUrl(name, url) {
    const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
    console.log(`\n--- Testing ${name} ---`);
    console.log('URL:', url);

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
            },
            responseType: 'arraybuffer',
        });

        console.log('✅ Success!');
        console.log('✅ Image Size:', response.data.length, 'bytes');
        return true;
    } catch (error) {
        console.error('❌ Failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            try {
                const errorData = Buffer.from(error.response.data).toString('utf8');
                console.error('   Data:', errorData);
            } catch (e) {
                console.error('   Data (raw):', error.response.data);
            }
        }
        return false;
    }
}

async function runTests() {
    const lat = 37.5089;
    const lng = 127.0639;

    // 1. Simple (No markers)
    await testUrl('Simple', `https://dapi.kakao.com/v2/maps/staticmap?center=${lng},${lat}&level=3&width=400&height=300`);

    // 2. With 'markers' (plural) - simple format
    await testUrl('Markers (Simple)', `https://dapi.kakao.com/v2/maps/staticmap?center=${lng},${lat}&level=3&width=400&height=300&markers=${lng},${lat}`);

    // 3. With 'marker' (singular) - simple format
    await testUrl('Marker (Singular)', `https://dapi.kakao.com/v2/maps/staticmap?center=${lng},${lat}&level=3&width=400&height=300&marker=${lng},${lat}`);

    // 4. With 'markers' - complex format
    await testUrl('Markers (Complex)', `https://dapi.kakao.com/v2/maps/staticmap?center=${lng},${lat}&level=3&width=400&height=300&markers=type:t|size:mid|pos:${lng},${lat}`);
}

runTests();
