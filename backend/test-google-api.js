require('dotenv').config();
const { initializeGoogleAPI } = require('./src/services/googleDocs.service');

async function testGoogleAPI() {
  try {
    console.log('📝 Google API 테스트 시작...\n');

    // 1. 환경 변수 확인
    console.log('1️⃣ 환경 변수 확인:');
    console.log('  GOOGLE_DOCS_COVER_TEMPLATE_ID:', process.env.GOOGLE_DOCS_COVER_TEMPLATE_ID ? '✅ 설정됨' : '❌ 없음');
    console.log('  GOOGLE_DOCS_SERVICE_INTRO_TEMPLATE_ID:', process.env.GOOGLE_DOCS_SERVICE_INTRO_TEMPLATE_ID ? '✅ 설정됨' : '❌ 없음');
    console.log('  GOOGLE_DOCS_COMPARISON_TEMPLATE_ID:', process.env.GOOGLE_DOCS_COMPARISON_TEMPLATE_ID ? '✅ 설정됨' : '❌ 없음');
    console.log('  GOOGLE_DOCS_DETAIL_TEMPLATE_ID:', process.env.GOOGLE_DOCS_DETAIL_TEMPLATE_ID ? '✅ 설정됨' : '❌ 없음');
    console.log('');

    // 2. Google API 초기화
    console.log('2️⃣ Google API 초기화 중...');
    const { auth, docs, drive } = await initializeGoogleAPI();

    if (!auth || !docs || !drive) {
      console.error('❌ Google API 초기화 실패');
      console.error('   서비스 계정 키 파일을 확인하세요: backend/credentials/google-service-account.json');
      return;
    }

    console.log('✅ Google API 초기화 성공!');
    console.log('');

    // 3. 서비스 계정 이메일 표시
    const keyFile = require('./credentials/google-service-account.json');
    console.log('3️⃣ 서비스 계정 정보:');
    console.log('  이메일:', keyFile.client_email);
    console.log('  프로젝트 ID:', keyFile.project_id);
    console.log('');

    console.log('⚠️ 중요: 다음 4개 Google Docs 템플릿을 위 이메일과 공유해야 합니다!');
    console.log('');
    console.log('템플릿 ID 목록:');
    console.log('  1. 표지:', process.env.GOOGLE_DOCS_COVER_TEMPLATE_ID);
    console.log('  2. 서비스 안내:', process.env.GOOGLE_DOCS_SERVICE_INTRO_TEMPLATE_ID);
    console.log('  3. 비교표:', process.env.GOOGLE_DOCS_COMPARISON_TEMPLATE_ID);
    console.log('  4. 상세:', process.env.GOOGLE_DOCS_DETAIL_TEMPLATE_ID);
    console.log('');

    console.log('각 템플릿 공유 방법:');
    console.log('  1. Google Docs에서 템플릿 열기');
    console.log('  2. 우측 상단 "공유" 버튼 클릭');
    console.log('  3. 위 서비스 계정 이메일 입력');
    console.log('  4. 권한: "편집자" 선택');
    console.log('  5. "전송" 클릭');
    console.log('');

    console.log('✅ Google API 테스트 완료!');
    console.log('');
    console.log('📌 다음 단계:');
    console.log('  1. 4개 템플릿을 서비스 계정과 공유');
    console.log('  2. 프론트엔드에서 제안서 생성 테스트');
    console.log('  3. PDF 다운로드 확인');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error(error);
  }
}

testGoogleAPI();
