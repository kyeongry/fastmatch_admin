const path = require('path');
const cwd = process.cwd();
require('dotenv').config({ path: path.join(cwd, 'backend', '.env') });

const { getBuildingInfo, searchAddress } = require('../src/services/externalApi.service');

async function runDebug() {
    try {
        console.log('🚀 Starting Building Info Debug...');

        const kakaoKey = process.env.KAKAO_REST_API_KEY;
        const buildingKey = process.env.BUILDING_REGISTRY_API_KEY || process.env.BUILDING_API_KEY;

        console.log('🔑 Environment Check:');
        console.log('   KAKAO_REST_API_KEY:', kakaoKey ? '✅ Present' : '❌ Missing');
        console.log('   BUILDING_REGISTRY_API_KEY:', buildingKey ? '✅ Present' : '❌ Missing');

        if (!kakaoKey || !buildingKey) {
            console.error('❌ Missing API keys. Please check .env file.');
            return;
        }

        // Test Case 1: Lotte World Tower
        const testAddress1 = '서울 송파구 올림픽로 300'; // Lotte World Tower
        console.log(`\n🔍 Testing Address: ${testAddress1}`);

        const searchResults = await searchAddress(testAddress1);
        if (searchResults.length > 0) {
            const result = searchResults[0];
            console.log('   Kakao Search Result:', {
                address: result.mainAddress,
                sigunguCode: result.sigunguCode,
                bjdongCode: result.bjdongCode,
                mainAddressNo: result.mainAddressNo,
                subAddressNo: result.subAddressNo,
                mountainYn: result.mountainYn,
                buildingName: result.buildingName
            });

            if (result.sigunguCode && result.bjdongCode) {
                console.log('   Calling getBuildingInfo...');
                const buildingInfo = await getBuildingInfo(
                    result.sigunguCode,
                    result.bjdongCode,
                    result.mainAddressNo,
                    result.subAddressNo,
                    result.mountainYn,
                    result.buildingName
                );

                if (buildingInfo) {
                    console.log('   ✅ Result:', {
                        name: buildingInfo.buildingName,
                        area: buildingInfo.totalArea,
                        floors: `${buildingInfo.floorsAbove}/${buildingInfo.floorsBelow}`,
                        date: buildingInfo.approvalYear
                    });
                } else {
                    console.log('   ❌ No building info found');
                }
            }
        } else {
            console.log('   ❌ Address not found');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

runDebug();
