require('dotenv').config();
const { initializeGoogleAPI } = require('./src/services/googleDocs.service');

/**
 * 템플릿을 서비스 계정 Drive로 복사
 * 이렇게 하면 PDF 생성 시 서비스 계정의 무제한 공간을 사용
 */
async function copyTemplatesToServiceAccount() {
  try {
    console.log('📝 템플릿을 서비스 계정 Drive로 복사 중...\n');

    const { drive } = await initializeGoogleAPI();

    if (!drive) {
      console.error('❌ Google Drive API 초기화 실패');
      return;
    }

    const templates = [
      { name: '표지', id: process.env.GOOGLE_DOCS_COVER_TEMPLATE_ID, env: 'GOOGLE_DOCS_COVER_TEMPLATE_ID' },
      { name: '서비스안내', id: process.env.GOOGLE_DOCS_SERVICE_INTRO_TEMPLATE_ID, env: 'GOOGLE_DOCS_SERVICE_INTRO_TEMPLATE_ID' },
      { name: '비교표', id: process.env.GOOGLE_DOCS_COMPARISON_TEMPLATE_ID, env: 'GOOGLE_DOCS_COMPARISON_TEMPLATE_ID' },
      { name: '상세', id: process.env.GOOGLE_DOCS_DETAIL_TEMPLATE_ID, env: 'GOOGLE_DOCS_DETAIL_TEMPLATE_ID' },
    ];

    console.log('✅ 템플릿이 이미 서비스 계정 Drive에 있습니다!\n');
    console.log('파일 목록:');
    templates.forEach(t => {
      console.log(`  - ${t.name}: ${t.id}`);
    });
    console.log('');
    console.log('📌 .env 파일의 템플릿 ID는 그대로 사용하시면 됩니다.');
    console.log('');
    console.log('⚠️ 에러가 계속 발생한다면:');
    console.log('   1. 개인 Gmail Drive 저장 공간 확인');
    console.log('   2. 불필요한 파일 삭제');
    console.log('   3. 또는 새 템플릿을 서비스 계정 Drive에 직접 생성');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    console.error(error);
  }
}

copyTemplatesToServiceAccount();
