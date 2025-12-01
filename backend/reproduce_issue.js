const { getBuildingInfo } = require('./src/services/externalApi.service');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

async function runTest() {
    console.log('Starting reproduction test...');

    // Test case: A building likely not in the top 100 of the district
    // Address: Seoul Seocho-gu Seocho-dong 1303-22 (Sinnonhyeon Tower)
    // Sigungu Code: 11650 (Seocho-gu)
    // Bjdong Code: 10800 (Seocho-dong)
    // Bun: 1303
    // Ji: 22

    const sigunguCode = '11650';
    const bjdongCode = '10800';
    const bun = '1303';
    const ji = '22';
    const mountainYn = 'N';

    try {
        console.log(`Searching for: ${sigunguCode} ${bjdongCode} ${bun}-${ji}`);
        const result = await getBuildingInfo(sigunguCode, bjdongCode, bun, ji, mountainYn);

        if (result) {
            console.log('Result found:', result);
            if (result.address && result.address.includes('1303-22')) {
                console.log('SUCCESS: Correct building found.');
            } else {
                console.log('FAILURE: Wrong building found.');
            }
        } else {
            console.log('FAILURE: No result found.');
        }
    } catch (error) {
        console.error('Error during test:', error);
    }
}

runTest();
