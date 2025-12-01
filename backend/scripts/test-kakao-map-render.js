require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { fetchKakaoMapImage } = require('../src/services/htmlPdf.service');
const fs = require('fs').promises;
const path = require('path');

async function testMapRender() {
  console.log('🗺️ 카카오맵 이미지 렌더링 테스트 시작...\n');

  // 테스트 좌표: 서울 강남역 근처
  const latitude = 37.5089;
  const longitude = 127.0639;

  console.log(`좌표: 위도 ${latitude}, 경도 ${longitude}`);
  console.log('API 키:', process.env.KAKAO_JS_KEY ? '설정됨' : '미설정');
  console.log('\n렌더링 중...\n');

  try {
    const imageBase64 = await fetchKakaoMapImage(latitude, longitude);

    if (imageBase64) {
      console.log('✅ 카카오맵 이미지 렌더링 성공!');
      console.log(`이미지 크기: ${imageBase64.length} 바이트`);

      // 파일로 저장 (확인용)
      const base64Data = imageBase64.replace(/^data:image\/png;base64,/, '');
      const outputPath = path.join(__dirname, '../test-map-output.png');
      await fs.writeFile(outputPath, base64Data, 'base64');
      console.log(`이미지 저장됨: ${outputPath}`);
    } else {
      console.log('❌ 카카오맵 이미지 렌더링 실패');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

testMapRender();
